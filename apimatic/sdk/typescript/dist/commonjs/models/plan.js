"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.planSchema = void 0;
const s = __importStar(require("../core/validation/index.js"));
const approval_js_1 = require("./approval.js");
const check_in_js_1 = require("./check-in.js");
const deposit_js_1 = require("./deposit.js");
const status1_js_1 = require("./status1.js");
exports.planSchema = s.object({
    id: s.string(),
    negotiationId: s.string(),
    status: status1_js_1.status1Schema,
    startsAt: s.dateTime(),
    venue: s.string(),
    area: s.string(),
    activity: s.string(),
    costPerPerson: s.float64(),
    depositAmount: s.float64(),
    cancelBy: s.dateTime(),
    checkInOpensAt: s.dateTime(),
    checkInClosesAt: s.dateTime(),
    approvals: s.array(s.lazy(() => approval_js_1.approvalSchema)),
    deposits: s.array(s.lazy(() => deposit_js_1.depositSchema)),
    checkIns: s.array(s.lazy(() => check_in_js_1.checkInSchema)),
}, { additionalProperties: s.json() });
//# sourceMappingURL=plan.js.map