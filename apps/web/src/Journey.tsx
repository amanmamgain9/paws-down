import type { ReactNode } from 'react';
import type { Deposit, Person, Plan } from './api';
import { CatFace, Heart, Paw } from './art';

const STEPS = ['Make a profile', 'Swipe and match', 'Wingcats haggle', 'Paws down', 'The date', 'Settle up'];

/** The six steps of a date, the one thing to do next, and the demo controls for it. */
export function Journey({ stage, next, latest, children }: { stage: number; next: string; latest?: string; children?: ReactNode }) {
  return (
    <section className="journey" aria-label="Where this date is up to">
      <ol className="steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < stage ? 'done' : i === stage ? 'now' : 'todo'} aria-current={i === stage ? 'step' : undefined}>
            <span className="dot">{i < stage ? <Paw size={15} /> : i + 1}</span>
            <span className="lbl">{label}</span>
          </li>
        ))}
      </ol>
      <div className="next">
        <CatFace tone="pink" size={40} mood={stage >= STEPS.length ? 'happy' : 'idle'} />
        <div className="say">
          <div className="nexttext">{next}</div>
          {latest && <div className="latest">Latest: {latest}</div>}
        </div>
        {children && <div className="do">{children}</div>}
      </div>
    </section>
  );
}

/** A strip with one $5 paw stamp per person, showing where their money is. */
export function Ticket({ plan, a, b, practice }: { plan: Plan; a: Person; b: Person; practice: boolean }) {
  const outcome = plan.settlement?.outcome;
  const foot =
    outcome === 'both_showed' ? 'You both showed up. Both holds were released.'
    : outcome === 'one_no_show' ? 'One of you did not show. Their $5 was kept, the other hold was released.'
    : outcome === 'both_no_show' ? 'Neither of you showed. Both holds were released.'
    : plan.status === 'cancelled' ? 'The date was called off in time. No money was taken.'
    : `Show up and your $${plan.depositAmount} comes back. Don't show and it is kept.`;
  return (
    <section className={`ticket ${plan.status} ${outcome ?? ''}`} aria-label="The agreed date">
      <Stamp person={a} tone="pink" deposit={plan.deposits.find((d) => d.personId === a.id)} amount={plan.depositAmount} practice={practice} />
      <div className="mid">
        <div className="eyebrow"><Heart size={12} /> Where each $5 is</div>
        <div className="foot">{foot}</div>
      </div>
      <Stamp person={b} tone="lilac" deposit={plan.deposits.find((d) => d.personId === b.id)} amount={plan.depositAmount} practice={practice} />
    </section>
  );
}

function Stamp({ person, tone, deposit, amount, practice }: { person: Person; tone: 'pink' | 'lilac'; deposit?: Deposit; amount: number; practice: boolean }) {
  const status = deposit?.status ?? 'none';
  const caption =
    status === 'held' ? `$${amount} held${practice ? ' (pretend)' : ''}`
    : status === 'released' ? `$${amount} back`
    : status === 'captured' ? `$${amount} kept`
    : status === 'awaiting_approval' ? 'approving…'
    : status === 'failed' ? 'hold failed'
    : 'no paw yet';
  return (
    <div className={`stub ${tone}`}>
      <div className={`stamp ${status}`}>
        {status === 'held' ? <Paw size={30} /> : status === 'released' ? <Heart size={28} /> : <span>${amount}</span>}
      </div>
      <div className="stubname">{person.name}</div>
      <div className="stubcap">{caption}</div>
    </div>
  );
}

/** Hearts float up once when both people show up. */
export function HeartBurst() {
  return (
    <div className="burst" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} style={{ left: `${4 + i * 6}%`, animationDelay: `${(i % 6) * 0.160}s`, color: i % 2 ? 'var(--lilac)' : 'var(--pink)' }}>
          <Heart size={18 + (i % 4) * 8} />
        </span>
      ))}
    </div>
  );
}
