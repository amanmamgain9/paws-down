import * as s from "../core/validation/index.js";
/**
 * Where the plan stands. It is locked once both holds are in place and settled once the holds have
 * been released or captured.
 */
export const Status1 = {
    AwaitingApproval: "awaiting_approval",
    AwaitingDeposits: "awaiting_deposits",
    Locked: "locked",
    Settled: "settled",
    Cancelled: "cancelled",
};
export const status1Schema = s.enumOf(Status1);
//# sourceMappingURL=status1.js.map