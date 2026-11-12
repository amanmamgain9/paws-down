import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * What the person is looking for. Two people are only paired when their answers match or one of
 * them is not sure.
 */
export const Intent = {
  Serious: "serious",
  Casual: "casual",
  NotSure: "not_sure",
} as const;
export type Intent = (typeof Intent)[keyof typeof Intent] | (string & {});

export const intentSchema: EnumSchema<Intent> = s.enumOf<Intent>(Intent);
