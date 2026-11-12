import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController,
  PaymentsController,
  PaypalExperienceUserAction,
  PaypalWalletContextShippingPreference,
} from '@paypal/paypal-server-sdk';
import { GatewayError, type HoldGateway } from '../gateway.ts';

/**
 * The $5 deposit as a PayPal hold, using the official PayPal Server SDK.
 *
 *   createHold  -> create order, intent AUTHORIZE   (the person then approves it at PayPal)
 *   placeHold   -> authorize the approved order     (money is held, not taken)
 *   release     -> void the authorization           (showed up: nothing is ever charged)
 *   capture     -> capture the authorization        (no-show: the $5 is kept)
 *
 * Written with the PayPal Context Plugin for this SDK. Three things it warned about shape this file:
 *   1. The SDK's default timeout is 0, which means "wait forever". We set one.
 *   2. The SDK's default retry budget is 0, so nothing is retried. We turn retries on.
 *   3. POST is not retried by default. Every call here sends a PayPal-Request-Id, which makes
 *      a repeated POST safe, so we add POST to the retried methods.
 * test/paypal-gateway.test.ts checks each of these against a stand-in PayPal that misbehaves.
 */

export interface PayPalGatewayOptions {
  clientId: string;
  clientSecret: string;
  /** Where PayPal sends the person after they approve or cancel. PayPal adds ?token=<order id>. */
  returnUrl: string;
  cancelUrl: string;
  /** Test seam: an axios adapter that answers instead of the network. Never set outside tests. */
  transport?: (config: any) => Promise<any>;
  /** Seconds between retries. Tests shrink this; the default suits the live sandbox. */
  retryIntervalSeconds?: number;
}

const CURRENCY = 'USD';
const money = (amount: number) => ({ currencyCode: CURRENCY, value: amount.toFixed(2) });

export class PayPalGateway implements HoldGateway {
  private readonly orders: OrdersController;
  private readonly payments: PaymentsController;

  constructor(private readonly options: PayPalGatewayOptions) {
    if (!options.clientId || !options.clientSecret)
      throw new GatewayError('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.');
    const client = new Client({
      // Sandbox only. This project never points at live PayPal.
      environment: Environment.Sandbox,
      clientCredentialsAuthCredentials: { oAuthClientId: options.clientId, oAuthClientSecret: options.clientSecret },
      timeout: 15_000,
      httpClientOptions: {
        retryConfig: {
          maxNumberOfRetries: 3,
          retryInterval: options.retryIntervalSeconds ?? 1,
          backoffFactor: 2,
          maximumRetryWaitTime: 20,
          // Off on purpose. Our failure tests showed that with this on, the SDK also re-sends
          // refusals such as a 422 "order not approved" four times. Timeouts are instead retried
          // one level up: settlement is re-run every second until it finishes, with the same
          // request ids, so a repeat can never charge twice.
          retryOnTimeout: false,
          httpStatusCodesToRetry: [408, 429, 500, 502, 503, 504],
          httpMethodsToRetry: ['GET', 'PUT', 'POST'],
        },
      },
      ...(options.transport ? { unstable_httpClientOptions: { adapter: options.transport } } : {}),
    });
    this.orders = new OrdersController(client);
    this.payments = new PaymentsController(client);
  }

