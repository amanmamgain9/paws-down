"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const errors_js_1 = require("./errors.js");
/**
 * An error answer from the API.
 *
 * @remarks
 * Thrown when the server responded with an error status. It is a `ResponseError`, so a `catch` for
 * everything the server had a say in sees it beside `DecodeError`, and it is a `CoreError`, so one
 * `instanceof AcmeError` catches it too. An operation that declares error bodies throws a subclass
 * redeclaring `payload` as a typed union; the rest throw this class directly.
 *
 * On this class `payload.kind` is `string`, so comparing it to `"undeclared"` does not narrow and
 * `"rawBody" in payload` does. A subclass declares a union of literals, which narrows on its own.
 */
class ApiError extends errors_js_1.ResponseErrorBase {
    kind = "api";
    /** The error body, as the arm the spec declared for this status, or `"undeclared"`. */
    payload;
    constructor(init) {
        super(`${init.method} ${init.uri} failed with ${init.status}`, init);
        this.payload = init.payload;
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=api-error.js.map