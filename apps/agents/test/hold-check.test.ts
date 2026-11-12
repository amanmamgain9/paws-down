import { describe, expect, it } from 'vitest';
import { checkHold, judgeHold, type AskWithTools, type PayPalTools } from '../src/hold-check.ts';

/**
 * The wingcat's look at a hold through PayPal's Agent Toolkit, with fakes in place of PayPal and
 * the model. These tests are about who decides: the model may look and talk, code gives the verdict.
 */

const ORDER = 'ORDER12345678901AB';
const order = (over: Record<string, unknown> = {}, hold: Record<string, unknown> | null = {}) => ({
  id: ORDER,
  intent: 'AUTHORIZE',
  status: 'COMPLETED',
  purchase_units: [
    {
      amount: { currency_code: 'USD', value: '5.00' },
      payments: hold === null ? {} : { authorizations: [{ id: 'AUTH1', status: 'CREATED', amount: { currency_code: 'USD', value: '5.00' }, ...hold }] },
    },
  ],
  ...over,
});
// The real toolkit wraps the order in two layers of JSON text.
const asToolText = (o: unknown) => JSON.stringify(JSON.stringify(o));

function fakePayPal(answer: unknown) {
  const lookedUp: unknown[] = [];
  const paypal: PayPalTools = {
    tools: [{ name: 'get_order', description: 'Look at an order', input_schema: { type: 'object' } }],
    call: async (_name, input) => {
      lookedUp.push(input);
      return asToolText(answer);
    },
  };
  return { paypal, lookedUp };
}
const input = { wingcat: 'Mochi', person: 'Maya', orderId: ORDER, amount: 5 };
/** A model that calls get_order with the given ID, then says the given words. */
const modelThat = (id: string | null, words: string): AskWithTools => async ({ call }) => {
  if (id) await call('get_order', { id });
  return words;
};

describe('judging a hold from what PayPal returns', () => {
  it('accepts an authorize-only order with a $5 hold that has not been charged', () => {
    expect(judgeHold(asToolText(order()), { orderId: ORDER, amount: 5 })).toMatchObject({ ok: true });
    expect(judgeHold(JSON.stringify(order()), { orderId: ORDER, amount: 5 })).toMatchObject({ ok: true });
  });

  it('rejects a hold that was voided or captured, a wrong amount, a charge, and a missing hold', () => {
    const judge = (o: unknown) => judgeHold(asToolText(o), { orderId: ORDER, amount: 5 });
    expect(judge(order({}, { status: 'VOIDED' }))).toMatchObject({ ok: false, why: expect.stringMatching(/voided/) });
    expect(judge(order({}, { status: 'CAPTURED' }))).toMatchObject({ ok: false, why: expect.stringMatching(/captured/) });
    expect(judge(order({}, { amount: { currency_code: 'USD', value: '50.00' } })).ok).toBe(false);
    expect(judge(order({ intent: 'CAPTURE' })).ok).toBe(false);
    expect(judge(order({}, null))).toMatchObject({ ok: false, why: expect.stringMatching(/no hold/) });
    expect(judge(order({ id: 'SOMEOTHERORDER12345' })).ok).toBe(false);
    expect(judgeHold('PayPal is down', { orderId: ORDER, amount: 5 }).ok).toBe(false);
  });
});

describe("a wingcat checking its person's hold", () => {
  it('uses the model\'s own words when the model looked and the hold is real', async () => {
    const { paypal } = fakePayPal(order());
    const check = await checkHold(input, paypal, modelThat(ORDER, 'I peeked at PayPal: your $5 is tucked away safely, not spent.'));
    expect(check).toMatchObject({ ok: true, modelLooked: true, note: 'I peeked at PayPal: your $5 is tucked away safely, not spent.' });
  });

  it('shows the model\'s words as plain text, without Markdown marks or emoji', async () => {
    const { paypal } = fakePayPal(order());
    const check = await checkHold(input, paypal, modelThat(ORDER, 'Good news: your $5 is only **held**, not charged. 🐾'));
    expect(check.note).toBe('Good news: your $5 is only held, not charged.');
  });

  it('never lets the model call a bad hold good', async () => {
    const { paypal } = fakePayPal(order({}, { status: 'VOIDED' }));
    const check = await checkHold(input, paypal, modelThat(ORDER, 'All good, your $5 is held!'));
    expect(check.ok).toBe(false);
    expect(check.note).toMatch(/could not confirm/);
    expect(check.note).not.toMatch(/All good/);
  });

  it('only lets the model look up its own person\'s order', async () => {
    const { paypal, lookedUp } = fakePayPal(order());
    const answers: string[] = [];
    const nosy: AskWithTools = async ({ call }) => {
      answers.push(await call('get_order', { id: 'SOMEONEELSE1234567' }));
      answers.push(await call('capture_order', { id: ORDER }));
      return 'Looks fine.';
    };
    const check = await checkHold(input, paypal, nosy);
    expect(answers[0]).toMatch(/only look up Maya's own order/);
    expect(answers[1]).toMatch(/not available/);
    // The model never saw the order, so the wingcat looked itself and used its own plain words.
    expect(lookedUp).toEqual([{ id: ORDER }]);
    expect(check).toMatchObject({ ok: true, modelLooked: false, note: expect.stringMatching(/I checked with PayPal myself/) });
  });

  it('still checks when there is no model, or the model cannot be reached', async () => {
    const { paypal, lookedUp } = fakePayPal(order());
    expect(await checkHold(input, paypal)).toMatchObject({ ok: true, modelLooked: false });
    const logs: string[] = [];
    const broken: AskWithTools = async () => {
      throw new Error('connection refused');
    };
    expect(await checkHold(input, paypal, broken, (l) => logs.push(l))).toMatchObject({ ok: true, modelLooked: false });
    expect(logs.join(' ')).toMatch(/could not reach the model/);
    expect(lookedUp).toHaveLength(2);
  });
});
