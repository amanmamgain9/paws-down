import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * Where the plan stands. It is locked once both holds are in place and settled once the holds have
 * been released or captured.
 */
export const Status1 = {
  AwaitingApproval: "awaiting_approval",
  AwaitingDeposits: "awaiting_deposits",
  Locked: "locked",
  Settled: "settled",
  Cancelled: "cancelled",
} as const;
export type Status1 = (typeof Status1)[keyof typeof Status1] | (string & {});

export const status1Schema: EnumSchema<Status1> = s.enumOf<Status1>(Status1);
