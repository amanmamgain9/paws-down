import * as s from "../core/validation/index.js";
export const newCheckInSchema = s.object({
    personId: s.string(),
    partnerCode: s.optional(s.string()),
}, { additionalProperties: s.json() });
//# sourceMappingURL=new-check-in.js.map