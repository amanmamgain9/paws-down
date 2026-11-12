import type { EnumSchema } from "../core/validation/schema.js";
/** What happened on the date. */
export declare const Outcome: {
    readonly BothShowed: "both_showed";
    readonly OneNoShow: "one_no_show";
    readonly BothNoShow: "both_no_show";
    readonly Cancelled: "cancelled";
};
export type Outcome = (typeof Outcome)[keyof typeof Outcome] | (string & {});
export declare const outcomeSchema: EnumSchema<Outcome>;
