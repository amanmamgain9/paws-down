import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** A person to register. */
export type NewPerson = {
  /** The person's first name. */
  name: string;
  /** The name of the wingcat that negotiates for this person. */
  wingcatName: string;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const newPersonSchema: Schema<NewPerson> = s.object<NewPerson>(
  {
    name: s.string(),
    wingcatName: s.string(),
  },
  { additionalProperties: s.json() },
);
