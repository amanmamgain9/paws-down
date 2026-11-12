import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { type Approval } from "../models/approval.js";
import { type CheckInCode } from "../models/check-in-code.js";
import { type CheckIn } from "../models/check-in.js";
import { type Deposit } from "../models/deposit.js";
import { type Error } from "../models/error.js";
import { type NewCheckIn } from "../models/new-check-in.js";
import { type PersonRef } from "../models/person-ref.js";
import { type Plan } from "../models/plan.js";
import { type Settlement } from "../models/settlement.js";
import type { Servers } from "../servers.js";
/**
 * An agreed date plan, its approvals, deposits, check-ins and settlement.
 */
export declare class Plans {
    #private;
    constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes);
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
    approvePlan(request: Plans.ApprovePlanRequest, options?: RequestOptions): ApiPromise<Plan, Plans.ApprovePlanError>;
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
    cancelPlan(request: Plans.CancelPlanRequest, options?: RequestOptions): ApiPromise<Plan, Plans.CancelPlanError>;
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
    checkIn(request: Plans.CheckInRequest, options?: RequestOptions): ApiPromise<CheckIn, Plans.CheckInError>;
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
    confirmDeposit(request: Plans.ConfirmDepositRequest, options?: RequestOptions): ApiPromise<Deposit, Plans.ConfirmDepositError>;
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
    createDeposit(request: Plans.CreateDepositRequest, options?: RequestOptions): ApiPromise<Deposit, Plans.CreateDepositError>;
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
    getCheckInCode(request: Plans.GetCheckInCodeRequest, options?: RequestOptions): ApiPromise<CheckInCode, Plans.GetCheckInCodeError>;
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
    getPlan(request: Plans.GetPlanRequest, options?: RequestOptions): ApiPromise<Plan, Plans.GetPlanError>;
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
    getSettlement(request: Plans.GetSettlementRequest, options?: RequestOptions): ApiPromise<Settlement, Plans.GetSettlementError>;
}
export declare namespace Plans {
    type ApprovePlanRequest = {
        /** The plan's ID. */
        planId: string;
        body: Approval;
    };
    class ApprovePlanError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Undeclared;
        static readonly errors: ErrorDecoders<ApprovePlanError>;
    }
    type CancelPlanRequest = {
        /** The plan's ID. */
        planId: string;
        body: PersonRef;
    };
    class CancelPlanError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Declared<"error3", Error> | Undeclared;
        static readonly errors: ErrorDecoders<CancelPlanError>;
    }
    type CheckInRequest = {
        /** The plan's ID. */
        planId: string;
        body: NewCheckIn;
    };
    class CheckInError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Declared<"error3", Error> | Undeclared;
        static readonly errors: ErrorDecoders<CheckInError>;
    }
    type ConfirmDepositRequest = {
        /** The plan's ID. */
        planId: string;
        /** The deposit's ID. */
        depositId: string;
    };
    class ConfirmDepositError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Declared<"error3", Error> | Undeclared;
        static readonly errors: ErrorDecoders<ConfirmDepositError>;
    }
    type CreateDepositRequest = {
        /** The plan's ID. */
        planId: string;
        body: PersonRef;
    };
    class CreateDepositError extends ApiError {
        readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Declared<"error3", Error> | Undeclared;
        static readonly errors: ErrorDecoders<CreateDepositError>;
    }
    type GetCheckInCodeRequest = {
        /** The plan's ID. */
        planId: string;
        /** The person's ID. */
        personId: string;
    };
    class GetCheckInCodeError extends ApiError {
        readonly payload: Declared<"error", Error> | Undeclared;
        static readonly errors: ErrorDecoders<GetCheckInCodeError>;
    }
    type GetPlanRequest = {
        /** The plan's ID. */
        planId: string;
    };
    class GetPlanError extends ApiError {
        readonly payload: Declared<"error", Error> | Undeclared;
        static readonly errors: ErrorDecoders<GetPlanError>;
    }
    type GetSettlementRequest = {
        /** The plan's ID. */
        planId: string;
    };
    class GetSettlementError extends ApiError {
        readonly payload: Declared<"error", Error> | Undeclared;
        static readonly errors: ErrorDecoders<GetSettlementError>;
    }
}
