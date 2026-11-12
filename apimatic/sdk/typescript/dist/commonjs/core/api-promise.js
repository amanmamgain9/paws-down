"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiPromise = void 0;
exports.toApiResult = toApiResult;
/**
 * The promise every operation returns: resolves with `T`, rejects with `E` or a `CoreError`.
 *
 * @remarks
 * It is a real `Promise`, so `await`, `.then` and `Promise.all` all work. Awaiting it throws `E` on
 * an error status and a `CoreError` when no usable response was produced, so a complete `catch`
 * needs both. A bug rejects as the raw error it threw, outside the family. Call
 * {@link ApiPromise.asApiResult} for a non-throwing {@link ApiResult} instead.
 *
 * `.then`, `.catch` and `.finally` hand back a plain `Promise`, which has no `asApiResult` on it.
 * Call that method on the value the operation returned.
 *
 * Nothing here suppresses an unhandled rejection. An abandoned call that fails is reported by the
 * runtime: `unhandledRejection` on Node, which by default ends the process, and
 * `unhandledrejection` in a browser.
 */
class ApiPromise extends Promise {
    #outcome;
    constructor(outcome) {
        super((resolve, reject) => {
            outcome.then((o) => (o.ok ? resolve(o.data) : reject(o.error)), reject);
        });
        this.#outcome = outcome;
    }
    static get [Symbol.species]() {
        return Promise;
    }
    /**
     * Resolves to an {@link ApiResult} instead of throwing: an error status arrives as a value, not
     * as a rejection.
     *
     * @remarks
     * It is also the only way to read the HTTP status and response headers of a successful call. An
     * error status is the only failure it turns into a value. A request value that would not encode,
     * auth, a dropped connection, a timeout and a body that would not decode all still reject, and a
     * caller abort rejects with the signal's own `reason`.
     *
     * Call it on the value the operation returned, in the same turn: marking this promise handled is
     * its first act, so a call deferred past a turn leaves the rejection unhandled until it runs.
     */
    async asApiResult() {
        this.catch(() => { });
        return toApiResult(await this.#outcome);
    }
}
exports.ApiPromise = ApiPromise;
function toApiResult(o) {
    return o.ok
        ? {
            ok: true,
            value: o.data,
            status: o.status,
            headers: o.headers,
        }
        : {
            ok: false,
            status: o.error.status,
            headers: o.error.headers,
            message: o.error.message,
            method: o.error.method,
            uri: o.error.uri,
            payload: o.error.payload,
        };
}
//# sourceMappingURL=api-promise.js.map