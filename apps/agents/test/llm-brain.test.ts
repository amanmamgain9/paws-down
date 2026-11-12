import type { Person, Proposal, Venue } from 'paws-down-api';
import { describe, expect, it } from 'vitest';
import type { Situation } from '../src/brain.ts';
import { LlmBrain, type AskModel, type Move } from '../src/llm-brain.ts';

/**
 * The model-driven wingcat, with a fake in place of the model. These tests are about the guard
 * rails: whatever the model answers, the wingcat only makes moves its own person would accept.
 */

const NOW = Date.UTC(2026, 10, 12, 9);
const at = (hour: number) => new Date(Date.UTC(2026, 10, 13, hour));

const venues = [
  { name: 'Green Bowl', area: 'Downtown', activity: 'Vegetarian dinner', costPerPerson: 22, tags: ['vegetarian', 'quiet'] },
  { name: 'Koji Ramen Bar', area: 'Downtown', activity: 'Ramen', costPerPerson: 18, tags: ['ramen', 'lively'] },
  { name: 'Gold Room', area: 'Uptown', activity: 'Cocktails', costPerPerson: 45, tags: ['cocktails'] },
] as unknown as Venue[];

const sam = {
  id: 'sam',
  name: 'Sam',
  wingcatName: 'Biscuit',
  showUpRecord: { showedUp: 0, dates: 0 },
  preferences: { freeSlots: [{ start: at(17), end: at(22) }], maxBudget: 30, areas: ['Downtown'], likes: ['vegetarian'], dealbreakers: ['cocktails'], intent: 'serious' },
} as unknown as Person;

const offer = (id: string, from: string, venue: string, hour: number, cost: number, area = 'Downtown'): Proposal =>
  ({ id, negotiationId: 'n1', fromPersonId: from, startsAt: at(hour), venue, area, activity: venue, costPerPerson: cost, reason: 'How about this?', round: 1 }) as unknown as Proposal;

const situation = (proposals: Proposal[]): Situation => ({ me: sam, proposals, venues, now: NOW });

/** A brain whose model always gives the same answer, and which records what it was asked. */
function brainSaying(answer: Move | null | Error) {
  const asked: { system: string; user: string }[] = [];
  const logs: string[] = [];
  const ask: AskModel = async (system, user) => {
    asked.push({ system, user });
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { brain: new LlmBrain(ask, undefined, (l) => logs.push(l)), asked, logs };
}

describe('the model-driven wingcat', () => {
  it('offers the option the model picked, with the model\'s own words as the reason', async () => {
    const { brain } = brainSaying({ action: 'propose', option: 1, reason: 'Sam purrs for a quiet veggie dinner.' });
    const d = await brain.decide(situation([]));
    expect(d).toMatchObject({ kind: 'propose', proposal: { venue: 'Green Bowl', costPerPerson: 22, reason: 'Sam purrs for a quiet veggie dinner.' } });
  });

  it('accepts an offer that fits its person when the model says accept', async () => {
    const { brain } = brainSaying({ action: 'accept', option: null, reason: 'Ramen it is.' });
    const d = await brain.decide(situation([offer('p1', 'alex', 'Koji Ramen Bar', 19, 18)]));
    expect(d).toEqual({ kind: 'accept', proposalId: 'p1' });
  });

  it('may counter an offer that fits, when the model thinks another option is better', async () => {
    const { brain } = brainSaying({ action: 'propose', option: 1, reason: 'Close, but Sam would love the veggie place more.' });
    const d = await brain.decide(situation([offer('p1', 'alex', 'Koji Ramen Bar', 19, 18)]));
    expect(d).toMatchObject({ kind: 'propose', proposal: { venue: 'Green Bowl' } });
  });

  it('never accepts an offer its person would refuse, even if the model says accept', async () => {
    const { brain, logs } = brainSaying({ action: 'accept', option: null, reason: 'Sure, cocktails!' });
    const d = await brain.decide(situation([offer('p1', 'alex', 'Gold Room', 19, 45, 'Uptown')]));
    expect(d.kind).toBe('propose');
    expect((d as any).proposal.venue).not.toBe('Gold Room');
    expect(logs.join(' ')).toMatch(/not a move it is allowed to make/);
  });

  it('never offers something that was not on its list', async () => {
    for (const option of [0, 99, -1]) {
      const { brain } = brainSaying({ action: 'propose', option, reason: 'Trust me.' });
      const d = await brain.decide(situation([]));
      expect(d).toMatchObject({ kind: 'propose', proposal: { venue: 'Green Bowl' } }); // the rule-based move
    }
  });

  it('only ever shows the model dates that fit its own person', async () => {
    const { brain, asked } = brainSaying({ action: 'propose', option: 1, reason: 'Dinner?' });
    await brain.decide(situation([]));
    expect(asked[0]!.user).toContain('Green Bowl');
    expect(asked[0]!.user).not.toContain('Gold Room'); // over budget, wrong area, and a hard no
  });

  it('does not put its person\'s budget or free times into what it sends', async () => {
    const { brain, asked } = brainSaying({ action: 'propose', option: 1, reason: 'Dinner?' });
    await brain.decide(situation([]));
    expect(asked[0]!.user).not.toMatch(/budget|\$30|maxBudget/i);
    expect(asked[0]!.user).not.toMatch(/free times|freeSlots/i);
  });

  it('falls back to the rule-based move when the model cannot be reached', async () => {
    const { brain, logs } = brainSaying(new Error('connection refused'));
    const d = await brain.decide(situation([]));
    expect(d).toMatchObject({ kind: 'propose', proposal: { venue: 'Green Bowl' } });
    expect(logs.join(' ')).toMatch(/could not reach the model/);
  });

  it('falls back when the model declines or gives an empty reason', async () => {
    for (const answer of [null, { action: 'propose', option: 1, reason: '   ' } as Move]) {
      const { brain } = brainSaying(answer);
      const d = await brain.decide(situation([]));
      expect(d).toMatchObject({ kind: 'propose', proposal: { venue: 'Green Bowl' } });
      expect((d as any).proposal.reason).toMatch(/Opening offer/);
    }
  });

  it('is told to stop haggling once the negotiation has run long', async () => {
    const { brain, asked } = brainSaying({ action: 'accept', option: null, reason: 'Deal.' });
    const history = [offer('p1', 'alex', 'Koji Ramen Bar', 18, 18), offer('p2', 'sam', 'Green Bowl', 18, 22), offer('p3', 'alex', 'Koji Ramen Bar', 20, 18), offer('p4', 'sam', 'Green Bowl', 20, 22), offer('p5', 'alex', 'Koji Ramen Bar', 19, 18)];
    await brain.decide(situation(history));
    expect(asked[0]!.user).toContain('This has gone on long enough. Accept it.');
  });

  it('says it is stuck, without asking the model, when nothing fits', async () => {
    const { brain, asked } = brainSaying({ action: 'propose', option: 1, reason: 'x' });
    const broke = { ...sam, preferences: { ...sam.preferences!, maxBudget: 1 } } as Person;
    const d = await brain.decide({ me: broke, proposals: [], venues, now: NOW });
    expect(d.kind).toBe('stuck');
    expect(asked).toHaveLength(0);
  });
});
