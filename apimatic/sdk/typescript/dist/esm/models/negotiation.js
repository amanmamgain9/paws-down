import * as s from "../core/validation/index.js";
import { statusSchema } from "./status.js";
export const negotiationSchema = s.object({
    id: s.string(),
    personAId: s.string(),
    personBId: s.string(),
    status: statusSchema,
    round: s.int(),
    maxRounds: s.int(),
    turnPersonId: s.optional(s.string()),
    planId: s.optional(s.string()),
}, { additionalProperties: s.json() });
//# sourceMappingURL=negotiation.js.map