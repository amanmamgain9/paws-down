# Show Up: no-flake dates

Hackathon brief, version 3 · written Tuesday 10 November 2026, 18:30 IST · proposed build, nothing implemented yet. "Show Up" is a working name.

**Sponsor prize target: Best Use of APIMatic** (3 winners, $1,000 each plus 6 months of APIMatic Business). Second sponsor target: Best Use of Bryntum (3 winners, $1,000 each), because a date calendar is a natural fit. The rules allow a project to win one sponsor prize plus one main or honorable-mention prize, so extra eligibility raises the chance of winning one, not several.
**Main prize targets:** Best Use of Agentic Commerce, Most Creative, Best Demo Delivery.
**Deadline: Friday 13 November, 01:30 IST** (confirmed on Devpost). Our own submit time is Thursday 21:00 IST. About 55 hours remain.

The earlier solar brief is kept as `BRIEF-solar-archived.md`.

## One-line pitch

**Both of you put $5 down. Show up and you both get it back. Flake and you lose it. Your AI wingmen arrange the date.**

## How it works

1. **Tell your wingman what you want.** Each person describes their ideal date in plain language: days and times, area, budget, likes, hard no's.
2. **The wingmen negotiate.** Each person's AI agent proposes and counters on time, place and activity until they agree or run out of rounds. Each agent can only agree to things inside its own person's limits, and it does not hand the other side its person's private notes.
3. **Both people say yes.** Each sees the agreed plan and the reason their wingman accepted it, and approves or rejects.
4. **Both put $5 down.** Each approves one PayPal hold. Money is held, not taken. If only one person puts a hold down before the cut-off, that hold is released and the date is off.
5. **The date.** Each person's phone shows a code; they enter each other's code to check in.
6. **Settlement, automatic.**
   - Both checked in: both holds are released. Nobody pays anything.
   - One person didn't show: their $5 is captured; the other person's hold is released.
   - Either cancels before the cut-off: both holds are released.

## Why this is not paying for a date

- Nobody pays anybody for their time. Both people put down the same amount and both get it back by turning up.
- No bidding, no prices on people, no payments between users.
- A forfeited deposit is captured by the platform and recorded as a credit for the person who was stood up. There is no payout between users in this prototype. (Open choice: send forfeits to a charity instead.)
- Adults only. The demo uses two invented people who are already matched; finding matches is out of scope.

## Rules the backend enforces

Agents propose; backend code decides. An agent saying "they agreed" or "they showed up" never moves money.

- A plan is valid only if it fits both people's stated limits, checked by code.
- Negotiation stops after a fixed number of rounds (start with 6). No agreement means no date and no holds.
- Deposits are requested no more than 72 hours before the date, to stay inside PayPal's authorization honor period.
- The cancel cut-off and the check-in window are fixed when the plan is confirmed and shown to both people before they pay.
- Settlement runs from check-in records, exactly once per date.

## PayPal flow

All payment code uses the PayPal Server SDK (`@paypal/paypal-server-sdk` 2.5.0, confirmed to have every call below).

1. For each person: create an order with intent AUTHORIZE for $5.00 USD, `custom_id` set to the date ID and person.
2. Each person approves in sandbox checkout; the backend authorizes each order and stores the authorization ID.
3. The date coordinator agent confirms both holds with the PayPal Agent Toolkit's `get_order` before marking the date confirmed.
4. Both showed up: void both authorizations.
5. One no-show: capture that person's authorization in full; void the other.
6. Cancelled or only one hold placed: void whatever exists.
7. Webhooks (`PAYMENT.AUTHORIZATION.CREATED`, `PAYMENT.AUTHORIZATION.VOIDED`, `PAYMENT.CAPTURE.COMPLETED`), signature-verified by a hand-written call, confirm status in the ledger. Settlement is triggered by check-in records, never by a webhook. All calls carry an idempotency ID.

No partial capture is needed, so that earlier risk is gone.

## The APIMatic story: Context Plugins at both ends

**1. We consume PayPal through APIMatic's PayPal Context Plugin.**

- Install in Claude Code: `npx context-plugins install https://github.com/paypaldev/server-sdk-context-plugin-preview`
- Every payment path is written with the plugin's skills guiding the coding agent.
- We prove the result is production-ready in APIMatic's own four families (correctness, error handling, resilience, security and configuration) with a failure-injection test suite: a 503 with retry, a 429 with back-off, missing configuration failing fast, a declined or expired authorization, and a duplicate capture or void. Pass results go in the README and the video.
- Evidence in `docs/apimatic/`: the install command and installed plugin files, coding-session excerpts showing skills in use, and a table mapping each PayPal code path to the skill that shaped it.

**2. We produce a Context Plugin for our own API: "build your own wingman".**

