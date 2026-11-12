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
exports.defaultLoggingOptions = exports.logLevels = void 0;
exports.buildLoggingOptions = buildLoggingOptions;
const errors_js_1 = require("./errors.js");
const host = __importStar(require("./runtime-environment.js"));
const s = __importStar(require("./validation/index.js"));
exports.logLevels = ["off", "error", "warn", "info", "debug"];
/** The built-in defaults behind {@link LoggingOptions}; spread a list to extend it. */
exports.defaultLoggingOptions = Object.freeze({
    logger: console,
    level: "off",
    logRequestHeaders: false,
    logResponseHeaders: false,
    logRequestBody: false,
    bodySizeLimit: 32_768,
    loggableContentTypes: Object.freeze(["application/json", "application/x-www-form-urlencoded"]),
    redactedHeaders: Object.freeze([]),
    unmaskHeaders: Object.freeze([]),
    redactedKeys: Object.freeze([
        "sig",
        "signature",
        "access_token",
        "apikey",
        "api_key",
        "client_secret",
        "password",
        "refresh_token",
        "code",
        "assertion",
        "client_assertion",
    ]),
    redactionPlaceholder: "***",
});
function buildLoggingOptions(options, environmentVariable) {
    let logger;
    let levelInCode;
    try {
        logger = options?.logger;
        levelInCode = exports.logLevels.some((level) => level === options?.level);
    }
    catch (err) {
        throw new errors_js_1.ConfigurationError("The logging options could not be resolved.", { cause: err });
    }
    if (logger !== undefined) {
        return validateLoggingOptions(options, { ...exports.defaultLoggingOptions, level: "debug" });
    }
    if (levelInCode) {
        return validateLoggingOptions(options, exports.defaultLoggingOptions);
    }
    const level = environmentLogLevel(environmentVariable);
    if (level === undefined)
        return validateLoggingOptions(options, exports.defaultLoggingOptions);
    const headers = level === "debug";
    return validateLoggingOptions(options, {
        ...exports.defaultLoggingOptions,
        level,
        logRequestHeaders: headers,
        logResponseHeaders: headers,
    });
}
function validateLoggingOptions(options, fallbacks) {
    const schema = s.of(s.fallback(s.object({
        level: s.fallback(s.literal(exports.logLevels), fallbacks.level),
        logRequestHeaders: s.fallback(s.boolean(), fallbacks.logRequestHeaders),
        logResponseHeaders: s.fallback(s.boolean(), fallbacks.logResponseHeaders),
        logRequestBody: s.fallback(s.boolean(), fallbacks.logRequestBody),
        bodySizeLimit: s.fallback(s.int().check(s.gte(0)), fallbacks.bodySizeLimit),
        loggableContentTypes: s.fallback(s.array(s.string()), fallbacks.loggableContentTypes),
        redactedHeaders: s.fallback(s.array(s.string()), fallbacks.redactedHeaders),
        unmaskHeaders: s.fallback(s.array(s.string()), fallbacks.unmaskHeaders),
        redactedKeys: s.fallback(s.array(s.string()), fallbacks.redactedKeys),
        redactionPlaceholder: s.fallback(s.string(), fallbacks.redactionPlaceholder),
    }), fallbacks));
    try {
        const logger = options?.logger;
        return {
            ...schema.decode(options),
            logger: logger === undefined ? exports.defaultLoggingOptions.logger : logger,
        };
    }
    catch (err) {
        throw new errors_js_1.ConfigurationError("The logging options could not be resolved.", { cause: err });
    }
}
function environmentLogLevel(name) {
    const value = host.environmentVariable(name);
    if (value === undefined)
        return undefined;
    const level = exports.logLevels.find((candidate) => candidate === value.toLowerCase());
    if (level === undefined) {
        console.warn(`${name} is set to ${JSON.stringify(value)}, which is not a log level. ` +
            `Expected one of: ${exports.logLevels.join(", ")}. Logging stays off.`);
    }
    return level;
}
//# sourceMappingURL=logging.js.map