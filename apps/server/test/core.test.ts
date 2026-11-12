import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError, PawsDown, type NewProposal, type Preferences } from '../src/core.ts';
import { GatewayError, type HoldGateway } from '../src/gateway.ts';
import { Store } from '../src/store.ts';

/** Test double only. The running app never uses this; it uses PayPal or fails. */
class FakeGateway implements HoldGateway {
  calls: string[] = [];
  failNext = false;
  private n = 0;
  private maybeFail() {
    if (this.failNext) {
      this.failNext = false;
      throw new GatewayError('PayPal is down');
    }
  }
  async createHold(i: { reference: string }) {
    this.maybeFail();
    this.calls.push(`create:${i.reference}`);
    return { orderId: `ord_${++this.n}`, approveUrl: 'https://example.test/approve' };
  }
  async placeHold(orderId: string) {
    this.maybeFail();
    this.calls.push(`hold:${orderId}`);
    return { authorizationId: `auth_${orderId}` };
  }
  async release(authorizationId: string) {
    this.maybeFail();
    this.calls.push(`release:${authorizationId}`);
  }
  async capture(authorizationId: string) {
    this.maybeFail();
    this.calls.push(`capture:${authorizationId}`);
    return { captureId: `cap_${authorizationId}` };
  }
}

const HOUR = 60 * 60 * 1000;
const at = (ms: number) => new Date(ms).toISOString();

let app: PawsDown;
let gw: FakeGateway;
let alex: string;
let sam: string;
let dateTime: string;

function prefs(over: Partial<Preferences> = {}): Preferences {
  const t = Date.parse(dateTime);
  return {
    freeSlots: [{ start: at(t - HOUR), end: at(t + 3 * HOUR) }],
    maxBudget: 30,
    areas: ['Downtown'],
    dealbreakers: [],
    ...over,
  };
}
function proposal(from: string, over: Partial<NewProposal> = {}): NewProposal {
  return {
    fromPersonId: from,
    startsAt: dateTime,
    venue: 'Green Bowl',
    area: 'Downtown',
    activity: 'Vegetarian dinner',
    costPerPerson: 22,
    reason: 'Fits you both.',
    ...over,
  };
}
async function lockedPlan() {
  const n = app.startNegotiation({ personAId: alex, personBId: sam });
  const p = app.makeProposal(n.id, proposal(alex));
  const plan = app.acceptProposal(n.id, p.id, sam);
  app.approvePlan(plan.id, { personId: alex, approved: true });
  app.approvePlan(plan.id, { personId: sam, approved: true });
  for (const person of [alex, sam]) {
    const d = await app.createDeposit(plan.id, person);
    await app.confirmDeposit(plan.id, d.id);
  }
  return app.getPlan(plan.id);
}
const code = (e: unknown) => (e as ApiError).code;

beforeEach(() => {
  gw = new FakeGateway();
  app = new PawsDown(new Store(), gw);
  dateTime = at(Date.now() + 24 * HOUR);
  alex = app.createPerson({ name: 'Alex', wingcatName: 'Mochi' }).id;
  sam = app.createPerson({ name: 'Sam', wingcatName: 'Biscuit' }).id;
  app.setPreferences(alex, prefs());
  app.setPreferences(sam, prefs({ dealbreakers: ['ramen'] }));
  app.setInterest({ fromPersonId: alex, toPersonId: sam, interested: true });
  app.setInterest({ fromPersonId: sam, toPersonId: alex, interested: true });
});

describe('before negotiating', () => {
  it('needs both people to say yes', () => {
    app.setInterest({ fromPersonId: sam, toPersonId: alex, interested: false });
    try {
      app.startNegotiation({ personAId: alex, personBId: sam });
      expect.unreachable();
    } catch (e) {
      expect(code(e)).toBe('not_mutual');
    }
  });

  it('does not announce who passed', () => {
    app.setInterest({ fromPersonId: sam, toPersonId: alex, interested: false });
    expect(app.recentEvents().at(-1)?.message).not.toMatch(/Sam|Alex/);
  });

  it('will not pair serious with casual, but not_sure fits either', () => {
    app.setPreferences(alex, prefs({ intent: 'serious' }));
    app.setPreferences(sam, prefs({ intent: 'casual' }));
    expect(() => app.startNegotiation({ personAId: alex, personBId: sam })).toThrowError(/different things/);
    app.setPreferences(sam, prefs({ intent: 'not_sure' }));
    expect(app.startNegotiation({ personAId: alex, personBId: sam }).status).toBe('open');
  });
});

describe('negotiation', () => {
  it('enforces turns', () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    expect(() => app.makeProposal(n.id, proposal(sam))).toThrowError(/turn/);
    app.makeProposal(n.id, proposal(alex));
    expect(() => app.makeProposal(n.id, proposal(alex))).toThrowError(/turn/);
  });

  it("stops a wingcat proposing outside its own person's limits", () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    try {
      app.makeProposal(n.id, proposal(alex, { costPerPerson: 80 }));
      expect.unreachable();
    } catch (e) {
      expect(code(e)).toBe('outside_own_limits');
    }
  });

  it("refuses an acceptance that breaks the other person's limits", () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    const p = app.makeProposal(n.id, proposal(alex, { venue: 'Koji Ramen Bar', activity: 'Ramen dinner' }));
    try {
      app.acceptProposal(n.id, p.id, sam);
      expect.unreachable();
    } catch (e) {
      expect(code(e)).toBe('outside_limits');
    }
    expect(app.getNegotiation(n.id).status).toBe('open');
  });

  it('fails after the last round', () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    for (let i = 0; i < n.maxRounds; i++) app.makeProposal(n.id, proposal(i % 2 ? sam : alex));
    expect(() => app.makeProposal(n.id, proposal(alex))).toThrowError(/rounds/);
    expect(app.getNegotiation(n.id).status).toBe('failed');
  });

  it('only allows public venues from the list', () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    try {
      app.makeProposal(n.id, proposal(alex, { venue: "Alex's flat" }));
      expect.unreachable();
    } catch (e) {
      expect(code(e)).toBe('unknown_venue');
    }
  });

  it('does not let the proposer accept their own proposal', () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    const p = app.makeProposal(n.id, proposal(alex));
    expect(() => app.acceptProposal(n.id, p.id, alex)).toThrowError(/other person/);
  });
});

