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
exports.Negotiations = void 0;
const api_error_js_1 = require("../core/api-error.js");
const uuid_js_1 = require("../core/uuid.js");
const s = __importStar(require("../core/validation/index.js"));
const error_js_1 = require("../models/error.js");
const negotiation_js_1 = require("../models/negotiation.js");
const new_negotiation_js_1 = require("../models/new-negotiation.js");
const new_proposal_js_1 = require("../models/new-proposal.js");
const person_ref_js_1 = require("../models/person-ref.js");
const plan_js_1 = require("../models/plan.js");
const proposal_js_1 = require("../models/proposal.js");
/**
 * Wingcats exchanging proposals until they agree or run out of rounds.
 */
class Negotiations {
    #rawClient;
    #servers;
    #auth;
    constructor(rawClient, servers, auth) {
        this.#rawClient = rawClient;
        this.#servers = servers;
        this.#auth = auth;
    }
    /**
     * Accept the other side's proposal
     *
     * @remarks
     * Accepts a proposal made by the other person. The server checks the proposal against both
     * people's preferences; if it fits, the negotiation is agreed and a plan is created.
     *
     * @returns The plan created from the accepted proposal.
     *
     * @throws {@link Negotiations.AcceptProposalError} when the API answers with an error status —
     * narrow on `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    acceptProposal(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/negotiations/{negotiationId}/proposals/{proposalId}/accept"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [
                { name: "negotiationId", value: request.negotiationId, schema: s.string() },
                { name: "proposalId", value: request.proposalId, schema: s.string() },
            ],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: person_ref_js_1.personRefSchema },
        }, {
            success: { kind: "json", schema: plan_js_1.planSchema },
            errorFactory: Negotiations.AcceptProposalError,
        }, options);
    }
    /**
     * Get a negotiation
     *
     * @remarks
     * Returns the negotiation's status, whose turn it is, and the plan once one is agreed.
     *
     * @returns The negotiation.
     *
     * @throws {@link Negotiations.GetNegotiationError} when the API answers with an error status —
     * narrow on `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    getNegotiation(request, options) {
        return this.#rawClient.execute({
            method: "GET",
            urlTemplate: this.#servers.default("/negotiations/{negotiationId}"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "negotiationId", value: request.negotiationId, schema: s.string() }],
            query: [],
            headers: [],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: negotiation_js_1.negotiationSchema },
            errorFactory: Negotiations.GetNegotiationError,
        }, options);
    }
    /**
     * List proposals in a negotiation
     *
     * @remarks
     * Returns every proposal made so far, oldest first.
     *
     * @returns The proposals.
     *
     * @throws {@link Negotiations.ListProposalsError} when the API answers with an error status —
     * narrow on `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    listProposals(request, options) {
        return this.#rawClient.execute({
            method: "GET",
            urlTemplate: this.#servers.default("/negotiations/{negotiationId}/proposals"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "negotiationId", value: request.negotiationId, schema: s.string() }],
            query: [],
            headers: [],
            body: { kind: "empty" },
        }, {
            success: { kind: "json", schema: s.array(s.lazy(() => proposal_js_1.proposalSchema)) },
            errorFactory: Negotiations.ListProposalsError,
        }, options);
    }
    /**
     * Make a proposal or counter-proposal
     *
     * @remarks
     * Posts a proposal on behalf of one person. It must be that person's turn and the proposal must
     * fit their own preferences. Each proposal uses one round; the negotiation fails when the rounds
     * run out.
     *
     * @returns The proposal was recorded.
     *
     * @throws {@link Negotiations.MakeProposalError} when the API answers with an error status —
     * narrow on `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    makeProposal(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/negotiations/{negotiationId}/proposals"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [{ name: "negotiationId", value: request.negotiationId, schema: s.string() }],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: new_proposal_js_1.newProposalSchema },
        }, {
            success: { kind: "json", schema: proposal_js_1.proposalSchema },
            errorFactory: Negotiations.MakeProposalError,
        }, options);
    }
    /**
     * Start a negotiation between two people
     *
     * @remarks
     * Opens a negotiation between two registered people. Both must have saved preferences, be looking
     * for compatible things, and have each said yes to meeting the other. People give that yes
     * themselves; a wingcat cannot.
     *
     * @returns The negotiation was opened.
     *
     * @throws {@link Negotiations.StartNegotiationError} when the API answers with an error status —
     * narrow on `err.payload.kind`
     *
     * @throws {@link PawsDownApiError} when no usable response was produced: a connection failure, a
     * timeout, a body that would not decode, a value that would not encode, or a credential that
     * could not be obtained
     */
    startNegotiation(request, options) {
        return this.#rawClient.execute({
            method: "POST",
            urlTemplate: this.#servers.default("/negotiations"),
            auth: this.#auth.apiKeyAuth,
            pathParams: [],
            query: [],
            headers: [{ name: "Idempotency-Key", value: (0, uuid_js_1.uuid)(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: new_negotiation_js_1.newNegotiationSchema },
        }, {
            success: { kind: "json", schema: negotiation_js_1.negotiationSchema },
            errorFactory: Negotiations.StartNegotiationError,
        }, options);
    }
}
exports.Negotiations = Negotiations;
(function (Negotiations) {
    class AcceptProposalError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 422, kind: "error3", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Negotiations.AcceptProposalError = AcceptProposalError;
    class GetNegotiationError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Negotiations.GetNegotiationError = GetNegotiationError;
    class ListProposalsError extends api_error_js_1.ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Negotiations.ListProposalsError = ListProposalsError;
    class MakeProposalError extends api_error_js_1.ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 404, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error3", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Negotiations.MakeProposalError = MakeProposalError;
    class StartNegotiationError extends api_error_js_1.ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 404, kind: "error2", decode: { kind: "json", schema: error_js_1.errorSchema } },
            { on: 409, kind: "error3", decode: { kind: "json", schema: error_js_1.errorSchema } },
        ];
    }
    Negotiations.StartNegotiationError = StartNegotiationError;
})(Negotiations || (exports.Negotiations = Negotiations = {}));
//# sourceMappingURL=negotiations.js.map