import { useCallback, useEffect, useState } from 'react';
import { call, type AppState, type Intent, type Negotiation, type Person, type Plan, type Proposal } from './api';
import { CatFace, Heart, Lock, Logo, Paw, type Mood, type Tone } from './art';
import { MatchScreen, PhotoStep, SwipeDeck } from './Deck';
import { HeartBurst, Journey, Ticket } from './Journey';
import { Questionnaire } from './Onboarding';

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const dayKey = (iso: string) => new Date(iso).toDateString();

type Act = (fn: () => Promise<unknown>) => Promise<void>;

/** "Serious" and "casual" are never shown to each other. The server enforces the same rule. */
const intentsFit = (a?: Intent, b?: Intent) => !((a === 'serious' && b === 'casual') || (a === 'casual' && b === 'serious'));
const involves = (n: Negotiation, id: string) => n.personAId === id || n.personBId === id;

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setState(await call<AppState>('GET', '/demo/state'));
    } catch {
      setError('Cannot reach the Paws Down server.');
    }
  }, []);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 1000);
    return () => clearInterval(t);
  }, [refresh]);

  /** Runs an action, shows any error in plain words, then refreshes. */
  const act = useCallback<Act>(
    async (fn) => {
      setError('');
      try {
        await fn();
      } catch (e) {
        setError((e as Error).message);
      }
      await refresh();
    },
    [refresh],
  );

  // PayPal sends the person back here with ?token=<order id> once they approve the hold.
  // The server then asks PayPal to place it; nothing is trusted from the address bar.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const orderId = query.get('token');
    const cancelled = query.has('cancelled');
    if (!orderId && !cancelled) return;
    window.history.replaceState(null, '', window.location.pathname);
    if (cancelled) setError('You left PayPal without approving, so no hold was placed.');
    else if (orderId) void act(() => call('POST', '/app/deposits/confirm', { orderId }));
  }, [act]);

  if (!state) return <div className="page"><p className="hint">{error || 'Waking the wingcats…'}</p></div>;

  // The two phones follow the first two people. Everyone else is someone to swipe past.
  const [a, b] = state.people;
  const negotiation = a && b ? state.negotiations.filter((n) => involves(n, a.id) && involves(n, b.id)).at(-1) : undefined;
  const plan = negotiation?.planId ? state.plans.find((p) => p.id === negotiation.planId) : undefined;
  const said = (from?: Person, to?: Person) => state.interests.find((i) => i.fromPersonId === from?.id && i.toPersonId === to?.id)?.interested;
  const practice = state.paymentMode === 'practice';
  const seed = () => act(() => call('POST', '/demo/seed'));

  return (
    <div className="page">
      <header className="top">
        <Logo />
        <div>
          <h1>Paws Down</h1>
          <div className="tagline">Both put $5 down. Show up, get it back.</div>
        </div>
        <span className="spacer" />
        {state.paymentMode === 'paypal_sandbox' && (
          <span className="mode sandbox" title="Holds are placed through the PayPal sandbox with test accounts. No real money moves.">PayPal sandbox: test money only</span>
        )}
        {state.paymentMode !== 'paypal_sandbox' && (
          <span className="mode" title={practice ? 'No PayPal and no money involved. Holds are pretend.' : 'Holds cannot be placed until PayPal is connected.'}>
            {practice ? 'Practice mode: pretend money' : 'PayPal not connected'}
          </span>
        )}
        {state.wingcatBrain === 'claude' && (
          <span className="mode sandbox" title="Each wingcat asks Claude what to offer and why. Code still checks every offer against its person's limits.">Wingcats: Claude</span>
        )}
        {state.wingcatBrain === 'rules' && (
          <span className="mode" title="The wingcats follow fixed rules, not AI. Add an Anthropic key to .env to have them ask Claude.">Wingcats: rule-based</span>
        )}
        {a && <button className="ghost" onClick={seed}>Start over</button>}
      </header>

      {!a || !b ? (
        <Welcome onStart={seed} />
      ) : (
        <>
          <Journey
            stage={stageOf(a, b, negotiation, plan)}
            next={nextStep({ a, b, negotiation, plan, mutual: said(a, b) === true && said(b, a) === true, passed: said(a, b) === false || said(b, a) === false, now: state.now })}
            latest={state.events.at(-1)?.message}
          >
            {plan?.status === 'locked' && (
              <>
                <span className="sim">Simulated clock</span>
                {Date.parse(state.now) < Date.parse(plan.checkInOpensAt) ? (
                  <button onClick={() => act(() => call('POST', '/demo/clock', { to: plan.checkInOpensAt }))}>Fast-forward to date time</button>
                ) : (
                  <button onClick={() => act(() => call('POST', '/demo/clock', { to: new Date(Date.parse(plan.checkInClosesAt) + 1000).toISOString() }))}>
                    End the check-in window
                  </button>
                )}
              </>
            )}
          </Journey>

          {plan && <Ticket plan={plan} a={a} b={b} practice={practice} />}

          <div className="phones">
            <Phone key={a.id} me={a} partner={b} tone="pink" state={state} act={act} />
            <Phone key={b.id} me={b} partner={a} tone="lilac" state={state} act={act} />
          </div>
        </>
      )}

      {error && <div className="error" role="alert">{error}</div>}
      {plan?.settlement?.outcome === 'both_showed' && <HeartBurst />}
    </div>
  );
}

