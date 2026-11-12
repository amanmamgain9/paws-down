import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { errorSchema, type Error } from "../models/error.js";
import { negotiationSchema, type Negotiation } from "../models/negotiation.js";
import { newNegotiationSchema, type NewNegotiation } from "../models/new-negotiation.js";
import { newProposalSchema, type NewProposal } from "../models/new-proposal.js";
import { personRefSchema, type PersonRef } from "../models/person-ref.js";
import { planSchema, type Plan } from "../models/plan.js";
import { proposalSchema, type Proposal } from "../models/proposal.js";
import type { Servers } from "../servers.js";

/**
 * Wingcats exchanging proposals until they agree or run out of rounds.
 */
export class Negotiations {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
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
  acceptProposal(
    request: Negotiations.AcceptProposalRequest,
    options?: RequestOptions,
  ): ApiPromise<Plan, Negotiations.AcceptProposalError> {
    return this.#rawClient.execute(
      {
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
      },
      {
        success: { kind: "json", schema: planSchema },
        errorFactory: Negotiations.AcceptProposalError,
      },
      options,
    );
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
  getNegotiation(
    request: Negotiations.GetNegotiationRequest,
    options?: RequestOptions,
  ): ApiPromise<Negotiation, Negotiations.GetNegotiationError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/negotiations/{negotiationId}"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "negotiationId", value: request.negotiationId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: negotiationSchema },
        errorFactory: Negotiations.GetNegotiationError,
      },
      options,
    );
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
  listProposals(
    request: Negotiations.ListProposalsRequest,
    options?: RequestOptions,
  ): ApiPromise<Proposal[], Negotiations.ListProposalsError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/negotiations/{negotiationId}/proposals"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "negotiationId", value: request.negotiationId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.lazy(() => proposalSchema)) },
        errorFactory: Negotiations.ListProposalsError,
      },
      options,
    );
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
  makeProposal(
    request: Negotiations.MakeProposalRequest,
    options?: RequestOptions,
  ): ApiPromise<Proposal, Negotiations.MakeProposalError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/negotiations/{negotiationId}/proposals"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "negotiationId", value: request.negotiationId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: newProposalSchema },
      },
      {
        success: { kind: "json", schema: proposalSchema },
        errorFactory: Negotiations.MakeProposalError,
      },
      options,
    );
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
  startNegotiation(
    request: Negotiations.StartNegotiationRequest,
    options?: RequestOptions,
  ): ApiPromise<Negotiation, Negotiations.StartNegotiationError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/negotiations"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: newNegotiationSchema },
      },
      {
        success: { kind: "json", schema: negotiationSchema },
        errorFactory: Negotiations.StartNegotiationError,
      },
      options,
    );
  }
}

export namespace Negotiations {
  export type AcceptProposalRequest = {
    /** The negotiation's ID. */
    negotiationId: string;
    /** The proposal's ID. */
    proposalId: string;
    body: PersonRef;
  };

  export class AcceptProposalError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<AcceptProposalError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 422, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type GetNegotiationRequest = {
    /** The negotiation's ID. */
    negotiationId: string;
  };

  export class GetNegotiationError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Undeclared;

    static readonly errors: ErrorDecoders<GetNegotiationError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ListProposalsRequest = {
    /** The negotiation's ID. */
    negotiationId: string;
  };

  export class ListProposalsError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Undeclared;

    static readonly errors: ErrorDecoders<ListProposalsError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type MakeProposalRequest = {
    /** The negotiation's ID. */
    negotiationId: string;
    body: NewProposal;
  };

  export class MakeProposalError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<MakeProposalError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type StartNegotiationRequest = {
    body: NewNegotiation;
  };

  export class StartNegotiationError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<StartNegotiationError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
