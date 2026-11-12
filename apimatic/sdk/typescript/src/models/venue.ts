import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** A public place for a date. */
export type Venue = {
  /** The venue's ID. */
  id: string;
  /** The venue's name. Use it exactly in a proposal. */
  name: string;
  /** The part of town it is in. */
  area: string;
  /** What people do there. */
  activity: string;
  /** Typical cost for each person, in USD. */
  costPerPerson: number;
  /** Words describing the venue, useful for matching likes and dealbreakers. */
  tags: string[];
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const venueSchema: Schema<Venue> = s.object<Venue>(
  {
    id: s.string(),
    name: s.string(),
    area: s.string(),
    activity: s.string(),
    costPerPerson: s.float64(),
    tags: s.array(s.string()),
  },
  { additionalProperties: s.json() },
);
