import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** A recorded check-in. */
export type CheckIn = {
  /** The person who checked in. */
  personId: string;
  /** True when the person entered the other person's code. */
  confirmedWithPartnerCode: boolean;
  /** When they checked in. */
  checkedInAt: Date;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const checkInSchema: Schema<CheckIn> = s.object<CheckIn>(
  {
    personId: s.string(),
    confirmedWithPartnerCode: s.boolean(),
    checkedInAt: s.dateTime(),
  },
  { additionalProperties: s.json() },
);
