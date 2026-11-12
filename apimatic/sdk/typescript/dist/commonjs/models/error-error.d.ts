import type { JsonValue, Schema } from "../core/validation/schema.js";
/** An error returned by the API. */
export type ErrorError = {
    /** A short machine-readable code. */
    code: string;
    /** A sentence a person can read. */
    message: string;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const errorErrorSchema: Schema<ErrorError>;
