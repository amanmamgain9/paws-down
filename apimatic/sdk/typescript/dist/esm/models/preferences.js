import * as s from "../core/validation/index.js";
import { intentSchema } from "./intent.js";
import { timeSlotSchema } from "./time-slot.js";
export const preferencesSchema = s.object({
    freeSlots: s.array(s.lazy(() => timeSlotSchema)),
    maxBudget: s.float64(),
    areas: s.array(s.string()),
    likes: s.optional(s.array(s.string())),
    dealbreakers: s.optional(s.array(s.string())),
    intent: s.optional(s.lazy(() => intentSchema)),
}, { additionalProperties: s.json() });
//# sourceMappingURL=preferences.js.map