import { readBinary, readBinaryError } from "./binary.js";
import { EventStream } from "./event-stream.js";
import { EventStreamReader } from "./event-stream-reader.js";
import { CoreError, DecodeError } from "./errors.js";
import { decodeEntry } from "./validation/schema.js";
import { SchemaError } from "./validation/schema-error.js";
export class ResponseReader {
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
                return readBinary(decoder, response);
            case "binaryError":
                return (await readBinaryError(response, method, uri, signal));
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
async function decodeJson(decoder, response, method, uri, signal) {
    let text;
    try {
        text = await response.text();
    }
    catch (err) {
        if (err instanceof CoreError || (signal.aborted && err === signal.reason))
            throw err;
        throw new DecodeError(`${method} ${uri} failed: Response body could not be read.`, {
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
        if (err instanceof CoreError || (signal.aborted && err === signal.reason))
            throw err;
        throw new DecodeError(`${method} ${uri} failed: Response body could not be read.`, {
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
        throw new DecodeError(`${method} ${uri} failed: ${subject} could not be parsed as JSON.`, {
            cause: err,
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    }
    try {
        return decodeEntry(schema, parsed);
    }
    catch (err) {
        if (!(err instanceof SchemaError))
            throw err;
        throw new DecodeError(`${method} ${uri} failed: ${subject} could not be decoded.`, {
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
        return decodeEntry(schema, text);
    }
    catch (err) {
        if (!(err instanceof SchemaError))
            throw err;
        throw new DecodeError(`${method} ${uri} failed: ${subject} could not be decoded.`, {
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
        if (err instanceof CoreError || (signal.aborted && err === signal.reason))
            throw err;
        throw new DecodeError(`${method} ${uri} failed: Response body could not be read.`, {
            cause: err,
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    }
    if (bytes.byteLength > 0)
        throw new DecodeError(`${method} ${uri} failed: Expected an empty response body.`, {
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
        if (err instanceof CoreError || (signal.aborted && err === signal.reason))
            throw err;
        throw new DecodeError(`${method} ${uri} failed: Response body could not be read.`, {
            cause: err,
            method,
            uri,
            status: response.status,
            headers: response.headers,
        });
    }
}
export function readEventStreamJson(decoder, response, method, uri, signal, options, abort) {
    const reader = new EventStreamReader(response, method, uri, signal, options, abort, decoder.sentinel);
    const events = (async function* () {
        for await (const data of reader.frames()) {
            yield decodeJsonText(decoder.dataSchema, data, "Event data", response, method, uri);
        }
        return undefined;
    })();
    return new EventStream(reader.close, events);
}
export function readEventStreamText(decoder, response, method, uri, signal, options, abort) {
    const reader = new EventStreamReader(response, method, uri, signal, options, abort, decoder.sentinel);
    const events = (async function* () {
        for await (const data of reader.frames()) {
            yield decodeTextValue(decoder.dataSchema, data, "Event data", response, method, uri);
        }
        return undefined;
    })();
    return new EventStream(reader.close, events);
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