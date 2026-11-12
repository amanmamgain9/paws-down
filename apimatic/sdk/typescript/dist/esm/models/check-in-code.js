import * as s from "../core/validation/index.js";
export const checkInCodeSchema = s.object({
    personId: s.string(),
    code: s.string(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=check-in-code.js.map