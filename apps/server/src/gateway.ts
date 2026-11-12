/**
 * The payment operations the app needs. The PayPal implementation lives in
 * payments/; nothing else in the server talks to PayPal.
 *
 * Every call takes a requestId so a retry of the same step is idempotent.
 */
export interface HoldGateway {
  /** Creates an order for a refundable hold and returns where the person approves it. */
  createHold(input: { amount: number; reference: string; requestId: string }): Promise<{
    orderId: string;
    approveUrl: string;
  }>;
  /** Places the hold once the person has approved the order. */
  placeHold(orderId: string, requestId: string): Promise<{ authorizationId: string }>;
  /** Releases a hold: the money goes back to the person. */
  release(authorizationId: string, requestId: string): Promise<void>;
  /** Captures a hold: the person loses the deposit. */
  capture(authorizationId: string, amount: number, requestId: string): Promise<{ captureId: string }>;
}

export class GatewayError extends Error {
  /** The payment provider's own name for the problem, when it gave one (for example ORDER_NOT_APPROVED). */
  readonly issue?: string;
  /** The HTTP status the provider answered with, when it answered at all. */
  readonly status?: number;
  constructor(message: string, details: { issue?: string; status?: number } = {}) {
    super(message);
    this.issue = details.issue;
    this.status = details.status;
  }
}

/** Used when no PayPal credentials are configured. Fails loudly; never pretends. */
export class UnconfiguredGateway implements HoldGateway {
  private fail(): never {
    throw new GatewayError(
      'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.',
    );
  }
  async createHold(): Promise<never> {
    this.fail();
  }
  async placeHold(): Promise<never> {
    this.fail();
  }
  async release(): Promise<never> {
    this.fail();
  }
  async capture(): Promise<never> {
    this.fail();
  }
}
