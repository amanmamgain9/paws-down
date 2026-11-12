import * as s from "../core/validation/index.js";
export const errorErrorSchema = s.object({
    code: s.string(),
    message: s.string(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=error-error.js.map