import { randomBytes } from 'node:crypto';
import type { HoldGateway } from './gateway.ts';

/**
 * Practice mode: lets the screens be tried with no PayPal account at all.
 * No money and no PayPal call is involved, and the UI says so on every screen.
 * It is never used for the recorded demo, which runs against the PayPal sandbox.
 */
export class PracticeGateway implements HoldGateway {
  async createHold() {
    return { orderId: `practice_${randomBytes(4).toString('hex')}`, approveUrl: 'practice://approve' };
  }
  async placeHold(orderId: string) {
    return { authorizationId: `practice_auth_${orderId}` };
  }
  async release() {}
  async capture(authorizationId: string) {
    return { captureId: `practice_cap_${authorizationId}` };
  }
}
