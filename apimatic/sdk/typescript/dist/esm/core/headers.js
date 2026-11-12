import { EncodeError } from "./errors.js";
import { encodedParam, flattenValue } from "./param-value.js";
import { percentEncode } from "./params.js";
import { SchemaError } from "./validation/schema-error.js";
import * as s from "./validation/index.js";
export class HeadersBuilder {
    #defaultHeaders;
    constructor(defaults) {
        this.#defaultHeaders = defaults.defaultHeaders;
    }
    build({ method, headers }, uri, body) {
        try {
            return new RequestHeaders(foldHeaders([contentHeaders(body), this.#defaultHeaders, headers]));
        }
        catch (err) {
            if (!(err instanceof SchemaError))
                throw err;
            throw new EncodeError(`${method} ${uri} failed: Request header could not be encoded.`, {
                cause: err,
                method,
                uri,
            });
        }
    }
}
export class RequestHeaders {
    #headers;
    constructor(headers) {
        this.#headers = headers;
    }
    withCredential(headers, cookies) {
        const result = new Headers(this.#headers);
        for (const [name, value] of headers)
            result.set(name, value);
        const cookie = mergeCookies(result.get("cookie"), cookies);
        if (cookie !== undefined)
            result.set("cookie", cookie);
        return result;
    }
}
const CONTENT_HEADER = s.optional(s.string());
function contentHeaders({ contentType, contentDisposition }) {
    return [
        { name: "content-type", value: contentType, schema: CONTENT_HEADER },
        { name: "content-disposition", value: contentDisposition, schema: CONTENT_HEADER },
    ];
}
function foldHeaders(layers) {
    const headers = new Headers();
    for (const layer of layers) {
        for (const header of layer) {
            const value = encodedParam(header);
            if (value === undefined)
                continue;
            const parts = flattenValue(value);
            if (parts.length === 0)
                headers.delete(header.name);
            else
                headers.set(header.name, parts.join(","));
        }
    }
    return headers;
}
function mergeCookies(existing, cookies) {
    if (cookies.length === 0)
        return existing ?? undefined;
    const pairs = new Map();
    for (const part of (existing ?? "").split(";")) {
        const trimmed = part.trim();
        const separator = trimmed.indexOf("=");
        if (separator <= 0)
            continue;
        pairs.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
    }
    for (const [name, value] of cookies)
        pairs.set(name, percentEncode(value));
    const merged = [...pairs].map(([name, value]) => `${name}=${value}`).join("; ");
    return merged === "" ? undefined : merged;
}
//# sourceMappingURL=headers.js.map