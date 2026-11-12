import { ApiError } from "../core/api-error.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { errorSchema } from "../models/error.js";
import { negotiationSchema } from "../models/negotiation.js";
import { newNegotiationSchema } from "../models/new-negotiation.js";
import { newProposalSchema } from "../models/new-proposal.js";
import { personRefSchema } from "../models/person-ref.js";
import { planSchema } from "../models/plan.js";
import { proposalSchema } from "../models/proposal.js";
/**
 * Wingcats exchanging proposals until they agree or run out of rounds.
 */
export class Negotiations {
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
            headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: personRefSchema },
        }, {
            success: { kind: "json", schema: planSchema },
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
            success: { kind: "json", schema: negotiationSchema },
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
            success: { kind: "json", schema: s.array(s.lazy(() => proposalSchema)) },
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
            headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: newProposalSchema },
        }, {
            success: { kind: "json", schema: proposalSchema },
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
            headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
            body: { kind: "json", value: request.body, schema: newNegotiationSchema },
        }, {
            success: { kind: "json", schema: negotiationSchema },
            errorFactory: Negotiations.StartNegotiationError,
        }, options);
    }
}
(function (Negotiations) {
    class AcceptProposalError extends ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
            { on: 409, kind: "error2", decode: { kind: "json", schema: errorSchema } },
            { on: 422, kind: "error3", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    Negotiations.AcceptProposalError = AcceptProposalError;
    class GetNegotiationError extends ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    Negotiations.GetNegotiationError = GetNegotiationError;
    class ListProposalsError extends ApiError {
        static errors = [
            { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    Negotiations.ListProposalsError = ListProposalsError;
    class MakeProposalError extends ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
            { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
            { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    Negotiations.MakeProposalError = MakeProposalError;
    class StartNegotiationError extends ApiError {
        static errors = [
            { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
            { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
            { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
        ];
    }
    Negotiations.StartNegotiationError = StartNegotiationError;
})(Negotiations || (Negotiations = {}));
//# sourceMappingURL=negotiations.js.map