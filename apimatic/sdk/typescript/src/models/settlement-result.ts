import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";
import { depositStatusSchema, type DepositStatus } from "./deposit-status.js";

/** The outcome for one person's hold. */
export type SettlementResult = {
  /** The person. */
  personId: string;
  /** Whether the person checked in. */
  showedUp: boolean;
  /** What happened to their hold. */
  depositStatus: DepositStatus;
  /** The amount released or captured, in USD. */
  amount: number;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const settlementResultSchema: Schema<SettlementResult> = s.object<SettlementResult>(
  {
    personId: s.string(),
    showedUp: s.boolean(),
    depositStatus: depositStatusSchema,
    amount: s.float64(),
  },
  { additionalProperties: s.json() },
);
