# Demo video script

The submitted video was recorded by a script, not by hand: a headless browser ran the app on the PayPal sandbox with Claude wingcats, and the captions were drawn on the page. Each $5 hold was approved by a sandbox test buyer in a separate signed-in browser, so the video shows a screenshot of that PayPal page, and the two waits for approval were cut. The manual script below still works if you want to record it yourself.

Target length: 2 minutes 45 seconds. Record the browser at 1280 wide or more, so both phones fit side by side.

## Before recording

1. Put the PayPal sandbox keys and an Anthropic key in `.env`.
2. Start the three parts, each in its own terminal: `npm run sandbox:server`, `npm run wingcats`, `npm run web`.
3. Open http://localhost:5173 and check the top right says **PayPal sandbox: test money only** and **Wingcats: Claude**.
4. Log in to the sandbox buyer once in the same browser, so the PayPal page opens straight on "Pay" during the take.
5. Do one full practice run. Press **Start over** before the real take.

If either label says something else, say so in the video. Do not describe rule-based cats as AI, or practice mode as PayPal.

## The take

| Time | Do on screen | Say |
| --- | --- | --- |
| 0:00 | Welcome screen. | "Everyone has been stood up. Paws Down fixes that. You both put five dollars down. Show up and you get it back. Flake and you lose it." |
| 0:12 | Click **Meet Maya and Jake**. Skip both photos. | "Maya and Jake are two invented people. Each one has a wingcat: an AI agent that arranges the date for them." |
| 0:22 | Show the six questions. Point at Maya's "ramen" like and Jake's "ramen" hard no. Click **Brief Mochi**, then **Brief Biscuit**. | "They tell their wingcat when they are free, where, their budget and their hard no's. Maya loves ramen. Jake has ruled it out. Neither sees the other's answers." |
| 0:40 | Pass on other people until Maya and Jake see each other, then say yes on both phones. Click **Send Mochi to arrange it**. | "They match. Nobody has to send the first message. The wingcats take it from here." |
| 0:52 | Let the offers appear. Read one reason aloud. | "Mochi opens with ramen. Biscuit can't accept that, so it counters. Each wingcat asks Claude what to offer and why. But code checks every offer against that person's limits, so a wingcat can't agree to something its person would refuse." |
| 1:15 | Click **Sounds purrfect** on both phones. | "Both people approve the plan." |
| 1:22 | Click **Put my paw down: hold $5** on Maya's phone. Pay on the PayPal sandbox page. Repeat for Jake. | "Now the money. Each puts five dollars down through PayPal. It is an authorization: a hold, not a charge." |
| 1:45 | Show both paws down and the check-in codes. Click **Fast-forward to date time**. | "The date is locked. This button moves the demo clock to date night." |
| 1:55 | Type Jake's code on Maya's phone and click **I'm here**. Leave Jake alone. Click **End the check-in window**. | "They check in by swapping codes. Maya turns up. Jake doesn't." |
| 2:05 | Show the settled screen. | "PayPal voids Maya's hold, so Maya pays nothing. Jake's five dollars is captured. When both show up, both holds are voided and nobody pays." |
| 2:20 | Show the README sections on PayPal and APIMatic, or the test run. | "Payments use the PayPal Server SDK, written with APIMatic's PayPal Context Plugin. Every call is safe to retry, and webhooks are verified. The wingcats reach our own API only through an SDK that APIMatic generated from our spec." |
| 2:38 | Back to the welcome screen. | "Paws Down. First dates that actually happen." |

## Notes

- The wingcats' offers come from Claude, so the venue and wording can differ between takes. Read what is on screen; do not memorise the lines from a practice run.
- Both demo people pay from the same sandbox buyer unless a second US sandbox buyer is set up.
- If the PayPal page asks for a login mid-take, pause the recording, log in, and resume.
- Keep the video under three minutes, with no copyrighted music and no third-party logos beyond what the PayPal page shows.
