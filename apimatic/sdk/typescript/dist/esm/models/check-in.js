import * as s from "../core/validation/index.js";
export const checkInSchema = s.object({
    personId: s.string(),
    confirmedWithPartnerCode: s.boolean(),
    checkedInAt: s.dateTime(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=check-in.js.map