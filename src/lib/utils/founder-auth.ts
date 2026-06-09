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

  if (!serverPass && !publicPass) {
    return { ok: false, reason: 'not_configured' };
  }

  const header = (headerValue ?? '').trim();
  if (!header) {
    return { ok: false, reason: 'unauthorized' };
  }

  // Accept EITHER the server-only pass or the client-visible pass.
  //
  // Previously the check used `serverPass || publicPass` which meant that
  // once FOUNDER_HUB_PASS was set to a distinct value from the public var,
  // the founder's own UI (which only has access to NEXT_PUBLIC_...) could
  // no longer authenticate, locking the founder out of their own chat.
  //
  // Accepting either value keeps both access paths working:
  //   - server/CI scripts use FOUNDER_HUB_PASS (the "real" secret)
  //   - the in-app UI uses NEXT_PUBLIC_FOUNDER_HUB_PASS (human convenience)
  // The Founder Hub page itself already sits behind Supabase auth (only a
  // signed-in platform user can load it), so the public value is not a
  // bare-internet credential — it's a second factor.
  if (serverPass && safeCompare(header, serverPass)) return { ok: true };
  if (publicPass && safeCompare(header, publicPass)) return { ok: true };

  // Warn once per cold start if we're still relying solely on the leaky
  // public var — surfaces the config gap without breaking anything.
  if (!serverPass && publicPass) {
    log.warn(
      'Founder Hub auth is relying on NEXT_PUBLIC_FOUNDER_HUB_PASS only — ' +
        'set a distinct server-only FOUNDER_HUB_PASS on Vercel so machine ' +
        'credentials can differ from the UI credential.'
    );
  }

  return { ok: false, reason: 'unauthorized' };
}

/**
 * Cost-burn cap for founder-hub/founder-os LLM endpoints (locked 2026-06-09
 * security sweep). These routes are pass-gated but the UI credential
 * (NEXT_PUBLIC_FOUNDER_HUB_PASS) is bundle-extractable by any signed-in user,
 * and every call costs real LLM spend — without a throttle, a leaked pass is
 * an unbounded credit-burn vector. 30/min/route is far above any human
 * founder's drill cadence, so the cap never bites legitimate use.
 *
 * failMode 'open' is deliberate: this is a COST cap, not a security boundary
 * (the pass check is) — a transient DB blip must never lock the founder out
 * of his own cockpit mid-BAFTA-prep.
 *
 * Returns true when the request is allowed. Call AFTER the pass check so
 * unauthenticated probes don't consume the window.
 */
export async function checkFounderHubLlmRateLimit(routeName: string): Promise<boolean> {
  try {
    const { checkRateLimit } = await import('./rate-limit');
    const result = await checkRateLimit('founder-hub', `/api/founder-hub-llm/${routeName}`, {
      maxRequests: 30,
      windowMs: 60_000,
      failMode: 'open',
    });
    return result.success;
  } catch (err) {
    // Fail open — see above; the limiter degrading must not break the hub.
    log.warn('Founder-hub LLM rate-limit check failed, allowing request:', err);
    return true;
  }
}
