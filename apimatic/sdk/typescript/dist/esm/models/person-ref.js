import * as s from "../core/validation/index.js";
export const personRefSchema = s.object({
    personId: s.string(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=person-ref.js.map