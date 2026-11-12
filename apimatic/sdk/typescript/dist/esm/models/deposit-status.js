import * as s from "../core/validation/index.js";
/** What happened to their hold. */
export const DepositStatus = {
    Released: "released",
    Captured: "captured",
};
export const depositStatusSchema = s.enumOf(DepositStatus);
//# sourceMappingURL=deposit-status.js.map