import type { JsonValue, Schema } from "../core/validation/schema.js";
import { type Outcome } from "./outcome.js";
import { type SettlementResult } from "./settlement-result.js";
/** The outcome of a date for both deposits. */
export type Settlement = {
    /** The plan that was settled. */
    planId: string;
    /** What happened on the date. */
    outcome: Outcome;
    /** When the settlement ran. */
    settledAt?: Date;
    /** What happened to each person's hold. */
    results: SettlementResult[];
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const settlementSchema: Schema<Settlement>;
