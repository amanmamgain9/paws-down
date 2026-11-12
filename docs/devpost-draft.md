# Devpost submission draft

Paste each section into the matching Devpost field. Items marked **TODO** need you.

## Before you press submit

1. Upload `video/paws-down-demo.mp4` to YouTube as Public or Unlisted, and paste the link under Links below. It is 2 minutes 54 seconds.
2. Prizes to enter: the main PayPal prizes and **Best Use of APIMatic**. Do not tick Bryntum, Render, AG Grid or Channel3: the project does not use them.
3. Leave the live demo field empty. The app is not hosted; the README has one-command Docker instructions.
4. After submitting, fill in the APIMatic claim form at the bottom of this page.

## Project name

Paws Down

## Tagline

No-flake dates: both put $5 down as a PayPal hold, AI wingcats arrange the date, and showing up gets it back.

## Inspiration

Everyone has been stood up, and it costs the person who flaked nothing. A small refundable deposit changes that, as long as nobody is paying anybody for a date. PayPal's authorize-then-void-or-capture flow fits exactly: the money is held, not taken, and it only moves if someone doesn't turn up.

## What it does

1. Each person tells their wingcat, an AI agent, when they are free, where, their budget and their hard no's.
2. When two people match, their wingcats negotiate a time and a public place by taking turns. Each wingcat asks Claude what to offer and why.
3. Both people approve the plan, and each puts $5 down as a PayPal hold. Each wingcat then looks the hold up on PayPal itself and tells its person it is held, not charged.
4. On the night they check in by swapping codes.
5. Both showed up: both holds are voided and nobody pays. One person didn't: their $5 is captured and the other hold is voided.

## How we built it

- **PayPal:** the PayPal Server SDK with Orders v2 `AUTHORIZE`, then void or capture. Every call carries a `PayPal-Request-Id`, so retries never double-charge. Webhooks are verified on the server.
- **An agent with a PayPal tool that can only look:** each wingcat has one tool from the PayPal Agent Toolkit, `get_order`, with every other action switched off. When its person's $5 is held, the wingcat asks Claude to check the order with PayPal and tell its person what it found. Code allows only that person's order, and code, not the model, decides whether the hold is really there.
- **Agents with limits:** Claude chooses the offer and writes the reason, but code builds the list of dates that fit that person, and the model picks from it by number. A wingcat cannot invent a venue, accept something its person would refuse, or see the other person's preferences. Money moves only from check-in records, never because an agent said so.
- **APIMatic, both directions:** the payment code was written with APIMatic's PayPal Context Plugin guiding the coding agent. We then wrote an OpenAPI spec for our own API, generated a TypeScript SDK with APIMatic, and generated our own Context Plugin from it, so anyone's coding agent can build a new wingcat with one install command.
- **Stack:** TypeScript, Node 24, Fastify, SQLite, React, Vite, the Anthropic SDK, Vitest.

## Challenges we ran into

- The PayPal sandbox refuses an India buyer paying an India seller, with a currency error that does not say why. A US sandbox buyer fixed it.
- The PayPal SDK's defaults retry nothing and never time out. The Context Plugin flagged both, and our tests confirmed them.
- Keeping an AI agent away from money decisions. The answer was to let the model choose only among options that code had already approved.

## Accomplishments that we're proud of

- A full date run on the real PayPal sandbox, ending with one void and one capture.
- 70 automated tests, including PayPal timeouts and 5xx errors, forged webhooks, and a wingcat that stays inside its limits whatever the model answers.
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
- **Not yet done:** webhooks have been tested with events we signed ourselves, not with a live PayPal event. The wingcat's Agent Toolkit check was added after the video was recorded, so the video does not show it; it has been run live on the two settled sandbox orders from the video.

## Built with

typescript, node.js, fastify, sqlite, react, vite, paypal, paypal-server-sdk, paypal-agent-toolkit, apimatic, anthropic, claude, vitest, docker

## Links

- Code: https://github.com/amanmamgain9/paws-down
- SDK: https://github.com/amanmamgain9/paws-down-sdk-typescript
- Context Plugin: https://github.com/amanmamgain9/paws-down-context-plugin
- Video: **TODO** YouTube link
- Live demo: none. To run it, see "Run it in two minutes" or "Run it as one container" in the README.

## Testing instructions

Quickest: `npm ci`, then `npm run practice:server`, `npm run wingcats` and `npm run web` in three terminals, and open http://localhost:5173. No accounts or keys needed.

For real sandbox holds, follow "Run it against the PayPal sandbox" in the README.

**TODO** if you give judges the sandbox buyer login, paste it here yourself. Do not put it in the public repo.

## After submitting

Fill in the APIMatic prize claim form, using the email your APIMatic account is under: https://docs.google.com/forms/d/e/1FAIpQLScc2oCgAFACm7d6H3R4mgzv-O34DdyVnLIBNiwmUNggr_-hhA/viewform
