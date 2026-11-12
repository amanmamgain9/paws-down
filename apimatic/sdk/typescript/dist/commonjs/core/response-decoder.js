"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseReader = void 0;
exports.readEventStreamJson = readEventStreamJson;
exports.readEventStreamText = readEventStreamText;
const binary_js_1 = require("./binary.js");
const event_stream_js_1 = require("./event-stream.js");
const event_stream_reader_js_1 = require("./event-stream-reader.js");
const errors_js_1 = require("./errors.js");
const schema_js_1 = require("./validation/schema.js");
const schema_error_js_1 = require("./validation/schema-error.js");
class ResponseReader {
    #eventStreamOptions;
    constructor(options) {
        this.#eventStreamOptions = options.eventStream;
    }
    async read(decoder, response, method, uri, signal, abort) {
        switch (decoder.kind) {
            case "json":
                return decodeJson(decoder, response, method, uri, signal);
            case "text":
                return decodeText(decoder, response, method, uri, signal);
            case "empty":
                return (await decodeEmpty(response, method, uri, signal));
            case "binary":
                return (0, binary_js_1.readBinary)(decoder, response);
            case "binaryError":
                return (await (0, binary_js_1.readBinaryError)(response, method, uri, signal));
            case "eventStreamText":
                return readEventStreamText(decoder, response, method, uri, signal, this.#eventStreamOptions, abort);
            case "eventStreamJson":
                return readEventStreamJson(decoder, response, method, uri, signal, this.#eventStreamOptions, abort);
            default: {
                await response.body?.cancel().catch(() => { });
                return unknownDecoderKind(decoder);
            }
        }
    }
    async readError(factory, response, method, uri, signal, abort) {
        const matchers = factory.errors;
        const status = response.status;
        const matcher = matchers?.find((m) => m.on === status) ??
            matchers?.find((m) => typeof m.on !== "number" && m.on !== "default" && matchesStatus(m.on, status)) ??
            matchers?.find((m) => m.on === "default");
        const payload = matcher
            ? await this.#declared(matcher, response, method, uri, signal, abort)
            : { kind: "undeclared", rawBody: await readRawBody(response, method, uri, signal) };
        return new factory({ status, headers: response.headers, method, uri, payload });
    }
    async #declared(matcher, response, method, uri, signal, abort) {
        return {
            kind: matcher.kind,
            body: await this.read(matcher.decode, response, method, uri, signal, abort),
        };
    }
}
exports.ResponseReader = ResponseReader;
async function decodeJson(decoder, response, method, uri, signal) {
    let text;
    try {
        text = await response.text();
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
    return decodeJsonText(decoder.schema, text, "Response body", response, method, uri);
}
async function decodeText(decoder, response, method, uri, signal) {
    let text;
    try {
        text = await response.text();
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
    return decodeTextValue(decoder.schema, text, "Response body", response, method, uri);
}
function decodeJsonText(schema, text, subject, response, method, uri) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch (err) {
        throw new errors_js_1.DecodeError(`${method} ${uri} failed: ${subject} could not be parsed as JSON.`, {
            cause: err,
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    }
    try {
        return (0, schema_js_1.decodeEntry)(schema, parsed);
    }
    catch (err) {
        if (!(err instanceof schema_error_js_1.SchemaError))
            throw err;
        throw new errors_js_1.DecodeError(`${method} ${uri} failed: ${subject} could not be decoded.`, {
            cause: err,
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    }
}
function decodeTextValue(schema, text, subject, response, method, uri) {
    try {
        return (0, schema_js_1.decodeEntry)(schema, text);
    }
    catch (err) {
        if (!(err instanceof schema_error_js_1.SchemaError))
            throw err;
        throw new errors_js_1.DecodeError(`${method} ${uri} failed: ${subject} could not be decoded.`, {
            cause: err,
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    }
}
async function decodeEmpty(response, method, uri, signal) {
    let bytes;
    try {
        bytes = await response.arrayBuffer();
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
    if (bytes.byteLength > 0)
        throw new errors_js_1.DecodeError(`${method} ${uri} failed: Expected an empty response body.`, {
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    return undefined;
}
async function readRawBody(response, method, uri, signal) {
    try {
        return await response.arrayBuffer();
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
}
function readEventStreamJson(decoder, response, method, uri, signal, options, abort) {
    const reader = new event_stream_reader_js_1.EventStreamReader(response, method, uri, signal, options, abort, decoder.sentinel);
    const events = (async function* () {
        for await (const data of reader.frames()) {
            yield decodeJsonText(decoder.dataSchema, data, "Event data", response, method, uri);
        }
        return undefined;
    })();
    return new event_stream_js_1.EventStream(reader.close, events);
}
function readEventStreamText(decoder, response, method, uri, signal, options, abort) {
    const reader = new event_stream_reader_js_1.EventStreamReader(response, method, uri, signal, options, abort, decoder.sentinel);
    const events = (async function* () {
        for await (const data of reader.frames()) {
            yield decodeTextValue(decoder.dataSchema, data, "Event data", response, method, uri);
        }
        return undefined;
    })();
    return new event_stream_js_1.EventStream(reader.close, events);
}
function matchesStatus(pattern, status) {
    if (typeof pattern === "number")
        return pattern === status;
    if (typeof pattern === "string")
        return `${Math.floor(status / 100)}XX` === pattern;
    return status >= pattern[0] && status <= pattern[1];
}
function unknownDecoderKind(decoder) {
    const kind = decoder.kind;
    throw new TypeError(`Unsupported response decoder kind: ${String(kind)}`);
}
//# sourceMappingURL=response-decoder.js.map