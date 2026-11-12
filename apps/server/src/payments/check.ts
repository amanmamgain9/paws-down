/**
 * A two-step check that your sandbox credentials work, run by you from the terminal.
 *
 *   npm run paypal:check              step 1: creates a $5 hold order and prints where to approve it
 *   npm run paypal:check -- <order>   step 2: places the hold on that order, then releases it
 *
 * It reads PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET from .env and never prints them.
 */
import { randomUUID } from 'node:crypto';
import { PayPalGateway } from './paypal-gateway.ts';

try {
  process.loadEnvFile(new URL('../../../../.env', import.meta.url));
} catch {
  // Reported below as "not configured".
}

const gateway = PayPalGateway.fromEnv();
if (!gateway) {
  console.error('PayPal is not configured. Copy .env.example to .env and put your sandbox client ID and secret in it.');
  process.exit(1);
}

const orderId = process.argv[2];
try {
  if (!orderId) {
    const hold = await gateway.createHold({ amount: 5, reference: 'sandbox-check', requestId: `check:${randomUUID()}` });
    console.log('Credentials work. PayPal created a $5 hold order.\n');
    console.log(`1. Open this and approve it with a sandbox PERSONAL (buyer) account:\n   ${hold.approveUrl}\n`);
    console.log(`2. Then run:\n   npm run paypal:check -- ${hold.orderId}`);
  } else {
    const { authorizationId } = await gateway.placeHold(orderId, `check:${orderId}:hold`);
    console.log(`Hold placed. Authorization ${authorizationId}.`);
    await gateway.release(authorizationId, `check:${orderId}:release`);
    console.log('Hold released. Nothing was charged. The sandbox is ready for Paws Down.');
  }
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
