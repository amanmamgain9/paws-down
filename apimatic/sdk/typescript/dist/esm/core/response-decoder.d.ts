import type { Entry } from "./validation/schema.js";
import type { HttpMethod, RawClientOptions } from "./api-request.js";
import type { BinaryContent, BinaryErrorContent } from "./binary.js";
import type { ResolvedEventStreamOptions } from "./event-stream.js";
import { EventStream } from "./event-stream.js";
import type { ApiError, ApiErrorInit, Declared } from "./api-error.js";
export type JsonResponseDecoder<T> = {
    readonly kind: "json";
    readonly schema: Entry<T>;
};
export type TextResponseDecoder<T> = {
    readonly kind: "text";
    readonly schema: Entry<T>;
};
export type EmptyResponseDecoder = {
    readonly kind: "empty";
};
export type BinaryResponseDecoder = {
    readonly kind: "binary";
    readonly contentType: string;
};
export type BinaryErrorResponseDecoder = {
    readonly kind: "binaryError";
};
export type EventStreamTextResponseDecoder<T> = {
    readonly kind: "eventStreamText";
    readonly dataSchema: Entry<T>;
    readonly sentinel?: string | undefined;
};
export type EventStreamJsonResponseDecoder<T> = {
    readonly kind: "eventStreamJson";
    readonly dataSchema: Entry<T>;
    readonly sentinel?: string | undefined;
};
export type EventStreamResponseDecoder<T> = EventStreamTextResponseDecoder<T> | EventStreamJsonResponseDecoder<T>;
export type ResponseDecoder<T> = JsonResponseDecoder<T> | TextResponseDecoder<T> | ([T] extends [undefined] ? EmptyResponseDecoder : never) | ([T] extends [BinaryContent] ? BinaryResponseDecoder : never) | ([T] extends [EventStream<infer D>] ? EventStreamResponseDecoder<D> : never);
export type ErrorResponseDecoder<T> = JsonResponseDecoder<T> | TextResponseDecoder<T> | ([T] extends [undefined] ? EmptyResponseDecoder : never) | ([T] extends [BinaryErrorContent] ? BinaryErrorResponseDecoder : never);
export type StatusPattern = number | "1XX" | "2XX" | "3XX" | "4XX" | "5XX" | "default" | readonly [number, number];
/**
 * The payload union an operation's error class declares.
 *
 * @remarks
 * It is the type of `err.payload` on the thrown error and of `result.payload` on the
 * `ok: false` arm of `ApiResult`, so a narrowing written for one works unchanged for the other.
 */
export type PayloadOf<E extends ApiError> = E["payload"];
type BodyByKind<Payload> = {
    [Arm in Extract<Payload, Declared<string, unknown>> as Arm["kind"]]: Arm["body"];
};
type KindOf<Payload> = keyof BodyByKind<Payload> & string;
export type ErrorMatcher<Payload, K extends KindOf<Payload> = KindOf<Payload>> = {
    readonly on: StatusPattern;
    readonly kind: K;
    readonly decode: ErrorResponseDecoder<BodyByKind<Payload>[K]>;
};
type ErrorMatcherOf<Payload> = {
    [K in KindOf<Payload>]: ErrorMatcher<Payload, K>;
}[KindOf<Payload>];
export type ErrorDecoders<E extends ApiError> = readonly ErrorMatcherOf<PayloadOf<E>>[];
export type ErrorFactory<E extends ApiError> = (new (init: ApiErrorInit<PayloadOf<E>>) => E) & {
    readonly errors?: ErrorDecoders<E> | undefined;
};
export type ResponseHandler<T = unknown, E extends ApiError = ApiError> = {
    success: ResponseDecoder<T>;
    errorFactory: ErrorFactory<E>;
};
type ReaderOptions = Pick<RawClientOptions, "eventStream">;
export declare class ResponseReader {
    #private;
    constructor(options: ReaderOptions);
    read<T>(decoder: ResponseDecoder<T> | ErrorResponseDecoder<T>, response: Response, method: HttpMethod, uri: string, signal: AbortSignal, abort: () => void): Promise<T>;
    readError<E extends ApiError>(factory: ErrorFactory<E>, response: Response, method: HttpMethod, uri: string, signal: AbortSignal, abort: () => void): Promise<E>;
}
export declare function readEventStreamJson<T>(decoder: EventStreamJsonResponseDecoder<T>, response: Response, method: HttpMethod, uri: string, signal: AbortSignal, options: ResolvedEventStreamOptions, abort: () => void): EventStream<T>;
export declare function readEventStreamText<T>(decoder: EventStreamTextResponseDecoder<T>, response: Response, method: HttpMethod, uri: string, signal: AbortSignal, options: ResolvedEventStreamOptions, abort: () => void): EventStream<T>;
export {};
