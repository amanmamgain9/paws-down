import { randomBytes, randomInt } from 'node:crypto';
import { GatewayError, type HoldGateway } from './gateway.ts';
import type { Store } from './store.ts';
import { VENUES, type Venue } from './venues.ts';

// ---------- Types (public shapes match apimatic/src/spec/openapi.yaml) ----------

export interface TimeSlot {
  start: string;
  end: string;
}
export interface Preferences {
  freeSlots: TimeSlot[];
  maxBudget: number;
  areas: string[];
  likes?: string[];
  dealbreakers?: string[];
  intent?: Intent;
}
export type Intent = 'serious' | 'casual' | 'not_sure';
const INTENTS: Intent[] = ['serious', 'casual', 'not_sure'];
/** One person's private yes or no to meeting another. Never shown to the other person. */
export interface Interest {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  interested: boolean;
}
export interface Person {
  id: string;
  name: string;
  wingcatName: string;
  preferences?: Preferences;
}
export interface Negotiation {
  id: string;
  personAId: string;
  personBId: string;
  status: 'open' | 'agreed' | 'failed';
  round: number;
  maxRounds: number;
  turnPersonId?: string;
  planId?: string;
}
export interface NewProposal {
  fromPersonId: string;
  startsAt: string;
  venue: string;
  area: string;
  activity: string;
  costPerPerson: number;
  reason: string;
}
export interface Proposal extends NewProposal {
  id: string;
  negotiationId: string;
  round: number;
}
export interface Approval {
  personId: string;
  approved: boolean;
}
export type DepositStatus = 'awaiting_approval' | 'held' | 'released' | 'captured' | 'failed';
export interface Deposit {
  id: string;
  planId: string;
  personId: string;
  amount: number;
  status: DepositStatus;
  approveUrl?: string;
}
export interface CheckIn {
  personId: string;
  checkedInAt: string;
  confirmedWithPartnerCode: boolean;
}
export type PlanStatus = 'awaiting_approval' | 'awaiting_deposits' | 'locked' | 'settled' | 'cancelled';
export interface Plan {
  id: string;
  negotiationId: string;
  status: PlanStatus;
  startsAt: string;
  venue: string;
  area: string;
  activity: string;
  costPerPerson: number;
  depositAmount: number;
  cancelBy: string;
  checkInOpensAt: string;
  checkInClosesAt: string;
  approvals: Approval[];
  deposits: Deposit[];
  checkIns: CheckIn[];
}
export interface Settlement {
  planId: string;
  outcome: 'both_showed' | 'one_no_show' | 'both_no_show' | 'cancelled';
  settledAt: string;
  results: { personId: string; showedUp: boolean; depositStatus: 'released' | 'captured'; amount: number }[];
}

/** Server-only records: PayPal identifiers and check-in codes never leave the server in a Plan. */
interface DepositRecord extends Deposit {
  orderId: string;
  authorizationId?: string;
}
interface PlanRecord extends Omit<Plan, 'deposits'> {
  personIds: [string, string];
  codes: Record<string, string>;
  settlement?: Settlement;
}

