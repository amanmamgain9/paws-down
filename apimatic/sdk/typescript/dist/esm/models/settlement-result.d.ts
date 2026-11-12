import type { JsonValue, Schema } from "../core/validation/schema.js";
import { type DepositStatus } from "./deposit-status.js";
/** The outcome for one person's hold. */
export type SettlementResult = {
    /** The person. */
    personId: string;
    /** Whether the person checked in. */
    showedUp: boolean;
    /** What happened to their hold. */
    depositStatus: DepositStatus;
    /** The amount released or captured, in USD. */
    amount: number;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const settlementResultSchema: Schema<SettlementResult>;
