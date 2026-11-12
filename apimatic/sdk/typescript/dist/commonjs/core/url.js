"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestUrl = exports.UrlBuilder = void 0;
exports.buildQueryUrl = buildQueryUrl;
exports.resolveBaseUrl = resolveBaseUrl;
exports.templateUri = templateUri;
const param_value_js_1 = require("./param-value.js");
const params_js_1 = require("./params.js");
const errors_js_1 = require("./errors.js");
const schema_error_js_1 = require("./validation/schema-error.js");
class UrlBuilder {
    #defaultPathParams;
    #defaultQuery;
    constructor(defaults) {
        this.#defaultPathParams = defaults.defaultPathParams;
        this.#defaultQuery = defaults.defaultQuery;
    }
    build(request) {
        return new RequestUrl(this.#applyQuery(this.#resolvePath(request), request));
    }
    #resolvePath({ method, urlTemplate, pathParams }) {
        try {
            return new URL(joinUrl(urlTemplate.baseUrl, expandPath(urlTemplate.subPath, pathParams, this.#defaultPathParams)));
        }
        catch (err) {
            if (!(err instanceof schema_error_js_1.SchemaError))
                throw err;
            const uri = templateUri(urlTemplate);
            throw new errors_js_1.EncodeError(`${method} ${uri} failed: Request path parameter could not be encoded.`, {
                cause: err,
                method,
                uri,
            });
        }
    }
    #applyQuery(path, { method, query }) {
        try {
            return buildQueryUrl(path, [this.#defaultQuery, query]);
        }
        catch (err) {
            if (!(err instanceof schema_error_js_1.SchemaError))
                throw err;
            const uri = uriOf(path);
            throw new errors_js_1.EncodeError(`${method} ${uri} failed: Request query parameter could not be encoded.`, {
                cause: err,
                method,
                uri,
            });
        }
    }
}
exports.UrlBuilder = UrlBuilder;
class RequestUrl {
    uri;
    #url;
    constructor(url) {
        this.#url = url;
        this.uri = uriOf(url);
    }
    withQuery(pairs) {
        return copyWithQuery(this.#url, (0, params_js_1.serializePairs)(pairs, params_js_1.percentEncode));
    }
}
exports.RequestUrl = RequestUrl;
function buildQueryUrl(url, queryInWireOrder) {
    return copyWithQuery(url, (0, params_js_1.queryString)(queryInWireOrder));
}
function resolveBaseUrl(server) {
    let out = server.baseUrl;
    for (const [key, value] of Object.entries(server.variables ?? {})) {
        if (value === undefined)
            continue;
        out = out.replaceAll(`{${key}}`, (0, params_js_1.percentEncode)(value));
    }
    return out;
}
function templateUri(template) {
    return joinUrl(template.baseUrl, template.subPath);
}
function uriOf(url) {
    return `${url.origin}${url.pathname}`;
}
function copyWithQuery(url, added) {
    const result = new URL(url);
    if (added !== "")
        result.search = url.search === "" ? added : `${url.search.slice(1)}&${added}`;
    return result;
}
function expandPath(template, ...layers) {
    let out = template;
    const skipped = [];
    for (const layer of layers) {
        for (const source of layer) {
            const value = (0, param_value_js_1.encodedParam)(source);
            if (value === undefined) {
                skipped.push(source.name);
                continue;
            }
            const replacement = value === null ? "" : (0, param_value_js_1.flattenValue)(value).map(params_js_1.percentEncode).join(",");
            out = out.replaceAll(`{${source.name}}`, replacement);
        }
    }
    for (const name of skipped) {
        if (!out.includes(`{${name}}`))
            continue;
        throw new TypeError(`Path parameter "${name}" resolved to undefined and left {${name}} unfilled.`);
    }
    return out;
}
function joinUrl(base, path) {
    const left = base.replace(/\/+$/, "");
    const right = path.replace(/^\/+/, "");
    return `${left}/${right}`;
}
//# sourceMappingURL=url.js.map