export interface AppEvent {
  seq: number;
  at: string;
  type: string;
  /** One plain sentence for the status line. */
  message: string;
  data?: unknown;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// ---------- Rules ----------

export const DEPOSIT_AMOUNT = 5;
export const MAX_ROUNDS = 6;
/** PayPal honours an authorization for 3 days, so holds are only taken this close to the date. */
export const MAX_HOLD_LEAD_MS = 72 * 60 * 60 * 1000;
const CANCEL_LEAD_MS = 2 * 60 * 60 * 1000;
const CHECK_IN_BEFORE_MS = 15 * 60 * 1000;
const CHECK_IN_AFTER_MS = 30 * 60 * 1000;

/** Returns the reasons a proposal breaks one person's limits. Empty means it fits. */
export function limitProblems(p: NewProposal, person: Person): string[] {
  const prefs = person.preferences;
  if (!prefs) return [`${person.name} has no saved preferences`];
  const problems: string[] = [];
  const t = Date.parse(p.startsAt);
  if (Number.isNaN(t)) problems.push('the start time is not a valid date');
  else if (!prefs.freeSlots.some((s) => t >= Date.parse(s.start) && t <= Date.parse(s.end)))
    problems.push(`${person.name} is not free then`);
  if (p.costPerPerson > prefs.maxBudget) problems.push(`it costs more than ${person.name}'s budget`);
  if (!prefs.areas.some((a) => a.trim().toLowerCase() === p.area.trim().toLowerCase()))
    problems.push(`${person.name} cannot get to ${p.area}`);
  const text = `${p.venue} ${p.activity}`.toLowerCase();
  for (const d of prefs.dealbreakers ?? [])
    if (d.trim() && text.includes(d.trim().toLowerCase())) problems.push(`it includes "${d}", a dealbreaker for ${person.name}`);
  return problems;
}

// ---------- The app ----------

export class PawsDown {
  private clockOffsetMs = 0;
  private listeners = new Set<(e: AppEvent) => void>();
  private events: AppEvent[] = [];
  private settling = new Set<string>();
  /** Deposits whose hold is being placed right now, so the browser return and the webhook share one attempt. */
  private confirming = new Map<string, Promise<Deposit>>();

  constructor(
    private store: Store,
    private gateway: HoldGateway,
    /** Shown on every screen so practice mode can never be mistaken for a real payment. */
    readonly paymentMode: 'paypal_sandbox' | 'practice' | 'not_connected' = 'not_connected',
  ) {}

  listVenues(): Venue[] {
    return VENUES;
  }

  // ----- clock (the demo can fast-forward it; labelled as simulated in the UI) -----
  now(): number {
    return Date.now() + this.clockOffsetMs;
  }
  private iso(ms = this.now()): string {
    return new Date(ms).toISOString();
  }
  async advanceClockTo(isoTime: string): Promise<void> {
    const target = Date.parse(isoTime);
    if (Number.isNaN(target)) throw new ApiError(400, 'bad_time', 'That is not a valid time.');
    if (target < this.now()) throw new ApiError(400, 'bad_time', 'The clock can only move forward.');
    this.clockOffsetMs = target - Date.now();
    this.emit('clock.advanced', `Demo clock moved to ${isoTime}.`, { now: isoTime });
    await this.tick();
  }

  // ----- events -----
  subscribe(fn: (e: AppEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  recentEvents(): AppEvent[] {
    return this.events.slice(-200);
  }
  private emit(type: string, message: string, data?: unknown): void {
    const e: AppEvent = { seq: this.events.length + 1, at: this.iso(), type, message, data };
    this.events.push(e);
    for (const fn of this.listeners) fn(e);
  }

  // ----- people -----
  createPerson(input: { name?: string; wingcatName?: string }): Person {
    const name = input.name?.trim();
    const wingcatName = input.wingcatName?.trim();
    if (!name || !wingcatName) throw new ApiError(400, 'missing_fields', 'A person needs a name and a wingcat name.');
    const person = this.store.put<Person>('person', { id: newId('per'), name, wingcatName });
    this.emit('person.created', `${name} joined with wingcat ${wingcatName}.`, { personId: person.id });
    return person;
  }
  getPerson(id: string): Person {
    return this.store.get<Person>('person', id) ?? notFound('person');
  }
  /** A profile picture, kept apart from the person so the wingcat API never carries it. */
  setPhoto(personId: string, photo?: string): { ok: true } {
    const person = this.getPerson(personId);
    if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo) || photo.length > 400_000)
      throw new ApiError(400, 'bad_photo', 'A photo must be a small JPEG, PNG or WebP image.');
    this.store.put('photo', { id: person.id, photo });
    this.emit('photo.saved', `${person.name} added a photo.`, { personId });
    return { ok: true };
  }
  setPreferences(personId: string, prefs: Preferences): Person {
    const person = this.getPerson(personId);
    if (!Array.isArray(prefs?.freeSlots) || prefs.freeSlots.length === 0)
      throw new ApiError(400, 'bad_preferences', 'Preferences need at least one free time.');
    for (const s of prefs.freeSlots)
      if (Number.isNaN(Date.parse(s.start)) || Number.isNaN(Date.parse(s.end)) || Date.parse(s.end) <= Date.parse(s.start))
        throw new ApiError(400, 'bad_preferences', 'Each free time needs a valid start and a later end.');
    if (typeof prefs.maxBudget !== 'number' || prefs.maxBudget < 0)
      throw new ApiError(400, 'bad_preferences', 'Preferences need a budget of zero or more.');
    if (!Array.isArray(prefs.areas) || prefs.areas.length === 0)
      throw new ApiError(400, 'bad_preferences', 'Preferences need at least one area.');
    if (prefs.intent !== undefined && !INTENTS.includes(prefs.intent))
      throw new ApiError(400, 'bad_preferences', 'What you are looking for must be serious, casual or not_sure.');
    person.preferences = {
      ...(prefs.intent ? { intent: prefs.intent } : {}),
      freeSlots: prefs.freeSlots,
      maxBudget: prefs.maxBudget,
      areas: prefs.areas,
      likes: prefs.likes ?? [],
      dealbreakers: prefs.dealbreakers ?? [],
    };
    this.store.put('person', person);
    this.emit('preferences.saved', `${person.wingcatName} knows what ${person.name} wants.`, { personId });
    return person;
  }