describe('plan and deposits', () => {
  it('one rejection cancels the plan and holds no money', () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    const plan = app.acceptProposal(n.id, app.makeProposal(n.id, proposal(alex)).id, sam);
    app.approvePlan(plan.id, { personId: alex, approved: true });
    expect(app.approvePlan(plan.id, { personId: sam, approved: false }).status).toBe('cancelled');
    expect(gw.calls).toEqual([]);
  });

  it('locks only when both holds are placed, and never exposes PayPal ids or codes', async () => {
    const plan = await lockedPlan();
    expect(plan.status).toBe('locked');
    const json = JSON.stringify(plan);
    expect(json).not.toMatch(/ord_|auth_|orderId|authorizationId|MEOW|PURR|PAWS|MITT/);
  });

  it('reports a PayPal failure as a 502 and stays retryable', async () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    const plan = app.acceptProposal(n.id, app.makeProposal(n.id, proposal(alex)).id, sam);
    app.approvePlan(plan.id, { personId: alex, approved: true });
    app.approvePlan(plan.id, { personId: sam, approved: true });
    gw.failNext = true;
    await expect(app.createDeposit(plan.id, alex)).rejects.toMatchObject({ status: 502 });
    const d = await app.createDeposit(plan.id, alex);
    expect(d.status).toBe('awaiting_approval');
  });
});

describe('settlement', () => {
  it('releases both holds when both show up', async () => {
    const plan = await lockedPlan();
    await app.advanceClockTo(plan.checkInOpensAt);
    const samCode = app.getCheckInCode(plan.id, sam).code;
    expect(app.checkIn(plan.id, { personId: alex, partnerCode: samCode }).confirmedWithPartnerCode).toBe(true);
    app.checkIn(plan.id, { personId: sam });
    await app.advanceClockTo(at(Date.parse(plan.checkInClosesAt) + 1000));
    const s = app.getSettlement(plan.id);
    expect(s.outcome).toBe('both_showed');
    expect(s.results.map((r) => r.depositStatus)).toEqual(['released', 'released']);
    expect(gw.calls.filter((c) => c.startsWith('capture'))).toEqual([]);
  });

  it("captures only the no-show's hold", async () => {
    const plan = await lockedPlan();
    await app.advanceClockTo(plan.checkInOpensAt);
    app.checkIn(plan.id, { personId: alex });
    await app.advanceClockTo(at(Date.parse(plan.checkInClosesAt) + 1000));
    const s = app.getSettlement(plan.id);
    expect(s.outcome).toBe('one_no_show');
    expect(s.results.find((r) => r.personId === sam)?.depositStatus).toBe('captured');
    expect(s.results.find((r) => r.personId === alex)?.depositStatus).toBe('released');
  });

  it('settles exactly once', async () => {
    const plan = await lockedPlan();
    await app.advanceClockTo(at(Date.parse(plan.checkInClosesAt) + 1000));
    const before = gw.calls.length;
    await app.tick();
    await app.tick();
    expect(gw.calls.length).toBe(before);
    expect(app.getSettlement(plan.id).outcome).toBe('both_no_show');
  });

  it('retries settlement after a PayPal failure without double-acting', async () => {
    const plan = await lockedPlan();
    await app.advanceClockTo(plan.checkInOpensAt);
    app.checkIn(plan.id, { personId: alex });
    app.checkIn(plan.id, { personId: sam });
    gw.failNext = true;
    await app.advanceClockTo(at(Date.parse(plan.checkInClosesAt) + 1000));
    expect(app.getPlan(plan.id).status).toBe('locked');
    await app.tick();
    expect(app.getPlan(plan.id).status).toBe('settled');
    expect(gw.calls.filter((c) => c.startsWith('release')).length).toBe(2);
  });

  it('rejects a wrong partner code and check-in outside the window', async () => {
    const plan = await lockedPlan();
    expect(() => app.checkIn(plan.id, { personId: alex })).toThrowError(/not open/);
    await app.advanceClockTo(plan.checkInOpensAt);
    expect(() => app.checkIn(plan.id, { personId: alex, partnerCode: 'NOPE-0000' })).toThrowError(/code/);
  });

  it('releases both holds on a cancel before the cut-off', async () => {
    const plan = await lockedPlan();
    const cancelled = await app.cancelPlan(plan.id, sam);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.deposits.map((d) => d.status)).toEqual(['released', 'released']);
  });

  it('calls the date off if only one hold is placed by the cut-off', async () => {
    const n = app.startNegotiation({ personAId: alex, personBId: sam });
    const plan = app.acceptProposal(n.id, app.makeProposal(n.id, proposal(alex)).id, sam);
    app.approvePlan(plan.id, { personId: alex, approved: true });
    app.approvePlan(plan.id, { personId: sam, approved: true });
    const d = await app.createDeposit(plan.id, alex);
    await app.confirmDeposit(plan.id, d.id);
    await app.advanceClockTo(at(Date.parse(plan.cancelBy) + 1000));
    const after = app.getPlan(plan.id);
    expect(after.status).toBe('cancelled');
    expect(after.deposits.map((x) => x.status)).toEqual(['released']);
  });
});
