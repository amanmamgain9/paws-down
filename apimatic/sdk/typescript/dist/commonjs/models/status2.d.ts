import type { EnumSchema } from "../core/validation/schema.js";
/**
 * The hold's state. Released means the money went back to the person; captured means they did not
 * show up and lost it.
 */
export declare const Status2: {
    readonly AwaitingApproval: "awaiting_approval";
    readonly Held: "held";
    readonly Released: "released";
    readonly Captured: "captured";
    readonly Failed: "failed";
};
export type Status2 = (typeof Status2)[keyof typeof Status2] | (string & {});
export declare const status2Schema: EnumSchema<Status2>;
