# PayPal webhooks

Paws Down accepts PayPal webhooks at `POST /webhooks/paypal` and checks every one itself before trusting it.

## Why we need them

After someone approves their $5 hold, PayPal sends them back to the app, and the app places the hold. If they close the tab first, the app never hears about it. The `CHECKOUT.ORDER.APPROVED` webhook covers that: PayPal tells the server directly, and the server places the hold.

| Event | What the server does |
| --- | --- |
| `CHECKOUT.ORDER.APPROVED` | Places the hold for that deposit, if it is still waiting. |
| `PAYMENT.AUTHORIZATION.CREATED` | Writes "PayPal confirmed: the $5 is held" to the feed. |
| `PAYMENT.AUTHORIZATION.VOIDED` | Writes "PayPal confirmed: the hold was released" to the feed. |
| `PAYMENT.CAPTURE.COMPLETED` | Writes "PayPal confirmed: the $5 was captured" to the feed. |
| anything else | Accepted and ignored. |

## How an event is checked

The check is in `apps/server/src/payments/webhook.ts` and makes no call back to PayPal.

1. PayPal signs this text: `<transmission id>|<transmission time>|<our webhook id>|<CRC32 of the raw body>`.
2. The server rebuilds that text from the request headers, its own webhook id, and the bytes it received.
3. It fetches PayPal's signing certificate from the address in the `paypal-cert-url` header, and verifies the signature (RSA with SHA-256).

Anything that fails is answered with 401 and changes nothing.

## What the tests prove

`apps/server/test/webhook.test.ts` sends honest and forged events through the real route.

- **Forged events are refused:** no signature, a changed body, a body with only its spacing changed, a signature from the wrong key, a signature made for another webhook, and an unsupported algorithm.
- **The certificate address cannot be hijacked:** only `https` addresses on `paypal.com` are fetched. `paypal.com.evil.example` is refused without any fetch.
- **Repeats are safe:** PayPal resends events. Each event id is handled once.
- **No double hold:** when the webhook and the browser return arrive at the same moment, one hold is placed.
- **Failures are retried:** if the hold cannot be placed, the server answers 500, PayPal sends the event again, and the retry works.

## Turning it on

Webhooks are off until `PAYPAL_WEBHOOK_ID` is set in `.env`. The server prints `PayPal webhooks: on` or `off` when it starts.

1. Give the server a public https address (a deployment, or a tunnel while developing).
2. In the PayPal developer dashboard, open the sandbox app, add a webhook for `https://<your address>/webhooks/paypal`, and subscribe to the four events in the table above.
3. Copy the webhook id PayPal shows into `.env` as `PAYPAL_WEBHOOK_ID`, and restart the server.

PayPal's Webhooks Simulator sends events that are not signed for your webhook id, so they are refused. Test with a real sandbox payment.

## Not yet checked

The signature check has been tested against events we signed ourselves in PayPal's documented format. It has not yet received a live event from PayPal, because that needs the public address in step 1.
