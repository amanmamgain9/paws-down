import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { approvalSchema, type Approval } from "../models/approval.js";
import { checkInCodeSchema, type CheckInCode } from "../models/check-in-code.js";
import { checkInSchema, type CheckIn } from "../models/check-in.js";
import { depositSchema, type Deposit } from "../models/deposit.js";
import { errorSchema, type Error } from "../models/error.js";
import { newCheckInSchema, type NewCheckIn } from "../models/new-check-in.js";
import { personRefSchema, type PersonRef } from "../models/person-ref.js";
import { planSchema, type Plan } from "../models/plan.js";
import { settlementSchema, type Settlement } from "../models/settlement.js";
import type { Servers } from "../servers.js";

/**
 * An agreed date plan, its approvals, deposits, check-ins and settlement.
 */
export class Plans {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
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
  approvePlan(
    request: Plans.ApprovePlanRequest,
    options?: RequestOptions,
  ): ApiPromise<Plan, Plans.ApprovePlanError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/plans/{planId}/approvals"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: approvalSchema },
      },
      {
        success: { kind: "json", schema: planSchema },
        errorFactory: Plans.ApprovePlanError,
      },
      options,
    );
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
  cancelPlan(
    request: Plans.CancelPlanRequest,
    options?: RequestOptions,
  ): ApiPromise<Plan, Plans.CancelPlanError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/plans/{planId}/cancel"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: personRefSchema },
      },
      {
        success: { kind: "json", schema: planSchema },
        errorFactory: Plans.CancelPlanError,
      },
      options,
    );
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
  checkIn(request: Plans.CheckInRequest, options?: RequestOptions): ApiPromise<CheckIn, Plans.CheckInError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/plans/{planId}/checkins"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: newCheckInSchema },
      },
      {
        success: { kind: "json", schema: checkInSchema },
        errorFactory: Plans.CheckInError,
      },
      options,
    );
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
  confirmDeposit(
    request: Plans.ConfirmDepositRequest,
    options?: RequestOptions,
  ): ApiPromise<Deposit, Plans.ConfirmDepositError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/plans/{planId}/deposits/{depositId}/confirm"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [
          { name: "planId", value: request.planId, schema: s.string() },
          { name: "depositId", value: request.depositId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: depositSchema },
        errorFactory: Plans.ConfirmDepositError,
      },
      options,
    );
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
  createDeposit(
    request: Plans.CreateDepositRequest,
    options?: RequestOptions,
  ): ApiPromise<Deposit, Plans.CreateDepositError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/plans/{planId}/deposits"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: personRefSchema },
      },
      {
        success: { kind: "json", schema: depositSchema },
        errorFactory: Plans.CreateDepositError,
      },
      options,
    );
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
  getCheckInCode(
    request: Plans.GetCheckInCodeRequest,
    options?: RequestOptions,
  ): ApiPromise<CheckInCode, Plans.GetCheckInCodeError> {
    return this.#rawClient.execute(
      {
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
      },
      {
        success: { kind: "json", schema: checkInCodeSchema },
        errorFactory: Plans.GetCheckInCodeError,
      },
      options,
    );
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
  getPlan(request: Plans.GetPlanRequest, options?: RequestOptions): ApiPromise<Plan, Plans.GetPlanError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/plans/{planId}"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: planSchema },
        errorFactory: Plans.GetPlanError,
      },
      options,
    );
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
  getSettlement(
    request: Plans.GetSettlementRequest,
    options?: RequestOptions,
  ): ApiPromise<Settlement, Plans.GetSettlementError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/plans/{planId}/settlement"),
        auth: this.#auth.apiKeyAuth,
        pathParams: [{ name: "planId", value: request.planId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: settlementSchema },
        errorFactory: Plans.GetSettlementError,
      },
      options,
    );
  }
}

export namespace Plans {
  export type ApprovePlanRequest = {
    /** The plan's ID. */
    planId: string;
    body: Approval;
  };

  export class ApprovePlanError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Undeclared;

    static readonly errors: ErrorDecoders<ApprovePlanError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error2", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CancelPlanRequest = {
    /** The plan's ID. */
    planId: string;
    body: PersonRef;
  };

  export class CancelPlanError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CancelPlanError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CheckInRequest = {
    /** The plan's ID. */
    planId: string;
    body: NewCheckIn;
  };

  export class CheckInError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CheckInError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ConfirmDepositRequest = {
    /** The plan's ID. */
    planId: string;
    /** The deposit's ID. */
    depositId: string;
  };

  export class ConfirmDepositError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ConfirmDepositError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CreateDepositRequest = {
    /** The plan's ID. */
    planId: string;
    body: PersonRef;
  };

  export class CreateDepositError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CreateDepositError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type GetCheckInCodeRequest = {
    /** The plan's ID. */
    planId: string;
    /** The person's ID. */
    personId: string;
  };

  export class GetCheckInCodeError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Undeclared;

    static readonly errors: ErrorDecoders<GetCheckInCodeError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type GetPlanRequest = {
    /** The plan's ID. */
    planId: string;
  };

  export class GetPlanError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Undeclared;

    static readonly errors: ErrorDecoders<GetPlanError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type GetSettlementRequest = {
    /** The plan's ID. */
    planId: string;
  };

  export class GetSettlementError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Undeclared;

    static readonly errors: ErrorDecoders<GetSettlementError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
