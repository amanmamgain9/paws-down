import type { EnumSchema } from "../core/validation/schema.js";
/** What happened to their hold. */
export declare const DepositStatus: {
    readonly Released: "released";
    readonly Captured: "captured";
};
export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus] | (string & {});
export declare const depositStatusSchema: EnumSchema<DepositStatus>;
