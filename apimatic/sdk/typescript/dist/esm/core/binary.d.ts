import type { HttpMethod } from "./api-request.js";
import type { BinaryResponseDecoder } from "./response-decoder.js";
/**
 * Bytes, in any form the platform can send.
 *
 * @remarks
 * Bytes, not a file: nothing here carries a name or a media type. Wrap them in {@link FileData}
 * to attach either.
 *
 * A `ReadableStream` streams the request rather than buffering it: the fetch is sent with
 * `duplex: "half"`, and the body cannot be replayed, so a retry would have nothing left to send.
 * That holds for a multipart file part too: one streaming part makes the SDK frame the whole form
 * itself as a single chunked stream, taking the `Content-Length` and the replayability with it.
 *
 * If the request is aborted or times out mid-upload the SDK stops reading within one chunk and
 * hands the lock back, so the source is yours again to cancel or dispose from the `catch`. It is
 * never cancelled on your behalf — the SDK closes only what it opened. A stream that was fully
 * sent stays locked, which is the platform's own guard against sending a spent body twice.
 *
 * The async-iterable arm is what a Node stream satisfies, so `createReadStream(path)` can be
 * passed straight in and is forwarded chunk by chunk rather than buffered, under that same
 * one-shot rule. It is spelled structurally on purpose: naming Node's `Readable` would put
 * `@types/node` in the published declarations, which the DOM typecheck lane exists to prevent.
 */
export type BinaryData = Blob | Uint8Array<ArrayBuffer> | ArrayBuffer | ReadableStream<Uint8Array> | AsyncIterable<Uint8Array<ArrayBuffer>>;
/**
 * Bytes plus the name and media type to declare for them — what turns {@link BinaryData} into a
 * file, as the platform's own `File` does to a `Blob`.
 *
 * @remarks
 * Wrap a {@link BinaryData} in this to send a `Content-Disposition` filename, or to override the
 * media type the operation declares. Both are optional, and a `Blob` that already carries a `type`
 * or a `name` supplies them on its own.
 */
export type FileData = {
    readonly data: BinaryData;
    readonly fileName?: string | undefined;
    readonly contentType?: string | undefined;
};
/** A file to send: bare {@link BinaryData} bytes, or a {@link FileData} that names them. */
export type FileInput = BinaryData | FileData;
export type BufferedResolvedFile = {
    readonly body: Blob | Uint8Array<ArrayBuffer>;
    readonly contentType: string | undefined;
    readonly fileName: string | undefined;
    readonly streaming: false;
};
export type StreamingResolvedFile = {
    readonly body: ReadableStream<Uint8Array>;
    readonly contentType: string | undefined;
    readonly fileName: string | undefined;
    readonly streaming: true;
};
export type ResolvedFile = BufferedResolvedFile | StreamingResolvedFile;
export type ByteSource = Blob | Uint8Array<ArrayBuffer> | ReadableStream<Uint8Array>;
/**
 * An error response whose body is bytes rather than JSON, buffered in full.
 *
 * @remarks
 * Unlike a binary *success* body this is a value, not a resource: a thrown error's payload has no
 * lifetime, so the bytes are read before the rejection surfaces and there is nothing to release.
 */
export type BinaryErrorContent = {
    readonly bytes: Uint8Array<ArrayBuffer>;
    readonly contentType: string | undefined;
    readonly fileName: string | undefined;
};
/**
 * A binary response body you own — a handle over the still-open connection, not bytes.
 *
 * @remarks
 * The body arrives as an unread `ReadableStream` and is handled the way any web stream is: buffer
 * it with `new Response(file.stream)` and one of `bytes()`, `text()` or `blob()`, read it chunk by
 * chunk with a reader or `for await`, or release it unread with `file.stream.cancel()`. Once a
 * reader holds the lock, cancel through the reader instead. The stream is the response body
 * itself, so an abort or a dropped connection surfaces on it as the platform reports it: an abort
 * as the signal's `reason` when `fetch` ties the body to the signal, a dropped connection as the
 * platform's own error.
 */
export type BinaryContent = {
    /**
     * The body, unread — a web `ReadableStream` whose lifetime is yours.
     */
    readonly stream: ReadableStream<Uint8Array<ArrayBuffer>>;
    /** The media type the server declared, or the operation's declared type when it declared none. */
    readonly contentType: string;
    /**
     * The name from `Content-Disposition`, when the response carried one.
     *
     * @remarks
     * Server-chosen, and therefore **untrusted input**. Never use it as a path: sanitize it, or name
     * the file yourself.
     */
    readonly fileName: string | undefined;
};
export declare function readBinary(decoder: BinaryResponseDecoder, response: Response): BinaryContent;
export declare function readBinaryError(response: Response, method: HttpMethod, uri: string, signal: AbortSignal): Promise<BinaryErrorContent>;
export declare function resolveFile(input: FileInput, declaredContentType: string | undefined, signal?: AbortSignal): ResolvedFile;
export declare function concatStream(sources: readonly ByteSource[], signal: AbortSignal | undefined): ReadableStream<Uint8Array>;
export declare function attachmentDisposition(fileName: string | undefined): string | undefined;
export declare function parseFileName(disposition: string | null): string | undefined;
