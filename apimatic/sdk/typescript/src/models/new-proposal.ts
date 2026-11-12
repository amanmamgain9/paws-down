import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** A proposed date. */
export type NewProposal = {
  /** The person this proposal is made for. */
  fromPersonId: string;
  /** When the date would start. */
  startsAt: Date;
  /** Where the date would be. */
  venue: string;
  /** The part of town the venue is in. */
  area: string;
  /** What the two would do. */
  activity: string;
  /** Estimated cost for each person, in USD. */
  costPerPerson: number;
  /** One sentence, shown to both people, on why the wingcat is proposing this. */
  reason: string;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const newProposalSchema: Schema<NewProposal> = s.object<NewProposal>(
  {
    fromPersonId: s.string(),
    startsAt: s.dateTime(),
    venue: s.string(),
    area: s.string(),
    activity: s.string(),
    costPerPerson: s.float64(),
    reason: s.string(),
  },
  { additionalProperties: s.json() },
);
