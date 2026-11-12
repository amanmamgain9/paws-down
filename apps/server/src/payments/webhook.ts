import { verify as verifySignature } from 'node:crypto';
import { crc32 } from 'node:zlib';

/**
 * Checks that a webhook really came from PayPal, without calling PayPal back.
 *
 * PayPal signs every webhook. The signed text is four values joined with "|":
 *
 *   <transmission id>|<transmission time>|<our webhook id>|<CRC32 of the raw body, as a decimal number>
 *
 * The signature (base64, RSA with SHA-256) arrives in the paypal-transmission-sig header, and the
 * certificate that checks it is at the address in paypal-cert-url.
 *
 * Three things are easy to get wrong, and each has a test in test/webhook.test.ts:
 *   1. The CRC must be taken over the exact bytes PayPal sent. Parsing the JSON and writing it
 *      out again changes the bytes, so the route keeps the raw body.
 *   2. The certificate address comes from the request, so an attacker could point it at their own
 *      certificate. We only fetch from PayPal's own hosts, over https.
 *   3. Our webhook id is part of the signed text. An event signed for someone else's webhook
 *      does not verify against ours.
 */

export class WebhookError extends Error {}

export interface WebhookVerifierOptions {
  /** The id PayPal gave this webhook in the developer dashboard. */
  webhookId: string;
  /** Test seam: returns the certificate (PEM) for an address instead of fetching it. */
  fetchCert?: (url: string) => Promise<string>;
}

const REQUIRED = ['paypal-transmission-id', 'paypal-transmission-time', 'paypal-transmission-sig', 'paypal-cert-url', 'paypal-auth-algo'] as const;
type Headers = Record<string, string | string[] | undefined>;

export class WebhookVerifier {
  private readonly certs = new Map<string, string>();

  constructor(private readonly options: WebhookVerifierOptions) {
    if (!options.webhookId) throw new WebhookError('PAYPAL_WEBHOOK_ID is not set.');
  }

  /** Builds the verifier from environment variables, or returns undefined when no webhook id is set. */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): WebhookVerifier | undefined {
    const webhookId = env.PAYPAL_WEBHOOK_ID?.trim();
    if (!webhookId || webhookId.startsWith('your-')) return undefined;
    return new WebhookVerifier({ webhookId });
  }

  /** Resolves when the signature is valid. Throws WebhookError, saying why, when it is not. */
  async verify(headers: Headers, rawBody: Buffer): Promise<void> {
    const h = {} as Record<(typeof REQUIRED)[number], string>;
    for (const name of REQUIRED) {
      const value = headers[name];
      if (typeof value !== 'string' || !value) throw new WebhookError(`The ${name} header is missing.`);
      h[name] = value;
    }
    if (h['paypal-auth-algo'] !== 'SHA256withRSA')
      throw new WebhookError(`Unsupported signature algorithm ${h['paypal-auth-algo']}.`);

    const cert = await this.certificate(h['paypal-cert-url']);
    const signed = `${h['paypal-transmission-id']}|${h['paypal-transmission-time']}|${this.options.webhookId}|${crc32(rawBody)}`;
    let ok = false;
    try {
      ok = verifySignature('RSA-SHA256', Buffer.from(signed), cert, Buffer.from(h['paypal-transmission-sig'], 'base64'));
    } catch {
      throw new WebhookError('The signing certificate could not be read.');
    }
    if (!ok) throw new WebhookError('The signature does not match.');
  }

  private async certificate(url: string): Promise<string> {
    if (!isPayPalHost(url)) throw new WebhookError('The certificate address is not a PayPal host.');
    const cached = this.certs.get(url);
    if (cached) return cached;
    let pem: string;
    try {
      pem = await (this.options.fetchCert ?? fetchPem)(url);
    } catch (err) {
      throw new WebhookError(`The signing certificate could not be fetched (${(err as Error).message}).`);
    }
    this.certs.set(url, pem);
    return pem;
  }
}

/** True only for https addresses on paypal.com or one of its subdomains. */
export function isPayPalHost(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === 'paypal.com' || u.hostname.endsWith('.paypal.com'));
  } catch {
    return false;
  }
}

async function fetchPem(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`PayPal answered ${res.status}`);
  return res.text();
}
