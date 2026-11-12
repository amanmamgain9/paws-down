import { describe, expect, it } from 'vitest';
import { GatewayError } from '../src/gateway.ts';
import { PayPalGateway } from '../src/payments/paypal-gateway.ts';

/**
 * Readiness tests: the real PayPal Server SDK, with a stand-in answering instead of the network.
 * A working call is not the same as a production-ready one, so most of these make PayPal misbehave.
 */

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };
type Seen = { method: string; url: string; headers: Record<string, string>; body: any };

/** A fake PayPal. `script` answers each non-token request in turn; the last answer repeats. */
function fakePayPal(script: Reply[], token: Reply = { status: 200, body: { access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 } }) {
  const seen: Seen[] = [];
  let next = 0;
  const transport = async (config: any) => {
    const isToken = String(config.url).includes('/v1/oauth2/token');
    const reply = isToken ? token : script[Math.min(next++, script.length - 1)]!;
    if (!isToken) {
      const headers = Object.fromEntries(Object.entries(config.headers ?? {}).map(([k, v]) => [k.toLowerCase(), String(v)]));
      seen.push({ method: String(config.method).toUpperCase(), url: String(config.url), headers, body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data });
    }
    return {
      data: reply.body === undefined ? '' : JSON.stringify(reply.body),
      status: reply.status,
      statusText: '',
      headers: { 'content-type': 'application/json', ...reply.headers },
      config,
    };
  };
  const gateway = new PayPalGateway({
    clientId: 'test-id',
    clientSecret: 'test-secret',
    returnUrl: 'http://localhost:5173/',
    cancelUrl: 'http://localhost:5173/?cancelled=1',
    transport,
    retryIntervalSeconds: 0.01,
  });
  return { gateway, seen };
}

