import type { NewProposal, Person, Proposal, Venue } from 'paws-down-api';

export interface Situation {
  me: Person;
  proposals: Proposal[];
  venues: Venue[];
  now: number;
}
export type Decision =
  | { kind: 'accept'; proposalId: string }
  | { kind: 'propose'; proposal: Omit<NewProposal, 'fromPersonId'> }
  | { kind: 'stuck'; why: string };

/** How a wingcat decides its next move. The LLM-driven brain implements the same interface. */
export interface Brain {
  decide(s: Situation): Promise<Decision>;
}

interface DateIdea {
  startsAt: Date;
  venue: string;
  area?: string;
  activity: string;
  costPerPerson: number;
}

/** Reasons a date does not suit my person. Only ever describes my own person's side. */
export function myProblems(p: DateIdea, me: Person): string[] {
  const prefs = me.preferences;
  if (!prefs) return ['I have no preferences yet'];
  const out: string[] = [];
  const t = p.startsAt.getTime();
  if (!prefs.freeSlots.some((s) => t >= s.start.getTime() && t <= s.end.getTime())) out.push(`${me.name} isn't free then`);
  if (p.costPerPerson > prefs.maxBudget) out.push(`it's over ${me.name}'s budget`);
  if (p.area && !prefs.areas.some((a) => a.toLowerCase() === p.area!.toLowerCase())) out.push(`${p.area} is too far for ${me.name}`);
  const text = `${p.venue} ${p.activity}`.toLowerCase();
  for (const d of prefs.dealbreakers ?? []) if (text.includes(d.toLowerCase())) out.push(`${me.name} said no ${d}`);
  return out;
}

/**
 * A wingcat that follows fixed rules, with no language model. It lets the app run with no AI key.
 * The screens label it as rule-based; the recorded demo uses the model-driven brain.
 */
export class RuleBrain implements Brain {
  async decide({ me, proposals, venues, now }: Situation): Promise<Decision> {
    const prefs = me.preferences;
    if (!prefs) return { kind: 'stuck', why: 'no preferences saved' };
    const last = proposals.at(-1);
    const theirs = last && last.fromPersonId !== me.id ? last : undefined;
    const problems = theirs ? myProblems(theirs, me) : [];
    if (theirs && problems.length === 0) return { kind: 'accept', proposalId: theirs.id };

    const key = (venue: string, at: Date) => `${venue}|${at.getTime()}`;
    const mine = new Set(proposals.filter((p) => p.fromPersonId === me.id).map((p) => key(p.venue, p.startsAt)));
    const times = prefs.freeSlots.map((s) => new Date(s.start.getTime() + 60 * 60 * 1000)).filter((t) => t.getTime() > now);
    // If their time already works for my person, keep it: change as little as possible.
    if (theirs && !problems.some((p) => p.includes("isn't free"))) times.unshift(theirs.startsAt);

    const likes = (prefs.likes ?? []).map((l) => l.toLowerCase());
    const likedBy = (v: Venue) => likes.filter((l) => v.tags.some((t) => t.toLowerCase().includes(l)) || v.activity.toLowerCase().includes(l));
    const options = venues
      .flatMap((v) => times.map((startsAt) => ({ v, startsAt })))
      .filter(({ v, startsAt }) => myProblems({ ...v, venue: v.name, startsAt }, me).length === 0 && !mine.has(key(v.name, startsAt)))
      .sort((a, b) => likedBy(b.v).length - likedBy(a.v).length || a.startsAt.getTime() - b.startsAt.getTime());
    const best = options[0];
    if (!best) return { kind: 'stuck', why: `nothing left that suits ${me.name}` };

    const liked = likedBy(best.v)[0];
    const pitch = `${best.v.activity} at ${best.v.name}${liked ? ` (${me.name} loves ${liked})` : ''}`;
    const reason = theirs ? `${capitalise(problems.join(' and '))}, so how about ${pitch}?` : `Opening offer: ${pitch}.`;
    return {
      kind: 'propose',
      proposal: {
        startsAt: best.startsAt,
        venue: best.v.name,
        area: best.v.area,
        activity: best.v.activity,
        costPerPerson: best.v.costPerPerson,
        reason,
      },
    };
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
