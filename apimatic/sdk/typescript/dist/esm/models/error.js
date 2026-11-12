import * as s from "../core/validation/index.js";
export const errorSchema = s.object({
    code: s.string(),
    message: s.string(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=error.js.map