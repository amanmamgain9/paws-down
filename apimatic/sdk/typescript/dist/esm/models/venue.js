import * as s from "../core/validation/index.js";
export const venueSchema = s.object({
    id: s.string(),
    name: s.string(),
    area: s.string(),
    activity: s.string(),
    costPerPerson: s.float64(),
    tags: s.array(s.string()),
}, { additionalProperties: s.json() });
//# sourceMappingURL=venue.js.map