/**
 * Founder Hub auth helper.
 *
 * SECURITY: Server API routes MUST validate against a server-only secret
 * (`FOUNDER_HUB_PASS`), NOT the client-visible `NEXT_PUBLIC_FOUNDER_HUB_PASS`.
 * Anything with the `NEXT_PUBLIC_` prefix is inlined into the client bundle
 * at build time and can be extracted by anyone who views the Founder Hub in
 * a browser — making it useless as an API credential.
 *
 * Migration: during rollout, this helper accepts either env var so APIs
 * keep working while `FOUNDER_HUB_PASS` is being set on Vercel. Once it
 * is set to a DIFFERENT value from the NEXT_PUBLIC one, the leaked value
 * stops working.
 */
import { safeCompare } from './safe-compare';
import { createLogger } from './logger';

const log = createLogger('FounderAuth');

export interface FounderAuthResult {
  ok: boolean;
  /** Present when ok=false. Use as the API response reason. */
  reason?: 'not_configured' | 'unauthorized';
}

/**
 * Verify a request header against the founder pass.
 * Returns { ok: true } when authorized; otherwise includes a reason.
 */
export function verifyFounderPass(headerValue: string | null | undefined): FounderAuthResult {
  const serverPass = process.env.FOUNDER_HUB_PASS?.trim();
  const publicPass = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS?.trim();

  const effectivePass = serverPass || publicPass;
  if (!effectivePass) {
    return { ok: false, reason: 'not_configured' };
  }

  // Warn once per cold start if we're still relying on the leaky public var.
  if (!serverPass && publicPass) {
    log.warn(
      'Founder Hub auth is using NEXT_PUBLIC_FOUNDER_HUB_PASS — this value is ' +
        'exposed to all website visitors via the client bundle. Set a distinct ' +
        'server-only FOUNDER_HUB_PASS on Vercel to close the leak.',
    );
  }

  const header = (headerValue ?? '').trim();
  if (!header || !safeCompare(header, effectivePass)) {
    return { ok: false, reason: 'unauthorized' };
  }
  return { ok: true };
}
