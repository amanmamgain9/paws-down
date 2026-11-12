import type { JsonValue, Schema } from "../core/validation/schema.js";
/** The code a person shows to their date. */
export type CheckInCode = {
    /** The person the code belongs to. */
    personId: string;
    /** The code to show. */
    code: string;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const checkInCodeSchema: Schema<CheckInCode>;
