import type { JsonValue, Schema } from "../core/validation/schema.js";
import { type Intent } from "./intent.js";
import { type TimeSlot } from "./time-slot.js";
/** What a person wants from a date. The server treats these as hard limits. */
export type Preferences = {
    /** Times the person is free. A plan must start inside one of them. */
    freeSlots: TimeSlot[];
    /** The most the person will spend on the date, in USD. */
    maxBudget: number;
    /** The parts of town the person can get to. A plan's area must be one of them. */
    areas: string[];
    /** Activities or food the person enjoys. */
    likes?: string[];
    /** Things the plan must not include. */
    dealbreakers?: string[];
    /**
     * What the person is looking for. Two people are only paired when their answers match or one of
     * them is not sure.
     */
    intent?: Intent;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const preferencesSchema: Schema<Preferences>;
