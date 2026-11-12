import { flattenParams } from "./param-value.js";
export function percentEncode(value) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
export function formEncode(value) {
    return percentEncode(value).replace(/%20/g, "+");
}
export function queryString(layers) {
    return serializePairs(layers.flatMap(flattenParams), percentEncode);
}
export function formString(fields) {
    return serializePairs(flattenParams(fields), formEncode);
}
export function serializePairs(pairs, encode) {
    return pairs.map(([key, value]) => `${encode(key)}=${encode(value)}`).join("&");
}
//# sourceMappingURL=params.js.map