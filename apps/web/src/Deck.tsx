import { useRef, useState } from 'react';
import { call, type Intent, type Person } from './api';
import { Heart, Paw, Portrait } from './art';

type Act = (fn: () => Promise<unknown>) => Promise<void>;

const INTENT_LABEL: Record<Intent, string> = { serious: 'Wants something serious', casual: 'Wants something casual', not_sure: 'Not sure yet' };

/** Shrinks a chosen picture in the browser so only a small JPEG is ever sent. */
async function shrink(file: File): Promise<string> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 640 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

/** Step one of a profile: a photo. Skipping keeps the drawing. */
export function PhotoStep({ me, act, onDone }: { me: Person; act: Act; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');
  const choose = async (file?: File) => {
    if (!file) return;
    setProblem('');
    try {
      const photo = await shrink(file);
      await act(() => call('PUT', `/app/people/${me.id}/photo`, { photo }));
    } catch {
      setProblem('That file could not be read as a picture. Try a JPEG or PNG.');
    }
  };
  return (
    <div className="photostep">
      <button type="button" className="photopick" onClick={() => input.current?.click()} aria-label={me.photo ? 'Change your photo' : 'Add your photo'}>
        <Portrait person={me} />
        <span className="photobadge">{me.photo ? 'Change' : 'Add photo'}</span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void choose(e.target.files?.[0])} />
      <div className="bigname">{me.name}</div>
      {problem && <p className="hint">{problem}</p>}
      <p className="hint">{me.photo ? 'Looking good.' : 'No photo handy? A drawing is used instead.'}</p>
      <button className="primary wide" onClick={onDone}>{me.photo ? 'Next' : 'Skip for now'}</button>
    </div>
  );
}

/** The swipe stack. People decide who they would like to meet; wingcats never see this step. */
export function SwipeDeck({ me, deck, waitingOn, act }: { me: Person; deck: Person[]; waitingOn: Person[]; act: Act }) {
  const answer = (to: Person, interested: boolean) => act(() => call('POST', '/app/interests', { fromPersonId: me.id, toPersonId: to.id, interested }));
  const top = deck[0];
  return (
    <div className="deck">
      {waitingOn.length > 0 && (
        <div className="waiting"><Heart /> You hearted {waitingOn.map((p) => p.name).join(' and ')}. If they heart you back, it's a match.</div>
      )}
      {top ? (
        <>
          <div className="stack">
            {deck[1] && <div className="card under" aria-hidden="true"><Portrait person={deck[1]} className="photo" /></div>}
            <SwipeCard key={top.id} person={top} onAnswer={(yes) => answer(top, yes)} />
          </div>
          <div className="sub center">{deck.length > 1 ? `${deck.length - 1} more after ${top.name}` : `${top.name} is the last one for now`}</div>
        </>
      ) : (
        <div className="nobody">
          <Paw size={30} />
          <b>That's everyone for now</b>
          <span className="sub">{waitingOn.length ? 'Hang tight while they decide.' : 'New people show up here as they join.'}</span>
        </div>
      )}
    </div>
  );
}

function SwipeCard({ person, onAnswer }: { person: Person; onAnswer: (yes: boolean) => void }) {
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState<null | 'yes' | 'no'>(null);
  const from = useRef<number | null>(null);
  const prefs = person.preferences;
  const record = person.showUpRecord;

  const finish = (yes: boolean) => {
    if (gone) return;
    setGone(yes ? 'yes' : 'no');
    setTimeout(() => onAnswer(yes), 280);
  };
  const lean = gone === 'yes' ? 1 : gone === 'no' ? -1 : Math.max(-1, Math.min(1, dx / 90));
  const style = gone
    ? { transform: `translateX(${gone === 'yes' ? 130 : -130}%) rotate(${gone === 'yes' ? 18 : -18}deg)`, opacity: 0, transition: 'transform 0.28s ease-in, opacity 0.28s ease-in' }
    : { transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: from.current === null ? 'transform 0.2s ease' : 'none' };

  return (
    <>
      <div
        className="card"
        style={style}
        onPointerDown={(e) => { from.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (from.current !== null) setDx(e.clientX - from.current); }}
        onPointerUp={() => { from.current = null; if (Math.abs(dx) > 90) finish(dx > 0); else setDx(0); }}
        onPointerCancel={() => { from.current = null; setDx(0); }}
      >
        <Portrait person={person} className="photo" />
        <span className="verdict yes" style={{ opacity: Math.max(0, lean) }}>Yes</span>
        <span className="verdict no" style={{ opacity: Math.max(0, -lean) }}>Pass</span>
        <div className="cardtext">
          <div className="cardname">{person.name}</div>
          <div className="showup"><Paw size={13} /> {record.dates === 0 ? 'New here, no dates yet' : `Showed up to ${record.showedUp} of ${record.dates} dates`}</div>
          {prefs && (
            <div className="chips">
              {prefs.intent && <span>{INTENT_LABEL[prefs.intent]}</span>}
              {(prefs.likes ?? []).map((x) => <span key={x} className="like">loves {x}</span>)}
              <span>around {prefs.areas.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
      <div className="swipebuttons">
        <button type="button" className="round pass" onClick={() => finish(false)} aria-label={`Pass on ${person.name}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
        </button>
        <span className="sub">drag the card, or tap</span>
        <button type="button" className="round yes" onClick={() => finish(true)} aria-label={`Yes to ${person.name}`}><Heart size={26} /></button>
      </div>
    </>
  );
}

/** Both people said yes. Either of them can now send the wingcats in. */
export function MatchScreen({ me, other, act }: { me: Person; other: Person; act: Act }) {
  return (
    <div className="match">
      <div className="matchpair">
        <Portrait person={me} />
        <span className="beat"><Heart size={34} /></span>
        <Portrait person={other} />
      </div>
      <h2>It's a match!</h2>
      <p className="sub">You and {other.name} both said yes. Nobody had to send the first message.</p>
      <button className="primary wide big" onClick={() => act(() => call('POST', '/app/negotiations', { personAId: me.id, personBId: other.id }))}>
        <Paw size={18} /> Send {me.wingcatName} to arrange it
      </button>
    </div>
  );
}
