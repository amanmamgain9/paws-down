<!-- Generated file — do not edit; regenerated with the SDK. -->

# People — operations

Accessor: `client.people` · Source: `src/resources/people.ts` · 3 operations · Request and error types: namespace `People`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `paws-down-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### createPerson

- **Signature**: `createPerson(request: People.CreatePersonRequest, options?: RequestOptions): ApiPromise<Person, People.CreatePersonError>`
- **Wire**: `POST /people`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Person`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `People.CreatePersonError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `People.CreatePersonRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `NewPerson` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `NewPerson` | `newPersonSchema` | `src/models/new-person.ts` |
| `Person` | `personSchema` | `src/models/person.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### getPerson

- **Signature**: `getPerson(request: People.GetPersonRequest, options?: RequestOptions): ApiPromise<Person, People.GetPersonError>`
- **Wire**: `GET /people/{personId}`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Person`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `People.GetPersonError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `People.GetPersonRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `personId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Person` | `personSchema` | `src/models/person.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### setPreferences

- **Signature**: `setPreferences(request: People.SetPreferencesRequest, options?: RequestOptions): ApiPromise<Person, People.SetPreferencesError>`
- **Wire**: `PUT /people/{personId}/preferences`
- **Auth**: `apiKeyAuth`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Person`
- **Error**: `PawsDownApiError` with `kind: "api"`, an instance of `People.SetPreferencesError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `People.SetPreferencesRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `personId` | `path` | `string` | yes |
| `body` | `body` | `Preferences` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Preferences` | `preferencesSchema` | `src/models/preferences.ts` |
| `Person` | `personSchema` | `src/models/person.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