  // ----- interest: people decide whether to meet; wingcats never do -----
  setInterest(input: { fromPersonId?: string; toPersonId?: string; interested?: boolean }): Interest {
    const from = this.getPerson(input.fromPersonId ?? '');
    const to = this.getPerson(input.toPersonId ?? '');
    if (from.id === to.id || typeof input.interested !== 'boolean')
      throw new ApiError(400, 'bad_interest', 'Say true or false about another person.');
    const interest = this.store.put<Interest>('interest', {
      id: `${from.id}:${to.id}`,
      fromPersonId: from.id,
      toPersonId: to.id,
      interested: input.interested,
    });
    // A "no" is announced without a name, so nobody learns who passed.
    if (!input.interested) this.emit('interest.passed', 'No date this time.', {});
    else if (this.saidYes(to.id, from.id)) this.emit('interest.mutual', `${from.name} and ${to.name} both said yes. Over to the wingcats.`, {});
    else this.emit('interest.yes', `${from.name} said yes to meeting.`, {});
    return interest;
  }
  private saidYes(fromId: string, toId: string): boolean {
    return this.store.get<Interest>('interest', `${fromId}:${toId}`)?.interested === true;
  }

  // ----- negotiation -----
  startNegotiation(input: { personAId?: string; personBId?: string }): Negotiation {
    if (!input.personAId || !input.personBId || input.personAId === input.personBId)
      throw new ApiError(400, 'bad_negotiation', 'A negotiation needs two different people.');
    const a = this.getPerson(input.personAId);
    const b = this.getPerson(input.personBId);
    if (!a.preferences || !b.preferences)
      throw new ApiError(400, 'missing_preferences', 'Both people need saved preferences first.');
    const [ia, ib] = [a.preferences.intent, b.preferences.intent];
    if (ia && ib && ia !== ib && ia !== 'not_sure' && ib !== 'not_sure')
      throw new ApiError(409, 'different_intentions', 'These two are looking for different things, so no date is arranged.');
    if (!this.saidYes(a.id, b.id) || !this.saidYes(b.id, a.id))
      throw new ApiError(409, 'not_mutual', 'Wingcats only negotiate once both people have said yes to meeting.');
    const n = this.store.put<Negotiation>('negotiation', {
      id: newId('neg'),
      personAId: a.id,
      personBId: b.id,
      status: 'open',
      round: 0,
      maxRounds: MAX_ROUNDS,
      turnPersonId: a.id,
    });
    this.emit('negotiation.started', `${a.wingcatName} and ${b.wingcatName} started negotiating.`, { negotiationId: n.id });
    return n;
  }
  getNegotiation(id: string): Negotiation {
    return this.store.get<Negotiation>('negotiation', id) ?? notFound('negotiation');
  }
  listProposals(negotiationId: string): Proposal[] {
    this.getNegotiation(negotiationId);
    return this.store.list<Proposal>('proposal').filter((p) => p.negotiationId === negotiationId);
  }
  makeProposal(negotiationId: string, input: NewProposal): Proposal {
    const n = this.getNegotiation(negotiationId);
    if (n.status !== 'open') throw new ApiError(409, 'negotiation_closed', 'This negotiation is over.');
    if (input.fromPersonId !== n.turnPersonId)
      throw new ApiError(409, 'not_your_turn', "It is the other wingcat's turn to propose.");
    for (const f of ['startsAt', 'venue', 'area', 'activity', 'reason'] as const)
      if (typeof input[f] !== 'string' || !input[f].trim())
        throw new ApiError(400, 'missing_fields', `A proposal needs "${f}".`);
    if (typeof input.costPerPerson !== 'number' || input.costPerPerson < 0)
      throw new ApiError(400, 'missing_fields', 'A proposal needs a cost per person of zero or more.');
    if (Date.parse(input.startsAt) <= this.now())
      throw new ApiError(400, 'in_the_past', 'A date has to start in the future.');
    const venue = VENUES.find((v) => v.name.toLowerCase() === input.venue.trim().toLowerCase());
    if (!venue || venue.area.toLowerCase() !== input.area.trim().toLowerCase())
      throw new ApiError(400, 'unknown_venue', 'Dates happen at public places only. Pick a venue and its area from the venue list.');
    if (input.costPerPerson < venue.costPerPerson)
      throw new ApiError(400, 'cost_too_low', `${venue.name} costs about $${venue.costPerPerson} each.`);
    const proposer = this.getPerson(input.fromPersonId);
    const problems = limitProblems(input, proposer);
    if (problems.length)
      throw new ApiError(400, 'outside_own_limits', `A wingcat cannot propose this: ${problems.join('; ')}.`);
    if (n.round >= n.maxRounds) {
      n.status = 'failed';
      delete n.turnPersonId;
      this.store.put('negotiation', n);
      this.emit('negotiation.failed', 'The wingcats ran out of rounds without agreeing.', { negotiationId });
      throw new ApiError(409, 'out_of_rounds', 'The negotiation ran out of rounds.');
    }
    n.round += 1;
    n.turnPersonId = input.fromPersonId === n.personAId ? n.personBId : n.personAId;
    this.store.put('negotiation', n);
    const proposal = this.store.put<Proposal>('proposal', {
      id: newId('pro'),
      negotiationId,
      round: n.round,
      fromPersonId: input.fromPersonId,
      startsAt: new Date(input.startsAt).toISOString(),
      venue: input.venue.trim(),
      area: input.area.trim(),
      activity: input.activity.trim(),
      costPerPerson: input.costPerPerson,
      reason: input.reason.trim(),
    });
    this.emit('proposal.made', `${proposer.wingcatName} proposed ${proposal.activity} at ${proposal.venue}: ${proposal.reason}`, {
      negotiationId,
      proposal,
    });
    return proposal;
  }
  acceptProposal(negotiationId: string, proposalId: string, personId: string): Plan {
    const n = this.getNegotiation(negotiationId);
    if (n.status !== 'open') throw new ApiError(409, 'negotiation_closed', 'This negotiation is over.');
    const proposals = this.listProposals(negotiationId);
    const proposal = proposals.find((p) => p.id === proposalId) ?? notFound('proposal');
    if (proposal.id !== proposals.at(-1)?.id)
      throw new ApiError(409, 'stale_proposal', 'Only the latest proposal can be accepted.');
    if (personId !== n.turnPersonId || personId === proposal.fromPersonId)
      throw new ApiError(409, 'not_your_turn', 'Only the other person can accept this proposal.');
    const a = this.getPerson(n.personAId);
    const b = this.getPerson(n.personBId);
    const problems = [...limitProblems(proposal, a), ...limitProblems(proposal, b)];
    if (Date.parse(proposal.startsAt) <= this.now()) problems.push('it starts in the past');
    if (problems.length)
      throw new ApiError(422, 'outside_limits', `This plan does not fit: ${problems.join('; ')}.`);

    const starts = Date.parse(proposal.startsAt);
    const plan: PlanRecord = {
      id: newId('pln'),
      negotiationId,
      status: 'awaiting_approval',
      startsAt: proposal.startsAt,
      venue: proposal.venue,
      area: proposal.area,
      activity: proposal.activity,
      costPerPerson: proposal.costPerPerson,
      depositAmount: DEPOSIT_AMOUNT,
      cancelBy: this.iso(starts - CANCEL_LEAD_MS),
      checkInOpensAt: this.iso(starts - CHECK_IN_BEFORE_MS),
      checkInClosesAt: this.iso(starts + CHECK_IN_AFTER_MS),
      approvals: [],
      checkIns: [],
      personIds: [a.id, b.id],
      codes: { [a.id]: newCode(), [b.id]: newCode() },
    };
    this.store.put('plan', plan);
    n.status = 'agreed';
    n.planId = plan.id;
    delete n.turnPersonId;
    this.store.put('negotiation', n);
    this.emit('plan.agreed', `The wingcats agreed: ${plan.activity} at ${plan.venue}.`, { planId: plan.id });
    return this.publicPlan(plan);
  }

