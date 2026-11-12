import Anthropic from '@anthropic-ai/sdk';
import { PayPalAgentToolkit } from '@paypal/agent-toolkit/bedrock';

/**
 * A wingcat's own look at its person's hold, made with PayPal's Agent Toolkit.
 *
 * The toolkit is set up with one action, `orders.get`, so the only PayPal tool a wingcat has is
 * `get_order`. It can look at an order. It has no tool that creates, captures or voids anything.
 * The model decides to look and writes the sentence its person reads; code decides whether the
 * hold is really there.
 */

/** The PayPal tools a wingcat is allowed to use, in the shape the Anthropic SDK takes. */
export interface PayPalTools {
  tools: { name: string; description: string; input_schema: { type: 'object'; [key: string]: unknown } }[];
  call(name: string, input: unknown): Promise<string>;
}

/** PayPal's Agent Toolkit with only "get an order" switched on. */
export function payPalLookOnly(clientId: string, clientSecret: string, sandbox = true): PayPalTools {
  const kit = new PayPalAgentToolkit({
    clientId,
    clientSecret,
    configuration: { actions: { orders: { get: true } }, context: { sandbox } },
  });
  return {
    tools: kit.getTools().map((t) => {
      const { $schema: _drop, ...schema } = t.toolSpec.inputSchema.json as Record<string, unknown>;
      return { name: t.toolSpec.name, description: t.toolSpec.description.trim(), input_schema: { ...schema, type: 'object' as const } };
    }),
    async call(name, input) {
      const res = await kit.handleToolCall({ toolUseId: 'wingcat', name, input });
      return res.content.map((c) => c.text).join('');
    },
  };
}

export interface Verdict {
  ok: boolean;
  why: string;
}

/** The toolkit returns the order as JSON text, sometimes wrapped in a second layer of JSON. */
function parseOrder(text: string): any {
  let value: unknown = text;
  for (let i = 0; i < 3 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value && typeof value === 'object' ? value : undefined;
}

/** What code requires before it calls a hold real: the right order, authorize-only, the right money, still held. */
export function judgeHold(orderText: string, expected: { orderId: string; amount: number }): Verdict {
  const order = parseOrder(orderText);
  if (!order) return { ok: false, why: 'PayPal did not return an order' };
  if (order.id !== expected.orderId) return { ok: false, why: 'PayPal returned a different order' };
  if (order.intent !== 'AUTHORIZE') return { ok: false, why: `the order is ${order.intent ?? 'of an unknown kind'}, not a hold` };
  const unit = order.purchase_units?.[0];
  const hold = unit?.payments?.authorizations?.[0];
  if (!hold) return { ok: false, why: 'PayPal shows no hold on the order yet' };
  if (hold.status !== 'CREATED') return { ok: false, why: `PayPal says the hold is ${String(hold.status).toLowerCase()}` };
  const money = hold.amount ?? unit.amount;
  if (money?.currency_code !== 'USD' || Number(money?.value) !== expected.amount)
    return { ok: false, why: `the hold is for ${money?.value} ${money?.currency_code}, not $${expected.amount}` };
  return { ok: true, why: `PayPal shows a $${expected.amount} hold that has not been charged` };
}

/** One conversation with the model, tools included. Returns the model's last words. Tests replace it with a fake. */
export type AskWithTools = (args: {
  system: string;
  user: string;
  tools: PayPalTools['tools'];
  call: (name: string, input: unknown) => Promise<string>;
}) => Promise<string | null>;

const MODEL = process.env.WINGCAT_MODEL ?? 'claude-opus-5-5';

/** Lets Claude call the tools it was given, a few rounds at most, then returns what it says. */
export function claudeWithTools(client = new Anthropic()): AskWithTools {
  return async ({ system, user, tools, call }) => {
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: user }];
    for (let round = 0; round < 4; round++) {
      const res = await client.messages.create({ model: MODEL, max_tokens: 1000, system, tools, messages, output_config: { effort: 'low' } });
      if (res.stop_reason !== 'tool_use') {
        const said = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join(' ').trim();
        return said || null;
      }
      messages.push({ role: 'assistant', content: res.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type === 'tool_use') results.push({ type: 'tool_result', tool_use_id: block.id, content: await call(block.name, block.input) });
      }
      messages.push({ role: 'user', content: results });
    }
    return null;
  };
}

export interface HoldCheck {
  ok: boolean;
  /** What the person reads on their phone. */
  note: string;
  /** Why code reached its verdict. */
  why: string;
  /** True when the model itself called the PayPal tool. */
  modelLooked: boolean;
}

/**
 * Checks one hold. The wingcat may only look up its own person's order. Whatever the model says,
 * the verdict comes from `judgeHold`, and a failed verdict is never worded by the model.
 */
export async function checkHold(
  input: { wingcat: string; person: string; orderId: string; amount: number },
  paypal: PayPalTools,
  ask?: AskWithTools,
  log: (line: string) => void = console.warn,
): Promise<HoldCheck> {
  let seen: string | undefined;
  const call = async (name: string, toolInput: unknown): Promise<string> => {
    if (name !== 'get_order') return 'That tool is not available to you.';
    if ((toolInput as { id?: unknown })?.id !== input.orderId) return `You may only look up ${input.person}'s own order.`;
    seen = await paypal.call('get_order', { id: input.orderId });
    return seen;
  };

  let said: string | null = null;
  if (ask) {
    try {
      said = await ask({
        system: [
          `You are ${input.wingcat}, a cat who acts as ${input.person}'s wingcat on Paws Down, a dating app where both people put $${input.amount} down as a PayPal hold before a first date.`,
          `You can look at ${input.person}'s PayPal order with the get_order tool. You can only look. You cannot create, capture or void anything.`,
          `Look the order up, then tell ${input.person} in one or two short sentences, warm and a little playful, what PayPal says about their hold. Say plainly whether the money is held or has been charged. Do not mention order IDs.`,
        ].join('\n'),
        user: `${input.person} has just put a paw down. Their PayPal order ID is ${input.orderId}. Check it.`,
        tools: paypal.tools,
        call,
      });
    } catch (err) {
      log(`${input.wingcat} could not reach the model for the hold check (${(err as Error).message}). Checking without it.`);
    }
  }
  const modelLooked = seen !== undefined;
  // If the model never looked, the wingcat still looks, through the same toolkit.
  if (seen === undefined) seen = await paypal.call('get_order', { id: input.orderId });

  const verdict = judgeHold(seen, input);
  const words = said?.trim().slice(0, 240);
  const note = !verdict.ok
    ? `I could not confirm your hold with PayPal: ${verdict.why}.`
    : modelLooked && words
      ? words
      : `I checked with PayPal myself: your $${input.amount} is held, not charged.`;
  return { ok: verdict.ok, note, why: verdict.why, modelLooked };
}
