import { useState } from 'react';
import { call, type Intent, type Person, type Preferences, type Venue } from './api';

/** Venue tags too general to be a like or a dealbreaker ("no dinner" helps nobody). */
const VAGUE_TAGS = new Set(['dinner', 'views', 'walk']);

type Act = (fn: () => Promise<unknown>) => Promise<void>;

const INTENT_LABEL: Record<Intent, string> = { serious: 'Something serious', casual: 'Something casual', not_sure: 'Not sure yet' };

/** Times offered in the questionnaire: the next three days, so a hold stays inside PayPal's 72-hour window. */
function slotOptions(now: string) {
  const at = (offset: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const day = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long' });
  return [
    { label: `${day(at(1, 18))} evening`, start: at(1, 18), end: at(1, 22) },
    { label: `${day(at(2, 17))} evening`, start: at(2, 17), end: at(2, 21) },
    { label: `${day(at(3, 11))} lunchtime`, start: at(3, 11), end: at(3, 14) },
  ];
}

/** Starting answers for the two invented demo people. Everything is editable before saving. */
const DEMO_ANSWERS: Record<string, { slots: number[]; areas: string[]; budget: number; no: string[]; intent: Intent; fun: string[] }> = {
  Alex: { slots: [0, 1], areas: ['Downtown', 'Riverside'], budget: 30, no: ['cocktails'], intent: 'not_sure', fun: ['ramen', 'board games'] },
  Sam: { slots: [1, 2], areas: ['Downtown'], budget: 25, no: ['ramen'], intent: 'serious', fun: ['vegetarian', 'live music'] },
};

export function Questionnaire({ me, venues, now, act }: { me: Person; venues: Venue[]; now: string; act: Act }) {
  const [options] = useState(() => slotOptions(now));
  const start = DEMO_ANSWERS[me.name] ?? { slots: [], areas: [], budget: 25, no: [], intent: 'not_sure' as Intent, fun: [] };
  const [slots, setSlots] = useState<number[]>(start.slots);
  const [areas, setAreas] = useState<string[]>(start.areas);
  const [budget, setBudget] = useState(String(start.budget));
  const [no, setNo] = useState<string[]>(start.no);
  const [intent, setIntent] = useState<Intent>(start.intent);
  const [fun, setFun] = useState<string[]>(start.fun);

  const allAreas = [...new Set(venues.map((v) => v.area))];
  const allTags = [...new Set(venues.flatMap((v) => v.tags))].filter((x) => !VAGUE_TAGS.has(x));
  const toggle = <T,>(list: T[], set: (v: T[]) => void, item: T, max = 99) =>
    set(list.includes(item) ? list.filter((x) => x !== item) : list.length < max ? [...list, item] : list);
  const ready = slots.length > 0 && areas.length > 0 && Number(budget) >= 0 && budget.trim() !== '';

  const save = () =>
    act(() =>
      call('PUT', `/app/people/${me.id}/preferences`, {
        freeSlots: [...slots].sort().map((i) => ({ start: options[i]!.start.toISOString(), end: options[i]!.end.toISOString() })),
        areas,
        maxBudget: Number(budget),
        dealbreakers: no,
        likes: fun,
        intent,
      } satisfies Preferences),
    );

  return (
    <div className="quiz">
      <Q n={1} text="When are you free?">
        {options.map((o, i) => <Chip key={o.label} on={slots.includes(i)} onClick={() => toggle(slots, setSlots, i)}>{o.label}</Chip>)}
      </Q>
      <Q n={2} text="Which parts of town can you get to?">
        {allAreas.map((x) => <Chip key={x} on={areas.includes(x)} onClick={() => toggle(areas, setAreas, x)}>{x}</Chip>)}
      </Q>
      <Q n={3} text="What's the most you'd spend on a first date?">
        <label className="money">$<input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))} aria-label="Budget in dollars" /></label>
      </Q>
      <Q n={4} text="Anything the date must not include?">
        {allTags.map((x) => <Chip key={x} kind="no" on={no.includes(x)} onClick={() => { toggle(no, setNo, x); setFun(fun.filter((f) => f !== x)); }}>{x}</Chip>)}
      </Q>
      <Q n={5} text="What are you looking for?">
        {(Object.keys(INTENT_LABEL) as Intent[]).map((x) => <Chip key={x} on={intent === x} onClick={() => setIntent(x)}>{INTENT_LABEL[x]}</Chip>)}
      </Q>
      <Q n={6} text="What sounds fun? Pick up to three.">
        {allTags.filter((x) => !no.includes(x)).map((x) => <Chip key={x} on={fun.includes(x)} onClick={() => toggle(fun, setFun, x, 3)}>{x}</Chip>)}
      </Q>

      <p className="rule">First dates are always in public places. That one isn't a choice.</p>
      <button className="primary wide" disabled={!ready} onClick={save}>Brief {me.wingcatName}</button>
      {!ready && <p className="hint">Pick at least one time and one area.</p>}
    </div>
  );
}

function Q({ n, text, children }: { n: number; text: string; children: React.ReactNode }) {
  return (
    <fieldset className="q">
      <legend><span className="num">{n}</span>{text}</legend>
      <div className="chips pick">{children}</div>
    </fieldset>
  );
}
function Chip({ on, kind, onClick, children }: { on: boolean; kind?: 'no'; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={`chip ${on ? 'on' : ''} ${kind ?? ''}`} aria-pressed={on} onClick={onClick}>{children}</button>;
}
