import * as s from "../core/validation/index.js";
import { depositStatusSchema } from "./deposit-status.js";
export const settlementResultSchema = s.object({
    personId: s.string(),
    showedUp: s.boolean(),
    depositStatus: depositStatusSchema,
    amount: s.float64(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=settlement-result.js.map