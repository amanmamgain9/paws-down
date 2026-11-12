import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** Identifies the person an action is taken for. */
export type PersonRef = {
  /** The person's ID. */
  personId: string;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const personRefSchema: Schema<PersonRef> = s.object<PersonRef>(
  {
    personId: s.string(),
  },
  { additionalProperties: s.json() },
);
