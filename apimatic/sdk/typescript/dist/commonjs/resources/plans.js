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
exports.Plans = void 0;
const api_error_js_1 = require("../core/api-error.js");
const uuid_js_1 = require("../core/uuid.js");
const s = __importStar(require("../core/validation/index.js"));
const approval_js_1 = require("../models/approval.js");
const check_in_code_js_1 = require("../models/check-in-code.js");
const check_in_js_1 = require("../models/check-in.js");
const deposit_js_1 = require("../models/deposit.js");
const error_js_1 = require("../models/error.js");
const new_check_in_js_1 = require("../models/new-check-in.js");
const person_ref_js_1 = require("../models/person-ref.js");
const plan_js_1 = require("../models/plan.js");
const settlement_js_1 = require("../models/settlement.js");
/**
 * An agreed date plan, its approvals, deposits, check-ins and settlement.
 */
class Plans {
    #rawClient;
    #servers;
    #auth;
    constructor(rawClient, servers, auth) {
        this.#rawClient = rawClient;
        this.#servers = servers;
        this.#auth = auth;
    }
    /**
     * Record a person's yes or no to the plan
     *
     * @remarks
     * Each person approves or rejects the plan their wingcat agreed. One rejection cancels the plan.
     *
     * @returns The updated plan.
     *
     * @throws {@link Plans.ApprovePlanError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    approvePlan(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/plans/{planId}/approvals"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: approval_js_1.approvalSchema },
        }, {
            success: { kind: "json", schema: plan_js_1.planSchema },
            errorFactory: Plans.ApprovePlanError,
        }, options);
    }
    /**
     * Cancel a plan before the cut-off
     *
     * @remarks
     * Either person can cancel before the plan's cancel-by time. Every hold is released.
     *
     * @returns The cancelled plan.
     *
     * @throws {@link Plans.CancelPlanError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    cancelPlan(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/plans/{planId}/cancel"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: person_ref_js_1.personRefSchema },
        }, {
            success: { kind: "json", schema: plan_js_1.planSchema },
            errorFactory: Plans.CancelPlanError,
        }, options);
    }
    /**
     * Check a person in at the date
     *
     * @remarks
     * Records that a person has arrived. Entering the code shown on the other person's screen
     * confirms the two are together. Only possible inside the check-in window of a locked plan.
     *
     * @returns The check-in was recorded.
     *
     * @throws {@link Plans.CheckInError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    checkIn(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/plans/{planId}/checkins"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: new_check_in_js_1.newCheckInSchema },
        }, {
            success: { kind: "json", schema: check_in_js_1.checkInSchema },
            errorFactory: Plans.CheckInError,
        }, options);
    }
    /**
     * Confirm a hold after the person approved it
     *
     * @remarks
     * Places the hold once the person has approved it with PayPal. When both people's holds are in
     * place the plan becomes locked.
     *
     * @returns The deposit, now held.
     *
     * @throws {@link Plans.ConfirmDepositError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    confirmDeposit(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/plans/{planId}/deposits/{depositId}/confirm"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [
                { name: "planId", value: request.planId, schema: s.string() },
                { name: "depositId", value: request.depositId, schema: s.string() },
            ],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: deposit_js_1.depositSchema },
            errorFactory: Plans.ConfirmDepositError,
        }, options);
    }
    /**
     * Start a person's 5 USD hold
     *
     * @remarks
     * Creates a PayPal order for a refundable hold and returns the link the person opens to approve
     * it. Money is held, not taken.
     *
     * @returns The deposit, waiting for the person's approval.
     *
     * @throws {@link Plans.CreateDepositError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    createDeposit(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/plans/{planId}/deposits"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: person_ref_js_1.personRefSchema },
        }, {
            success: { kind: "json", schema: deposit_js_1.depositSchema },
            errorFactory: Plans.CreateDepositError,
        }, options);
    }
    /**
     * Get a person's check-in code
     *
     * @remarks
     * Returns the code this person shows to the other person when they meet.
     *
     * @returns The person's check-in code.
     *
     * @throws {@link Plans.GetCheckInCodeError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    getCheckInCode(request, options) {
        return this.#rawClient.execute({
            method: "GET",
            urlTemplate: this.#servers.default("/plans/{planId}/checkin-codes/{personId}"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [
                { name: "planId", value: request.planId, schema: s.string() },
                { name: "personId", value: request.personId, schema: s.string() },
            ],
            query: [],
            headers: [],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: check_in_code_js_1.checkInCodeSchema },
            errorFactory: Plans.GetCheckInCodeError,
        }, options);
    }
    /**
     * Get a plan
     *
     * @remarks
     * Returns the plan with its approvals, deposits, check-ins and settlement.
     *
     * @returns The plan.
     *
     * @throws {@link Plans.GetPlanError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    getPlan(request, options) {
        return this.#rawClient.execute({
            method: "GET",
            urlTemplate: this.#servers.default("/plans/{planId}"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
            query: [],
            headers: [],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: plan_js_1.planSchema },
            errorFactory: Plans.GetPlanError,
        }, options);
    }
    /**
     * Get how the deposits were settled
     *
     * @remarks
     * Returns what happened to each hold after the date: released when the person showed up or the
     * date was cancelled, captured when they did not.
     *
     * @returns The settlement.
     *
     * @throws {@link Plans.GetSettlementError} when the API answers with an error status — narrow on
     * `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    getSettlement(request, options) {
        return this.#rawClient.execute({
            method: "GET",
            urlTemplate: this.#servers.default("/plans/{planId}/settlement"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
            query: [],
            headers: [],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: settlement_js_1.settlementSchema },
            errorFactory: Plans.GetSettlementError,
        }, options);
    }
}
exports.Plans = Plans;
(function (Plans) {
    class ApprovePlanError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.ApprovePlanError = ApprovePlanError;
    class CancelPlanError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 502, kind: "error3", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.CancelPlanError = CancelPlanError;
    class CheckInError extends api_error_js_1.ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 404, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error3", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.CheckInError = CheckInError;
    class ConfirmDepositError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 502, kind: "error3", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.ConfirmDepositError = ConfirmDepositError;
    class CreateDepositError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 502, kind: "error3", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.CreateDepositError = CreateDepositError;
    class GetCheckInCodeError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.GetCheckInCodeError = GetCheckInCodeError;
    class GetPlanError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.GetPlanError = GetPlanError;
    class GetSettlementError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Plans.GetSettlementError = GetSettlementError;
})(Plans || (exports.Plans = Plans = {}));
//# sourceMappingURL=plans.js.map