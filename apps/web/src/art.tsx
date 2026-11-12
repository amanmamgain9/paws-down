/** Every drawing in the app. All original SVG, so there is nothing third-party to license. */

export type Tone = 'pink' | 'lilac';
export type Mood = 'idle' | 'thinking' | 'happy' | 'sad';

const CAT = {
  pink: { ear: '#ED93B1', inner: '#FBD9E4', face: '#FFF1F5', mark: '#F4A9C2', ink: '#4B1528', nose: '#D4537E', blush: '#F7A8C0' },
  lilac: { ear: '#AFA9EC', inner: '#E4E1FB', face: '#F1EFFE', mark: '#B9B3F0', ink: '#26215C', nose: '#7F77DD', blush: '#C9B8F5' },
};

/** Mochi (pink) has a heart patch, Biscuit (lilac) has tabby stripes. The mood changes the eyes and mouth. */
export function CatFace({ tone, size, mood = 'idle' }: { tone: Tone; size: number; mood?: Mood }) {
  const c = CAT[tone];
  const look = mood === 'thinking' ? { dx: 1.6, dy: -1.8 } : { dx: 0, dy: 0 };
  return (
    <svg className={`cat ${tone} ${mood}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g stroke={c.ear} strokeWidth="3" strokeLinejoin="round" fill={c.ear}>
        <path d="M11 27 L13 7 L27 17 Z" />
        <path d="M53 27 L51 7 L37 17 Z" />
      </g>
      <path d="M15 21 L16 12 L22.500 17 Z M49 21 L48 12 L41.500 17 Z" fill={c.inner} />
      <ellipse cx="32" cy="37" rx="24" ry="20.500" fill={c.face} stroke={c.ear} strokeWidth="1.500" />
      {tone === 'pink' ? (
        <path d="M32 26.500 c-2.600 -2.400 -5.200 -3.900 -5.200 -6.400 a2.700 2.700 0 0 1 5.200 -1.100 a2.700 2.700 0 0 1 5.200 1.100 c0 2.500 -2.600 4 -5.200 6.400z" fill={c.mark} />
      ) : (
        <path d="M32 17.500 v7 M26.500 18.500 l1.500 5.500 M37.500 18.500 l-1.500 5.500" stroke={c.mark} strokeWidth="2.400" strokeLinecap="round" fill="none" />
      )}
      <ellipse cx="16.500" cy="43" rx="4.200" ry="2.600" fill={c.blush} opacity="0.65" />
      <ellipse cx="47.500" cy="43" rx="4.200" ry="2.600" fill={c.blush} opacity="0.65" />

      {mood === 'happy' && (
        <path d="M19 36.500 q4 -5.500 8 0 M37 36.500 q4 -5.500 8 0" stroke={c.ink} strokeWidth="2.200" strokeLinecap="round" fill="none" />
      )}
      {mood === 'sad' && (
        <path d="M19 34.500 q4 4 8 0.500 M37 35 q4 3.500 8 -0.500" stroke={c.ink} strokeWidth="2.200" strokeLinecap="round" fill="none" />
      )}
      {(mood === 'idle' || mood === 'thinking') && (
        <g className="eyes">
          <ellipse cx={23 + look.dx} cy={35 + look.dy} rx="3" ry="3.700" fill={c.ink} />
          <ellipse cx={41 + look.dx} cy={35 + look.dy} rx="3" ry="3.700" fill={c.ink} />
          <circle cx={24 + look.dx} cy={33.600 + look.dy} r="1" fill="#fff" />
          <circle cx={42 + look.dx} cy={33.600 + look.dy} r="1" fill="#fff" />
        </g>
      )}

      <path d="M30 41.500 h4 l-2 2.400 z" fill={c.nose} stroke={c.nose} strokeWidth="1" strokeLinejoin="round" />
      {mood === 'sad' ? (
        <path d="M27.500 49 q4.500 -3.500 9 0" stroke={c.ink} strokeWidth="1.600" strokeLinecap="round" fill="none" />
      ) : (
        <>
          {mood === 'happy' && <path d="M29 46.500 q3 5 6 0 z" fill={c.nose} />}
          <path d="M32 44 q-2.800 4 -6 1.500 M32 44 q2.800 4 6 1.500" stroke={c.ink} strokeWidth="1.600" strokeLinecap="round" fill="none" />
        </>
      )}
      <path d="M4 38 l8 1.500 M4 44 l8 -1 M60 38 l-8 1.500 M60 44 l-8 -1" stroke={c.ink} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Paw({ size = 26 }: { size?: number }) {
  return (
    <svg className="paw" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <circle cx="5.500" cy="10.500" r="2.200" />
      <circle cx="9.500" cy="6.500" r="2.200" />
      <circle cx="14.500" cy="6.500" r="2.200" />
      <circle cx="18.500" cy="10.500" r="2.200" />
    </svg>
  );
}

const HEART = 'M12 21s-7.500-4.600-10-9.300C.400 8.300 2.300 4 6.300 4c2.200 0 3.900 1.200 5.700 3.300C13.800 5.200 15.500 4 17.700 4c4 0 5.900 4.300 4.300 7.700C19.500 16.400 12 21 12 21z';

export function Heart({ size = 14 }: { size?: number }) {
  return (
    <svg className="heart" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d={HEART} />
    </svg>
  );
}

/** The logo: a heart with a paw print pressed into it. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={HEART} fill="currentColor" />
      <g fill="#fff" transform="translate(6.500 5) scale(0.460)">
        <ellipse cx="12" cy="16" rx="5" ry="4" />
        <circle cx="5.500" cy="10.500" r="2.200" />
        <circle cx="9.500" cy="6.500" r="2.200" />
        <circle cx="14.500" cy="6.500" r="2.200" />
        <circle cx="18.500" cy="10.500" r="2.200" />
      </g>
    </svg>
  );
}

export function Lock({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 10V7a5 5 0 0 1 10 0v3h1.500A1.500 1.500 0 0 1 20 11.500v8A1.500 1.500 0 0 1 18.500 21h-13A1.500 1.500 0 0 1 4 19.500v-8A1.500 1.500 0 0 1 5.500 10H7zm2 0h6V7a3 3 0 0 0-6 0v3z" />
    </svg>
  );
}

const hash = (s: string) => [...s].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
const PALETTES = [
  { bg: '#F9C9D8', ink: '#72243E' },
  { bg: '#D9D5FA', ink: '#3C3489' },
  { bg: '#FFD9B8', ink: '#8A4B14' },
  { bg: '#BFE8D6', ink: '#0F5C45' },
  { bg: '#BFDDF7', ink: '#1B4F80' },
];
const SKIN = ['#FFE9DF', '#F3CDB4', '#C99272'];
/** Colours for a person's drawing. Alex and Sam match their phones; everyone else gets one by name. */
export function paletteFor(name: string) {
  return name === 'Alex' ? PALETTES[0]! : name === 'Sam' ? PALETTES[1]! : PALETTES[2 + (hash(name) % 3)]!;
}

const HAIR: Record<string, 'short' | 'long' | 'curly'> = { Alex: 'long', Sam: 'short', Jordan: 'long', Riley: 'curly', Casey: 'short' };

/** A drawn stand-in for a profile photo, varied by name so people look different. */
export function Avatar({ name }: { name: string }) {
  const c = paletteFor(name);
  const skin = SKIN[hash(name + 's') % SKIN.length];
  const hair = HAIR[name] ?? (['short', 'long', 'curly'] as const)[hash(name) % 3];
  const longHair = hair === 'long';
  return (
    <svg className="avatar" viewBox="0 0 72 72" role="img" aria-label={`Drawn picture of ${name}`}>
      <rect width="72" height="72" fill={c.bg} />
      {longHair && <path d="M19 34 c0 -15 8 -21 17 -21 s17 6 17 21 v16 h-34 z" fill={c.ink} />}
      <path d="M13 72 c1 -14 10 -20 23 -20 s22 6 23 20 z" fill={c.ink} opacity="0.9" />
      <rect x="31" y="44" width="10" height="10" rx="4" fill={skin} />
      <circle cx="36" cy="34" r="13" fill={skin} />
      {hair === 'curly' ? (
        <g fill={c.ink}>
          <circle cx="25" cy="27" r="6" /><circle cx="31" cy="21" r="6.5" /><circle cx="40" cy="20.5" r="6.5" /><circle cx="47" cy="26" r="6" /><circle cx="22.5" cy="33" r="4" /><circle cx="49.5" cy="33" r="4" />
        </g>
      ) : longHair ? (
        <path d="M23 33 c1 -9 6 -13 13 -13 s12 4 13 13 c-6 -1 -10 -4 -13 -8 c-3 4 -7 7 -13 8z" fill={c.ink} />
      ) : (
        <path d="M22.5 32 c-1 -11 6 -16 14 -16 s14 5 13 16 c-3 -5 -6 -7 -13 -7 s-11 2 -14 7z" fill={c.ink} />
      )}
      <circle cx="31" cy="35" r="1.5" fill="#3a2530" />
      <circle cx="41" cy="35" r="1.5" fill="#3a2530" />
      <path d="M32 40 q4 3.5 8 0" stroke="#3a2530" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** A person's picture: their uploaded photo if there is one, otherwise the drawing. */
export function Portrait({ person, className = '' }: { person: { name: string; photo?: string }; className?: string }) {
  return (
    <div className={`portrait ${className}`} style={{ background: paletteFor(person.name).bg }}>
      {person.photo ? <img src={person.photo} alt={`${person.name}'s photo`} draggable={false} /> : <Avatar name={person.name} />}
    </div>
  );
}