- Write the Show Up OpenAPI spec first (people, preferences, negotiations, proposals, plans, deposits, check-ins), with descriptions and examples so `apimatic api validate` passes.
- Generate a v4 TypeScript SDK, push it to a public GitHub repo, generate our Context Plugin from it and push that too. This pipeline is already proven on the trial account.
- Generate a developer portal with one recipe, "negotiate a date and settle the deposits".

**3. Every agent uses the Show Up API only through the generated SDK at runtime.**

**4. The on-camera moment.** A fresh Claude Code session, knowing nothing about our code, installs our plugin with one command and is asked to build a new wingman with its own personality. It joins, negotiates a date against an existing wingman, and the result appears on screen. A real recorded run.

**Claim form (after the Devpost entry):** [APIMatic claim form](https://docs.google.com/forms/d/e/1FAIpQLScc2oCgAFACm7d6H3R4mgzv-O34DdyVnLIBNiwmUNggr_-hhA/viewform), using the email the APIMatic account is under.

## Other sponsor eligibility

Sponsor pages read on 10 Nov.

- **Bryntum (targeted).** The prize is for the best use of its Gantt, Scheduler or Calendar, including "an agent that drives the schedule itself"; one of its own example ideas is a booking "locked in only once a PayPal payment clears". Our use: each person's screen has a Bryntum Calendar showing their free times. Wingman proposals appear on it as tentative slots while they negotiate, and the agreed date becomes a locked event only when both PayPal holds are placed. The behind-the-scenes view uses Bryntum Scheduler with one row per person. 45-day trial: `npm install @bryntum/calendar@npm:@bryntum/calendar-trial`.
- **AG Grid (not targeted).** The prize is for AG Studio, their dashboard product: polished custom widgets, theming and their Studio Agent Framework, "not just AG Grid or AG Charts on their own". That is a separate analytics-dashboard build and a weak fit for a consumer dating app.
- **Channel3 (not targeted).** Requires meaningful use of its retail product-search API. No natural place in this product.
- **Render (optional).** Requires deploying on Render and using Render Workflows to coordinate agents or background jobs. Prize is credits. Only if time remains after deploying.

## The demo

Two people, Alex and Sam, shown as two phone-sized screens side by side, plus a behind-the-scenes panel.

1. Alex and Sam each type what they want. Their limits overlap only partly, so the negotiation is visible: a few proposals and counters, each with a one-line reason.
2. The wingmen agree on a plan. Both approve.
3. Both place a $5 PayPal sandbox hold.
4. Ending one: a labelled "fast-forward to date time" control advances the demo clock, both enter codes, both holds are released.
5. Ending two: the date is rerun with Sam not showing. Sam's $5 is captured, Alex's is released, and each screen says so in one sentence.
6. A new wingman, built live with our Context Plugin, joins and negotiates.

A plain-language status line on each screen always says what is happening now, for example "Your wingman countered: Saturday 6 pm instead of Friday."

## What is real and what is simulated

| Real | Simulated, labelled on screen |
|---|---|
| Agent negotiation, produced live by an LLM from each person's inputs | The clock fast-forward to date time |
| API calls through the APIMatic-generated SDK | Being at the venue (check-in is by code; location is not verified) |
| PayPal sandbox holds, voids, captures and verified webhooks | Alex and Sam, who are invented demo users |
| Settlement computed from check-in records | |

Errors show a clear state, never a fabricated success. No prerecorded negotiations or payment events.

## Stack

TypeScript on Node 24, one repo with npm workspaces.

| Piece | Built with |
|---|---|
| Backend | Fastify, SQLite |
| Live updates | Server-Sent Events |
| Payments | PayPal Server SDK, PayPal checkout button, PayPal Agent Toolkit |
| Agents | Anthropic SDK calling Claude, structured outputs validated by the backend |
| Agents ↔ backend | Our APIMatic-generated TypeScript SDK |
| Interface | React, Vite, Tailwind, Bryntum Calendar and Scheduler |
| Tests | Vitest with faked PayPal failures |
| Deploy | One Docker container on Render; the backend serves the built interface |

## Repo layout

```
show-up/
├── README.md  LICENSE  .env.example  BRIEF.md
├── package.json
├── apimatic/src/
│   ├── spec/openapi.yaml        the Show Up API, source of truth
│   └── plugin-config.json
├── apps/
│   ├── server/src/
│   │   ├── routes/              people, negotiations, plans, deposits, check-ins
│   │   ├── payments/            all PayPal code
│   │   ├── negotiation/         round limits, plan validation against both people's limits
│   │   ├── settlement/          check-in records to void or capture decisions
│   │   ├── ledger/              deposit and outcome records
│   │   ├── clock/               demo clock and fast-forward
│   │   └── events/              live event stream
│   ├── agents/                  wingman agent, date coordinator agent
│   └── web/                     two person screens, behind-the-scenes view
├── tests/readiness/             failure-injection suite for PayPal
├── docs/apimatic/               Context Plugin evidence
├── docs/impact.md
└── scripts/                     regenerate SDK and plugin, reset the demo
```

Two more public repos hold generated output only: `show-up-sdk-typescript` and `show-up-context-plugin`. The plugin bakes the SDK repo's address into its skills, so these names must be final before generating.

## Gates

| Gate | Status |
|---|---|
| APIMatic SDK and Context Plugin generation on the trial | Passed 10 Nov |
| PayPal Server SDK has authorize, capture, void, refund | Passed 10 Nov |
| Devpost deadline, deliverables, prize rules | Passed 10 Nov |
| Sandbox hold, void and capture end to end | Open: needs sandbox client ID and secret in `.env` |
| Webhook delivery and verification | Open: needs the same credentials and a tunnel |
| Installing our published plugin with `npx context-plugins install` | Open |
| LLM access | Open: no `ANTHROPIC_API_KEY` on this machine |

Needed from the account owner: a PayPal sandbox app, two sandbox personal accounts (Alex and Sam, also given to judges in the README), and an Anthropic API key, all placed in `.env` by hand.

## Schedule (IST)

| When | What |
|---|---|
| Tue 10 Nov, evening | Repo and licence. OpenAPI spec written and validated. Server skeleton with people, preferences and negotiation routes. PayPal Context Plugin installed. |
| Wed 11 Nov, morning | SDK generated and published. Wingman agents negotiating through it. Plan validation. |
| Wed 11 Nov, afternoon | PayPal holds, voids, captures; check-in and settlement; webhooks; ledger. |
| Wed 11 Nov, evening | The two person screens with the Bryntum Calendar and the status line. First full run of both endings. Our Context Plugin published. |
| Thu 12 Nov, morning | Fresh-agent wingman moment rehearsed. Readiness tests. Bryntum Scheduler view. Portal. Deploy. |
| Thu 12 Nov, 14:00 | Feature freeze. |
| Thu 12 Nov, 14:00–19:00 | README, evidence folder, record and edit the video, upload to YouTube. |
| Thu 12 Nov, 19:00–21:00 | Devpost submission, then the APIMatic claim form. |

**If we fall behind, drop in this order:** developer portal, Bryntum Scheduler view (keep the Calendar), hosted deployment, webhooks (keep direct API confirmation), the second ending on camera. Never drop: PayPal Context Plugin evidence, the generated SDK in the live flow, our plugin's on-camera moment, live negotiation, hold then void-or-capture.

## Video, target 2 minutes 50 seconds

| Time | Show |
|---|---|
| 0:00–0:15 | The problem everyone knows: getting stood up. The one-line pitch. |
| 0:15–0:50 | Alex and Sam tell their wingmen what they want; the wingmen negotiate and agree. |
| 0:50–1:10 | Both approve; both place a $5 PayPal hold. |
| 1:10–1:35 | Ending one: both check in, both get their money back. |
| 1:35–1:55 | Ending two: Sam flakes, Sam's $5 is captured, Alex's is released. |
| 1:55–2:25 | A fresh coding agent installs our Context Plugin, builds a new wingman, and it negotiates live. |
| 2:25–2:50 | How it was built: PayPal Context Plugin, readiness checks passing, generated SDK, what is simulated, repository. |

YouTube, public, under three minutes, no third-party logos, no copyrighted music.

## Submission checklist

- Public GitHub repository; open-source licence visible in the repo's About section.
- README: setup, architecture, demo controls, what is simulated, sponsor integrations, impact case with sources.
- "Tools" statement naming the AI model and how it is used.
- Sandbox logins for Alex and Sam in the README; never the app's client secret.
- Environment-variable template; no secrets committed.
- `docs/apimatic/` evidence; OpenAPI spec, generated SDK, our plugin, reproducible generation commands.
- Functional demo: hosted URL or complete run instructions.
- YouTube video.
- Devpost text description.
- APIMatic claim form submitted.

## Scope limits

No matching or discovery, no chat between people, no location tracking, no payouts between users, no real identity checks, no repeat or recurring charges. Not a production dating service.

## Still to do or verify

- Impact case: sourced figures on no-shows and flaking for `docs/impact.md` and the video opening. None researched yet.
- That the Bryntum Calendar trial installs and renders in our React setup.
- Optional stretch, only if the core is done: venues' agents bid to host the agreed date (a reverse auction between venues, never on people).
- Whether a check-in by code is convincing enough on camera, or needs a QR scan.
- Credit or charity for forfeited deposits.
- A final product name, checked for obvious trademark clashes.
