import * as s from "../core/validation/index.js";
/**
 * The hold's state. Released means the money went back to the person; captured means they did not
 * show up and lost it.
 */
export const Status2 = {
    AwaitingApproval: "awaiting_approval",
    Held: "held",
    Released: "released",
    Captured: "captured",
    Failed: "failed",
};
export const status2Schema = s.enumOf(Status2);
//# sourceMappingURL=status2.js.map