import * as s from "../core/validation/index.js";
export const timeSlotSchema = s.object({
    start: s.dateTime(),
    end: s.dateTime(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=time-slot.js.map