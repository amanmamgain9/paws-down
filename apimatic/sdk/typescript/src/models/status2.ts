import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The hold's state. Released means the money went back to the person; captured means they did not
 * show up and lost it.
 */
export const Status2 = {
  AwaitingApproval: "awaiting_approval",
  Held: "held",
  Released: "released",
  Captured: "captured",
  Failed: "failed",
} as const;
export type Status2 = (typeof Status2)[keyof typeof Status2] | (string & {});

export const status2Schema: EnumSchema<Status2> = s.enumOf<Status2>(Status2);
