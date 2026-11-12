import type { HttpMethod } from "./api-request.js";
import type { ResolvedEventStreamOptions } from "./event-stream.js";
export declare class EventStreamReader {
    #private;
    constructor(response: Response, method: HttpMethod, uri: string, signal: AbortSignal, options: ResolvedEventStreamOptions, abort: () => void, sentinel: string | undefined);
    readonly close: () => Promise<void>;
    frames(): AsyncGenerator<string, undefined, undefined>;
}
