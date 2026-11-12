"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBody = buildBody;
const binary_js_1 = require("./binary.js");
const errors_js_1 = require("./errors.js");
const param_value_js_1 = require("./param-value.js");
const params_js_1 = require("./params.js");
const schema_js_1 = require("./validation/schema.js");
const schema_error_js_1 = require("./validation/schema-error.js");
function buildBody(method, uri, body, signal) {
    switch (body.kind) {
        case "empty":
            return { body: null };
        case "json":
            return buildJson(body, method, uri);
        case "formUrlEncoded":
            return buildFormUrlEncoded(body, method, uri);
        case "text":
            return buildText(body, method, uri);
        case "multipart":
            return buildMultipart(body, signal, method, uri);
        case "binary":
            return buildBinary(body, signal);
        default:
            return unknownBodyKind(body);
    }
}
function unknownBodyKind(body) {
    const kind = body.kind;
    throw new TypeError(`Unsupported request body kind: ${String(kind)}`);
}
function encodeFailure(err, method, uri) {
    if (!(err instanceof schema_error_js_1.SchemaError))
        throw err;
    return new errors_js_1.EncodeError(`${method} ${uri} failed: Request value could not be encoded.`, {
        cause: err,
        method,
        uri,
    });
}
function buildFormUrlEncoded(body, method, uri) {
    let text;
    try {
        text = (0, params_js_1.formString)(body.value);
    }
    catch (err) {
        throw encodeFailure(err, method, uri);
    }
    return { body: text, contentType: "application/x-www-form-urlencoded;charset=UTF-8" };
}
function buildJson(body, method, uri) {
    let encoded;
    try {
        encoded = (0, schema_js_1.encodeEntry)(body.schema, body.value);
    }
    catch (err) {
        throw encodeFailure(err, method, uri);
    }
    const text = JSON.stringify(encoded);
    if (text === undefined)
        return { body: null };
    return { body: text, contentType: "application/json" };
}
function buildBinary(body, signal) {
    if (body.value === undefined || body.value === null)
        return { body: null };
    const file = (0, binary_js_1.resolveFile)(body.value, body.contentType, signal);
    const content = { body: file.body };
    if (file.contentType !== undefined)
        content.contentType = file.contentType;
    const disposition = (0, binary_js_1.attachmentDisposition)(file.fileName);
    if (disposition !== undefined)
        content.contentDisposition = disposition;
    if (file.streaming)
        content.streaming = true;
    return content;
}
function buildText(body, method, uri) {
    let encoded;
    try {
        encoded = (0, schema_js_1.encodeEntry)(body.schema, body.value);
    }
    catch (err) {
        throw encodeFailure(err, method, uri);
    }
    if (encoded === undefined)
        return { body: null };
    return {
        body: (0, param_value_js_1.isScalar)(encoded) ? (0, param_value_js_1.scalar)(encoded) : (0, param_value_js_1.jsonValue)(encoded),
        contentType: "text/plain;charset=utf-8",
    };
}
function buildMultipart(body, signal, method, uri) {
    let entries;
    try {
        entries = body.value.flatMap(partEntries);
    }
    catch (err) {
        throw encodeFailure(err, method, uri);
    }
    if (allBuffered(entries))
        return { body: toFormData(entries) };
    const boundary = `----${crypto.randomUUID()}`;
    return {
        body: frameMultipart(entries, boundary, signal),
        contentType: `multipart/form-data; boundary=${boundary}`,
        streaming: true,
    };
}
function partEntries(part) {
    switch (part.kind) {
        case "text":
            return (0, param_value_js_1.flattenParams)([part]).map(([name, value]) => ({ kind: "text", name, value }));
        case "json": {
            const encoded = (0, schema_js_1.encodeEntry)(part.schema, part.value);
            const entries = [];
            for (const document of Array.isArray(encoded) ? encoded : [encoded]) {
                const value = JSON.stringify(document);
                if (value === undefined)
                    continue;
                entries.push({ kind: "json", name: part.name, value, contentType: part.contentType });
            }
            return entries;
        }
        case "file": {
            const entries = [];
            for (const input of Array.isArray(part.value) ? part.value : [part.value]) {
                if (input === undefined || input === null)
                    continue;
                entries.push({ kind: "file", name: part.name, file: (0, binary_js_1.resolveFile)(input, part.contentType) });
            }
            return entries;
        }
        default:
            return unknownPartKind(part);
    }
}
function allBuffered(entries) {
    return entries.every((entry) => entry.kind !== "file" || !entry.file.streaming);
}
function toFormData(entries) {
    const form = new FormData();
    for (const entry of entries) {
        if (entry.kind === "text") {
            form.append(entry.name, entry.value);
        }
        else if (entry.kind === "json") {
            form.append(entry.name, new Blob([entry.value], { type: entry.contentType }), "");
        }
        else {
            const { body, contentType, fileName } = entry.file;
            form.append(entry.name, new Blob([body], { type: contentType ?? "" }), fileName ?? "");
        }
    }
    return form;
}
function frameMultipart(entries, boundary, signal) {
    const encoder = new TextEncoder();
    const segments = [];
    for (const entry of entries) {
        const name = escapeParameter(normalizeNewlines(entry.name));
        const disposition = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"`;
        if (entry.kind === "text") {
            segments.push(encoder.encode(`${disposition}\r\n\r\n${normalizeNewlines(entry.value)}\r\n`));
        }
        else if (entry.kind === "json") {
            const contentType = partContentType(entry.contentType);
            segments.push(encoder.encode(`${disposition}\r\nContent-Type: ${contentType}\r\n\r\n${entry.value}\r\n`));
        }
        else {
            const { body, contentType, fileName } = entry.file;
            const filename = fileName === undefined || fileName === "" ? "" : `; filename="${escapeParameter(fileName)}"`;
            segments.push(encoder.encode(`${disposition}${filename}\r\nContent-Type: ${partContentType(contentType)}\r\n\r\n`), body, encoder.encode("\r\n"));
        }
    }
    segments.push(encoder.encode(`--${boundary}--\r\n`));
    return (0, binary_js_1.concatStream)(segments, signal);
}
function normalizeNewlines(value) {
    return value.replace(/\r\n|\r|\n/g, "\r\n");
}
function escapeParameter(value) {
    return value.replaceAll('"', "%22").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}
const PRINTABLE_ASCII = /^[ -~]*$/;
function partContentType(type) {
    if (type === undefined || type === "" || !PRINTABLE_ASCII.test(type))
        return "application/octet-stream";
    return type.toLowerCase();
}
function unknownPartKind(part) {
    const kind = part.kind;
    throw new TypeError(`Unsupported multipart part kind: ${String(kind)}`);
}
//# sourceMappingURL=request-body.js.map