import * as s from "../core/validation/index.js";
import { preferencesSchema } from "./preferences.js";
export const personSchema = s.object({
    id: s.string(),
    name: s.string(),
    wingcatName: s.string(),
    preferences: s.optional(s.lazy(() => preferencesSchema)),
}, { additionalProperties: s.json() });
//# sourceMappingURL=person.js.map