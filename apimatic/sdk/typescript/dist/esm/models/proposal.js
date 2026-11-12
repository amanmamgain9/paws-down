import * as s from "../core/validation/index.js";
export const proposalSchema = s.object({
    id: s.string(),
    negotiationId: s.string(),
    fromPersonId: s.string(),
    startsAt: s.dateTime(),
    venue: s.string(),
    area: s.optional(s.string()),
    activity: s.string(),
    costPerPerson: s.float64(),
    reason: s.string(),
    round: s.int(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=proposal.js.map