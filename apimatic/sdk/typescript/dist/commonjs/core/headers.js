"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestHeaders = exports.HeadersBuilder = void 0;
const errors_js_1 = require("./errors.js");
const param_value_js_1 = require("./param-value.js");
const params_js_1 = require("./params.js");
const schema_error_js_1 = require("./validation/schema-error.js");
const s = __importStar(require("./validation/index.js"));
class HeadersBuilder {
    #defaultHeaders;
    constructor(defaults) {
        this.#defaultHeaders = defaults.defaultHeaders;
    }
    build({ method, headers }, uri, body) {
        try {
            return new RequestHeaders(foldHeaders([contentHeaders(body), this.#defaultHeaders, headers]));
        }
        catch (err) {
            if (!(err instanceof schema_error_js_1.SchemaError))
                throw err;
            throw new errors_js_1.EncodeError(`${method} ${uri} failed: Request header could not be encoded.`, {
                cause: err,
                method,
                uri,
            });
        }
    }
}
exports.HeadersBuilder = HeadersBuilder;
class RequestHeaders {
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
exports.RequestHeaders = RequestHeaders;
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
            const value = (0, param_value_js_1.encodedParam)(header);
            if (value === undefined)
                continue;
            const parts = (0, param_value_js_1.flattenValue)(value);
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
        pairs.set(name, (0, params_js_1.percentEncode)(value));
    const merged = [...pairs].map(([name, value]) => `${name}=${value}`).join("; ");
    return merged === "" ? undefined : merged;
}
//# sourceMappingURL=headers.js.map