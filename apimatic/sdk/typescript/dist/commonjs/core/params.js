"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.percentEncode = percentEncode;
exports.formEncode = formEncode;
exports.queryString = queryString;
exports.formString = formString;
exports.serializePairs = serializePairs;
const param_value_js_1 = require("./param-value.js");
function percentEncode(value) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
function formEncode(value) {
    return percentEncode(value).replace(/%20/g, "+");
}
function queryString(layers) {
    return serializePairs(layers.flatMap(param_value_js_1.flattenParams), percentEncode);
}
function formString(fields) {
    return serializePairs((0, param_value_js_1.flattenParams)(fields), formEncode);
}
function serializePairs(pairs, encode) {
    return pairs.map(([key, value]) => `${encode(key)}=${encode(value)}`).join("&");
}
//# sourceMappingURL=params.js.map