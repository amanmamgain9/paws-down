import type { EnumSchema } from "../core/validation/schema.js";
/**
 * What the person is looking for. Two people are only paired when their answers match or one of
 * them is not sure.
 */
export declare const Intent: {
    readonly Serious: "serious";
    readonly Casual: "casual";
    readonly NotSure: "not_sure";
};
export type Intent = (typeof Intent)[keyof typeof Intent] | (string & {});
export declare const intentSchema: EnumSchema<Intent>;
