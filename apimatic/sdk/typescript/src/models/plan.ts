import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";
import { approvalSchema, type Approval } from "./approval.js";
import { checkInSchema, type CheckIn } from "./check-in.js";
import { depositSchema, type Deposit } from "./deposit.js";
import { status1Schema, type Status1 } from "./status1.js";

/** An agreed date and everything that happens to it afterwards. */
export type Plan = {
  /** The plan's ID. */
  id: string;
  /** The negotiation that produced the plan. */
  negotiationId: string;
  /**
   * Where the plan stands. It is locked once both holds are in place and settled once the holds
   * have been released or captured.
   */
  status: Status1;
  /** When the date starts. */
  startsAt: Date;
  /** Where the date is. */
  venue: string;
  /** The part of town the venue is in. */
  area: string;
  /** What the two will do. */
  activity: string;
  /** Estimated cost for each person, in USD. */
  costPerPerson: number;
  /** The refundable hold each person places, in USD. */
  depositAmount: number;
  /** Either person can cancel before this time and both holds are released. */
  cancelBy: Date;
  /** When check-in opens. */
  checkInOpensAt: Date;
  /** When check-in closes and the deposits are settled. */
  checkInClosesAt: Date;
  /** Each person's answer so far. */
  approvals: Approval[];
  /** Each person's hold. */
  deposits: Deposit[];
  /** Who has checked in. */
  checkIns: CheckIn[];
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const planSchema: Schema<Plan> = s.object<Plan>(
  {
    id: s.string(),
    negotiationId: s.string(),
    status: status1Schema,
    startsAt: s.dateTime(),
    venue: s.string(),
    area: s.string(),
    activity: s.string(),
    costPerPerson: s.float64(),
    depositAmount: s.float64(),
    cancelBy: s.dateTime(),
    checkInOpensAt: s.dateTime(),
    checkInClosesAt: s.dateTime(),
    approvals: s.array(s.lazy(() => approvalSchema)),
    deposits: s.array(s.lazy(() => depositSchema)),
    checkIns: s.array(s.lazy(() => checkInSchema)),
  },
  { additionalProperties: s.json() },
);
