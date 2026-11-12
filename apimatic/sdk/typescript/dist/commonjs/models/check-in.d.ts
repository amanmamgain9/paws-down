import type { JsonValue, Schema } from "../core/validation/schema.js";
/** A recorded check-in. */
export type CheckIn = {
    /** The person who checked in. */
    personId: string;
    /** True when the person entered the other person's code. */
    confirmedWithPartnerCode: boolean;
    /** When they checked in. */
    checkedInAt: Date;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const checkInSchema: Schema<CheckIn>;
