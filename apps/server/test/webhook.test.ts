import { generateKeyPairSync, sign } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { beforeEach, describe, expect, it } from 'vitest';
import { PawsDown } from '../src/core.ts';
import type { HoldGateway } from '../src/gateway.ts';
import { buildServer } from '../src/http.ts';
import { isPayPalHost, WebhookVerifier } from '../src/payments/webhook.ts';
import { Store } from '../src/store.ts';

/**
 * Webhook tests. A test key pair stands in for PayPal's signing certificate, so we can make
 * both honest events and forged ones and send them through the real HTTP route.
 */

const WEBHOOK_ID = 'WH-TEST-1';
const CERT_URL = 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1';
const paypalKey = generateKeyPairSync('rsa', { modulusLength: 2048 });
const attackerKey = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = (k: typeof paypalKey) => k.publicKey.export({ type: 'spki', format: 'pem' }).toString();

/** Signs a body the way PayPal does and returns the headers it would send. */
function signed(body: string, over: { key?: typeof paypalKey; webhookId?: string; certUrl?: string } = {}) {
  const id = 'tx-1';
  const time = '2026-11-11T10:00:00Z';
  const text = `${id}|${time}|${over.webhookId ?? WEBHOOK_ID}|${crc32(Buffer.from(body))}`;
  return {
    'content-type': 'application/json',
    'paypal-transmission-id': id,
    'paypal-transmission-time': time,
    'paypal-transmission-sig': sign('RSA-SHA256', Buffer.from(text), (over.key ?? paypalKey).privateKey).toString('base64'),
    'paypal-cert-url': over.certUrl ?? CERT_URL,
    'paypal-auth-algo': 'SHA256withRSA',
  };
}

class CountingGateway implements HoldGateway {
  holds = 0;
  failNext = false;
  private n = 0;
  async createHold() {
    return { orderId: `ORDER-${++this.n}`, approveUrl: 'https://example.test/approve' };
  }
  async placeHold(orderId: string) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('PayPal is down');
    }
    this.holds++;
    return { authorizationId: `AUTH-${orderId}` };
  }
  async release() {}
  async capture(authorizationId: string) {
    return { captureId: `CAP-${authorizationId}` };
  }
}

let app: PawsDown;
let gw: CountingGateway;
let http: Awaited<ReturnType<typeof buildServer>>;
let certFetches: string[];
let planId: string;
let alex: string;
let sam: string;

const post = (body: string, headers: Record<string, string>) => http.inject({ method: 'POST', url: '/webhooks/paypal', payload: body, headers });
const event = (id: string, type: string, resource: unknown) => JSON.stringify({ id, event_type: type, resource });
const messages = () => app.recentEvents().map((e) => e.message);

beforeEach(async () => {
  gw = new CountingGateway();
  app = new PawsDown(new Store(), gw, 'paypal_sandbox');
  certFetches = [];
  const verifier = new WebhookVerifier({
    webhookId: WEBHOOK_ID,
    fetchCert: async (url) => {
      certFetches.push(url);
      return pem(paypalKey);
    },
  });
  http = await buildServer(app, 'key', verifier);

  // Two people with an approved plan, each with a $5 order waiting for approval at PayPal.
  const start = Date.now() + 24 * 3_600_000;
  const prefs = { freeSlots: [{ start: new Date(start - 3_600_000).toISOString(), end: new Date(start + 3 * 3_600_000).toISOString() }], maxBudget: 30, areas: ['Downtown'], dealbreakers: [] };
  alex = app.createPerson({ name: 'Alex', wingcatName: 'Mochi' }).id;
  sam = app.createPerson({ name: 'Sam', wingcatName: 'Biscuit' }).id;
  for (const p of [alex, sam]) app.setPreferences(p, prefs);
  app.setInterest({ fromPersonId: alex, toPersonId: sam, interested: true });
  app.setInterest({ fromPersonId: sam, toPersonId: alex, interested: true });
  const n = app.startNegotiation({ personAId: alex, personBId: sam });
  const p = app.makeProposal(n.id, { fromPersonId: alex, startsAt: new Date(start).toISOString(), venue: 'Green Bowl', area: 'Downtown', activity: 'Vegetarian dinner', costPerPerson: 22, reason: 'Fits you both.' });
  planId = app.acceptProposal(n.id, p.id, sam).id;
  app.approvePlan(planId, { personId: alex, approved: true });
  app.approvePlan(planId, { personId: sam, approved: true });
  await app.createDeposit(planId, alex); // ORDER-1
  await app.createDeposit(planId, sam); // ORDER-2
});

