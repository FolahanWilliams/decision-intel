/**
 * Next.js request helpers — consolidated 2026-04-27 during the slop-scan
 * Phase 3 dedup. `extractIp` was previously copy-pasted across 3
 * IP-rate-limited public endpoints (demo/run, design-partner/apply,
 * billing/enterprise-quote-public).
 */

import type { NextRequest } from 'next/server';

/** Best-effort client IP extraction from x-forwarded-for / x-real-ip
 *  headers. Returns 'unknown' when neither is present. Used for IP-based
 *  rate limiting on anonymous public endpoints. */
export function extractIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}
