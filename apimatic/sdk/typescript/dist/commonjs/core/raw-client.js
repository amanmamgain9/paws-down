"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawClient = void 0;
const errors_js_1 = require("./errors.js");
const response_decoder_js_1 = require("./response-decoder.js");
const api_promise_js_1 = require("./api-promise.js");
const pageable_js_1 = require("./pagination/pageable.js");
const request_body_js_1 = require("./request-body.js");
const retry_js_1 = require("./retry.js");
const url_js_1 = require("./url.js");
const headers_js_1 = require("./headers.js");
const http_logger_js_1 = require("./http-logger.js");
const schemes_js_1 = require("./auth/schemes.js");
class RawClient {
    #config;
    #urlBuilder;
    #headersBuilder;
    #responseReader;
    constructor(config) {
        this.#config = config;
        this.#urlBuilder = new url_js_1.UrlBuilder(config);
        this.#headersBuilder = new headers_js_1.HeadersBuilder(config);
        this.#responseReader = new response_decoder_js_1.ResponseReader(config);
    }
    execute(apiRequest, responseHandler, options) {
        return new api_promise_js_1.ApiPromise(this.#dispatch(apiRequest, responseHandler, options));
    }
    paginate(request, state, buildRequest, responseHandler, itemsSelector, options) {
        const requestSnapshot = { ...request };
        const dispatch = (apiRequest) => this.#dispatch(apiRequest, responseHandler, options);
        return new pageable_js_1.Pageable(async function* () {
            let current = state;
            while (true) {
                const outcome = await dispatch(buildRequest(requestSnapshot, current));
                yield outcome;
                if (!outcome.ok)
                    return;
                const itemCount = itemsSelector(outcome.data)?.length ?? 0;
                const next = current.next(outcome.data, outcome.headers, itemCount, outcome.uri);
                if (next === null)
                    return;
                current = next;
            }
        }, itemsSelector);
    }
    async #dispatch(apiRequest, responseHandler, options) {
        const startedAt = Date.now();
        const callerSignal = options?.signal ?? neverAbortedSignal();
        const uploadController = new AbortController();
        const streamRequestController = new AbortController();
        const abortStreamRequest = () => streamRequestController.abort();
        const url = this.#urlBuilder.build(apiRequest);
        const { uri } = url;
        const body = (0, request_body_js_1.buildBody)(apiRequest.method, uri, apiRequest.body, AbortSignal.any([callerSignal, uploadController.signal]));
        const logger = new http_logger_js_1.HttpLogger(options?.logging, this.#config.logging, apiRequest.method, url.withQuery([]));
        const headers = this.#headersBuilder.build(apiRequest, uri, body);
        const policy = new retry_js_1.RetryPolicy(options?.retry, this.#config.retry);
        const response = await policy.execute(apiRequest.method, callerSignal, startedAt, logger, async (timeout) => {
            const authenticated = await (0, schemes_js_1.authenticateRequest)(apiRequest.method, apiRequest.auth, url, headers, callerSignal, startedAt, logger);
            const isStreaming = body.streaming === true;
            const timeoutController = new AbortController();
            const signal = AbortSignal.any([
                callerSignal,
                timeoutController.signal,
                streamRequestController.signal,
            ]);
            if (isStreaming) {
                timeoutController.signal.addEventListener("abort", () => uploadController.abort(timeoutController.signal.reason), { once: true });
            }
            const request = new Request(authenticated.url, {
                method: apiRequest.method,
                headers: authenticated.headers,
                body: body.body,
                signal,
                ...(isStreaming ? { duplex: "half", window: null, redirect: "error" } : {}),
            });
            await logger.logRequest(request);
            const timer = startTimeout(timeoutController, timeout, apiRequest.method, uri);
            let response;
            try {
                response = await this.#config.fetch.call(undefined, request);
            }
            catch (err) {
                if (err instanceof errors_js_1.ConnectionError || err instanceof errors_js_1.TimeoutError)
                    return { kind: "fault", error: err, isStreaming };
                if (err instanceof errors_js_1.CoreError)
                    throw err;
                if (signal.reason instanceof errors_js_1.TimeoutError)
                    return { kind: "fault", error: signal.reason, isStreaming };
                if (signal.aborted)
                    throw signal.reason;
                return {
                    kind: "fault",
                    error: new errors_js_1.ConnectionError(`${apiRequest.method} ${uri} failed: ${err instanceof Error && err.message !== "" ? err.message : "Connection error."}`, { cause: err, method: apiRequest.method, uri }),
                    isStreaming,
                };
            }
            finally {
                clearTimeout(timer);
            }
            const discard = () => {
                void Promise.resolve(response.body?.cancel()).catch(() => { });
            };
            try {
                logger.logResponse(response);
            }
            catch (err) {
                discard();
                throw err;
            }
            if (response.status === 401)
                apiRequest.auth.invalidate?.();
            return { kind: "response", response, isStreaming, discard };
        });
        if (isSuccess(response.status)) {
            const data = await this.#responseReader.read(responseHandler.success, response, apiRequest.method, uri, callerSignal, abortStreamRequest);
            return { ok: true, status: response.status, headers: response.headers, uri, data };
        }
        const error = await this.#responseReader.readError(responseHandler.errorFactory, response, apiRequest.method, uri, callerSignal, abortStreamRequest);
        return { ok: false, status: response.status, headers: response.headers, uri, error };
    }
}
exports.RawClient = RawClient;
function isSuccess(status) {
    return status >= 200 && status <= 299;
}
function neverAbortedSignal() {
    return new AbortController().signal;
}
function startTimeout(controller, timeoutMs, method, uri) {
    return setTimeout(() => controller.abort(new errors_js_1.TimeoutError(`${method} ${uri} failed: Request timed out after ${timeoutMs}ms.`, {
        method,
        uri,
        timeout: timeoutMs,
    })), timeoutMs);
}
//# sourceMappingURL=raw-client.js.map