import type { JsonValue, Schema } from "../core/validation/schema.js";
/** A person's answer to the agreed plan. */
export type Approval = {
    /** The person answering. */
    personId: string;
    /** True to go ahead, false to call it off. */
    approved: boolean;
    /** Properties the service sent or accepts beyond those declared. */
    additionalProperties?: Record<string, JsonValue>;
};
export declare const approvalSchema: Schema<Approval>;
