import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { ApiError, type PawsDown } from './core.ts';
import { WebhookError, type WebhookVerifier } from './payments/webhook.ts';

/** HTTP routes. Paths and shapes follow apimatic/src/spec/openapi.yaml. */
export async function buildServer(app: PawsDown, apiKey: string, webhooks?: WebhookVerifier): Promise<FastifyInstance> {
  const http = Fastify();
  await http.register(cors, { origin: true });

  http.setErrorHandler((err, _req, reply) => {
    if (err instanceof ApiError) return reply.status(err.status).send({ code: err.code, message: err.message });
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.status(status).send({ code: 'bad_request', message: (err as Error).message });
    console.error(err);
    return reply.status(500).send({ code: 'internal_error', message: 'Something went wrong on the server.' });
  });

  // The API in the spec: every call needs the wingcat API key.
  await http.register(async (api) => {
    api.addHook('onRequest', async (req) => {
      if (req.headers['x-api-key'] !== apiKey) throw new ApiError(401, 'unauthorized', 'A valid X-Api-Key header is required.');
    });
    type P = Record<string, string>;
    type B = any; // request bodies are validated in core.ts

    api.post('/people', async (req, reply) => reply.status(201).send(app.createPerson(req.body as B)));
    api.get('/people/:personId', async (req) => app.getPerson((req.params as P).personId!));
    api.put('/people/:personId/preferences', async (req) => app.setPreferences((req.params as P).personId!, req.body as B));

    api.get('/venues', async () => app.listVenues());

    api.post('/negotiations', async (req, reply) => reply.status(201).send(app.startNegotiation(req.body as B)));
    api.get('/negotiations/:negotiationId', async (req) => app.getNegotiation((req.params as P).negotiationId!));
    api.get('/negotiations/:negotiationId/proposals', async (req) => app.listProposals((req.params as P).negotiationId!));
    api.post('/negotiations/:negotiationId/proposals', async (req, reply) =>
      reply.status(201).send(app.makeProposal((req.params as P).negotiationId!, req.body as B)),
    );
    api.post('/negotiations/:negotiationId/proposals/:proposalId/accept', async (req, reply) => {
      const { negotiationId, proposalId } = req.params as P;
      return reply.status(201).send(app.acceptProposal(negotiationId!, proposalId!, (req.body as B)?.personId));
    });

    api.get('/plans/:planId', async (req) => app.getPlan((req.params as P).planId!));
    api.post('/plans/:planId/approvals', async (req) => app.approvePlan((req.params as P).planId!, req.body as B));
    api.post('/plans/:planId/deposits', async (req, reply) =>
      reply.status(201).send(await app.createDeposit((req.params as P).planId!, (req.body as B)?.personId)),
    );
    api.post('/plans/:planId/deposits/:depositId/confirm', async (req) => {
      const { planId, depositId } = req.params as P;
      return app.confirmDeposit(planId!, depositId!);
    });
    api.post('/plans/:planId/checkins', async (req, reply) =>
      reply.status(201).send(app.checkIn((req.params as P).planId!, req.body as B)),
    );
    api.get('/plans/:planId/checkin-codes/:personId', async (req) => {
      const { planId, personId } = req.params as P;
      return app.getCheckInCode(planId!, personId!);
    });
    api.post('/plans/:planId/cancel', async (req) => app.cancelPlan((req.params as P).planId!, (req.body as B)?.personId));
    api.get('/plans/:planId/settlement', async (req) => app.getSettlement((req.params as P).planId!));
  });

  // Routes for the two people's own screens. People act for themselves here; wingcats use the API above.
  type P = Record<string, string>;
  type B = any;
  http.post('/app/people', async (req, reply) => reply.status(201).send(app.createPerson(req.body as B)));
  http.put('/app/people/:personId/preferences', async (req) => app.setPreferences((req.params as P).personId!, req.body as B));
  http.put('/app/people/:personId/photo', async (req) => app.setPhoto((req.params as P).personId!, (req.body as B)?.photo));
  http.post('/app/interests', async (req, reply) => reply.status(201).send(app.setInterest(req.body as B)));
  http.post('/app/negotiations', async (req, reply) => reply.status(201).send(app.startNegotiation(req.body as B)));
  http.post('/app/plans/:planId/approvals', async (req) => app.approvePlan((req.params as P).planId!, req.body as B));
  http.post('/app/plans/:planId/deposits', async (req, reply) =>
    reply.status(201).send(await app.createDeposit((req.params as P).planId!, (req.body as B)?.personId)),
  );
  http.post('/app/plans/:planId/deposits/:depositId/confirm', async (req) => {
    const { planId, depositId } = req.params as P;
    return app.confirmDeposit(planId!, depositId!);
  });
  http.post('/app/deposits/confirm', async (req) => app.confirmDepositForOrder((req.body as B)?.orderId));
  http.post('/app/plans/:planId/checkins', async (req, reply) =>
    reply.status(201).send(app.checkIn((req.params as P).planId!, req.body as B)),
  );
  http.get('/app/plans/:planId/checkin-codes/:personId', async (req) => {
    const { planId, personId } = req.params as P;
    return app.getCheckInCode(planId!, personId!);
  });
  http.post('/app/plans/:planId/cancel', async (req) => app.cancelPlan((req.params as P).planId!, (req.body as B)?.personId));

  // Demo-only routes for the screens: live events, a snapshot, and the simulated clock.
  // The wingcats say which brain they are running ('claude' or 'rules'), so the screens can show it.
  let wingcatBrain: 'claude' | 'rules' | undefined;
  http.post('/demo/wingcats', async (req) => {
    const brain = (req.body as { brain?: string })?.brain;
    if (brain !== 'claude' && brain !== 'rules') throw new ApiError(400, 'bad_request', "brain must be 'claude' or 'rules'.");
    wingcatBrain = brain;
    return { brain };
  });
  http.get('/demo/state', async () => ({ ...app.snapshot(), wingcatBrain, events: app.recentEvents() }));
  http.post('/demo/clock', async (req) => {
    await app.advanceClockTo((req.body as { to?: string })?.to ?? '');
    return { now: new Date(app.now()).toISOString() };
  });
  http.post('/demo/reset', async () => {
    app.reset();
    return { ok: true };
  });
  // Creates the invented demo people.
  http.post('/demo/seed', async () => {
    app.reset();
    // Maya and Jake are the two people the screens follow. Each sets up their own profile.
    const maya = app.createPerson({ name: 'Maya', wingcatName: 'Mochi' });
    const jake = app.createPerson({ name: 'Jake', wingcatName: 'Biscuit' });
    // Three more people who already have profiles, so there is someone to swipe past.
    const slot = (days: number, hour: number, hours: number) => {
      const start = new Date(app.now());
      start.setDate(start.getDate() + days);
      start.setHours(hour, 0, 0, 0);
      return { start: start.toISOString(), end: new Date(start.getTime() + hours * 3_600_000).toISOString() };
    };
    const others = [
      { name: 'Jordan', wingcatName: 'Pudding', prefs: { freeSlots: [slot(2, 19, 3)], maxBudget: 40, areas: ['Uptown'], likes: ['cocktails', 'art'], dealbreakers: ['board games'], intent: 'casual' as const } },
      { name: 'Riley', wingcatName: 'Tofu', prefs: { freeSlots: [slot(3, 12, 3)], maxBudget: 20, areas: ['Riverside'], likes: ['cats', 'cake', 'coffee'], dealbreakers: [], intent: 'not_sure' as const } },
      { name: 'Casey', wingcatName: 'Noodle', prefs: { freeSlots: [slot(1, 18, 3)], maxBudget: 30, areas: ['Downtown', 'Riverside'], likes: ['pizza', 'live music'], dealbreakers: ['cocktails'], intent: 'serious' as const } },
    ];
    for (const o of others) app.setPreferences(app.createPerson(o).id, o.prefs);
    return { mayaId: maya.id, jakeId: jake.id };
  });
  // PayPal webhooks. This route keeps the body as raw bytes, because the signature covers the
  // exact bytes PayPal sent. Nothing is trusted, or even parsed, until the signature checks out.
  await http.register(async (hook) => {
    hook.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    hook.post('/webhooks/paypal', async (req, reply) => {
      if (!webhooks) throw new ApiError(503, 'webhooks_not_configured', 'Set PAYPAL_WEBHOOK_ID in .env to accept PayPal webhooks.');
      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      try {
        await webhooks.verify(req.headers, raw);
      } catch (err) {
        if (err instanceof WebhookError) throw new ApiError(401, 'bad_signature', `This did not come from PayPal: ${err.message}`);
        throw err;
      }
      let event: unknown;
      try {
        event = JSON.parse(raw.toString('utf8'));
      } catch {
        throw new ApiError(400, 'bad_event', 'The event is not valid JSON.');
      }
      return reply.status(200).send(await app.handlePayPalEvent(event as any));
    });
  });

  http.get('/demo/events', (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    const send = (e: unknown) => reply.raw.write(`data: ${JSON.stringify(e)}\n\n`);
    for (const e of app.recentEvents()) send(e);
    const stop = app.subscribe(send);
    req.raw.on('close', stop);
  });

  return http;
}
