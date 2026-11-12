import * as s from "../core/validation/index.js";
export const newProposalSchema = s.object({
    fromPersonId: s.string(),
    startsAt: s.dateTime(),
    venue: s.string(),
    area: s.string(),
    activity: s.string(),
    costPerPerson: s.float64(),
    reason: s.string(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=new-proposal.js.map