import { ConnectionError, TimeoutError } from "./errors.js";
const LINE_FEED = "\n";
const CARRIAGE_RETURN = "\r";
const LINE_FEED_CODE = 0x0a;
const SPACE_CODE = 0x20;
const BYTE_ORDER_MARK_CODE = 0xfeff;
const DATA_FIELD = "data";
export class EventStreamReader {
    #response;
    #method;
    #uri;
    #signal;
    #abort;
    #sentinel;
    #clock;
    #parser = new EventStreamParser();
    #reader;
    #released;
    #failure;
    #onAbort;
    constructor(response, method, uri, signal, options, abort, sentinel) {
        this.#response = response;
        this.#method = method;
        this.#uri = uri;
        this.#signal = signal;
        this.#abort = abort;
        this.#sentinel = sentinel;
        this.#clock = new IdleClock(options.idleTimeout, (bound) => this.#lapse(bound));
    }
    close = () => this.#release(undefined);
    async *frames() {
        try {
            this.#watchSignal();
            for (;;) {
                if (this.#halted())
                    return undefined;
                const bytes = await this.#readChunk();
                if (bytes === undefined)
                    return undefined;
                for (const data of this.#parser.parse(bytes)) {
                    if (this.#halted())
                        return undefined;
                    if (data === this.#sentinel)
                        return undefined;
                    yield data;
                }
            }
        }
        finally {
            void this.#release(undefined);
        }
    }
    #halted() {
        if (this.#failure !== undefined)
            throw this.#failure.error;
        return this.#released !== undefined;
    }
    async #readChunk() {
        const body = this.#response.body;
        if (body === null)
            return undefined;
        let result;
        let fault;
        this.#clock.start();
        try {
            result = await (this.#reader ??= body.getReader()).read();
        }
        catch (error) {
            fault = error;
        }
        finally {
            this.#clock.pause();
        }
        if (this.#halted())
            return undefined;
        const lapsed = this.#clock.take();
        if (lapsed !== undefined)
            throw lapsed;
        if (result === undefined) {
            const signal = this.#signal;
            throw signal.aborted && fault === signal.reason ? fault : this.#readError(fault);
        }
        return result.done ? undefined : result.value;
    }
    #watchSignal() {
        const signal = this.#signal;
        if (this.#released !== undefined)
            return;
        if (signal.aborted) {
            void this.#release({ error: signal.reason });
            return;
        }
        const onAbort = () => {
            void this.#release({ error: signal.reason });
        };
        this.#onAbort = onAbort;
        signal.addEventListener("abort", onAbort, { once: true });
    }
    #lapse(bound) {
        const error = new TimeoutError(`${this.#method} ${this.#uri} failed: Event stream was idle for ${bound}ms.`, {
            method: this.#method,
            uri: this.#uri,
            timeout: bound,
        });
        void this.#drop(error);
        return error;
    }
    #release(failure) {
        if (this.#released !== undefined)
            return this.#released;
        this.#failure = failure;
        this.#clock.stop();
        if (this.#onAbort !== undefined)
            this.#signal.removeEventListener("abort", this.#onAbort);
        this.#onAbort = undefined;
        void this.#drop(failure?.error);
        this.#released = Promise.resolve();
        return this.#released;
    }
    #drop(reason) {
        const reader = this.#reader;
        const cancelled = Promise.resolve(reader === undefined ? this.#response.body?.cancel(reason) : reader.cancel(reason)).catch(() => { });
        this.#abort();
        return cancelled;
    }
    #readError(error) {
        return new ConnectionError(`${this.#method} ${this.#uri} failed: Event stream could not be read.`, {
            method: this.#method,
            uri: this.#uri,
            cause: error,
        });
    }
}
class IdleClock {
    #bound;
    #lapse;
    #timer;
    #waitingSince;
    #lapsed;
    constructor(bound, lapse) {
        this.#bound = bound;
        this.#lapse = lapse;
    }
    start() {
        const bound = this.#bound;
        if (bound === null)
            return;
        this.#waitingSince = performance.now();
        this.#timer ??= setTimeout(() => this.#tick(bound), bound);
    }
    pause() {
        this.#waitingSince = undefined;
    }
    stop() {
        clearTimeout(this.#timer);
        this.#timer = undefined;
    }
    take() {
        const lapsed = this.#lapsed;
        this.#lapsed = undefined;
        return lapsed;
    }
    #tick(bound) {
        this.#timer = undefined;
        const since = this.#waitingSince;
        if (since === undefined)
            return;
        const remaining = bound - (performance.now() - since);
        if (remaining > 0) {
            this.#timer = setTimeout(() => this.#tick(bound), Math.ceil(remaining));
            return;
        }
        this.#lapsed = this.#lapse(bound);
    }
}
class EventStreamParser {
    #decoder = new TextDecoder("utf-8", { ignoreBOM: true });
    #started = false;
    #rest = "";
    parse(bytes) {
        const chunk = this.#decode(bytes);
        const text = this.#rest === "" ? chunk : this.#rest + chunk;
        const frames = [];
        let blockStart = 0;
        let data = "";
        let position = 0;
        let lineFeed = text.indexOf(LINE_FEED);
        let carriageReturn = text.indexOf(CARRIAGE_RETURN);
        while (lineFeed !== -1 || carriageReturn !== -1) {
            const end = lineFeed === -1 || (carriageReturn !== -1 && carriageReturn < lineFeed) ? carriageReturn : lineFeed;
            const line = text.slice(position, end);
            position = end + 1;
            if (end === carriageReturn && text.charCodeAt(position) === LINE_FEED_CODE)
                position += 1;
            if (line === "") {
                if (data !== "")
                    frames.push(data.slice(0, -1));
                data = "";
                blockStart = position;
            }
            else {
                const value = this.#dataOf(line);
                if (value !== undefined)
                    data += value + LINE_FEED;
            }
            if (lineFeed !== -1 && lineFeed < position)
                lineFeed = text.indexOf(LINE_FEED, position);
            if (carriageReturn !== -1 && carriageReturn < position)
                carriageReturn = text.indexOf(CARRIAGE_RETURN, position);
        }
        this.#rest = text.slice(blockStart);
        return frames;
    }
    #dataOf(line) {
        const colon = line.indexOf(":");
        if (colon === -1)
            return line === DATA_FIELD ? "" : undefined;
        if (colon !== DATA_FIELD.length || !line.startsWith(DATA_FIELD))
            return undefined;
        return line.slice(line.charCodeAt(colon + 1) === SPACE_CODE ? colon + 2 : colon + 1);
    }
    #decode(bytes) {
        const text = this.#decoder.decode(bytes, { stream: true });
        if (this.#started || text === "")
            return text;
        this.#started = true;
        return text.charCodeAt(0) === BYTE_ORDER_MARK_CODE ? text.slice(1) : text;
    }
}
//# sourceMappingURL=event-stream-reader.js.map