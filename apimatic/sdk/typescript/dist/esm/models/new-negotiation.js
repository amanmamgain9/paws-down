import * as s from "../core/validation/index.js";
export const newNegotiationSchema = s.object({
    personAId: s.string(),
    personBId: s.string(),
}, { additionalProperties: s.json() });
//# sourceMappingURL=new-negotiation.js.map