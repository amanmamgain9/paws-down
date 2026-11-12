import type { JsonValue, Schema } from "../core/validation/schema.js";
/** A window of free time. */
export type TimeSlot = {
    /** When the window opens. */
    start: Date;
    /** When the window closes. */
    end: Date;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const timeSlotSchema: Schema<TimeSlot>;
