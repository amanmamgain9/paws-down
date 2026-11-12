<!-- Generated file — do not edit; regenerated with the SDK. -->

# Plans — operations

Accessor: `client.plans` · Source: `src/resources/plans.ts` · 8 operations · Request and error types: namespace `Plans`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `paws-down-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### approvePlan

- **Signature**: `approvePlan(request: Plans.ApprovePlanRequest, options?: RequestOptions): ApiPromise<Plan, Plans.ApprovePlanError>`
- **Wire**: `POST /plans/{planId}/approvals`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Plan`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.ApprovePlanError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"error2"` [409] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.ApprovePlanRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |
| `body` | `body` | `Approval` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Approval` | `approvalSchema` | `src/models/approval.ts` |
| `Plan` | `planSchema` | `src/models/plan.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### cancelPlan

- **Signature**: `cancelPlan(request: Plans.CancelPlanRequest, options?: RequestOptions): ApiPromise<Plan, Plans.CancelPlanError>`
- **Wire**: `POST /plans/{planId}/cancel`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Plan`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.CancelPlanError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"error2"` [409] `Error` · `"error3"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.CancelPlanRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |
| `body` | `body` | `PersonRef` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `PersonRef` | `personRefSchema` | `src/models/person-ref.ts` |
| `Plan` | `planSchema` | `src/models/plan.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### checkIn

- **Signature**: `checkIn(request: Plans.CheckInRequest, options?: RequestOptions): ApiPromise<CheckIn, Plans.CheckInError>`
- **Wire**: `POST /plans/{planId}/checkins`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `CheckIn`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.CheckInError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.CheckInRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |
| `body` | `body` | `NewCheckIn` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `NewCheckIn` | `newCheckInSchema` | `src/models/new-check-in.ts` |
| `CheckIn` | `checkInSchema` | `src/models/check-in.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### confirmDeposit

- **Signature**: `confirmDeposit(request: Plans.ConfirmDepositRequest, options?: RequestOptions): ApiPromise<Deposit, Plans.ConfirmDepositError>`
- **Wire**: `POST /plans/{planId}/deposits/{depositId}/confirm`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Deposit`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.ConfirmDepositError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"error2"` [409] `Error` · `"error3"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.ConfirmDepositRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |
| `depositId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Deposit` | `depositSchema` | `src/models/deposit.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### createDeposit

- **Signature**: `createDeposit(request: Plans.CreateDepositRequest, options?: RequestOptions): ApiPromise<Deposit, Plans.CreateDepositError>`
- **Wire**: `POST /plans/{planId}/deposits`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Deposit`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.CreateDepositError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"error2"` [409] `Error` · `"error3"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.CreateDepositRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |
| `body` | `body` | `PersonRef` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `PersonRef` | `personRefSchema` | `src/models/person-ref.ts` |
| `Deposit` | `depositSchema` | `src/models/deposit.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### getCheckInCode

- **Signature**: `getCheckInCode(request: Plans.GetCheckInCodeRequest, options?: RequestOptions): ApiPromise<CheckInCode, Plans.GetCheckInCodeError>`
- **Wire**: `GET /plans/{planId}/checkin-codes/{personId}`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `CheckInCode`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.GetCheckInCodeError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.GetCheckInCodeRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |
| `personId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `CheckInCode` | `checkInCodeSchema` | `src/models/check-in-code.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### getPlan

- **Signature**: `getPlan(request: Plans.GetPlanRequest, options?: RequestOptions): ApiPromise<Plan, Plans.GetPlanError>`
- **Wire**: `GET /plans/{planId}`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Plan`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.GetPlanError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.GetPlanRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Plan` | `planSchema` | `src/models/plan.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### getSettlement

- **Signature**: `getSettlement(request: Plans.GetSettlementRequest, options?: RequestOptions): ApiPromise<Settlement, Plans.GetSettlementError>`
- **Wire**: `GET /plans/{planId}/settlement`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Settlement`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Plans.GetSettlementError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Plans.GetSettlementRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `planId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Settlement` | `settlementSchema` | `src/models/settlement.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

