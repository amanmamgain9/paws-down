# Devpost submission draft

Paste each section into the matching Devpost field. Items marked **TODO** need you.

## Project name

Paws Down

## Tagline

No-flake dates: both put $5 down as a PayPal hold, AI wingcats arrange the date, and showing up gets it back.

## Inspiration

Everyone has been stood up, and it costs the person who flaked nothing. A small refundable deposit changes that, as long as nobody is paying anybody for a date. PayPal's authorize-then-void-or-capture flow fits exactly: the money is held, not taken, and it only moves if someone doesn't turn up.

## What it does

1. Each person tells their wingcat, an AI agent, when they are free, where, their budget and their hard no's.
2. When two people match, their wingcats negotiate a time and a public place by taking turns. Each wingcat asks Claude what to offer and why.
3. Both people approve the plan, and each puts $5 down as a PayPal hold.
4. On the night they check in by swapping codes.
5. Both showed up: both holds are voided and nobody pays. One person didn't: their $5 is captured and the other hold is voided.

## How we built it

- **PayPal:** the PayPal Server SDK with Orders v2 `AUTHORIZE`, then void or capture. Every call carries a `PayPal-Request-Id`, so retries never double-charge. Webhooks are verified on the server.
- **Agents with limits:** Claude chooses the offer and writes the reason, but code builds the list of dates that fit that person, and the model picks from it by number. A wingcat cannot invent a venue, accept something its person would refuse, or see the other person's preferences. Money moves only from check-in records, never because an agent said so.
- **APIMatic, both directions:** the payment code was written with APIMatic's PayPal Context Plugin guiding the coding agent. We then wrote an OpenAPI spec for our own API, generated a TypeScript SDK with APIMatic, and generated our own Context Plugin from it, so anyone's coding agent can build a new wingcat with one install command.
- **Stack:** TypeScript, Node 24, Fastify, SQLite, React, Vite, the Anthropic SDK, Vitest.

## Challenges we ran into

- The PayPal sandbox refuses an India buyer paying an India seller, with a currency error that does not say why. A US sandbox buyer fixed it.
- The PayPal SDK's defaults retry nothing and never time out. The Context Plugin flagged both, and our tests confirmed them.
- Keeping an AI agent away from money decisions. The answer was to let the model choose only among options that code had already approved.

## Accomplishments that we're proud of

- A full date run on the real PayPal sandbox, ending with one void and one capture.
- 64 automated tests, including PayPal timeouts and 5xx errors, forged webhooks, and a wingcat that stays inside its limits whatever the model answers.
- A published SDK and Context Plugin for our own API.

## What we learned

Agents that handle money are mostly a safety problem. The model is the easy part; the work is deciding what it is never allowed to do, and proving that with tests.

## What's next

- Safety features: an "I feel unsafe" release, running late, and disputes.
- Sending a forfeited deposit to the person who was stood up, or to a charity.
- A calendar view of free times and tentative offers.

## What is real and what is simulated

- **Real:** PayPal sandbox holds, voids and captures; Claude-driven negotiation; the generated SDK in the live flow.
- **Simulated:** Maya and Jake are invented, both phones are on one screen, and a demo clock fast-forwards to date time.
- **Not yet done:** webhooks have been tested with events we signed ourselves, not with a live PayPal event.

## Built with

typescript, node.js, fastify, sqlite, react, vite, paypal, paypal-server-sdk, apimatic, anthropic, claude, vitest, docker

## Links

- Code: https://github.com/amanmamgain9/paws-down
- SDK: https://github.com/amanmamgain9/paws-down-sdk-typescript
- Context Plugin: https://github.com/amanmamgain9/paws-down-context-plugin
- Video: **TODO** YouTube link
- Live demo: **TODO** Render link, or leave blank and point to the Docker instructions in the README

## Testing instructions

Quickest: `npm ci`, then `npm run practice:server`, `npm run wingcats` and `npm run web` in three terminals, and open http://localhost:5173. No accounts or keys needed.

For real sandbox holds, follow "Run it against the PayPal sandbox" in the README.

**TODO** if you give judges the sandbox buyer login, paste it here yourself. Do not put it in the public repo.

## After submitting

Fill in the APIMatic prize claim form, using the email your APIMatic account is under: https://docs.google.com/forms/d/e/1FAIpQLScc2oCgAFACm7d6H3R4mgzv-O34DdyVnLIBNiwmUNggr_-hhA/viewform
