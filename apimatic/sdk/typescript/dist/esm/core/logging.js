import { ConfigurationError } from "./errors.js";
import * as host from "./runtime-environment.js";
import * as s from "./validation/index.js";
export const logLevels = ["off", "error", "warn", "info", "debug"];
/** The built-in defaults behind {@link LoggingOptions}; spread a list to extend it. */
export const defaultLoggingOptions = Object.freeze({
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
export function buildLoggingOptions(options, environmentVariable) {
    let logger;
    let levelInCode;
    try {
        logger = options?.logger;
        levelInCode = logLevels.some((level) => level === options?.level);
    }
    catch (err) {
        throw new ConfigurationError("The logging options could not be resolved.", { cause: err });
    }
    if (logger !== undefined) {
        return validateLoggingOptions(options, { ...defaultLoggingOptions, level: "debug" });
    }
    if (levelInCode) {
        return validateLoggingOptions(options, defaultLoggingOptions);
    }
    const level = environmentLogLevel(environmentVariable);
    if (level === undefined)
        return validateLoggingOptions(options, defaultLoggingOptions);
    const headers = level === "debug";
    return validateLoggingOptions(options, {
        ...defaultLoggingOptions,
        level,
        logRequestHeaders: headers,
        logResponseHeaders: headers,
    });
}
function validateLoggingOptions(options, fallbacks) {
    const schema = s.of(s.fallback(s.object({
        level: s.fallback(s.literal(logLevels), fallbacks.level),
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
            logger: logger === undefined ? defaultLoggingOptions.logger : logger,
        };
    }
    catch (err) {
        throw new ConfigurationError("The logging options could not be resolved.", { cause: err });
    }
}
function environmentLogLevel(name) {
    const value = host.environmentVariable(name);
    if (value === undefined)
        return undefined;
    const level = logLevels.find((candidate) => candidate === value.toLowerCase());
    if (level === undefined) {
        console.warn(`${name} is set to ${JSON.stringify(value)}, which is not a log level. ` +
            `Expected one of: ${logLevels.join(", ")}. Logging stays off.`);
    }
    return level;
}
//# sourceMappingURL=logging.js.map