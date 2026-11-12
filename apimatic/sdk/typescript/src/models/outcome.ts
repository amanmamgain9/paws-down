import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** What happened on the date. */
export const Outcome = {
  BothShowed: "both_showed",
  OneNoShow: "one_no_show",
  BothNoShow: "both_no_show",
  Cancelled: "cancelled",
} as const;
export type Outcome = (typeof Outcome)[keyof typeof Outcome] | (string & {});

export const outcomeSchema: EnumSchema<Outcome> = s.enumOf<Outcome>(Outcome);
