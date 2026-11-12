"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBinary = readBinary;
exports.readBinaryError = readBinaryError;
exports.resolveFile = resolveFile;
exports.concatStream = concatStream;
exports.attachmentDisposition = attachmentDisposition;
exports.parseFileName = parseFileName;
const errors_js_1 = require("./errors.js");
function readBinary(decoder, response) {
    const contentType = response.headers.get("content-type") ?? decoder.contentType;
    const fileName = parseFileName(response.headers.get("content-disposition"));
    return { stream: response.body ?? emptyStream(), contentType, fileName };
}
async function readBinaryError(response, method, uri, signal) {
    let buffer;
    try {
        buffer = await response.arrayBuffer();
    }
    catch (err) {
        if (err instanceof errors_js_1.CoreError || (signal.aborted && err === signal.reason))
            throw err;
        throw new errors_js_1.DecodeError(`${method} ${uri} failed: Response body could not be read.`, {
            cause: err,
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    }
    return {
        bytes: new Uint8Array(buffer),
        contentType: response.headers.get("content-type") ?? undefined,
        fileName: parseFileName(response.headers.get("content-disposition")),
    };
}
function resolveFile(input, declaredContentType, signal) {
    const file = isFileData(input) ? input : { data: input };
    if (!isBinaryData(file.data))
        throw unusableBinaryData(file.data);
    const declared = file.contentType ?? blobContentType(file.data);
    const contentType = declared === undefined || declared === "" ? declaredContentType : declared;
    const fileName = file.fileName ?? blobFileName(file.data);
    const body = toBody(file.data, signal);
    if (body instanceof ReadableStream)
        return { body, contentType, fileName, streaming: true };
    return { body, contentType, fileName, streaming: false };
}
function concatStream(sources, signal) {
    return streamFrom(concatenate(sources), signal);
}
function attachmentDisposition(fileName) {
    if (fileName === undefined || fileName === "")
        return undefined;
    return `attachment; filename="${asciiFileName(fileName)}"; filename*=UTF-8''${encodeRfc5987(fileName)}`;
}
const EXTENDED_FILENAME = /;[ \t]*filename\*[ \t]*=[ \t]*([^;]*)/i;
const QUOTED_FILENAME = /;[ \t]*filename[ \t]*=[ \t]*"((?:[^"\\]|\\[\s\S])*)"/i;
const TOKEN_FILENAME = /;[ \t]*filename[ \t]*=[ \t]*([^;",]+)/i;
const ESCAPED_PAIR = /\\([\s\S])/g;
function parseFileName(disposition) {
    if (disposition === null)
        return undefined;
    const extended = EXTENDED_FILENAME.exec(disposition);
    if (extended !== null) {
        const decoded = decodeRfc5987((extended[1] ?? "").trim());
        if (decoded !== undefined && decoded !== "")
            return decoded;
    }
    const quoted = QUOTED_FILENAME.exec(disposition);
    if (quoted !== null) {
        const unescaped = (quoted[1] ?? "").replace(ESCAPED_PAIR, "$1");
        if (unescaped !== "")
            return unescaped;
    }
    const token = TOKEN_FILENAME.exec(disposition);
    const value = (token?.[1] ?? "").trim();
    return value === "" ? undefined : value;
}
function emptyStream() {
    return new ReadableStream({ start: (controller) => controller.close() });
}
function toBody(data, signal) {
    if (data instanceof ArrayBuffer)
        return new Uint8Array(data);
    if (data instanceof ReadableStream)
        return signal === undefined ? data : borrowStream(data, signal);
    if (isAsyncIterable(data))
        return streamFrom(data, signal);
    return data;
}
function streamFrom(iterable, signal) {
    const iterator = iterable[Symbol.asyncIterator]();
    let sink;
    let settled = false;
    const settle = () => {
        if (settled)
            return false;
        settled = true;
        return true;
    };
    const onAbort = () => {
        if (!settle())
            return;
        sink?.error(signal?.reason);
        void iterator.return?.(signal?.reason).catch(() => { });
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    return new ReadableStream({
        start: (controller) => {
            sink = controller;
            if (signal?.aborted)
                onAbort();
        },
        pull: async (controller) => {
            const { done, value } = await iterator.next();
            if (settled)
                return;
            if (done) {
                settle();
                controller.close();
                return;
            }
            controller.enqueue(value);
        },
        cancel: async (reason) => {
            settle();
            await iterator.return?.(reason);
        },
    });
}
function borrowStream(source, signal) {
    let reader;
    let sink;
    let settled = false;
    const settle = () => {
        if (settled)
            return false;
        settled = true;
        return true;
    };
    const onAbort = () => {
        if (!settle())
            return;
        sink?.error(signal.reason);
        reader?.releaseLock();
    };
    signal.addEventListener("abort", onAbort, { once: true });
    return new ReadableStream({
        start: (controller) => {
            sink = controller;
            if (signal.aborted)
                onAbort();
        },
        pull: async (controller) => {
            try {
                reader ??= source.getReader();
                const { done, value } = await reader.read();
                if (settled)
                    return;
                if (done) {
                    settle();
                    controller.close();
                    return;
                }
                controller.enqueue(value);
            }
            catch (err) {
                if (settle())
                    controller.error(err);
            }
        },
        cancel: () => {
            if (settle())
                reader?.releaseLock();
        },
    }, { highWaterMark: 0 });
}
async function* concatenate(sources) {
    for (const source of sources) {
        if (source instanceof Uint8Array) {
            yield source;
        }
        else if (source instanceof Blob) {
            const reader = source.stream().getReader();
            try {
                yield* readChunks(reader);
            }
            finally {
                await reader.cancel().catch(() => { });
            }
        }
        else {
            const reader = source.getReader();
            try {
                yield* readChunks(reader);
            }
            finally {
                reader.releaseLock();
            }
        }
    }
}
async function* readChunks(reader) {
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            return;
        yield value;
    }
}
function isFileData(input) {
    return typeof input === "object" && input !== null && "data" in input;
}
function isBinaryData(data) {
    return (data instanceof Blob ||
        data instanceof Uint8Array ||
        data instanceof ArrayBuffer ||
        data instanceof ReadableStream ||
        isAsyncIterable(data));
}
function isAsyncIterable(data) {
    return typeof data === "object" && data !== null && Symbol.asyncIterator in data;
}
function unusableBinaryData(data) {
    return new TypeError(`A file body must be a Blob, Uint8Array, ArrayBuffer, ReadableStream or an async iterable of ` +
        `bytes, or a { data } wrapper around one — received ${receivedType(data)}. A filesystem path is ` +
        `not a file body: open it with createReadStream(path), or read it with await openAsBlob(path).`);
}
function receivedType(data) {
    if (data === null)
        return "null";
    if (typeof data !== "object")
        return typeof data;
    return data.constructor?.name ?? "object";
}
function blobContentType(data) {
    return data instanceof Blob ? data.type : undefined;
}
function blobFileName(data) {
    if (!(data instanceof Blob) || !("name" in data))
        return undefined;
    const name = data.name;
    return typeof name === "string" && name !== "" ? name : undefined;
}
const DISPOSITION_UNSAFE = /[^ -~]|["\\;]/g;
function asciiFileName(fileName) {
    return fileName.replace(DISPOSITION_UNSAFE, "_");
}
const RFC5987_ATTR_CHAR = /^[A-Za-z0-9!#$&+\-.^_`|~]$/;
function encodeRfc5987(value) {
    let encoded = "";
    for (const byte of new TextEncoder().encode(value)) {
        const char = String.fromCharCode(byte);
        encoded += RFC5987_ATTR_CHAR.test(char) ? char : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
    }
    return encoded;
}
const EXT_VALUE = /^([^']*)'[^']*'([\s\S]*)$/;
function decodeRfc5987(value) {
    const parts = EXT_VALUE.exec(value);
    if (parts === null)
        return undefined;
    const charset = (parts[1] ?? "").toLowerCase();
    const label = charset === "" ? "utf-8" : charset;
    if (label !== "utf-8" && label !== "iso-8859-1")
        return undefined;
    const bytes = percentDecode(parts[2] ?? "");
    if (bytes === undefined)
        return undefined;
    try {
        return new TextDecoder(label, { fatal: true }).decode(bytes);
    }
    catch {
        return undefined;
    }
}
const HEX_PAIR = /^[0-9A-Fa-f]{2}$/;
function percentDecode(value) {
    const bytes = [];
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index] ?? "";
        if (char !== "%") {
            const code = char.charCodeAt(0);
            if (code > 0xff)
                return undefined;
            bytes.push(code);
            continue;
        }
        const hex = value.slice(index + 1, index + 3);
        if (!HEX_PAIR.test(hex))
            return undefined;
        bytes.push(Number.parseInt(hex, 16));
        index += 2;
    }
    return new Uint8Array(bytes);
}
//# sourceMappingURL=binary.js.map