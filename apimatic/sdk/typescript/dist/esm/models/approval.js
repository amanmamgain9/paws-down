import * as s from "../core/validation/index.js";
export const approvalSchema = s.object({
    personId: s.string(),
    approved: s.boolean(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=approval.js.map