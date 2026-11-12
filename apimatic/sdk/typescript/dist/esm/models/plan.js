import * as s from "../core/validation/index.js";
import { approvalSchema } from "./approval.js";
import { checkInSchema } from "./check-in.js";
import { depositSchema } from "./deposit.js";
import { status1Schema } from "./status1.js";
export const planSchema = s.object({
    id: s.string(),
    negotiationId: s.string(),
    status: status1Schema,
    startsAt: s.dateTime(),
    venue: s.string(),
    area: s.string(),
    activity: s.string(),
    costPerPerson: s.float64(),
    depositAmount: s.float64(),
    cancelBy: s.dateTime(),
    checkInOpensAt: s.dateTime(),
    checkInClosesAt: s.dateTime(),
    approvals: s.array(s.lazy(() => approvalSchema)),
    deposits: s.array(s.lazy(() => depositSchema)),
    checkIns: s.array(s.lazy(() => checkInSchema)),
}, { additionalProperties: s.json() });
//# sourceMappingURL=plan.js.map