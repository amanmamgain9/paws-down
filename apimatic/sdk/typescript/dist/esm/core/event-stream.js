import * as s from "./validation/index.js";
import { ConfigurationError } from "./errors.js";
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
export class EventStream extends AsyncDisposable {
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
const asyncDispose = Reflect.get(Symbol, "asyncDispose");
if (typeof asyncDispose === "symbol") {
    Object.defineProperty(EventStream.prototype, asyncDispose, {
        value() {
            return this.close();
        },
    });
}
export function buildEventStreamOptions(options) {
    const schema = s.of(s.fallback(s.object({
        idleTimeout: s.fallback(s.nullable(s.int().check(s.gte(0), s.lte(MAX_TIMEOUT_MS))), DEFAULT_EVENT_STREAM_OPTIONS.idleTimeout),
    }), DEFAULT_EVENT_STREAM_OPTIONS));
    try {
        return schema.decode(options);
    }
    catch (err) {
        throw new ConfigurationError("The event stream options could not be resolved.", { cause: err });
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