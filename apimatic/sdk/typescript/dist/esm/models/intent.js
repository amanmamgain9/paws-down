import * as s from "../core/validation/index.js";
/**
 * What the person is looking for. Two people are only paired when their answers match or one of
 * them is not sure.
 */
export const Intent = {
    Serious: "serious",
    Casual: "casual",
    NotSure: "not_sure",
};
export const intentSchema = s.enumOf(Intent);
//# sourceMappingURL=intent.js.map