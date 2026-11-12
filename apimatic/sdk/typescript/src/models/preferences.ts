import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";
import { intentSchema, type Intent } from "./intent.js";
import { timeSlotSchema, type TimeSlot } from "./time-slot.js";

/** What a person wants from a date. The server treats these as hard limits. */
export type Preferences = {
  /** Times the person is free. A plan must start inside one of them. */
  freeSlots: TimeSlot[];
  /** The most the person will spend on the date, in USD. */
  maxBudget: number;
  /** The parts of town the person can get to. A plan's area must be one of them. */
  areas: string[];
  /** Activities or food the person enjoys. */
  likes?: string[];
  /** Things the plan must not include. */
  dealbreakers?: string[];
  /**
   * What the person is looking for. Two people are only paired when their answers match or one of
   * them is not sure.
   */
  intent?: Intent;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const preferencesSchema: Schema<Preferences> = s.object<Preferences>(
  {
    freeSlots: s.array(s.lazy(() => timeSlotSchema)),
    maxBudget: s.float64(),
    areas: s.array(s.string()),
    likes: s.optional(s.array(s.string())),
    dealbreakers: s.optional(s.array(s.string())),
    intent: s.optional(s.lazy(() => intentSchema)),
  },
  { additionalProperties: s.json() },
);
