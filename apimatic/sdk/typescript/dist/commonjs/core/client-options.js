"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCoreClientOptions = buildCoreClientOptions;
const errors_js_1 = require("./errors.js");
const logging_js_1 = require("./logging.js");
const retry_js_1 = require("./retry.js");
const event_stream_js_1 = require("./event-stream.js");
/**
 * Resolves the engine-wide options once, when the client is built, from what the caller passed.
 *
 * @remarks
 * `loggingEnvironmentVariable` is the name of the environment variable that can turn logging on.
 * It is read here, once, and only when `logging` sets neither `logger` nor `level`.
 *
 * @throws {@link ConfigurationError} when no `fetch` was supplied and the global one is missing,
 * or when reading `retry`, `eventStream` or `logging` throws. No value throws: every bounded field
 * resolves, its own default standing in for a value the engine cannot honour.
 */
function buildCoreClientOptions(options, loggingEnvironmentVariable) {
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
        throw new errors_js_1.ConfigurationError("No fetch implementation available; pass ClientOptions.fetch.");
    }
    return {
        retry: (0, retry_js_1.buildRetryOptions)(options.retry),
        eventStream: (0, event_stream_js_1.buildEventStreamOptions)(options.eventStream),
        logging: (0, logging_js_1.buildLoggingOptions)(options.logging, loggingEnvironmentVariable),
        fetch: fetchImpl,
    };
}
//# sourceMappingURL=client-options.js.map