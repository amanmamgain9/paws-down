<!-- Generated file — do not edit; regenerated with the SDK. -->

# Venues — operations

Accessor: `client.venues` · Source: `src/resources/venues.ts` · 1 operation · Request types: namespace `Venues`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `paws-down-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### listVenues

- **Signature**: `listVenues(options?: RequestOptions): ApiPromise<Venue[], ApiError>`
- **Wire**: `GET /venues`
- **Auth**: `apiKeyAuth`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Venue[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PawsDownApiError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

| Type | Schema value | Source |
| --- | --- | --- |
| `Venue` | `venueSchema` | `src/models/venue.ts` |

