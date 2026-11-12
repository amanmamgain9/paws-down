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
exports.EventStream = void 0;
exports.buildEventStreamOptions = buildEventStreamOptions;
const s = __importStar(require("./validation/index.js"));
const errors_js_1 = require("./errors.js");
const MAX_TIMEOUT_MS = 2_147_483_647;
const DEFAULT_EVENT_STREAM_OPTIONS = {
    idleTimeout: 60_000,
};
const AsyncDisposable = class {
};
/**
 * A server-sent event stream you own: the still-open response, read one event at a time.
 *
 * @remarks
 * The operation resolves as soon as the response headers arrive. Iterate the stream once with
 * `for await`, or release it unread with `close()`. Each step is one event's `data`, decoded
 * through the schema the operation declares, and nothing is read ahead of your loop. Leaving the
 * loop early releases the connection. Aborting the call's `signal` ends the loop with the signal's
 * own `reason`, and every other failure is a `CoreError`. Where the platform supports
 * `await using`, disposing the stream releases the connection too.
 */
class EventStream extends AsyncDisposable {
    #close;
    #events;
    #taken = false;
    /** @internal Engine-only: the stream decoders in `response-decoder.ts` build it. */
    constructor(close, events) {
        super();
        this.#close = close;
        this.#events = events;
    }
    /**
     * The events' data, in order. Callable once: a second call throws a `TypeError`, as a second read
     * of a web stream does.
     */
    [Symbol.asyncIterator]() {
        return this.#take();
    }
    /** Releases the connection, iterated or not. Safe to call more than once. */
    close() {
        return this.#close();
    }
    /**
     * The same events as a web `ReadableStream`, pulled one at a time; cancelling it releases the
     * connection. It takes the stream's one iteration.
     */
    toReadableStream() {
        return pullStream(this.#take());
    }
    #take() {
        if (this.#taken) {
            throw new TypeError("An event stream can be read once, and this one is already being read.");
        }
        this.#taken = true;
        const events = this.#events;
        return {
            next: () => events.next(),
            return: () => {
                void this.#close();
                return events.return(undefined);
            },
        };
    }
}
exports.EventStream = EventStream;
const asyncDispose = Reflect.get(Symbol, "asyncDispose");
if (typeof asyncDispose === "symbol") {
    Object.defineProperty(EventStream.prototype, asyncDispose, {
        value() {
            return this.close();
        },
    });
}
function buildEventStreamOptions(options) {
    const schema = s.of(s.fallback(s.object({
        idleTimeout: s.fallback(s.nullable(s.int().check(s.gte(0), s.lte(MAX_TIMEOUT_MS))), DEFAULT_EVENT_STREAM_OPTIONS.idleTimeout),
    }), DEFAULT_EVENT_STREAM_OPTIONS));
    try {
        return schema.decode(options);
    }
    catch (err) {
        throw new errors_js_1.ConfigurationError("The event stream options could not be resolved.", { cause: err });
    }
}
function pullStream(iterator) {
    return new ReadableStream({
        pull: async (controller) => {
            const next = await iterator.next();
            if (next.done === true)
                controller.close();
            else
                controller.enqueue(next.value);
        },
        cancel: async () => {
            await iterator.return();
        },
    }, { highWaterMark: 0 });
}
//# sourceMappingURL=event-stream.js.map