<!-- Generated file — do not edit; regenerated with the SDK. -->

# Negotiations — operations

Accessor: `client.negotiations` · Source: `src/resources/negotiations.ts` · 5 operations · Request and error types: namespace `Negotiations`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `paws-down-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### acceptProposal

- **Signature**: `acceptProposal(request: Negotiations.AcceptProposalRequest, options?: RequestOptions): ApiPromise<Plan, Negotiations.AcceptProposalError>`
- **Wire**: `POST /negotiations/{negotiationId}/proposals/{proposalId}/accept`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Plan`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Negotiations.AcceptProposalError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"error2"` [409] `Error` · `"error3"` [422] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Negotiations.AcceptProposalRequest` (3):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `negotiationId` | `path` | `string` | yes |
| `proposalId` | `path` | `string` | yes |
| `body` | `body` | `PersonRef` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `PersonRef` | `personRefSchema` | `src/models/person-ref.ts` |
| `Plan` | `planSchema` | `src/models/plan.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### getNegotiation

- **Signature**: `getNegotiation(request: Negotiations.GetNegotiationRequest, options?: RequestOptions): ApiPromise<Negotiation, Negotiations.GetNegotiationError>`
- **Wire**: `GET /negotiations/{negotiationId}`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Negotiation`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Negotiations.GetNegotiationError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Negotiations.GetNegotiationRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `negotiationId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Negotiation` | `negotiationSchema` | `src/models/negotiation.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### listProposals

- **Signature**: `listProposals(request: Negotiations.ListProposalsRequest, options?: RequestOptions): ApiPromise<Proposal[], Negotiations.ListProposalsError>`
- **Wire**: `GET /negotiations/{negotiationId}/proposals`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Proposal[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Negotiations.ListProposalsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Negotiations.ListProposalsRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `negotiationId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Proposal` | `proposalSchema` | `src/models/proposal.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### makeProposal

- **Signature**: `makeProposal(request: Negotiations.MakeProposalRequest, options?: RequestOptions): ApiPromise<Proposal, Negotiations.MakeProposalError>`
- **Wire**: `POST /negotiations/{negotiationId}/proposals`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Proposal`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Negotiations.MakeProposalError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Negotiations.MakeProposalRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `negotiationId` | `path` | `string` | yes |
| `body` | `body` | `NewProposal` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `NewProposal` | `newProposalSchema` | `src/models/new-proposal.ts` |
| `Proposal` | `proposalSchema` | `src/models/proposal.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### startNegotiation

- **Signature**: `startNegotiation(request: Negotiations.StartNegotiationRequest, options?: RequestOptions): ApiPromise<Negotiation, Negotiations.StartNegotiationError>`
- **Wire**: `POST /negotiations`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Negotiation`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `Negotiations.StartNegotiationError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Negotiations.StartNegotiationRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `NewNegotiation` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `NewNegotiation` | `newNegotiationSchema` | `src/models/new-negotiation.ts` |
| `Negotiation` | `negotiationSchema` | `src/models/negotiation.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

