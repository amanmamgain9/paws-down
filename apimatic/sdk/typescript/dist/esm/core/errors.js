/**
 * The runtime root every failure in the family extends. Its public face is {@link CoreError}.
 *
 * @remarks
 * Not exported from the package and never named in a signature: a caught failure is one of the
 * leaves, and {@link CoreError} is how they are spelled together.
 */
export class CoreErrorBase extends Error {
    /** HTTP method of the call that failed. */
    method;
    /**
     * Absolute URI of the call that failed, as `https://us.api.acme.com/v1/accounts/acc_1/payments`.
     *
     * @remarks
     * Path parameters are filled in and server variables expanded, so it names the resource actually
     * dialled. It carries no query, fragment or userinfo, so no query parameter reaches it, not even
     * an `apiKeyQuery` credential. With `method` it opens `message`.
     *
     * One failure names an unresolved URI: a path parameter rejected by its schema arrives as an
     * `EncodeError` whose URI still shows the unfilled `{braces}` — an `undefined` one included,
     * since a path parameter is always required, so its schema rejects it first. A `baseUrl` that
     * is not a URL is a bug, and leaves as a raw `TypeError` naming no call.
     */
    uri;
    constructor(message, init) {
        super(message, init);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
        this.method = init.method;
        this.uri = init.uri;
    }
}
/**
 * The runtime rung under {@link ResponseError}, carrying the two facts that exist exactly when
 * the server answered.
 *
 * @remarks
 * Not exported from the package. Its two arms are `ApiError` and {@link DecodeError}.
 */
export class ResponseErrorBase extends CoreErrorBase {
    /** Status the API answered with. */
    status;
    /** Headers the API answered with. The correlation id is read off these. */
    headers;
    constructor(message, init) {
        super(message, init);
        this.status = init.status;
        this.headers = init.headers;
    }
}
/**
 * The server answered, and the answer could not be turned into the value the spec declares.
 *
 * @remarks
 * `status` and `headers` are the ones it answered with, so the failure still says what came back
 * and still carries the correlation id. `cause` says how it failed: a `SchemaError` when the body
 * did not fit its contract, a `SyntaxError` when it was not JSON, or the platform's read fault
 * when it died mid-stream. A body arriving where the operation declares none has no `cause`.
 *
 * Shape drift on a **declared** status is this, because the spec was wrong about the API. A status
 * the spec does not describe arrives instead as an `ApiError` whose payload is the `"undeclared"`
 * arm, which is the open world working as intended.
 */
export class DecodeError extends ResponseErrorBase {
    kind = "decode";
    constructor(message, init) {
        super(message, init);
    }
}
/**
 * A request value did not match its declared type, so nothing was sent.
 *
 * @remarks
 * The mirror of {@link DecodeError}, and it carries no `status` or `headers` because there is no
 * response: the call never left. `cause` is the `SchemaError` that rejected the value, whose own
 * `cause` is the issue list naming the field.
 */
export class EncodeError extends CoreErrorBase {
    kind = "encode";
    constructor(message, init) {
        super(message, init);
    }
}
/**
 * `fetch` rejected before a response line arrived — the request never reached the server, or the
 * server never answered — or an event stream's connection failed while you read it.
 *
 * @remarks
 * Once a response line has arrived this is no longer the kind: a body that then dies mid-read is a
 * {@link DecodeError}, carrying the status and headers the server did send. A binary success body
 * is the exception, since it is yours from the moment it resolves, so a socket dying under it
 * surfaces on that stream as the platform's own error, not as this. An event stream is the other:
 * its loop raises this when a read fails, with the fault on `cause`.
 */
export class ConnectionError extends CoreErrorBase {
    kind = "connection";
    constructor(message, init) {
        super(message, init);
    }
}
/**
 * The request exceeded the client timeout, or an event stream stayed silent past its idle timeout.
 *
 * @remarks
 * The client timeout starts once the credential is in hand and covers the request up to its
 * response headers. Obtaining the credential and reading any response body are not covered. An
 * OAuth2 token request is timed on its own, so a slow token endpoint raises this with the token
 * endpoint's `uri`, not the operation's. An event stream's loop raises this when the server sends
 * nothing for `eventStream.idleTimeout` while the loop waits.
 */
export class TimeoutError extends CoreErrorBase {
    kind = "timeout";
    /**
     * The budget that elapsed, in milliseconds: `ClientOptions.retry.timeout` as it resolved for this
     * client, or the stream's `idleTimeout` when an event stream raised it, so a handler reads the
     * limit off the failure rather than the configuration.
     */
    timeout;
    constructor(message, init) {
        super(message, init);
        this.timeout = init.timeout;
    }
}
/**
 * A credential could not be obtained, so the call was never sent.
 *
 * @remarks
 * Raised when the token exchange answered with an error status, returned a body that would not
 * decode, or could not be encoded, and when every branch of an `anyAuth` failed. `cause` carries
 * that failure, and the operation's retry loop never re-sends it: a refusal is not transient. A
 * dropped connection or a timeout during the exchange keeps its own kind instead, names the token
 * endpoint, and ends the call without the operation being sent.
 *
 * `method` and `uri` name the operation you called; the token endpoint appears in the message
 * after them. A 401 answered by the operation itself is an `ApiError`, not this.
 */
export class AuthError extends CoreErrorBase {
    kind = "auth";
    constructor(message, init) {
        super(message, init);
    }
}
/**
 * A next link the API sent could not be followed, so nothing was sent.
 *
 * @remarks
 * Raised from inside a paged loop, between two pages: the page that carried the link has
 * already been delivered, and a loop that stops after it never sees this. A link is followed
 * only when it resolves, against the URL of the page that carried it, to the same scheme, host
 * and port as the API base, so no credential ever leaves the API; a link to another origin is
 * refused, and so is one that is not a URL. For a link to another origin, `uri` names the call
 * that was refused; for a link that is not a URL there is no such call, so `uri` names the page
 * that carried it and `cause` carries the platform's parse failure.
 */
export class PaginationError extends CoreErrorBase {
    kind = "pagination";
    constructor(message, init) {
        super(message, init);
    }
}
/**
 * The value behind the {@link ResponseError} type: `err instanceof ResponseError` narrows to that
 * union. It cannot be constructed and cannot be extended.
 */
export const ResponseError = ResponseErrorBase;
/**
 * The value behind the {@link CoreError} type, exported as `AcmeError`: `err instanceof AcmeError`
 * narrows to that union. It cannot be constructed and cannot be extended.
 */
export const CoreError = CoreErrorBase;
/**
 * The client, or one call's options, could not be resolved.
 *
 * @remarks
 * Not a member of the {@link CoreError} family: it carries no `method` or `uri`. The constructor
 * throws it synchronously for three defects: no `fetch`, a basic-auth username containing a
 * colon, and an unknown `serverEnvironment`. A `serverOptions` override of the wrong type is a
 * `SchemaError` instead, raised by the codec that rejected it.
 *
 * A `retry` field the engine cannot honour is **not** a fourth: it falls back to its default. The
 * `retry` and `logging` records reach this error only when reading one throws, as a getter that
 * throws or a revoked proxy does, and that failure is on `cause`. Passed to the constructor, such a
 * record is thrown from it. Passed to one call, it rejects that call before anything is sent.
 */
export class ConfigurationError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=errors.js.map