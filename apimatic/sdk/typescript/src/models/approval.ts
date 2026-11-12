import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** A person's answer to the agreed plan. */
export type Approval = {
  /** The person answering. */
  personId: string;
  /** True to go ahead, false to call it off. */
  approved: boolean;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const approvalSchema: Schema<Approval> = s.object<Approval>(
  {
    personId: s.string(),
    approved: s.boolean(),
  },
  { additionalProperties: s.json() },
);
