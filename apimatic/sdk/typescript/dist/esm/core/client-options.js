import { ConfigurationError } from "./errors.js";
import { buildLoggingOptions } from "./logging.js";
import { buildRetryOptions } from "./retry.js";
import { buildEventStreamOptions, } from "./event-stream.js";
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
export function buildCoreClientOptions(options, loggingEnvironmentVariable) {
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
        throw new ConfigurationError("No fetch implementation available; pass ClientOptions.fetch.");
    }
    return {
        retry: buildRetryOptions(options.retry),
        eventStream: buildEventStreamOptions(options.eventStream),
        logging: buildLoggingOptions(options.logging, loggingEnvironmentVariable),
        fetch: fetchImpl,
    };
}
//# sourceMappingURL=client-options.js.map