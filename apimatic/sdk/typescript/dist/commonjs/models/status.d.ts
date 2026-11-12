import type { EnumSchema } from "../core/validation/schema.js";
/** Where the negotiation stands. */
export declare const Status: {
    readonly Open: "open";
    readonly Agreed: "agreed";
    readonly Failed: "failed";
};
export type Status = (typeof Status)[keyof typeof Status] | (string & {});
export declare const statusSchema: EnumSchema<Status>;
