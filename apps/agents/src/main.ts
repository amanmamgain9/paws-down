import { PawsDownApiClient } from 'paws-down-api';
import { RuleBrain, type Brain } from './brain.ts';

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
const brain: Brain = new RuleBrain();
const THINKING_MS = Number(process.env.WINGCAT_THINKING_MS ?? 2500);
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
console.log(`Wingcats are watching ${baseUrl} (rule-based brain)`);
for (;;) {
  try {
    const state = (await (await fetch(`${baseUrl}/demo/state`)).json()) as { negotiations: OpenNegotiation[]; proposals: { negotiationId: string }[] };
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
