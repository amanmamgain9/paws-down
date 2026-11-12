"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryPolicy = void 0;
exports.buildRetryOptions = buildRetryOptions;
const errors_js_1 = require("./errors.js");
const s = __importStar(require("./validation/index.js"));
const MAX_DELAY_MS = 60_000;
const MAX_TIMEOUT_MS = 2_147_483_647;
const MAX_BACKOFF_FACTOR = 100;
const MIN_STATUS = 100;
const MAX_STATUS = 599;
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const DEFAULT_RETRY_OPTIONS = {
    timeout: 60_000,
    statusCodesToRetry: [408, 429, 500, 502, 503, 504],
    httpMethodsToRetry: ["GET", "HEAD", "PUT", "OPTIONS"],
    maxRetries: 3,
    delay: 1000,
    backoffFactor: 2,
    useExponentialBackoff: true,
    maxJitter: 0.25,
};
function buildRetryOptions(retry, fallbacks = DEFAULT_RETRY_OPTIONS) {
    const schema = s.of(s.fallback(s.object({
        timeout: s.fallback(s.int().check(s.gte(0), s.lte(MAX_TIMEOUT_MS)), fallbacks.timeout),
        statusCodesToRetry: s.fallback(s.array(s.int().check(s.gte(MIN_STATUS), s.lte(MAX_STATUS))), fallbacks.statusCodesToRetry),
        httpMethodsToRetry: s.fallback(s.array(s.literal(HTTP_METHODS)), fallbacks.httpMethodsToRetry),
        maxRetries: s.fallback(s.int().check(s.gte(0)), fallbacks.maxRetries),
        delay: s.fallback(s.int().check(s.gte(0), s.lte(MAX_TIMEOUT_MS)), fallbacks.delay),
        backoffFactor: s.fallback(s.float64().check(s.gte(1), s.lte(MAX_BACKOFF_FACTOR)), fallbacks.backoffFactor),
        useExponentialBackoff: s.fallback(s.boolean(), fallbacks.useExponentialBackoff),
        maxJitter: s.fallback(s.float64().check(s.gte(0), s.lte(1)), fallbacks.maxJitter),
        onRetry: s.fallback(s.callback(), fallbacks.onRetry),
    }), fallbacks));
    try {
        return schema.decode(retry);
    }
    catch (err) {
        throw new errors_js_1.ConfigurationError("The retry options could not be resolved.", { cause: err });
    }
}
class RetryPolicy {
    #options;
    constructor(retry, fallbacks) {
        this.#options = buildRetryOptions(retry, fallbacks);
    }
    async execute(method, callerSignal, startedAt, logger, send) {
        for (let retriesMade = 0;; retriesMade += 1) {
            const attempt = await send(this.#options.timeout);
            if (!shouldRetry(this.#options, retriesMade, method, attempt)) {
                if (attempt.kind === "fault") {
                    logger.logFailure(attempt.error, startedAt);
                    throw attempt.error;
                }
                return attempt.response;
            }
            let reason;
            switch (attempt.kind) {
                case "response":
                    attempt.discard();
                    reason = { kind: "status", status: attempt.response.status, headers: attempt.response.headers };
                    break;
                case "fault":
                    reason = { kind: "fault", error: attempt.error };
                    break;
            }
            if (callerSignal.aborted)
                throw callerSignal.reason;
            const retry = {
                attemptNumber: retriesMade + 1,
                delay: retryDelayMs(this.#options, retriesMade, reason),
                reason,
            };
            logger.logRetry(retry, this.#options.maxRetries);
            this.#options.onRetry?.(retry);
            await sleep(retry.delay, callerSignal);
            if (callerSignal.aborted)
                throw callerSignal.reason;
        }
    }
}
exports.RetryPolicy = RetryPolicy;
function retryDelayMs(options, retriesMade, reason) {
    const hint = reason.kind === "status" ? delayFromRetryAfterHeader(reason.headers, Date.now()) : undefined;
    const growth = options.useExponentialBackoff ? options.backoffFactor ** retriesMade : 1;
    const delay = Math.min(Math.max(hint ?? options.delay * growth, 0), MAX_DELAY_MS);
    return Math.ceil(delay * (1 + Math.random() * options.maxJitter));
}
function shouldRetry(options, attempt, method, outcome) {
    if (attempt >= options.maxRetries || outcome.isStreaming)
        return false;
    if (!options.httpMethodsToRetry.includes(method))
        return false;
    return outcome.kind === "fault" || options.statusCodesToRetry.includes(outcome.response.status);
}
function delayFromRetryAfterHeader(headers, now) {
    const value = headers.get("retry-after");
    if (value === null || value === "")
        return undefined;
    if (value[0] >= "0" && value[0] <= "9") {
        for (const c of value)
            if (c < "0" || c > "9")
                return undefined;
        return Number(value) * 1000;
    }
    const first = value[0].toLowerCase();
    if (first < "a" || first > "z")
        return undefined;
    const date = Date.parse(value);
    return Number.isNaN(date) ? undefined : date - now;
}
function sleep(ms, signal) {
    if (signal.aborted)
        return Promise.resolve();
    return new Promise((resolve) => {
        const timer = setTimeout(done, ms);
        signal.addEventListener("abort", done);
        function done() {
            clearTimeout(timer);
            signal.removeEventListener("abort", done);
            resolve();
        }
    });
}
//# sourceMappingURL=retry.js.map