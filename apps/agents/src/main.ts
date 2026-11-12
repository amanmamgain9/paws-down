import { PawsDownApiClient } from 'paws-down-api';
import { RuleBrain, type Brain } from './brain.ts';
import { LlmBrain } from './llm-brain.ts';

/**
 * Runs the wingcats. Every action on the Paws Down API goes through the
 * APIMatic-generated SDK; the only other call is reading the demo feed to learn
 * which negotiations are waiting for a move.
 */
// Same .env as the server, so both sides agree on the API key.
try {
  process.loadEnvFile(new URL('../../../.env', import.meta.url));
} catch {
  // No .env: fall back to the demo key, as the server does.
}

const baseUrl = process.env.PAWS_DOWN_URL ?? 'http://localhost:4000';
const client = new PawsDownApiClient({
  apiKeyAuth: process.env.PAWS_DOWN_API_KEY ?? 'demo-key',
  serverOptions: { baseUrl },
});
// With an Anthropic key in .env the wingcats ask Claude. Without one they follow fixed rules,
// so the app still runs with no AI key at all. Either way the screens say which it is.
const key = process.env.ANTHROPIC_API_KEY ?? '';
const brainName: 'claude' | 'rules' = key && !key.startsWith('your-') ? 'claude' : 'rules';
const brain: Brain = brainName === 'claude' ? new LlmBrain() : new RuleBrain();
// The rule-based cats pause so their moves can be followed. Claude takes its own time to think.
const THINKING_MS = Number(process.env.WINGCAT_THINKING_MS ?? (brainName === 'claude' ? 400 : 2500));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface OpenNegotiation {
  id: string;
  status: string;
  turnPersonId?: string;
}

async function takeTurn(n: OpenNegotiation): Promise<void> {
  const personId = n.turnPersonId!;
  const [me, proposals, venues] = await Promise.all([
    client.people.getPerson({ personId }),
    client.negotiations.listProposals({ negotiationId: n.id }),
    client.venues.listVenues(),
  ]);
  const decision = await brain.decide({ me, proposals, venues, now: Date.now() });

  if (decision.kind === 'accept') {
    const res = await client.negotiations
      .acceptProposal({ negotiationId: n.id, proposalId: decision.proposalId, body: { personId } })
      .asApiResult();
    console.log(res.ok ? `${me.wingcatName} accepted.` : `${me.wingcatName} could not accept: ${res.message}`);
  } else if (decision.kind === 'propose') {
    const res = await client.negotiations
      .makeProposal({ negotiationId: n.id, body: { fromPersonId: personId, ...decision.proposal } })
      .asApiResult();
    console.log(res.ok ? `${me.wingcatName} proposed ${res.value.venue}.` : `${me.wingcatName}'s proposal was refused: ${res.message}`);
  } else {
    console.log(`${me.wingcatName} is stuck: ${decision.why}`);
    stuck.add(`${n.id}:${proposals.length}`);
  }
}

const stuck = new Set<string>();
console.log(`Wingcats are watching ${baseUrl} (${brainName === 'claude' ? 'asking Claude' : 'rule-based brain'})`);
for (;;) {
  try {
    const state = (await (await fetch(`${baseUrl}/demo/state`)).json()) as { wingcatBrain?: string; negotiations: OpenNegotiation[]; proposals: { negotiationId: string }[] };
    // Tell the server which brain is running, so the screens can say so.
    if (state.wingcatBrain !== brainName) {
      await fetch(`${baseUrl}/demo/wingcats`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brain: brainName }) });
    }
    for (const n of state.negotiations) {
      const round = state.proposals.filter((p) => p.negotiationId === n.id).length;
      if (n.status !== 'open' || !n.turnPersonId || stuck.has(`${n.id}:${round}`)) continue;
      await sleep(THINKING_MS);
      await takeTurn(n);
    }
  } catch (err) {
    console.error(`Wingcats hit a problem and will retry: ${(err as Error).message}`);
  }
  await sleep(700);
}
