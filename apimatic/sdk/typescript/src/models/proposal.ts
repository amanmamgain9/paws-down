import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** A proposal recorded in a negotiation. */
export type Proposal = {
  /** The proposal's ID. */
  id: string;
  /** The negotiation it belongs to. */
  negotiationId: string;
  /** The person it was made for. */
  fromPersonId: string;
  /** When the date would start. */
  startsAt: Date;
  /** Where the date would be. */
  venue: string;
  /** The part of town the venue is in. */
  area?: string;
  /** What the two would do. */
  activity: string;
  /** Estimated cost for each person, in USD. */
  costPerPerson: number;
  /** Why the wingcat proposed this. */
  reason: string;
  /** Which round of the negotiation this was. */
  round: number;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const proposalSchema: Schema<Proposal> = s.object<Proposal>(
  {
    id: s.string(),
    negotiationId: s.string(),
    fromPersonId: s.string(),
    startsAt: s.dateTime(),
    venue: s.string(),
    area: s.optional(s.string()),
    activity: s.string(),
    costPerPerson: s.float64(),
    reason: s.string(),
    round: s.int(),
  },
  { additionalProperties: s.json() },
);
