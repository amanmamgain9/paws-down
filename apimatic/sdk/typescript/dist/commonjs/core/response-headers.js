"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberFromHeader = numberFromHeader;
exports.booleanFromHeader = booleanFromHeader;
exports.urlFromHeader = urlFromHeader;
function numberFromHeader(headers, name) {
    const raw = firstValue(headers, name);
    if (raw === undefined)
        return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
}
function booleanFromHeader(headers, name) {
    switch (firstValue(headers, name)?.toLowerCase()) {
        case "true":
        case "1":
            return true;
        case "false":
        case "0":
            return false;
        default:
            return undefined;
    }
}
function urlFromHeader(headers, name, rel) {
    const value = headers.get(name)?.trim();
    if (value === undefined || value.length === 0)
        return undefined;
    if (!value.startsWith("<"))
        return value;
    let index = 0;
    while ((index = value.indexOf("<", index)) >= 0) {
        const targetEnd = value.indexOf(">", index + 1);
        if (targetEnd < 0)
            return undefined;
        const parametersEnd = indexOfUnquoted(value, ",", targetEnd + 1);
        if (hasRel(value.slice(targetEnd + 1, parametersEnd), rel))
            return value.slice(index + 1, targetEnd);
        index = parametersEnd;
    }
    return undefined;
}
function indexOfUnquoted(text, target, start) {
    let inQuotes = false;
    for (let i = start; i < text.length; i++) {
        const char = text[i];
        if (char === '"')
            inQuotes = !inQuotes;
        else if (char === target && !inQuotes)
            return i;
    }
    return text.length;
}
function hasRel(parameters, rel) {
    let start = 0;
    while (start < parameters.length) {
        const end = indexOfUnquoted(parameters, ";", start);
        const parameter = parameters.slice(start, end);
        start = end + 1;
        const separator = parameter.indexOf("=");
        if (separator < 0)
            continue;
        if (parameter.slice(0, separator).trim().toLowerCase() !== "rel")
            continue;
        const relTypes = parameter
            .slice(separator + 1)
            .trim()
            .replace(/^"+|"+$/g, "")
            .split(" ");
        return relTypes.some((relType) => relType.toLowerCase() === rel.toLowerCase());
    }
    return false;
}
function firstValue(headers, name) {
    const joined = headers.get(name);
    if (joined === null)
        return undefined;
    for (const value of joined.split(",")) {
        const trimmed = value.trim();
        if (trimmed.length > 0)
            return trimmed;
    }
    return undefined;
}
//# sourceMappingURL=response-headers.js.map