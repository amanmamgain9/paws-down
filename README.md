# Paws Down 🐾

**No-flake dates.** Both of you put $5 down as a PayPal hold. Show up and you both get it back. Flake and you lose it. Your wingcats arrange the date.

Built for the PayPal AI Hackathon.

## How it works

1. **Tell your wingcat what you want.** Free times, area, budget, likes, hard no's.
2. **The wingcats negotiate.** Each person's agent proposes and counters until both agree. An agent can only agree to things inside its own person's limits.
3. **Both people say yes** to the plan.
4. **Both put $5 down.** Each approves one PayPal hold. The money is held, not taken.
5. **The date.** Each phone shows a code. You enter each other's code to check in.
6. **Settlement is automatic.**
   - Both showed up: both holds are released. Nobody pays anything.
   - One person did not show: their $5 is captured, and the other hold is released.
   - Either cancels before the cut-off: both holds are released.

Nobody pays anybody for a date. Both people put down the same amount, and both get it back by turning up.

## Run it in two minutes (no PayPal account needed)

You need Node 24.

```bash
npm ci
```

Then, in three terminals:

```bash
npm run practice:server
```

```bash
npm run wingcats
```

```bash
npm run web
```

Open http://localhost:5173. This is **practice mode**: no PayPal call is made, and every screen says so.

## Run it against the PayPal sandbox

1. Copy `.env.example` to `.env` and fill in a sandbox app's client id and secret. `.env` is never committed.
2. Check the connection. The first command creates a $5 order and prints a link to approve it:

   ```bash
   npm run paypal:check
   ```

   After approving as a sandbox buyer, run it again with the order id. It places the hold, then releases it, so nothing is charged:

   ```bash
   npm run paypal:check -- <order id>
   ```

3. Start the server with `npm run sandbox:server` in place of `npm run practice:server`. The wingcats and web commands are the same.

When you put $5 down, PayPal's sandbox checkout opens. Log in with a sandbox **personal** (buyer) account.

One thing that cost us an hour: if the sandbox seller is an India account, an India buyer is refused ("This seller doesn't accept payments in your currency"). Use a US sandbox buyer.

## What is in the repo

| Folder | What it is |
| --- | --- |
| `apps/server` | The backend: plans, holds, check-ins, settlement, webhooks. Fastify and SQLite. |
| `apps/agents` | The wingcats. They talk to the server only through the generated SDK. |
| `apps/web` | The two people's screens. React and Vite. |
| `apimatic/src/spec` | The Paws Down OpenAPI spec. |
| `apimatic/sdk/typescript` | The TypeScript SDK that APIMatic generated from that spec. |
| `docs/` | Notes on the PayPal webhooks and on the PayPal Context Plugin. |

## How PayPal is used

All payment code uses the PayPal Server SDK (`@paypal/paypal-server-sdk`), in `apps/server/src/payments/`.

| Step | PayPal call |
| --- | --- |
| Put $5 down | Create an order with intent `AUTHORIZE` |
| Person approves at PayPal | Authorize the order (this places the hold) |
| Showed up, or cancelled in time | Void the authorization |
| Did not show | Capture the authorization |

- Every call carries a `PayPal-Request-Id`, so a retry never places a second hold or a second capture.
- The server decides when money moves, from check-in records. An agent saying "they showed up" moves nothing.
- Webhooks are verified on the server before anything is trusted. See [docs/paypal-webhooks.md](docs/paypal-webhooks.md).

## How APIMatic is used

- **We consume PayPal through APIMatic's PayPal Context Plugin.** The payment code was written with the plugin's skills guiding the coding agent. See [docs/apimatic/paypal-context-plugin.md](docs/apimatic/paypal-context-plugin.md).
- **We produce an SDK for our own API.** The spec in `apimatic/src/spec` generates the `paws-down-api` SDK, and the wingcats use nothing else to reach the server.

## Tests

```bash
npm test
```

53 tests cover the date rules, the PayPal calls (including timeouts, 5xx errors and repeated requests), and forged webhooks.

## What is real and what is not

- **Real:** PayPal sandbox holds, voids and captures. A full date has been run on the sandbox, ending with one void and one capture.
- **Simulated:** the people are invented, and the demo has a clock you can move forward to reach the date.
- **Wingcats are rule-based today.** They follow fixed rules to propose and counter; no language model is involved yet.
- **Webhooks have not received a live PayPal event yet.** They are tested with events we signed ourselves in PayPal's documented format.
- **A captured $5 stays with the platform** in this prototype. There is no payout between users.

## License

MIT