const ORDER = { id: 'ORDER-1', status: 'PAYER_ACTION_REQUIRED', links: [{ href: 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1', rel: 'payer-action', method: 'GET' }] };
const AUTHORIZED = { id: 'ORDER-1', status: 'COMPLETED', purchase_units: [{ reference_id: 'deposit', payments: { authorizations: [{ id: 'AUTH-1', status: 'CREATED' }] } }] };
const problem = (issue: string, name = 'UNPROCESSABLE_ENTITY') => ({ name, message: 'The requested action could not be performed.', debug_id: 'abc123', details: [{ issue, description: issue }] });

describe('the happy path', () => {
  it('creates a $5 order that only holds money, and returns where to approve it', async () => {
    const { gateway, seen } = fakePayPal([{ status: 201, body: ORDER }]);
    const hold = await gateway.createHold({ amount: 5, reference: 'plan_1:per_1', requestId: 'dep_1:create' });

    expect(hold).toEqual({ orderId: 'ORDER-1', approveUrl: ORDER.links[0]!.href });
    expect(seen).toHaveLength(1);
    expect(seen[0]!.url).toContain('api-m.sandbox.paypal.com/v2/checkout/orders');
    expect(seen[0]!.headers['paypal-request-id']).toBe('dep_1:create');
    expect(seen[0]!.headers.authorization).toBe('Bearer test-token');
    expect(seen[0]!.body.intent).toBe('AUTHORIZE');
    expect(seen[0]!.body.purchase_units[0].amount).toEqual({ currency_code: 'USD', value: '5.00' });
    expect(seen[0]!.body.payment_source.paypal.experience_context.return_url).toBe('http://localhost:5173/');
  });

  it('places the hold on an approved order', async () => {
    const { gateway, seen } = fakePayPal([{ status: 201, body: AUTHORIZED }]);
    expect(await gateway.placeHold('ORDER-1', 'dep_1:hold')).toEqual({ authorizationId: 'AUTH-1' });
    expect(seen[0]!.url).toContain('/v2/checkout/orders/ORDER-1/authorize');
    expect(seen[0]!.headers['paypal-request-id']).toBe('dep_1:hold');
  });

  it('releases a hold by voiding it', async () => {
    const { gateway, seen } = fakePayPal([{ status: 204 }]);
    await gateway.release('AUTH-1', 'dep_1:release');
    expect(seen[0]!.url).toContain('/v2/payments/authorizations/AUTH-1/void');
    expect(seen[0]!.headers['paypal-request-id']).toBe('dep_1:release');
  });

  it('captures the full hold as a final capture', async () => {
    const { gateway, seen } = fakePayPal([{ status: 201, body: { id: 'CAP-1', status: 'COMPLETED' } }]);
    expect(await gateway.capture('AUTH-1', 5, 'dep_1:capture')).toEqual({ captureId: 'CAP-1' });
    expect(seen[0]!.url).toContain('/v2/payments/authorizations/AUTH-1/capture');
    expect(seen[0]!.body).toMatchObject({ amount: { currency_code: 'USD', value: '5.00' }, final_capture: true });
  });
});

describe('when PayPal misbehaves', () => {
  it('retries a 503 and succeeds, sending the same request id every time', async () => {
    const { gateway, seen } = fakePayPal([{ status: 503 }, { status: 503 }, { status: 201, body: ORDER }]);
    const hold = await gateway.createHold({ amount: 5, reference: 'r', requestId: 'dep_2:create' });
    expect(hold.orderId).toBe('ORDER-1');
    expect(seen).toHaveLength(3);
    expect(new Set(seen.map((s) => s.headers['paypal-request-id']))).toEqual(new Set(['dep_2:create']));
  });

  it('retries when rate-limited (429)', async () => {
    const { gateway, seen } = fakePayPal([{ status: 429, body: { name: 'RATE_LIMIT_REACHED' } }, { status: 201, body: { id: 'CAP-2' } }]);
    expect(await gateway.capture('AUTH-1', 5, 'dep_3:capture')).toEqual({ captureId: 'CAP-2' });
    expect(seen).toHaveLength(2);
  });

  it('gives up after its retries and says PayPal is having trouble', async () => {
    const { gateway, seen } = fakePayPal([{ status: 503 }]);
    await expect(gateway.release('AUTH-1', 'dep_4:release')).rejects.toThrow(/PayPal is having trouble/);
    expect(seen).toHaveLength(4); // one try plus three retries
  });

  it('does not retry a refusal, and explains an unapproved order in plain words', async () => {
    const { gateway, seen } = fakePayPal([{ status: 422, body: problem('ORDER_NOT_APPROVED') }]);
    const err = await gateway.placeHold('ORDER-1', 'dep_5:hold').catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect(err.message).toMatch(/has not been approved at PayPal yet/);
    expect(err.message).toMatch(/abc123/);
    expect(err.issue).toBe('ORDER_NOT_APPROVED');
    expect(seen).toHaveLength(1);
  });

  it('reports a declined payment method', async () => {
    const { gateway } = fakePayPal([{ status: 422, body: problem('INSTRUMENT_DECLINED') }]);
    await expect(gateway.placeHold('ORDER-1', 'dep_6:hold')).rejects.toThrow(/declined the payment method/);
  });

  it('treats releasing an already released hold as done', async () => {
    const { gateway } = fakePayPal([{ status: 422, body: problem('PREVIOUSLY_VOIDED') }]);
    await expect(gateway.release('AUTH-1', 'dep_7:release')).resolves.toBeUndefined();
  });

  it('refuses to capture a hold that was already released', async () => {
    const { gateway } = fakePayPal([{ status: 422, body: problem('AUTHORIZATION_VOIDED') }]);
    await expect(gateway.capture('AUTH-1', 5, 'dep_8:capture')).rejects.toThrow(/already released/);
  });

  it('reports an expired hold', async () => {
    const { gateway } = fakePayPal([{ status: 422, body: problem('AUTHORIZATION_EXPIRED') }]);
    await expect(gateway.capture('AUTH-1', 5, 'dep_9:capture')).rejects.toThrow(/expired/);
  });

  it('turns a network failure into a clear error', async () => {
    const gateway = new PayPalGateway({
      clientId: 'id', clientSecret: 'secret', returnUrl: 'http://x/', cancelUrl: 'http://x/', retryIntervalSeconds: 0.01,
      transport: async () => { throw new Error('getaddrinfo ENOTFOUND api-m.sandbox.paypal.com'); },
    });
    await expect(gateway.release('AUTH-1', 'dep_10:release')).rejects.toThrow(/could not be reached/);
  });
});

describe('configuration', () => {
  it('says so when the credentials are wrong', async () => {
    const { gateway } = fakePayPal([{ status: 201, body: ORDER }], { status: 401, body: { error: 'invalid_client', error_description: 'Client Authentication failed' } });
    await expect(gateway.createHold({ amount: 5, reference: 'r', requestId: 'dep_11:create' })).rejects.toThrow(/client ID or secret/);
  });

  it('is not built when .env has no real credentials', () => {
    expect(PayPalGateway.fromEnv({})).toBeUndefined();
    expect(PayPalGateway.fromEnv({ PAYPAL_CLIENT_ID: 'your-sandbox-client-id', PAYPAL_CLIENT_SECRET: 'your-sandbox-client-secret' })).toBeUndefined();
    expect(PayPalGateway.fromEnv({ PAYPAL_CLIENT_ID: 'abc', PAYPAL_CLIENT_SECRET: 'def' })).toBeInstanceOf(PayPalGateway);
  });

  it('refuses to start with empty credentials', () => {
    expect(() => new PayPalGateway({ clientId: '', clientSecret: '', returnUrl: 'x', cancelUrl: 'x' })).toThrow(/not configured/);
  });
});
