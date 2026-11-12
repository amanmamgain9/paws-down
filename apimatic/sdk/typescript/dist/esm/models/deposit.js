import * as s from "../core/validation/index.js";
import { status2Schema } from "./status2.js";
export const depositSchema = s.object({
    id: s.string(),
    planId: s.string(),
    personId: s.string(),
    amount: s.float64(),
    status: status2Schema,
    approveUrl: s.optional(s.string()),
}, { additionalProperties: s.json() });
//# sourceMappingURL=deposit.js.map