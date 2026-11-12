import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** What happened to their hold. */
export const DepositStatus = {
  Released: "released",
  Captured: "captured",
} as const;
export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus] | (string & {});

export const depositStatusSchema: EnumSchema<DepositStatus> = s.enumOf<DepositStatus>(DepositStatus);
