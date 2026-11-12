import { mkdirSync } from 'node:fs';
import { PawsDown } from './core.ts';
import { UnconfiguredGateway } from './gateway.ts';
import { buildServer } from './http.ts';
import { PayPalGateway } from './payments/paypal-gateway.ts';
import { WebhookVerifier } from './payments/webhook.ts';
import { PracticeGateway } from './practice-gateway.ts';
import { Store } from './store.ts';

// Secrets live only in the repo's .env file, which is never committed.
try {
  process.loadEnvFile(new URL('../../../.env', import.meta.url));
} catch {
  // No .env yet. That is fine: the server says PayPal is not connected.
}

const port = Number(process.env.PORT ?? 4000);
const apiKey = process.env.PAWS_DOWN_API_KEY ?? 'demo-key';

mkdirSync('data', { recursive: true });
const store = new Store(process.env.PAWS_DOWN_DB ?? 'data/paws-down.sqlite');

// Three modes, in this order:
//   practice       asked for with PAWS_DOWN_PRACTICE=1: no PayPal call at all, and every screen says so.
//   paypal_sandbox sandbox credentials are in .env: real PayPal sandbox holds.
//   not_connected  neither: deposits fail with a clear error. Nothing is ever faked silently.
const paypal = process.env.PAWS_DOWN_PRACTICE === '1' ? undefined : PayPalGateway.fromEnv();
const app =
  process.env.PAWS_DOWN_PRACTICE === '1'
    ? new PawsDown(store, new PracticeGateway(), 'practice')
    : paypal
      ? new PawsDown(store, paypal, 'paypal_sandbox')
      : new PawsDown(store, new UnconfiguredGateway(), 'not_connected');
setInterval(() => void app.tick(), 1000).unref();

// Webhooks only make sense with real PayPal, and only once a webhook id is in .env.
const webhooks = paypal ? WebhookVerifier.fromEnv() : undefined;
const http = await buildServer(app, apiKey, webhooks);
await http.listen({ port, host: '0.0.0.0' });
console.log(`Paws Down server listening on http://localhost:${port} (payments: ${app.paymentMode}, PayPal webhooks: ${webhooks ? 'on' : 'off'})`);