/** How far along the six steps this date is. Six means finished. */
function stageOf(a: Person, b: Person, negotiation?: Negotiation, plan?: Plan): number {
  if (!a.preferences || !b.preferences) return 0;
  if (!negotiation) return 1;
  if (!plan) return 2;
  if (plan.status === 'locked') return 4;
  if (plan.status === 'settled') return 6;
  return 3;
}

/** One plain sentence saying what happens next. */
function nextStep({ a, b, negotiation, plan, mutual, passed, now }: { a: Person; b: Person; negotiation?: Negotiation; plan?: Plan; mutual: boolean; passed: boolean; now: string }): string {
  if (!a.preferences || !b.preferences) return `${a.name} and ${b.name} each make a profile: a photo, then six questions for their wingcat.`;
  if (!negotiation) {
    if (passed) return 'No match this time. Nobody is told who passed.';
    if (mutual) return `It's a match. Either of them can send the wingcats in.`;
    return 'Each of them swipes through people. A wingcat only steps in when two people heart each other.';
  }
  if (negotiation.status === 'failed') return 'The wingcats could not find a plan that fits you both. Start over to try again.';
  if (!plan) return 'The wingcats are trading offers. They can plan the date, but they can never touch money.';
  switch (plan.status) {
    case 'awaiting_approval':
      return 'The wingcats agreed a plan. Now both people say whether they like it.';
    case 'awaiting_deposits':
      return `Each person puts $${plan.depositAmount} down. It is a hold, so nobody is charged yet.`;
    case 'locked':
      return Date.parse(now) < Date.parse(plan.checkInOpensAt)
        ? 'Both paws are down and the date is locked. Fast-forward to the date to see how it ends.'
        : 'It is date time. Check in with each other\'s code, or leave one person out to see a no-show.';
    case 'settled':
      return plan.settlement?.outcome === 'both_showed' ? 'You both showed up, so you both got your money back. Enjoy the date.' : 'The date is settled. The ticket shows where each $5 went.';
    case 'cancelled':
      return 'The date is off and no money was taken. Start over to try again.';
  }
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section className="welcome">
      <div className="pair">
        <CatFace tone="pink" size={104} mood="happy" />
        <span className="beat"><Heart size={34} /></span>
        <CatFace tone="lilac" size={104} mood="happy" />
      </div>
      <h2>First dates that actually happen</h2>
      <p>Your wingcat arranges the date. You both put $5 down. Show up and you get it back.</p>
      <ol className="how">
        <li><span className="dot">1</span><b>Match</b><span>Add a photo, answer six questions, and swipe.</span></li>
        <li><span className="dot">2</span><b>The cats haggle</b><span>Your two wingcats agree a time and a public place.</span></li>
        <li><span className="dot">3</span><b>Paws down</b><span>$5 each is held. Flake, and yours is kept.</span></li>
      </ol>
      <button className="primary big" onClick={onStart}>Meet Maya and Jake</button>
      <div className="hint">Two invented people. You play both of their phones, side by side.</div>
    </section>
  );
}

