import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";
import { preferencesSchema, type Preferences } from "./preferences.js";

/** A registered person. */
export type Person = {
  /** The person's ID. */
  id: string;
  /** The person's first name. */
  name: string;
  /** The name of this person's wingcat. */
  wingcatName: string;
  /** What a person wants from a date. The server treats these as hard limits. */
  preferences?: Preferences;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const personSchema: Schema<Person> = s.object<Person>(
  {
    id: s.string(),
    name: s.string(),
    wingcatName: s.string(),
    preferences: s.optional(s.lazy(() => preferencesSchema)),
  },
  { additionalProperties: s.json() },
);