  // ----- plans -----
  getPlan(id: string): Plan {
    return this.publicPlan(this.planRecord(id));
  }
  approvePlan(planId: string, input: Approval): Plan {
    const plan = this.planRecord(planId);
    this.requireMember(plan, input.personId);
    if (plan.status !== 'awaiting_approval')
      throw new ApiError(409, 'not_awaiting_approval', 'This plan is no longer waiting for approval.');
    if (typeof input.approved !== 'boolean') throw new ApiError(400, 'missing_fields', 'Say true or false.');
    if (plan.approvals.some((x) => x.personId === input.personId))
      throw new ApiError(409, 'already_answered', 'This person has already answered.');
    plan.approvals.push({ personId: input.personId, approved: input.approved });
    const person = this.getPerson(input.personId);
    if (!input.approved) {
      plan.status = 'cancelled';
      this.emit('plan.rejected', `${person.name} said no to the plan. No money was held.`, { planId });
    } else if (plan.approvals.length === 2) {
      plan.status = 'awaiting_deposits';
      this.emit('plan.approved', 'Both said yes. Time to put paws down.', { planId });
    } else {
      this.emit('plan.approval', `${person.name} said yes to the plan.`, { planId });
    }
    this.store.put('plan', plan);
    return this.publicPlan(plan);
  }
  async createDeposit(planId: string, personId: string): Promise<Deposit> {
    const plan = this.planRecord(planId);
    this.requireMember(plan, personId);
    if (plan.status !== 'awaiting_deposits')
      throw new ApiError(409, 'not_awaiting_deposits', 'This plan is not waiting for deposits.');
    if (Date.parse(plan.startsAt) - this.now() > MAX_HOLD_LEAD_MS)
      throw new ApiError(409, 'too_early', 'Holds can only be placed within 72 hours of the date.');
    const existing = this.depositsFor(planId).find((d) => d.personId === personId && d.status !== 'failed');
    if (existing) return publicDeposit(existing);
    const id = newId('dep');
    const { orderId, approveUrl } = await this.pay(() =>
      this.gateway.createHold({ amount: plan.depositAmount, reference: `${planId}:${personId}`, requestId: `${id}:create` }),
    );
    const deposit: DepositRecord = {
      id,
      planId,
      personId,
      amount: plan.depositAmount,
      status: 'awaiting_approval',
      approveUrl,
      orderId,
    };
    this.store.put('deposit', deposit);
    this.emit('deposit.created', `${this.getPerson(personId).name} is approving a $${plan.depositAmount} hold.`, { planId, depositId: id });
    return publicDeposit(deposit);
  }
  /** The PayPal order behind a deposit. Only the wingcats' look-only check asks for this. */
  paypalOrderId(depositId: string): string {
    const deposit = this.store.list<DepositRecord>('deposit').find((d) => d.id === depositId) ?? notFound('deposit');
    return deposit.orderId;
  }
  confirmDeposit(planId: string, depositId: string): Promise<Deposit> {
    const running = this.confirming.get(depositId);
    if (running) return running;
    const attempt = this.placeHoldFor(planId, depositId).finally(() => this.confirming.delete(depositId));
    this.confirming.set(depositId, attempt);
    return attempt;
  }
  private async placeHoldFor(planId: string, depositId: string): Promise<Deposit> {
    const plan = this.planRecord(planId);
    const deposit = this.depositsFor(planId).find((d) => d.id === depositId) ?? notFound('deposit');
    if (deposit.status === 'held') return publicDeposit(deposit);
    if (deposit.status !== 'awaiting_approval' || plan.status !== 'awaiting_deposits')
      throw new ApiError(409, 'cannot_confirm', 'This deposit cannot be confirmed now.');
    const { authorizationId } = await this.pay(() => this.gateway.placeHold(deposit.orderId, `${deposit.id}:hold`));
    deposit.status = 'held';
    deposit.authorizationId = authorizationId;
    delete deposit.approveUrl;
    this.store.put('deposit', deposit);
    const name = this.getPerson(deposit.personId).name;
    const held = this.depositsFor(planId).filter((d) => d.status === 'held');
    if (held.length === 2) {
      plan.status = 'locked';
      this.store.put('plan', plan);
      this.emit('plan.locked', 'Both paws are down. The date is locked in.', { planId });
    } else {
      this.emit('deposit.held', `${name}'s $${deposit.amount} is held. Waiting for the other paw.`, { planId, depositId });
    }
    return publicDeposit(deposit);
  }
  /** PayPal sends the person back with only the order id, so the deposit is found from that. */
  async confirmDepositForOrder(orderId?: string): Promise<Deposit> {
    const deposit = this.store.list<DepositRecord>('deposit').find((d) => d.orderId === orderId) ?? notFound('deposit');
    return this.confirmDeposit(deposit.planId, deposit.id);
  }