/** One person's phone. It shows a single screen at a time, like the real app would. */
function Phone({ me, partner, tone, state, act }: { me: Person; partner: Person; tone: Tone; state: AppState; act: Act }) {
  const [photoDone, setPhotoDone] = useState(false);
  const otherTone: Tone = tone === 'pink' ? 'lilac' : 'pink';
  const practice = state.paymentMode === 'practice';
  const others = state.people.filter((p) => p.id !== me.id);
  const said = (from: Person, to: Person) => state.interests.find((i) => i.fromPersonId === from.id && i.toPersonId === to.id)?.interested;

  const negotiation = state.negotiations.filter((n) => involves(n, me.id)).at(-1);
  const match = others.find((p) => said(me, p) === true && said(p, me) === true);
  const other = negotiation ? others.find((p) => involves(negotiation, p.id)) : match;
  const proposals = negotiation ? state.proposals.filter((p) => p.negotiationId === negotiation.id) : [];
  const plan = negotiation?.planId ? state.plans.find((p) => p.id === negotiation.planId) : undefined;
  const thinking = negotiation?.status === 'open' && negotiation.turnPersonId === me.id;

  const waitingOn = others.filter((p) => said(me, p) === true && said(p, me) !== true);
  // For the demo, the other phone's person is always second in the stack, so there is one pass before the match.
  const shown = others.filter((p) => p.preferences && intentsFit(me.preferences?.intent, p.preferences.intent));
  const strangers = shown.filter((p) => p.id !== partner.id);
  const stack = shown.includes(partner) ? [...strangers.slice(0, 1), partner, ...strangers.slice(1)] : strangers;
  const deck = stack.filter((p) => said(me, p) === undefined);

  const myResult = plan?.settlement?.results.find((r) => r.personId === me.id);
  const screen = !me.preferences ? (photoDone ? 'quiz' : 'photo') : !negotiation ? (match ? 'match' : 'deck') : !plan ? 'haggle' : 'date';
  const pill = { photo: 'Profile 1 of 2', quiz: 'Profile 2 of 2', deck: 'Swiping', match: 'Matched', haggle: negotiation?.status === 'failed' ? 'No deal' : 'Negotiating', date: plan ? PLAN_LABEL[plan.status] : '' }[screen];
  const mood: Mood =
    myResult?.depositStatus === 'captured' || negotiation?.status === 'failed' || plan?.status === 'cancelled' ? 'sad'
    : thinking ? 'thinking'
    : match || plan ? 'happy'
    : 'idle';

  const says =
    screen === 'photo' ? `Hi ${me.name}! I'm ${me.wingcatName}, your wingcat. First, a photo, so people know who they would be meeting.`
    : screen === 'quiz' ? 'Now tell me what you want from a first date. I will do the arranging.'
    : screen === 'deck' ? 'Here is who is around. Heart anyone you would like to meet. I only step in if they heart you back.'
    : screen === 'match' ? `${other?.name} said yes too! Want me to sort out the date with ${other?.wingcatName}?`
    : screen === 'haggle' ? (negotiation?.status === 'failed' ? `Sorry, ${other?.wingcatName} and I could not find a plan that suits you both.` : `I'm working it out with ${other?.wingcatName}. I can plan, but I can never touch your money.`)
    : !plan ? ''
    : plan.status === 'awaiting_approval' ? 'We found a plan. Do you like it?'
    : plan.status === 'awaiting_deposits' ? `Put $${plan.depositAmount} down to lock it in. It's a hold, not a charge.`
    : plan.status === 'locked' ? `You're locked in. Swap codes with ${other?.name} when you meet.`
    : plan.status === 'cancelled' ? 'The date is off. No money was taken.'
    : myResult?.depositStatus === 'captured' ? `You didn't make it, so your $${myResult.amount} was kept.`
    : `You showed up, so your $${myResult?.amount ?? plan.depositAmount} is back with you.`;

  return (
    <section className={`phone ${tone}`} aria-label={`${me.name}'s phone`}>
      <div className="phonebar"><span>{me.name}'s phone</span><span className="pill">{pill}</span></div>
      <div className="catsay">
        <CatFace tone={tone} size={54} mood={mood} />
        <div className="speech"><b>{me.wingcatName}</b>{says}</div>
      </div>

      {screen === 'photo' && <PhotoStep me={me} act={act} onDone={() => setPhotoDone(true)} />}
      {screen === 'quiz' && <Questionnaire me={me} venues={state.venues} now={state.now} act={act} />}
      {screen === 'deck' && <SwipeDeck me={me} deck={deck} waitingOn={waitingOn} act={act} />}
      {screen === 'match' && other && <MatchScreen me={me} other={other} act={act} />}

      {screen === 'haggle' && other && me.preferences && (
        <>
          <div>
            <div className="label">{me.name}'s free time, with the offers on it</div>
            <Calendar slots={me.preferences.freeSlots} proposals={proposals} plan={plan} meId={me.id} />
          </div>
          <div className="feed">
            <div className="label">{me.wingcatName} and {other.wingcatName} talking</div>
            {proposals.map((p, i) => <Offer key={p.id} p={p} first={i === 0} mine={p.fromPersonId === me.id} me={me} other={other} tone={tone} otherTone={otherTone} />)}
            {thinking && (
              <div className="offer mine">
                <CatFace tone={tone} size={30} mood="thinking" />
                <div className="bubble dots" aria-label={`${me.wingcatName} is thinking`}><i /><i /><i /></div>
              </div>
            )}
            {!thinking && negotiation?.status === 'open' && <p className="hint">Waiting for {other.wingcatName}…</p>}
          </div>
        </>
      )}

      {screen === 'date' && plan && other && <DateScreen me={me} other={other} plan={plan} now={state.now} practice={practice} lastOffer={proposals.at(-1)} holdChecks={state.holdChecks} act={act} />}
    </section>
  );
}

