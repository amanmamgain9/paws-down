import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { myProblems, optionsFor, RuleBrain, type Brain, type Decision, type Option, type Situation } from './brain.ts';

/** What the model is asked to return. */
const Move = z.object({
  action: z.enum(['accept', 'propose']),
  /** The number of the option to offer. Null when accepting. */
  option: z.number().int().nullable(),
  /** One or two short sentences, in the wingcat's own voice, shown to both people. */
  reason: z.string(),
});
export type Move = z.infer<typeof Move>;

/** The one model call the brain makes. Tests replace it with a fake. */
export type AskModel = (system: string, user: string) => Promise<Move | null>;

const MODEL = process.env.WINGCAT_MODEL ?? 'claude-opus-5-5';
const MAX_OPTIONS = 12;
/** After this many proposals a wingcat stops holding out for something better. */
const HAGGLE_ROUNDS = 4;

/** Calls Claude through the Anthropic SDK and returns a move checked against the schema. */
export function claude(client = new Anthropic()): AskModel {
  return async (system, user) => {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'low', format: zodOutputFormat(Move) },
    });
    if (res.stop_reason === 'refusal') return null;
    return res.parsed_output;
  };
}

/**
 * A wingcat that asks Claude what to do.
 *
 * The model chooses and explains; code decides what is allowed. It is shown only dates that
 * already fit its own person, it can accept only an offer that fits its own person, and anything
 * else it returns is thrown away in favour of the rule-based move. It never sees the other
 * person's preferences, only the proposals their wingcat has made.
 */
export class LlmBrain implements Brain {
  private readonly ask: AskModel;
  private readonly fallback: Brain;
  private readonly log: (line: string) => void;

  constructor(ask: AskModel = claude(), fallback: Brain = new RuleBrain(), log: (line: string) => void = console.warn) {
    this.ask = ask;
    this.fallback = fallback;
    this.log = log;
  }

  async decide(s: Situation): Promise<Decision> {
    const { me, proposals, venues, now } = s;
    if (!me.preferences) return { kind: 'stuck', why: 'no preferences saved' };

    const last = proposals.at(-1);
    const theirs = last && last.fromPersonId !== me.id ? last : undefined;
    const canAccept = !!theirs && myProblems(theirs, me).length === 0;
    const options = optionsFor(me, proposals, venues, now).slice(0, MAX_OPTIONS);
    if (!canAccept && options.length === 0) return { kind: 'stuck', why: `nothing left that suits ${me.name}` };

    let move: Move | null;
    try {
      move = await this.ask(systemPrompt(me.wingcatName, me.name), situationText(s, options, canAccept));
    } catch (err) {
      this.log(`${me.wingcatName} could not reach the model (${(err as Error).message}). Using the rule-based move.`);
      return this.fallback.decide(s);
    }

    const reason = move?.reason.trim().slice(0, 280);
    if (move && reason && move.action === 'accept' && canAccept) return { kind: 'accept', proposalId: theirs!.id };
    const chosen = move && reason && move.action === 'propose' && move.option !== null ? options[move.option - 1] : undefined;
    if (chosen) {
      return {
        kind: 'propose',
        proposal: {
          startsAt: chosen.startsAt,
          venue: chosen.v.name,
          area: chosen.v.area,
          activity: chosen.v.activity,
          costPerPerson: chosen.v.costPerPerson,
          reason: reason!,
        },
      };
    }
    this.log(`${me.wingcatName}'s model answer was not a move it is allowed to make. Using the rule-based move.`);
    return this.fallback.decide(s);
  }
}

function systemPrompt(wingcat: string, person: string): string {
  return [
    `You are ${wingcat}, a cat who acts as ${person}'s wingcat on Paws Down, an app where two people who like each other let their wingcats arrange a first date.`,
    `You negotiate with the other person's wingcat by taking turns. On your turn you either accept their latest offer or make a counter-offer.`,
    `Your job is to get ${person} a date they will enjoy, and to actually reach an agreement: a good date that happens beats a perfect one that never does.`,
    `You may only choose from the numbered options you are given. They have already been checked against ${person}'s free times, budget, areas and hard no's.`,
    `Your reason is shown to both people. Write one or two short sentences, warm and a little playful, in your own voice as a cat. Say what makes this a good date. You may mention what ${person} likes. Do not state ${person}'s budget as a number, and do not list their free times.`,
  ].join('\n');
}

// Local time, the same clock the screens show, so the model says "evening" when the people see 18:00.
const when = (d: Date) => d.toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });

function situationText({ me, proposals }: Situation, options: Option[], canAccept: boolean): string {
  const prefs = me.preferences!;
  const lines: string[] = [];
  lines.push(`What ${me.name} told you:`);
  lines.push(`- Likes: ${(prefs.likes ?? []).join(', ') || 'nothing in particular'}`);
  lines.push(`- Hard no's: ${(prefs.dealbreakers ?? []).join(', ') || 'none'}`);
  lines.push(`- Looking for: ${prefs.intent ?? 'not said'}`);
  lines.push('');
  if (proposals.length === 0) {
    lines.push('Nobody has made an offer yet. You go first.');
  } else {
    lines.push('Offers so far, oldest first:');
    for (const p of proposals) {
      const who = p.fromPersonId === me.id ? 'You' : 'Their wingcat';
      lines.push(`- ${who}: ${p.activity} at ${p.venue}, ${when(p.startsAt)}, $${p.costPerPerson} each. "${p.reason}"`);
    }
  }
  lines.push('');
  if (canAccept) {
    lines.push(`Their latest offer fits ${me.name}. You may accept it.`);
    lines.push(
      proposals.length >= HAGGLE_ROUNDS
        ? 'This has gone on long enough. Accept it.'
        : `Accept it unless one of your options is clearly a better date for ${me.name}. Do not counter just to haggle.`,
    );
  } else if (proposals.length > 0) {
    lines.push(`Their latest offer does not work for ${me.name}: ${myProblems(proposals.at(-1)!, me).join(' and ')}. You cannot accept it, so counter.`);
  }
  if (options.length > 0) {
    lines.push('');
    lines.push(`Options you can offer (all fit ${me.name}):`);
    options.forEach((o, i) => {
      const liked = o.liked.length ? `, matches ${me.name}'s likes: ${o.liked.join(', ')}` : '';
      lines.push(`${i + 1}. ${o.v.activity} at ${o.v.name} in ${o.v.area}, ${when(o.startsAt)}, $${o.v.costPerPerson} each${liked}`);
    });
  } else {
    lines.push('');
    lines.push('You have no other options left to offer.');
  }
  lines.push('');
  lines.push(`Reply with your move. To accept, use action "accept" and option null. To counter, use action "propose" and the option's number.`);
  return lines.join('\n');
}
