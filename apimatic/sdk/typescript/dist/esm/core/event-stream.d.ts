type AsyncDisposeKey = SymbolConstructor extends {
    readonly asyncDispose: infer K extends symbol;
} ? K : never;
type AsyncDisposeMember = {
    readonly [K in AsyncDisposeKey]: () => Promise<void>;
};
declare const AsyncDisposable: new () => AsyncDisposeMember;
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
export declare class EventStream<T> extends AsyncDisposable implements AsyncIterable<T> {
    #private;
    /**
     * The events' data, in order. Callable once: a second call throws a `TypeError`, as a second read
     * of a web stream does.
     */
    [Symbol.asyncIterator](): AsyncIterator<T, undefined, undefined>;
    /** Releases the connection, iterated or not. Safe to call more than once. */
    close(): Promise<void>;
    /**
     * The same events as a web `ReadableStream`, pulled one at a time; cancelling it releases the
     * connection. It takes the stream's one iteration.
     */
    toReadableStream(): ReadableStream<T>;
}
/**
 * How an event stream is watched for a silent server.
 *
 * @remarks
 * Resolved once, when the client is built. A field left out takes its default.
 */
export type EventStreamOptions = {
    /**
     * Milliseconds the server may stay silent while your loop waits for the next event. When it runs
     * out the loop ends with a `TimeoutError`. `null` disables it.
     *
     * @default 60000
     */
    readonly idleTimeout?: number | null;
};
export type ResolvedEventStreamOptions = Required<EventStreamOptions>;
export declare function buildEventStreamOptions(options: EventStreamOptions | undefined): ResolvedEventStreamOptions;
export {};