function Offer({ p, first, mine, me, other, tone, otherTone }: { p: Proposal; first: boolean; mine: boolean; me: Person; other: Person; tone: Tone; otherTone: Tone }) {
  return (
    <div className={`offer ${mine ? 'mine' : 'theirs'}`}>
      <CatFace tone={mine ? tone : otherTone} size={30} />
      <div className="bubble">
        <div className="from">{mine ? me.wingcatName : other.wingcatName} {first ? 'opens with' : 'counters with'}</div>
        <div className="what">{fmtDay(p.startsAt)} {fmtTime(p.startsAt)} · {p.venue}</div>
        <div className="why">{p.reason}</div>
      </div>
    </div>
  );
}

/** Everything after the wingcats agree: say yes to the plan, put a paw down, check in, see the result. */
function DateScreen({ me, other, plan, now, practice, lastOffer, holdChecks, act }: { me: Person; other: Person; plan: Plan; now: string; practice: boolean; lastOffer?: Proposal; holdChecks?: AppState['holdChecks']; act: Act }) {
  const myHoldCheck = holdChecks?.[plan.deposits.find((d) => d.personId === me.id)?.id ?? ''];
  const [code, setCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const myDeposit = plan.deposits.find((d) => d.personId === me.id);
  const myApproval = plan.approvals.find((x) => x.personId === me.id);
  const myCheckIn = plan.checkIns.find((c) => c.personId === me.id);
  const myResult = plan.settlement?.results.find((r) => r.personId === me.id);
  const checkInOpen = plan.status === 'locked' && Date.parse(now) >= Date.parse(plan.checkInOpensAt);

  useEffect(() => {
    if (plan.status === 'locked' && !code)
      void call<{ code: string }>('GET', `/app/plans/${plan.id}/checkin-codes/${me.id}`).then((r) => setCode(r.code)).catch(() => {});
  }, [plan.status, plan.id, me.id, code]);

  return (
    <div className="plan">
      <div className="planhead">
        <div className="label"><Heart /> Your date with {other.name}</div>
        <div className="plantitle">{plan.venue}</div>
        <div className="when">{new Date(plan.startsAt).toLocaleDateString(undefined, { weekday: 'long' })}, {fmtTime(plan.startsAt)}</div>
        <div className="sub">{plan.activity} in {plan.area}, about ${plan.costPerPerson} each. A public place.</div>
        {lastOffer && plan.status === 'awaiting_approval' && <div className="why">Why this one: {lastOffer.reason}</div>}
      </div>

      {plan.status === 'awaiting_approval' && !myApproval && (
        <div className="row">
          <button className="primary" onClick={() => act(() => call('POST', `/app/plans/${plan.id}/approvals`, { personId: me.id, approved: true }))}>Sounds purrfect</button>
          <button onClick={() => act(() => call('POST', `/app/plans/${plan.id}/approvals`, { personId: me.id, approved: false }))}>Not for me</button>
        </div>
      )}
      {plan.status === 'awaiting_approval' && myApproval && <p className="hint">You said yes. Waiting for {other.name}.</p>}

      {plan.status === 'awaiting_deposits' && !myDeposit && (
        <button className="primary wide big" onClick={() => act(() => call('POST', `/app/plans/${plan.id}/deposits`, { personId: me.id }))}>
          <Paw size={18} /> Put my paw down: hold ${plan.depositAmount}
        </button>
      )}
      {myDeposit?.status === 'awaiting_approval' && (
        practice ? (
          <button className="primary wide" onClick={() => act(() => call('POST', `/app/plans/${plan.id}/deposits/${myDeposit.id}/confirm`))}>
            Approve the pretend hold
          </button>
        ) : (
          <div className="row">
            <a className="button primary" href={myDeposit.approveUrl}>Approve with PayPal</a>
            <button onClick={() => act(() => call('POST', `/app/plans/${plan.id}/deposits/${myDeposit.id}/confirm`))}>I already approved</button>
          </div>
        )
      )}
      {myDeposit?.status === 'held' && (
        <div className="pawdown">
          <Paw size={18} />
          <div>
            <b>Paw down: ${myDeposit.amount} held{practice ? ' (pretend)' : ''}</b>
            <div className="sub">{plan.status === 'awaiting_deposits' ? `Waiting for ${other.name}'s paw.` : 'You get it back when you show up.'}</div>
          </div>
        </div>
      )}
      {myHoldCheck && myDeposit?.status === 'held' && (
        <div className={`holdcheck ${myHoldCheck.ok ? '' : 'bad'}`}>
          <b>{myHoldCheck.ok ? '✓' : '!'} {me.wingcatName} checked with PayPal</b>
          <div>{myHoldCheck.note}</div>
          <div className="sub">Read-only look through the PayPal Agent Toolkit (get_order)</div>
        </div>
      )}

      {plan.status === 'locked' && code && (
        <div className="code">
          <div className="sub">Your check-in code</div>
          <div className="digits">{code}</div>
          {!checkInOpen && <div className="sub">Check-in opens {fmtTime(plan.checkInOpensAt)}.</div>}
          {checkInOpen && !myCheckIn && (
            <>
              <input placeholder={`${other.name}'s code`} aria-label={`${other.name}'s code`} value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} />
              <button className="primary wide" onClick={() => act(() => call('POST', `/app/plans/${plan.id}/checkins`, { personId: me.id, ...(partnerCode.trim() ? { partnerCode } : {}) }))}>
                I'm here
              </button>
            </>
          )}
          {myCheckIn && <div className="ok">Checked in{myCheckIn.confirmedWithPartnerCode ? ` with ${other.name}'s code` : ''}.</div>}
        </div>
      )}

      {(plan.status === 'awaiting_deposits' || plan.status === 'locked') && Date.parse(now) < Date.parse(plan.cancelBy) && (
        <button className="link" onClick={() => act(() => call('POST', `/app/plans/${plan.id}/cancel`, { personId: me.id }))}>
          Cancel for free until {fmtDay(plan.cancelBy)} {fmtTime(plan.cancelBy)}
        </button>
      )}

      {myResult && (
        <div className={`outcome ${myResult.depositStatus}`}>
          {myResult.depositStatus === 'released'
            ? <><Heart size={16} /> Your ${myResult.amount} is back with you.</>
            : `You didn't show, so your $${myResult.amount} was kept.`}
        </div>
      )}
      {myResult && <div className="sub center">{me.name} has now showed up to {me.showUpRecord.showedUp} of {me.showUpRecord.dates} dates. That shows on your profile.</div>}
      {plan.status === 'cancelled' && !myResult && <div className="outcome released">The date is off. No money was taken.</div>}
    </div>
  );
}

