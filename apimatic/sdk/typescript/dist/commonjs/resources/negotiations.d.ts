import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { type Error } from "../models/error.js";
import { type Negotiation } from "../models/negotiation.js";
import { type NewNegotiation } from "../models/new-negotiation.js";
import { type NewProposal } from "../models/new-proposal.js";
import { type PersonRef } from "../models/person-ref.js";
import { type Plan } from "../models/plan.js";
import { type Proposal } from "../models/proposal.js";
import type { Servers } from "../servers.js";
/**
 * Wingcats exchanging proposals until they agree or run out of rounds.
 */
export declare class Negotiations {
    #private;
    constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes);
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
    acceptProposal(request: Negotiations.AcceptProposalRequest, options?: RequestOptions): ApiPromise<Plan, Negotiations.AcceptProposalError>;
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
    getNegotiation(request: Negotiations.GetNegotiationRequest, options?: RequestOptions): ApiPromise<Negotiation, Negotiations.GetNegotiationError>;
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
    listProposals(request: Negotiations.ListProposalsRequest, options?: RequestOptions): ApiPromise<Proposal[], Negotiations.ListProposalsError>;
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
    makeProposal(request: Negotiations.MakeProposalRequest, options?: RequestOptions): ApiPromise<Proposal, Negotiations.MakeProposalError>;
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
    startNegotiation(request: Negotiations.StartNegotiationRequest, options?: RequestOptions): ApiPromise<Negotiation, Negotiations.StartNegotiationError>;
}
export declare namespace Negotiations {
    type AcceptProposalRequest = {
        /** The negotiation's ID. */
        negotiationId: string;
        /** The proposal's ID. */
        proposalId: string;
        body: PersonRef;
    };
    class AcceptProposalError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Declared<"error3", Error> | Undeclared;
        static readonly errors: ErrorDecoders<AcceptProposalError>;
    }
    type GetNegotiationRequest = {
        /** The negotiation's ID. */
        negotiationId: string;
    };
    class GetNegotiationError extends ApiError {
        readonly payload: Declared<"error", Error> | Undeclared;
        static readonly errors: ErrorDecoders<GetNegotiationError>;
    }
    type ListProposalsRequest = {
        /** The negotiation's ID. */
        negotiationId: string;
    };
    class ListProposalsError extends ApiError {
        readonly payload: Declared<"error", Error> | Undeclared;
        static readonly errors: ErrorDecoders<ListProposalsError>;
    }
    type MakeProposalRequest = {
        /** The negotiation's ID. */
        negotiationId: string;
        body: NewProposal;
    };
    class MakeProposalError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Declared<"error3", Error> | Undeclared;
        static readonly errors: ErrorDecoders<MakeProposalError>;
    }
    type StartNegotiationRequest = {
        body: NewNegotiation;
    };
    class StartNegotiationError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Declared<"error3", Error> | Undeclared;
        static readonly errors: ErrorDecoders<StartNegotiationError>;
    }
}
