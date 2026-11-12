import type { JsonValue, Schema } from "../core/validation/schema.js";
/** A check-in attempt. */
export type NewCheckIn = {
    /** The person checking in. */
    personId: string;
    /**
     * The code shown on the other person's screen. Send it when you have met, to confirm you are
     * together.
     */
    partnerCode?: string;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const newCheckInSchema: Schema<NewCheckIn>;
