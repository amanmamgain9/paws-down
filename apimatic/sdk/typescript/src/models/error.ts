import * as s from "../core/validation/index.js";
import type { JsonValue, Schema } from "../core/validation/schema.js";

/** An error returned by the API. */
export type Error = {
  /** A short machine-readable code. */
  code: string;
  /** A sentence a person can read. */
  message: string;
  /** Properties the service sent or accepts beyond those declared. */
  additionalProperties?: Record<string, JsonValue>;
};

export const errorSchema: Schema<Error> = s.object<Error>(
  {
    code: s.string(),
    message: s.string(),
  },
  { additionalProperties: s.json() },
);