  /** Builds the gateway from environment variables, or returns undefined when PayPal is not set up. */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): PayPalGateway | undefined {
    const clientId = env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = env.PAYPAL_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret || clientId.startsWith('your-')) return undefined;
    const web = (env.PAWS_DOWN_WEB_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    return new PayPalGateway({ clientId, clientSecret, returnUrl: `${web}/`, cancelUrl: `${web}/?cancelled=1` });
  }

  async createHold(input: { amount: number; reference: string; requestId: string }) {
    const order = await this.call('create the PayPal order', () =>
      this.orders.createOrder({
        paypalRequestId: input.requestId,
        prefer: 'return=representation',
        body: {
          intent: CheckoutPaymentIntent.Authorize,
          purchaseUnits: [
            {
              referenceId: 'deposit',
              customId: input.reference,
              description: 'Paws Down show-up deposit. Released when you show up.',
              amount: money(input.amount),
            },
          ],
          paymentSource: {
            paypal: {
              experienceContext: {
                brandName: 'Paws Down',
                returnUrl: this.options.returnUrl,
                cancelUrl: this.options.cancelUrl,
                userAction: PaypalExperienceUserAction.PayNow,
                shippingPreference: PaypalWalletContextShippingPreference.NoShipping,
              },
            },
          },
        },
      }),
    );
    const approveUrl = order.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href;
    if (!order.id || !approveUrl) throw new GatewayError('PayPal created the order but gave no approval link.');
    return { orderId: order.id, approveUrl };
  }

  async placeHold(orderId: string, requestId: string) {
    const order = await this.call('place the hold', () =>
      this.orders.authorizeOrder({ id: orderId, paypalRequestId: requestId, prefer: 'return=representation' }),
    );
    const authorizationId = order.purchaseUnits?.[0]?.payments?.authorizations?.[0]?.id;
    if (!authorizationId) throw new GatewayError('PayPal authorized the order but returned no authorization.');
    return { authorizationId };
  }

  async release(authorizationId: string, requestId: string): Promise<void> {
    try {
      await this.call('release the hold', () => this.payments.voidPayment({ authorizationId, paypalRequestId: requestId }));
    } catch (err) {
      // Releasing twice is fine: the money is already back with the person.
      if (err instanceof GatewayError && err.issue === 'PREVIOUSLY_VOIDED') return;
      throw err;
    }
  }

  async capture(authorizationId: string, amount: number, requestId: string) {
    const capture = await this.call('capture the hold', () =>
      this.payments.captureAuthorizedPayment({
        authorizationId,
        paypalRequestId: requestId,
        prefer: 'return=representation',
        body: { amount: money(amount), finalCapture: true, noteToPayer: 'Paws Down: missed date deposit.' },
      }),
    );
    if (!capture.id) throw new GatewayError('PayPal captured the hold but returned no capture id.');
    return { captureId: capture.id };
  }

  /** Runs one SDK call and turns every failure into a GatewayError with a plain message. */
  private async call<T>(doing: string, op: () => Promise<{ result: T }>): Promise<T> {
    try {
      return (await op()).result;
    } catch (err) {
      throw toGatewayError(doing, err);
    }
  }
}

const PLAIN: Record<string, string> = {
  ORDER_NOT_APPROVED: 'The hold has not been approved at PayPal yet.',
  PAYER_ACTION_REQUIRED: 'PayPal needs the person to finish approving the hold.',
  INSTRUMENT_DECLINED: 'PayPal declined the payment method. Try another one.',
  PREVIOUSLY_VOIDED: 'This hold was already released.',
  PREVIOUSLY_CAPTURED: 'This hold was already captured.',
  AUTHORIZATION_ALREADY_CAPTURED: 'This hold was already captured.',
  AUTHORIZATION_VOIDED: 'This hold was already released, so it cannot be captured.',
  AUTHORIZATION_EXPIRED: 'This hold expired before the date was settled.',
};

function toGatewayError(doing: string, err: unknown): GatewayError {
  if (err instanceof GatewayError) return err;
  if (err instanceof ApiError) {
    // Error payloads keep PayPal's own field names (debug_id, not debugId), and a bare ApiError
    // only fills `body`, so read both.
    const payload = (err.result ?? parse(err.body)) as { name?: string; message?: string; debug_id?: string; details?: { issue?: string }[] } | undefined;
    const issue = payload?.details?.[0]?.issue ?? payload?.name;
    const plain =
      err.statusCode === 401 ? 'PayPal rejected the client ID or secret. Check the sandbox credentials in .env.'
      : err.statusCode === 429 ? 'PayPal is rate-limiting us. Try again in a moment.'
      : err.statusCode >= 500 ? 'PayPal is having trouble right now. Try again in a moment.'
      : (issue && PLAIN[issue]) ?? payload?.message ?? `PayPal answered ${err.statusCode}.`;
    const debug = payload?.debug_id ? ` (PayPal debug id ${payload.debug_id})` : '';
    return new GatewayError(`Could not ${doing}: ${plain}${debug}`, { issue, status: err.statusCode });
  }
  // Network failures and timeouts come from the transport, not as ApiError.
  return new GatewayError(`Could not ${doing}: PayPal could not be reached (${(err as Error)?.message ?? 'unknown error'}).`);
}

function parse(body: unknown): unknown {
  if (typeof body !== 'string') return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}
