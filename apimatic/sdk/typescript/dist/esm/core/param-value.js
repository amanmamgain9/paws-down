import { encodeEntry } from "./validation/schema.js";
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
export function flattenValue(value) {
    if (value === undefined || value === null)
        return [];
    if (isScalar(value))
        return [scalar(value)];
    if (!Array.isArray(value))
        return [jsonValue(value)];
    const folded = [];
    for (const element of value) {
        if (element === undefined || element === null)
            folded.push("");
        else if (isScalar(element))
            folded.push(scalar(element));
        else
            return [jsonValue(value)];
    }
    return folded;
}
export function encodedParam(source) {
    return encodeEntry(source.schema, source.value);
}
export function flattenParams(sources) {
    return (sources ?? []).flatMap((source) => flattenParam(source.name, encodedParam(source), source.style ?? "plain"));
}
function flattenParam(key, value, style) {
    if (value === undefined || value === null)
        return [];
    if (isScalar(value))
        return [[key, scalar(value)]];
    if (Array.isArray(value))
        return flattenArray(key, value, style);
    return Object.entries(value).flatMap(([sub, subValue]) => flattenParam(`${key}[${sub}]`, subValue, style));
}
function flattenArray(key, values, style) {
    const present = values.filter((value) => value !== undefined && value !== null);
    switch (style) {
        case "plain":
            return present.flatMap((value) => flattenParam(key, value, style));
        case "indexed":
            return values.flatMap((value, index) => flattenParam(`${key}[${index}]`, value, style));
        case "unindexed":
            return present.flatMap((value) => flattenParam(`${key}[]`, value, style));
        case "csv":
            return [joined(key, values, ",")];
        case "tsv":
            return [joined(key, values, "\t")];
        case "psv":
            return [joined(key, values, "|")];
        default:
            return unknownStyle(style);
    }
}
function joined(key, values, separator) {
    return [key, flattenValue(values).join(separator)];
}
function unknownStyle(style) {
    throw new TypeError(`Unknown parameter style: ${String(style)}.`);
}
export function isScalar(value) {
    if (value === undefined || value === null)
        return false;
    return typeof value !== "object";
}
export function scalar(value) {
    return String(value);
}
export function jsonValue(value) {
    return JSON.stringify(value, bigintReplacer);
}
function bigintReplacer(_key, value) {
    if (typeof value !== "bigint")
        return value;
    if (value <= MAX_SAFE_BIGINT && value >= -MAX_SAFE_BIGINT)
        return Number(value);
    return String(value);
}
//# sourceMappingURL=param-value.js.map