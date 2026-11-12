# Reference

> Source: [PawsDownApiClient](src/client.ts)

## People

> Source: [People](src/resources/people.ts)

<details>
<summary><code>createPerson(request: People.CreatePersonRequest, options?: RequestOptions): ApiPromise&lt;Person, People.CreatePersonError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Registers a person and the name of the wingcat that will negotiate for them.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.people.createPerson({
    body: { name: "some example string", wingcatName: "some example string" },
  });
  // TODO: Handle 'response' of type Person
} catch (err) {
  // TODO: Handle 'err' of type People.CreatePersonError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.people
  .createPerson({ body: { name: "some example string", wingcatName: "some example string" } })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Person
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[NewPerson](src/models/new-person.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.people.createPerson(request)`

- **OnSuccess**: <code>[Person](src/models/person.ts)</code>
- **OnError**: throws <code>[People.CreatePersonError](src/resources/people.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.people.createPerson(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Person, People.CreatePersonError&gt;</code>, with `result.value` of type <code>[Person](src/models/person.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>getPerson(request: People.GetPersonRequest, options?: RequestOptions): ApiPromise&lt;Person, People.GetPersonError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Returns a person and their saved preferences.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.people.getPerson({ personId: "per_alex" });
  // TODO: Handle 'response' of type Person
} catch (err) {
  // TODO: Handle 'err' of type People.GetPersonError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.people.getPerson({ personId: "per_alex" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Person
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>personId</code> | <code>string</code> | The person's ID. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.people.getPerson(request)`

- **OnSuccess**: <code>[Person](src/models/person.ts)</code>
- **OnError**: throws <code>[People.GetPersonError](src/resources/people.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.people.getPerson(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Person, People.GetPersonError&gt;</code>, with `result.value` of type <code>[Person](src/models/person.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>setPreferences(request: People.SetPreferencesRequest, options?: RequestOptions): ApiPromise&lt;Person, People.SetPreferencesError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Replaces the person's preferences. These are the hard limits the server checks every plan against, so a wingcat can never agree to something outside them.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.people.setPreferences({
    personId: "per_alex",
    body: {
      freeSlots: [
        { start: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)), end: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
      ],
      maxBudget: 1.5,
      areas: ["some example string"],
    },
  });
  // TODO: Handle 'response' of type Person
} catch (err) {
  // TODO: Handle 'err' of type People.SetPreferencesError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.people
  .setPreferences({
    personId: "per_alex",
    body: {
      freeSlots: [
        { start: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)), end: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
      ],
      maxBudget: 1.5,
      areas: ["some example string"],
    },
  })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Person
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>personId</code> | <code>string</code> | The person's ID. |
| <code>body</code> | <code>[Preferences](src/models/preferences.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.people.setPreferences(request)`

- **OnSuccess**: <code>[Person](src/models/person.ts)</code>
- **OnError**: throws <code>[People.SetPreferencesError](src/resources/people.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.people.setPreferences(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Person, People.SetPreferencesError&gt;</code>, with `result.value` of type <code>[Person](src/models/person.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Venues

> Source: [Venues](src/resources/venues.ts)

<details>
<summary><code>listVenues(options?: RequestOptions): ApiPromise&lt;Venue[], ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Dates happen at public places only. A proposal must name a venue and area from this list and cost at least the venue's price.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.venues.listVenues();
  // TODO: Handle 'response' of type Venue[]
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.venues.listVenues().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Venue[]
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.venues.listVenues()`

- **OnSuccess**: <code>[Venue](src/models/venue.ts)[]</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.venues.listVenues().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Venue[], ApiError&gt;</code>, with `result.value` of type <code>[Venue](src/models/venue.ts)[]</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Negotiations

> Source: [Negotiations](src/resources/negotiations.ts)

<details>
<summary><code>acceptProposal(request: Negotiations.AcceptProposalRequest, options?: RequestOptions): ApiPromise&lt;Plan, Negotiations.AcceptProposalError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Accepts a proposal made by the other person. The server checks the proposal against both people's preferences; if it fits, the negotiation is agreed and a plan is created.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.negotiations.acceptProposal({
    negotiationId: "neg_7f3a",
    proposalId: "pro_2",
    body: { personId: "some example string" },
  });
  // TODO: Handle 'response' of type Plan
} catch (err) {
  // TODO: Handle 'err' of type Negotiations.AcceptProposalError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.negotiations
  .acceptProposal({
    negotiationId: "neg_7f3a",
    proposalId: "pro_2",
    body: { personId: "some example string" },
  })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Plan
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>negotiationId</code> | <code>string</code> | The negotiation's ID. |
| <code>proposalId</code> | <code>string</code> | The proposal's ID. |
| <code>body</code> | <code>[PersonRef](src/models/person-ref.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.negotiations.acceptProposal(request)`

- **OnSuccess**: <code>[Plan](src/models/plan.ts)</code>
- **OnError**: throws <code>[Negotiations.AcceptProposalError](src/resources/negotiations.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.negotiations.acceptProposal(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Plan, Negotiations.AcceptProposalError&gt;</code>, with `result.value` of type <code>[Plan](src/models/plan.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>getNegotiation(request: Negotiations.GetNegotiationRequest, options?: RequestOptions): ApiPromise&lt;Negotiation, Negotiations.GetNegotiationError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Returns the negotiation's status, whose turn it is, and the plan once one is agreed.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.negotiations.getNegotiation({ negotiationId: "neg_7f3a" });
  // TODO: Handle 'response' of type Negotiation
} catch (err) {
  // TODO: Handle 'err' of type Negotiations.GetNegotiationError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.negotiations.getNegotiation({ negotiationId: "neg_7f3a" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Negotiation
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>negotiationId</code> | <code>string</code> | The negotiation's ID. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.negotiations.getNegotiation(request)`

- **OnSuccess**: <code>[Negotiation](src/models/negotiation.ts)</code>
- **OnError**: throws <code>[Negotiations.GetNegotiationError](src/resources/negotiations.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.negotiations.getNegotiation(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Negotiation, Negotiations.GetNegotiationError&gt;</code>, with `result.value` of type <code>[Negotiation](src/models/negotiation.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>listProposals(request: Negotiations.ListProposalsRequest, options?: RequestOptions): ApiPromise&lt;Proposal[], Negotiations.ListProposalsError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Returns every proposal made so far, oldest first.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.negotiations.listProposals({ negotiationId: "neg_7f3a" });
  // TODO: Handle 'response' of type Proposal[]
} catch (err) {
  // TODO: Handle 'err' of type Negotiations.ListProposalsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.negotiations.listProposals({ negotiationId: "neg_7f3a" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Proposal[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>negotiationId</code> | <code>string</code> | The negotiation's ID. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.negotiations.listProposals(request)`

- **OnSuccess**: <code>[Proposal](src/models/proposal.ts)[]</code>
- **OnError**: throws <code>[Negotiations.ListProposalsError](src/resources/negotiations.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.negotiations.listProposals(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Proposal[], Negotiations.ListProposalsError&gt;</code>, with `result.value` of type <code>[Proposal](src/models/proposal.ts)[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>makeProposal(request: Negotiations.MakeProposalRequest, options?: RequestOptions): ApiPromise&lt;Proposal, Negotiations.MakeProposalError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Posts a proposal on behalf of one person. It must be that person's turn and the proposal must fit their own preferences. Each proposal uses one round; the negotiation fails when the rounds run out.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.negotiations.makeProposal({
    negotiationId: "neg_7f3a",
    body: {
      fromPersonId: "some example string",
      startsAt: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)),
      venue: "some example string",
      area: "some example string",
      activity: "some example string",
      costPerPerson: 1.5,
      reason: "some example string",
    },
  });
  // TODO: Handle 'response' of type Proposal
} catch (err) {
  // TODO: Handle 'err' of type Negotiations.MakeProposalError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.negotiations
  .makeProposal({
    negotiationId: "neg_7f3a",
    body: {
      fromPersonId: "some example string",
      startsAt: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)),
      venue: "some example string",
      area: "some example string",
      activity: "some example string",
      costPerPerson: 1.5,
      reason: "some example string",
    },
  })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Proposal
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>negotiationId</code> | <code>string</code> | The negotiation's ID. |
| <code>body</code> | <code>[NewProposal](src/models/new-proposal.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.negotiations.makeProposal(request)`

- **OnSuccess**: <code>[Proposal](src/models/proposal.ts)</code>
- **OnError**: throws <code>[Negotiations.MakeProposalError](src/resources/negotiations.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.negotiations.makeProposal(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Proposal, Negotiations.MakeProposalError&gt;</code>, with `result.value` of type <code>[Proposal](src/models/proposal.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>startNegotiation(request: Negotiations.StartNegotiationRequest, options?: RequestOptions): ApiPromise&lt;Negotiation, Negotiations.StartNegotiationError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Opens a negotiation between two registered people. Both must have saved preferences, be looking for compatible things, and have each said yes to meeting the other. People give that yes themselves; a wingcat cannot.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.negotiations.startNegotiation({
    body: { personAId: "some example string", personBId: "some example string" },
  });
  // TODO: Handle 'response' of type Negotiation
} catch (err) {
  // TODO: Handle 'err' of type Negotiations.StartNegotiationError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.negotiations
  .startNegotiation({ body: { personAId: "some example string", personBId: "some example string" } })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Negotiation
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[NewNegotiation](src/models/new-negotiation.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.negotiations.startNegotiation(request)`

- **OnSuccess**: <code>[Negotiation](src/models/negotiation.ts)</code>
- **OnError**: throws <code>[Negotiations.StartNegotiationError](src/resources/negotiations.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.negotiations.startNegotiation(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Negotiation, Negotiations.StartNegotiationError&gt;</code>, with `result.value` of type <code>[Negotiation](src/models/negotiation.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Plans

> Source: [Plans](src/resources/plans.ts)

<details>
<summary><code>approvePlan(request: Plans.ApprovePlanRequest, options?: RequestOptions): ApiPromise&lt;Plan, Plans.ApprovePlanError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Each person approves or rejects the plan their wingcat agreed. One rejection cancels the plan.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.approvePlan({
    planId: "pln_9c1d",
    body: { personId: "some example string", approved: true },
  });
  // TODO: Handle 'response' of type Plan
} catch (err) {
  // TODO: Handle 'err' of type Plans.ApprovePlanError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans
  .approvePlan({ planId: "pln_9c1d", body: { personId: "some example string", approved: true } })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Plan
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |
| <code>body</code> | <code>[Approval](src/models/approval.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.approvePlan(request)`

- **OnSuccess**: <code>[Plan](src/models/plan.ts)</code>
- **OnError**: throws <code>[Plans.ApprovePlanError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.approvePlan(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Plan, Plans.ApprovePlanError&gt;</code>, with `result.value` of type <code>[Plan](src/models/plan.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>cancelPlan(request: Plans.CancelPlanRequest, options?: RequestOptions): ApiPromise&lt;Plan, Plans.CancelPlanError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Either person can cancel before the plan's cancel-by time. Every hold is released.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.cancelPlan({
    planId: "pln_9c1d",
    body: { personId: "some example string" },
  });
  // TODO: Handle 'response' of type Plan
} catch (err) {
  // TODO: Handle 'err' of type Plans.CancelPlanError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans
  .cancelPlan({ planId: "pln_9c1d", body: { personId: "some example string" } })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Plan
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |
| <code>body</code> | <code>[PersonRef](src/models/person-ref.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.cancelPlan(request)`

- **OnSuccess**: <code>[Plan](src/models/plan.ts)</code>
- **OnError**: throws <code>[Plans.CancelPlanError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.cancelPlan(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Plan, Plans.CancelPlanError&gt;</code>, with `result.value` of type <code>[Plan](src/models/plan.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>checkIn(request: Plans.CheckInRequest, options?: RequestOptions): ApiPromise&lt;CheckIn, Plans.CheckInError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Records that a person has arrived. Entering the code shown on the other person's screen confirms the two are together. Only possible inside the check-in window of a locked plan.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.checkIn({
    planId: "pln_9c1d",
    body: { personId: "some example string" },
  });
  // TODO: Handle 'response' of type CheckIn
} catch (err) {
  // TODO: Handle 'err' of type Plans.CheckInError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans
  .checkIn({ planId: "pln_9c1d", body: { personId: "some example string" } })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type CheckIn
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |
| <code>body</code> | <code>[NewCheckIn](src/models/new-check-in.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.checkIn(request)`

- **OnSuccess**: <code>[CheckIn](src/models/check-in.ts)</code>
- **OnError**: throws <code>[Plans.CheckInError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.checkIn(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;CheckIn, Plans.CheckInError&gt;</code>, with `result.value` of type <code>[CheckIn](src/models/check-in.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>confirmDeposit(request: Plans.ConfirmDepositRequest, options?: RequestOptions): ApiPromise&lt;Deposit, Plans.ConfirmDepositError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Places the hold once the person has approved it with PayPal. When both people's holds are in place the plan becomes locked.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.confirmDeposit({ planId: "pln_9c1d", depositId: "dep_alex" });
  // TODO: Handle 'response' of type Deposit
} catch (err) {
  // TODO: Handle 'err' of type Plans.ConfirmDepositError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans.confirmDeposit({ planId: "pln_9c1d", depositId: "dep_alex" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Deposit
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |
| <code>depositId</code> | <code>string</code> | The deposit's ID. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.confirmDeposit(request)`

- **OnSuccess**: <code>[Deposit](src/models/deposit.ts)</code>
- **OnError**: throws <code>[Plans.ConfirmDepositError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.confirmDeposit(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Deposit, Plans.ConfirmDepositError&gt;</code>, with `result.value` of type <code>[Deposit](src/models/deposit.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>createDeposit(request: Plans.CreateDepositRequest, options?: RequestOptions): ApiPromise&lt;Deposit, Plans.CreateDepositError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Creates a PayPal order for a refundable hold and returns the link the person opens to approve it. Money is held, not taken.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.createDeposit({
    planId: "pln_9c1d",
    body: { personId: "some example string" },
  });
  // TODO: Handle 'response' of type Deposit
} catch (err) {
  // TODO: Handle 'err' of type Plans.CreateDepositError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans
  .createDeposit({ planId: "pln_9c1d", body: { personId: "some example string" } })
  .asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Deposit
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |
| <code>body</code> | <code>[PersonRef](src/models/person-ref.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.createDeposit(request)`

- **OnSuccess**: <code>[Deposit](src/models/deposit.ts)</code>
- **OnError**: throws <code>[Plans.CreateDepositError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.createDeposit(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Deposit, Plans.CreateDepositError&gt;</code>, with `result.value` of type <code>[Deposit](src/models/deposit.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>getCheckInCode(request: Plans.GetCheckInCodeRequest, options?: RequestOptions): ApiPromise&lt;CheckInCode, Plans.GetCheckInCodeError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Returns the code this person shows to the other person when they meet.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.getCheckInCode({ planId: "pln_9c1d", personId: "per_alex" });
  // TODO: Handle 'response' of type CheckInCode
} catch (err) {
  // TODO: Handle 'err' of type Plans.GetCheckInCodeError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans.getCheckInCode({ planId: "pln_9c1d", personId: "per_alex" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type CheckInCode
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |
| <code>personId</code> | <code>string</code> | The person's ID. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.getCheckInCode(request)`

- **OnSuccess**: <code>[CheckInCode](src/models/check-in-code.ts)</code>
- **OnError**: throws <code>[Plans.GetCheckInCodeError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.getCheckInCode(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;CheckInCode, Plans.GetCheckInCodeError&gt;</code>, with `result.value` of type <code>[CheckInCode](src/models/check-in-code.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>getPlan(request: Plans.GetPlanRequest, options?: RequestOptions): ApiPromise&lt;Plan, Plans.GetPlanError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Returns the plan with its approvals, deposits, check-ins and settlement.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.getPlan({ planId: "pln_9c1d" });
  // TODO: Handle 'response' of type Plan
} catch (err) {
  // TODO: Handle 'err' of type Plans.GetPlanError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans.getPlan({ planId: "pln_9c1d" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Plan
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.getPlan(request)`

- **OnSuccess**: <code>[Plan](src/models/plan.ts)</code>
- **OnError**: throws <code>[Plans.GetPlanError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.getPlan(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Plan, Plans.GetPlanError&gt;</code>, with `result.value` of type <code>[Plan](src/models/plan.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>getSettlement(request: Plans.GetSettlementRequest, options?: RequestOptions): ApiPromise&lt;Settlement, Plans.GetSettlementError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Returns what happened to each hold after the date: released when the person showed up or the date was cancelled, captured when they did not.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.plans.getSettlement({ planId: "pln_9c1d" });
  // TODO: Handle 'response' of type Settlement
} catch (err) {
  // TODO: Handle 'err' of type Plans.GetSettlementError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.plans.getSettlement({ planId: "pln_9c1d" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Settlement
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>planId</code> | <code>string</code> | The plan's ID. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.plans.getSettlement(request)`

- **OnSuccess**: <code>[Settlement](src/models/settlement.ts)</code>
- **OnError**: throws <code>[Plans.GetSettlementError](src/resources/plans.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.plans.getSettlement(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Settlement, Plans.GetSettlementError&gt;</code>, with `result.value` of type <code>[Settlement](src/models/settlement.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PawsDownApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

