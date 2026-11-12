import * as s from "../core/validation/index.js";
export const newPersonSchema = s.object({
    name: s.string(),
    wingcatName: s.string(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=new-person.js.map