import * as s from "../core/validation/index.js";
/** Where the negotiation stands. */
export const Status = {
    Open: "open",
    Agreed: "agreed",
    Failed: "failed",
};
export const statusSchema = s.enumOf(Status);
//# sourceMappingURL=status.js.map