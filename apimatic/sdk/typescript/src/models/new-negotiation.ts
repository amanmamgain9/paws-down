import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** The two people whose wingcats should negotiate. */
export type NewNegotiation = {
  /** The person whose wingcat proposes first. */
  personAId: string;
  /** The other person. */
  personBId: string;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const newNegotiationSchema: Schema<NewNegotiation> = s.object<NewNegotiation>(
  {
    personAId: s.string(),
    personBId: s.string(),
  },
  { additionalProperties: s.json() },
);
