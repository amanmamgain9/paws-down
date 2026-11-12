# How the PayPal Context Plugin shaped our PayPal code

We wrote `apps/server/src/payments/paypal-gateway.ts` against the official PayPal Server SDK
(`@paypal/paypal-server-sdk` 2.5.0) with APIMatic's PayPal Context Plugin installed:

    npx context-plugins install https://github.com/paypaldev/server-sdk-context-plugin-preview

The plugin's TypeScript skills pointed at things the SDK's types do not show. Each one changed the code,
and each one is covered by a test in `apps/server/test/paypal-gateway.test.ts`.

| What the plugin said | What we found in the SDK | What we did |
| --- | --- | --- |
| The default timeout may be `0`, meaning no timeout at all | `DEFAULT_CONFIGURATION.timeout` is `0` | Set a 15 second timeout |
| Raising `maxNumberOfRetries` alone does nothing when `maximumRetryWaitTime` is `0` | Both default to `0`, so nothing is retried | Set 3 retries and a 20 second retry budget |
| `POST` is usually not in `httpMethodsToRetry` | Only `GET` and `PUT` are | Added `POST`, because every call carries a `PayPal-Request-Id` and is safe to repeat |
| Error payloads keep the wire's field names | `CustomError` has `debug_id`, not `debugId` | Read `debug_id` and `details[0].issue` as spelled |
| A bare `ApiError` fills `body`, not `result` | Confirmed | Fall back to parsing `body` |
| Stub the SDK through `unstable_httpClientOptions`, and answer the token request too | Confirmed | Our fake PayPal answers `/v1/oauth2/token` and records every other call |

## One thing our own tests added

With `retryOnTimeout: true`, our fake PayPal saw a `422 ORDER_NOT_APPROVED` refusal sent four times.
With it `false`, the refusal was sent once and a `503` was still retried. We turned it off and rely on
the server re-running settlement, with the same request ids, until it finishes.

## The tests

`npm test` runs 16 gateway tests against a stand-in PayPal: the four happy-path calls, a 503 that
recovers, a 429 that recovers, a 503 that never recovers, an unapproved order, a declined payment
method, a double release, a capture after release, an expired hold, a network failure, wrong
credentials, and missing configuration.
