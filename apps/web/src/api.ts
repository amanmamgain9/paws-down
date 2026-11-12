export interface TimeSlot {
  start: string;
  end: string;
}
export interface Person {
  id: string;
  name: string;
  wingcatName: string;
  showUpRecord: { showedUp: number; dates: number };
  preferences?: Preferences;
  /** A small data-URL picture the person uploaded. Missing means a drawing is shown. */
  photo?: string;
}
export type Intent = 'serious' | 'casual' | 'not_sure';
export interface Preferences {
  freeSlots: TimeSlot[];
  maxBudget: number;
  areas: string[];
  likes?: string[];
  dealbreakers?: string[];
  intent?: Intent;
}
export interface Interest {
  fromPersonId: string;
  toPersonId: string;
  interested: boolean;
}
export interface Venue {
  name: string;
  area: string;
  tags: string[];
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
export interface Proposal {
  id: string;
  negotiationId: string;
  fromPersonId: string;
  startsAt: string;
  venue: string;
  area: string;
  activity: string;
  costPerPerson: number;
  reason: string;
  round: number;
}
export interface Deposit {
  id: string;
  personId: string;
  amount: number;
  status: 'awaiting_approval' | 'held' | 'released' | 'captured' | 'failed';
  approveUrl?: string;
}
export interface Plan {
  id: string;
  negotiationId: string;
  status: 'awaiting_approval' | 'awaiting_deposits' | 'locked' | 'settled' | 'cancelled';
  startsAt: string;
  venue: string;
  area: string;
  activity: string;
  costPerPerson: number;
  depositAmount: number;
  cancelBy: string;
  checkInOpensAt: string;
  checkInClosesAt: string;
  approvals: { personId: string; approved: boolean }[];
  deposits: Deposit[];
  checkIns: { personId: string; checkedInAt: string; confirmedWithPartnerCode: boolean }[];
  settlement?: {
    outcome: 'both_showed' | 'one_no_show' | 'both_no_show' | 'cancelled';
    results: { personId: string; showedUp: boolean; depositStatus: 'released' | 'captured'; amount: number }[];
  };
}
export interface AppState {
  now: string;
  paymentMode: 'paypal_sandbox' | 'practice' | 'not_connected';
  /** Which brain the wingcats say they are running. Missing until they have checked in. */
  wingcatBrain?: 'claude' | 'rules';
  people: Person[];
  venues: Venue[];
  interests: Interest[];
  negotiations: Negotiation[];
  proposals: Proposal[];
  plans: Plan[];
  events: { seq: number; at: string; type: string; message: string }[];
}

export async function call<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message ?? `Request failed (${res.status})`);
  return data as T;
}