const PLAN_LABEL: Record<Plan['status'], string> = {
  awaiting_approval: 'Plan agreed',
  awaiting_deposits: 'Paws needed',
  locked: 'Date locked',
  settled: 'Settled',
  cancelled: 'Called off',
};

function Calendar({ slots, proposals, plan, meId }: { slots: { start: string; end: string }[]; proposals: Proposal[]; plan?: Plan; meId: string }) {
  const days = [...new Set([...slots.map((s) => s.start), ...proposals.map((p) => p.startsAt)].sort().map(dayKey))].slice(0, 4);
  return (
    <div className="calendar" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
      {days.map((d) => {
        const free = slots.filter((s) => dayKey(s.start) === d);
        const offers = proposals.filter((p) => dayKey(p.startsAt) === d);
        const locked = plan && plan.status !== 'cancelled' && dayKey(plan.startsAt) === d;
        return (
          <div key={d} className="day">
            <div className="dayname">{fmtDay(new Date(d).toISOString())}</div>
            {free.map((s) => <div key={s.start} className="slot free">Free {fmtTime(s.start)}</div>)}
            {free.length === 0 && <div className="slot busy">Busy</div>}
            {offers.map((p) =>
              locked && plan!.startsAt === p.startsAt && plan!.venue === p.venue ? null : (
                <div key={p.id} className={`slot offer ${p.fromPersonId === meId ? 'mine' : ''}`}>{fmtTime(p.startsAt)} offer</div>
              ),
            )}
            {locked && (
              <div className={`slot ${plan!.status === 'locked' || plan!.status === 'settled' ? 'locked' : 'agreed'}`}>
                {plan!.status === 'locked' || plan!.status === 'settled' ? <Lock /> : <Heart />} {fmtTime(plan!.startsAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