const statusOf = (personId: string) => app.getPlan(planId).deposits.find((d) => d.personId === personId)?.status;

describe('a real PayPal event', () => {
  it('places the hold when the order was approved, even if the person never came back to the app', async () => {
    const body = event('WH-EV-1', 'CHECKOUT.ORDER.APPROVED', { id: 'ORDER-1' });
    const res = await post(body, signed(body));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ outcome: 'handled' });
    expect(statusOf(alex)).toBe('held');
    expect(gw.holds).toBe(1);
  });

  it('handles the same event only once when PayPal sends it again', async () => {
    const body = event('WH-EV-1', 'CHECKOUT.ORDER.APPROVED', { id: 'ORDER-1' });
    await post(body, signed(body));
    const again = await post(body, signed(body));
    expect(again.statusCode).toBe(200);
    expect(again.json()).toEqual({ outcome: 'duplicate' });
    expect(gw.holds).toBe(1);
  });

  it('places one hold when the webhook and the browser return arrive together', async () => {
    const body = event('WH-EV-1', 'CHECKOUT.ORDER.APPROVED', { id: 'ORDER-1' });
    await Promise.all([post(body, signed(body)), app.confirmDepositForOrder('ORDER-1')]);
    expect(gw.holds).toBe(1);
    expect(messages().filter((m) => m.includes("Alex's $5 is held"))).toHaveLength(1);
  });

  it('answers 500 so PayPal retries when the hold could not be placed, then succeeds on the retry', async () => {
    gw.failNext = true;
    const body = event('WH-EV-1', 'CHECKOUT.ORDER.APPROVED', { id: 'ORDER-1' });
    expect((await post(body, signed(body))).statusCode).toBeGreaterThanOrEqual(500);
    expect(statusOf(alex)).toBe('awaiting_approval');
    const retry = await post(body, signed(body));
    expect(retry.json()).toEqual({ outcome: 'handled' });
    expect(statusOf(alex)).toBe('held');
  });

  it('writes PayPal\'s confirmation of a release and a capture to the feed', async () => {
    await app.confirmDepositForOrder('ORDER-1');
    await app.confirmDepositForOrder('ORDER-2');
    const voided = event('WH-EV-2', 'PAYMENT.AUTHORIZATION.VOIDED', { id: 'AUTH-ORDER-1' });
    const captured = event('WH-EV-3', 'PAYMENT.CAPTURE.COMPLETED', { id: 'CAP-9', supplementary_data: { related_ids: { authorization_id: 'AUTH-ORDER-2' } } });
    expect((await post(voided, signed(voided))).json()).toEqual({ outcome: 'handled' });
    expect((await post(captured, signed(captured))).json()).toEqual({ outcome: 'handled' });
    expect(messages()).toContain("PayPal confirmed: Alex's $5 hold was released.");
    expect(messages()).toContain("PayPal confirmed: Sam's $5 was captured.");
  });

  it('accepts but ignores events about orders it does not know', async () => {
    const body = event('WH-EV-4', 'CHECKOUT.ORDER.APPROVED', { id: 'SOMEONE-ELSES-ORDER' });
    const res = await post(body, signed(body));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ outcome: 'ignored' });
    expect(gw.holds).toBe(0);
  });

  it('fetches the signing certificate once and reuses it', async () => {
    for (const id of ['A', 'B', 'C']) {
      const body = event(id, 'SOMETHING.ELSE', {});
      await post(body, signed(body));
    }
    expect(certFetches).toEqual([CERT_URL]);
  });
});

