import * as s from "../core/validation/index.js";
import { outcomeSchema } from "./outcome.js";
import { settlementResultSchema } from "./settlement-result.js";
export const settlementSchema = s.object({
    planId: s.string(),
    outcome: outcomeSchema,
    settledAt: s.optional(s.dateTime()),
    results: s.array(s.lazy(() => settlementResultSchema)),
}, { additionalProperties: s.json() });
//# sourceMappingURL=settlement.js.map