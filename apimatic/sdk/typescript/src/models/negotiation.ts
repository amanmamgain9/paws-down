import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";
import { statusSchema, type Status } from "./status.js";

/** A negotiation between two wingcats. */
export type Negotiation = {
  /** The negotiation's ID. */
  id: string;
  /** The person whose wingcat proposed first. */
  personAId: string;
  /** The other person. */
  personBId: string;
  /** Where the negotiation stands. */
  status: Status;
  /** How many proposals have been made. */
  round: number;
  /** The negotiation fails after this many proposals without agreement. */
  maxRounds: number;
  /** Whose wingcat must act next. Absent once the negotiation is over. */
  turnPersonId?: string;
  /** The plan created when the negotiation was agreed. */
  planId?: string;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const negotiationSchema: Schema<Negotiation> = s.object<Negotiation>(
  {
    id: s.string(),
    personAId: s.string(),
    personBId: s.string(),
    status: statusSchema,
    round: s.int(),
    maxRounds: s.int(),
    turnPersonId: s.optional(s.string()),
    planId: s.optional(s.string()),
  },
  { additionalProperties: s.json() },
);
