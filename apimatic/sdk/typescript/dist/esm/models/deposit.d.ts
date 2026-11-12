import type { JsonValue, Schema } from "../core/validation/schema.js";
import { type Status2 } from "./status2.js";
/** One person's refundable hold. */
export type Deposit = {
    /** The deposit's ID. */
    id: string;
    /** The plan it secures. */
    planId: string;
    /** The person who placed it. */
    personId: string;
    /** The amount held, in USD. */
    amount: number;
    /**
     * The hold's state. Released means the money went back to the person; captured means they did not
     * show up and lost it.
     */
    status: Status2;
    /** The PayPal page the person opens to approve the hold. Present while awaiting approval. */
    approveUrl?: string;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const depositSchema: Schema<Deposit>;