describe('a forged or damaged event', () => {
  const approved = event('WH-EV-1', 'CHECKOUT.ORDER.APPROVED', { id: 'ORDER-1' });
  const refused = async (body: string, headers: Record<string, string>, why: RegExp) => {
    const res = await post(body, headers);
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('bad_signature');
    expect(res.json().message).toMatch(why);
    expect(gw.holds).toBe(0);
    expect(statusOf(alex)).toBe('awaiting_approval');
  };

  it('is refused when it has no signature at all', async () => {
    await refused(approved, { 'content-type': 'application/json' }, /header is missing/);
  });

  it('is refused when the body was changed after signing', async () => {
    const headers = signed(event('WH-EV-1', 'CHECKOUT.ORDER.APPROVED', { id: 'ORDER-2' }));
    await refused(approved, headers, /signature does not match/);
  });

  it('is refused when only the spacing of the body changed, because the signature covers the exact bytes', async () => {
    const pretty = JSON.stringify(JSON.parse(approved), null, 2);
    await refused(pretty, signed(approved), /signature does not match/);
  });

  it('is refused when signed with a key that is not PayPal\'s', async () => {
    await refused(approved, signed(approved, { key: attackerKey }), /signature does not match/);
  });

  it('is refused when it was signed for a different webhook', async () => {
    await refused(approved, signed(approved, { webhookId: 'WH-SOMEONE-ELSE' }), /signature does not match/);
  });

  it('is refused, without fetching anything, when the certificate address is not PayPal', async () => {
    for (const certUrl of ['https://evil.example/cert.pem', 'https://paypal.com.evil.example/cert.pem', 'http://api.paypal.com/cert.pem']) {
      await refused(approved, signed(approved, { key: attackerKey, certUrl }), /not a PayPal host/);
    }
    expect(certFetches).toEqual([]);
  });

  it('is refused when the algorithm is not the one we check', async () => {
    await refused(approved, { ...signed(approved), 'paypal-auth-algo': 'none' }, /Unsupported signature algorithm/);
  });
});

describe('configuration', () => {
  it('answers 503 when no webhook id is configured, and trusts nothing', async () => {
    const bare = await buildServer(app, 'key');
    const res = await bare.inject({ method: 'POST', url: '/webhooks/paypal', payload: '{}', headers: { 'content-type': 'application/json' } });
    expect(res.statusCode).toBe(503);
  });

  it('is off until a real webhook id is in .env', () => {
    expect(WebhookVerifier.fromEnv({})).toBeUndefined();
    expect(WebhookVerifier.fromEnv({ PAYPAL_WEBHOOK_ID: 'your-sandbox-webhook-id' })).toBeUndefined();
    expect(WebhookVerifier.fromEnv({ PAYPAL_WEBHOOK_ID: 'WH-123' })).toBeInstanceOf(WebhookVerifier);
  });

  it('only trusts https addresses on paypal.com', () => {
    expect(isPayPalHost('https://api.paypal.com/v1/notifications/certs/X')).toBe(true);
    expect(isPayPalHost('https://api.sandbox.paypal.com/v1/notifications/certs/X')).toBe(true);
    expect(isPayPalHost('https://notpaypal.com/x')).toBe(false);
    expect(isPayPalHost('not a url')).toBe(false);
  });

  it('leaves the other routes parsing JSON as before', async () => {
    const res = await http.inject({ method: 'POST', url: '/app/people', payload: { name: 'Riley', wingcatName: 'Tofu' } });
    expect(res.statusCode).toBe(201);
  });
});
