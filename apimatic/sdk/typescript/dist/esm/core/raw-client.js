import { CoreError, ConnectionError, TimeoutError } from "./errors.js";
import { ResponseReader } from "./response-decoder.js";
import { ApiPromise } from "./api-promise.js";
import { Pageable } from "./pagination/pageable.js";
import { buildBody } from "./request-body.js";
import { RetryPolicy } from "./retry.js";
import { UrlBuilder } from "./url.js";
import { HeadersBuilder } from "./headers.js";
import { HttpLogger } from "./http-logger.js";
import { authenticateRequest } from "./auth/schemes.js";
export class RawClient {
    #config;
    #urlBuilder;
    #headersBuilder;
    #responseReader;
    constructor(config) {
        this.#config = config;
        this.#urlBuilder = new UrlBuilder(config);
        this.#headersBuilder = new HeadersBuilder(config);
        this.#responseReader = new ResponseReader(config);
    }
    execute(apiRequest, responseHandler, options) {
        return new ApiPromise(this.#dispatch(apiRequest, responseHandler, options));
    }
    paginate(request, state, buildRequest, responseHandler, itemsSelector, options) {
        const requestSnapshot = { ...request };
        const dispatch = (apiRequest) => this.#dispatch(apiRequest, responseHandler, options);
        return new Pageable(async function* () {
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
        const body = buildBody(apiRequest.method, uri, apiRequest.body, AbortSignal.any([callerSignal, uploadController.signal]));
        const logger = new HttpLogger(options?.logging, this.#config.logging, apiRequest.method, url.withQuery([]));
        const headers = this.#headersBuilder.build(apiRequest, uri, body);
        const policy = new RetryPolicy(options?.retry, this.#config.retry);
        const response = await policy.execute(apiRequest.method, callerSignal, startedAt, logger, async (timeout) => {
            const authenticated = await authenticateRequest(apiRequest.method, apiRequest.auth, url, headers, callerSignal, startedAt, logger);
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
                if (err instanceof ConnectionError || err instanceof TimeoutError)
                    return { kind: "fault", error: err, isStreaming };
                if (err instanceof CoreError)
                    throw err;
                if (signal.reason instanceof TimeoutError)
                    return { kind: "fault", error: signal.reason, isStreaming };
                if (signal.aborted)
                    throw signal.reason;
                return {
                    kind: "fault",
                    error: new ConnectionError(`${apiRequest.method} ${uri} failed: ${err instanceof Error && err.message !== "" ? err.message : "Connection error."}`, { cause: err, method: apiRequest.method, uri }),
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
function isSuccess(status) {
    return status >= 200 && status <= 299;
}
function neverAbortedSignal() {
    return new AbortController().signal;
}
function startTimeout(controller, timeoutMs, method, uri) {
    return setTimeout(() => controller.abort(new TimeoutError(`${method} ${uri} failed: Request timed out after ${timeoutMs}ms.`, {
        method,
        uri,
        timeout: timeoutMs,
    })), timeoutMs);
}
//# sourceMappingURL=raw-client.js.map