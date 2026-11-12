import * as s from "../core/validation/index.js";
/** What happened on the date. */
export const Outcome = {
    BothShowed: "both_showed",
    OneNoShow: "one_no_show",
    BothNoShow: "both_no_show",
    Cancelled: "cancelled",
};
export const outcomeSchema = s.enumOf(Outcome);
//# sourceMappingURL=outcome.js.map