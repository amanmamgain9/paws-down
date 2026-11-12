import type { EnumSchema } from "../core/validation/schema.js";
/**
 * Where the plan stands. It is locked once both holds are in place and settled once the holds have
 * been released or captured.
 */
export declare const Status1: {
    readonly AwaitingApproval: "awaiting_approval";
    readonly AwaitingDeposits: "awaiting_deposits";
    readonly Locked: "locked";
    readonly Settled: "settled";
    readonly Cancelled: "cancelled";
};
export type Status1 = (typeof Status1)[keyof typeof Status1] | (string & {});
export declare const status1Schema: EnumSchema<Status1>;