  /**
   * A verified PayPal webhook event. The route has already checked the signature.
   *
   * PayPal may send the same event more than once, so each event id is handled once. An approved
   * order places the hold even when the person closed the tab before coming back to the app.
   * The other events are PayPal's own confirmation of what we did, and are written to the feed.
   */
  async handlePayPalEvent(event: { id?: string; event_type?: string; resource?: any }): Promise<{ outcome: 'handled' | 'duplicate' | 'ignored' }> {
    if (!event?.id || !event.event_type) throw new ApiError(400, 'bad_event', 'The event has no id or type.');
    if (this.store.get('paypal_event', event.id)) return { outcome: 'duplicate' };
    const deposits = this.store.list<DepositRecord>('deposit');
    const resource = event.resource ?? {};
    let outcome: 'handled' | 'ignored' = 'ignored';
    const confirmed = (deposit: DepositRecord | undefined, what: string) => {
      if (!deposit) return;
      this.emit('paypal.confirmed', `PayPal confirmed: ${this.getPerson(deposit.personId).name}'s $${deposit.amount} ${what}.`, {
        planId: deposit.planId,
        depositId: deposit.id,
        eventType: event.event_type,
      });
      outcome = 'handled';
    };

    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const deposit = deposits.find((d) => d.orderId === resource.id);
      if (deposit?.status === 'awaiting_approval' && this.planRecord(deposit.planId).status === 'awaiting_deposits') {
        // A failure here is thrown, so the route answers 500 and PayPal sends the event again.
        await this.confirmDeposit(deposit.planId, deposit.id);
        outcome = 'handled';
      }
    } else if (event.event_type === 'PAYMENT.AUTHORIZATION.CREATED') {
      confirmed(deposits.find((d) => d.authorizationId === resource.id), 'is held');
    } else if (event.event_type === 'PAYMENT.AUTHORIZATION.VOIDED') {
      confirmed(deposits.find((d) => d.authorizationId === resource.id), 'hold was released');
    } else if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const authorizationId = resource.supplementary_data?.related_ids?.authorization_id;
      confirmed(deposits.find((d) => d.authorizationId && d.authorizationId === authorizationId), 'was captured');
    }
    this.store.put('paypal_event', { id: event.id, type: event.event_type, outcome, at: this.iso() });
    return { outcome };
  }
  getCheckInCode(planId: string, personId: string): { personId: string; code: string } {
    const plan = this.planRecord(planId);
    this.requireMember(plan, personId);
    return { personId, code: plan.codes[personId]! };
  }
  checkIn(planId: string, input: { personId: string; partnerCode?: string }): CheckIn {
    const plan = this.planRecord(planId);
    this.requireMember(plan, input.personId);
    if (plan.status !== 'locked') throw new ApiError(409, 'not_locked', 'Check-in is only for a locked date.');
    const now = this.now();
    if (now < Date.parse(plan.checkInOpensAt) || now > Date.parse(plan.checkInClosesAt))
      throw new ApiError(409, 'outside_window', 'Check-in is not open right now.');
    const partnerId = plan.personIds.find((p) => p !== input.personId)!;
    let confirmed = false;
    if (input.partnerCode !== undefined) {
      if (input.partnerCode.trim().toUpperCase() !== plan.codes[partnerId])
        throw new ApiError(400, 'wrong_code', "That is not the other person's code.");
      confirmed = true;
    }
    let checkIn = plan.checkIns.find((c) => c.personId === input.personId);
    if (checkIn) checkIn.confirmedWithPartnerCode ||= confirmed;
    else {
      checkIn = { personId: input.personId, checkedInAt: this.iso(), confirmedWithPartnerCode: confirmed };
      plan.checkIns.push(checkIn);
    }
    this.store.put('plan', plan);
    this.emit('checkin.recorded', `${this.getPerson(input.personId).name} checked in.`, { planId });
    return checkIn;
  }
  async cancelPlan(planId: string, personId: string): Promise<Plan> {
    const plan = this.planRecord(planId);
    this.requireMember(plan, personId);
    if (plan.status === 'settled' || plan.status === 'cancelled')
      throw new ApiError(409, 'already_over', 'This plan is already over.');
    if (this.now() > Date.parse(plan.cancelBy))
      throw new ApiError(409, 'too_late', 'It is past the cancel-by time.');
    await this.settle(plan, 'cancelled', `${this.getPerson(personId).name} cancelled in time. Every hold is released.`);
    return this.publicPlan(this.planRecord(planId));
  }
  getSettlement(planId: string): Settlement {
    return this.planRecord(planId).settlement ?? notFound('settlement');
  }

  /**
   * Runs the time-based rules. Called on a timer and after the demo clock moves.
   * Settlement is decided here from check-in records, never from a payment event.
   */
  async tick(): Promise<void> {
    const now = this.now();
    for (const plan of this.store.list<PlanRecord>('plan')) {
      try {
        if (plan.status === 'locked' && now > Date.parse(plan.checkInClosesAt)) {
          const showed = plan.personIds.filter((p) => plan.checkIns.some((c) => c.personId === p));
          if (showed.length === 2) await this.settle(plan, 'both_showed', 'Both showed up. Both get their $5 back.');
          else if (showed.length === 1) {
            const flaker = this.getPerson(plan.personIds.find((p) => !showed.includes(p))!);
            const there = this.getPerson(showed[0]!);
            await this.settle(plan, 'one_no_show', `${flaker.name} did not show. ${flaker.name}'s $5 is captured; ${there.name} gets theirs back.`);
          } else await this.settle(plan, 'both_no_show', 'Nobody showed up, so nobody was stood up. Both holds are released.');
        } else if (plan.status === 'awaiting_deposits' && now > Date.parse(plan.cancelBy)) {
          await this.settle(plan, 'cancelled', 'Both holds were not placed in time. The date is off and any hold is released.');
        }
      } catch (err) {
        this.emit('settlement.error', `Settlement could not finish and will be retried: ${(err as Error).message}`, { planId: plan.id });
      }
    }
  }

  private async settle(plan: PlanRecord, outcome: Settlement['outcome'], message: string): Promise<void> {
    if (this.settling.has(plan.id)) return;
    this.settling.add(plan.id);
    try {
      const results: Settlement['results'] = [];
      for (const personId of plan.personIds) {
        const showedUp = plan.checkIns.some((c) => c.personId === personId);
        const deposit = this.depositsFor(plan.id).find((d) => d.personId === personId && d.status !== 'failed');
        if (!deposit) continue;
        const forfeit = outcome === 'one_no_show' && !showedUp;
        if (deposit.status === 'held') {
          if (forfeit) await this.pay(() => this.gateway.capture(deposit.authorizationId!, deposit.amount, `${deposit.id}:capture`));
          else await this.pay(() => this.gateway.release(deposit.authorizationId!, `${deposit.id}:release`));
          deposit.status = forfeit ? 'captured' : 'released';
        } else if (deposit.status === 'awaiting_approval') {
          deposit.status = 'failed'; // never approved: no hold exists, nothing to release
        }
        delete deposit.approveUrl;
        this.store.put('deposit', deposit);
        if (deposit.status === 'released' || deposit.status === 'captured')
          results.push({ personId, showedUp, depositStatus: deposit.status, amount: deposit.amount });
      }
      plan.status = outcome === 'cancelled' ? 'cancelled' : 'settled';
      plan.settlement = { planId: plan.id, outcome, settledAt: this.iso(), results };
      this.store.put('plan', plan);
      this.emit('plan.settled', message, { planId: plan.id, settlement: plan.settlement });
    } finally {
      this.settling.delete(plan.id);
    }
  }

  // ----- helpers -----
  /** For the dashboard: every person, negotiation, proposal and plan as the API would return them. */
  snapshot() {
    return {
      now: this.iso(),
      paymentMode: this.paymentMode,
      venues: VENUES,
      people: this.store.list<Person>('person').map((p) => ({
        ...p,
        showUpRecord: this.showUpRecord(p.id),
        photo: this.store.get<{ id: string; photo: string }>('photo', p.id)?.photo,
      })),
      interests: this.store.list<Interest>('interest'),
      negotiations: this.store.list<Negotiation>('negotiation'),
      proposals: this.store.list<Proposal>('proposal'),
      plans: this.store.list<PlanRecord>('plan').map((p) => ({ ...this.publicPlan(p), settlement: p.settlement })),
    };
  }
  /** How often a person turned up to locked dates, counted from settlement records. */
  showUpRecord(personId: string): { showedUp: number; dates: number } {
    const results = this.store
      .list<PlanRecord>('plan')
      .filter((p) => p.settlement && p.settlement.outcome !== 'cancelled')
      .flatMap((p) => p.settlement!.results.filter((r) => r.personId === personId));
    return { showedUp: results.filter((r) => r.showedUp).length, dates: results.length };
  }
  reset(): void {
    this.store.clear();
    this.clockOffsetMs = 0;
    this.events = [];
    this.emit('demo.reset', 'The demo was reset.');
  }
  private planRecord(id: string): PlanRecord {
    return this.store.get<PlanRecord>('plan', id) ?? notFound('plan');
  }
  private depositsFor(planId: string): DepositRecord[] {
    return this.store.list<DepositRecord>('deposit').filter((d) => d.planId === planId);
  }
  private requireMember(plan: PlanRecord, personId: string): void {
    if (!plan.personIds.includes(personId)) throw new ApiError(404, 'not_found', 'That person is not part of this plan.');
  }
  private publicPlan(plan: PlanRecord): Plan {
    const { personIds: _p, codes: _c, settlement: _s, ...rest } = plan;
    return { ...rest, deposits: this.depositsFor(plan.id).filter((d) => d.status !== 'failed').map(publicDeposit) };
  }
  private async pay<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (err) {
      if (err instanceof GatewayError) throw new ApiError(502, 'payment_provider_error', err.message);
      throw err;
    }
  }
}

function publicDeposit(d: DepositRecord): Deposit {
  const { orderId: _o, authorizationId: _a, ...rest } = d;
  return rest;
}
function newId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString('hex')}`;
}
function newCode(): string {
  const words = ['MEOW', 'PURR', 'PAWS', 'MITT'];
  return `${words[randomInt(words.length)]}-${randomInt(1000, 10000)}`;
}
function notFound(what: string): never {
  throw new ApiError(404, 'not_found', `No ${what} exists with that ID.`);
}
