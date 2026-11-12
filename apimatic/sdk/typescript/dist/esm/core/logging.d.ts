export declare const logLevels: readonly ["off", "error", "warn", "info", "debug"];
/** The built-in defaults behind {@link LoggingOptions}; spread a list to extend it. */
export declare const defaultLoggingOptions: ResolvedLoggingOptions;
/** How the client logs its HTTP traffic, set through `ClientOptions.logging`. */
export type LoggingOptions = {
    readonly logger?: Logger;
    readonly level?: LogLevel;
    readonly logRequestHeaders?: boolean;
    readonly logResponseHeaders?: boolean;
    readonly logRequestBody?: boolean;
    readonly bodySizeLimit?: number;
    readonly loggableContentTypes?: readonly string[];
    readonly redactedHeaders?: readonly string[];
    readonly unmaskHeaders?: readonly string[];
    readonly redactedKeys?: readonly string[];
    readonly redactionPlaceholder?: string;
};
/** The part of {@link LoggingOptions} a call may override through `RequestOptions.logging`. */
export type RequestLoggingOptions = Pick<LoggingOptions, "level">;
/** Where the client writes its log lines; `console` already has this shape. */
export type Logger = {
    error(message: string, details: LogDetails): void;
    warn(message: string, details: LogDetails): void;
    info(message: string, details: LogDetails): void;
    debug(message: string, details: LogDetails): void;
};
/** The structured fields passed with every log line; narrow on `event` to read the rest. */
export type LogDetails = HttpRequestDetails | RequestHeadersDetails | RequestBodyDetails | HttpResponseDetails | ResponseHeadersDetails | HttpRetryingDetails | HttpFailedDetails;
/** Logged at `info` as a request is sent. */
export type HttpRequestDetails = {
    readonly event: "HttpRequest";
    readonly method: string;
    readonly url: string;
};
/** Logged at `debug` with a request's headers, one field per header. */
export type RequestHeadersDetails = {
    readonly event: "RequestHeaders";
    readonly [header: string]: string;
};
/** Logged at `debug` with a request's body. */
export type RequestBodyDetails = {
    readonly event: "RequestBody";
    readonly mediaType: string;
    readonly body: string;
};
/** Logged at `info` when a response arrives, or `warn` for an error status. */
export type HttpResponseDetails = {
    readonly event: "HttpResponse";
    readonly method: string;
    readonly url: string;
    readonly status: number;
    readonly durationMs: number;
};
/** Logged at `debug` with a response's headers, one field per header. */
export type ResponseHeadersDetails = {
    readonly event: "ResponseHeaders";
    readonly [header: string]: string;
};
/** Logged at `warn` before a failed attempt is retried. */
export type HttpRetryingDetails = {
    readonly event: "HttpRetrying";
    readonly method: string;
    readonly url: string;
    readonly delayMs: number;
    readonly retry: number;
    readonly maxRetries: number;
} & ({
    readonly reason: "status";
    readonly status: number;
} | {
    readonly reason: "fault";
    readonly errorName: string;
});
/** Logged at `error` when a call ends without a response. */
export type HttpFailedDetails = {
    readonly event: "HttpFailed";
    readonly method: string;
    readonly url: string;
    readonly durationMs: number;
    readonly errorName: string;
};
export type LogSeverity = "error" | "warn" | "info" | "debug";
/** The most detailed level the client logs, or `"off"` to log nothing. */
export type LogLevel = LogSeverity | "off";
export type ResolvedLoggingOptions = Required<LoggingOptions>;
export declare function buildLoggingOptions(options: LoggingOptions | undefined, environmentVariable: string): ResolvedLoggingOptions;
