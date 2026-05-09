/**
 * SSR-safe date formatting utilities.
 *
 * `toLocaleString()` / `toLocaleDateString()` produce different output on
 * server (often UTC / en-US) vs client (user's locale/timezone), causing
 * React hydration mismatches (Error #418).
 *
 * These helpers use deterministic formatting that is identical on server
 * and client.
 */

/** Format as "Mar 17, 2026" (always en-US, UTC). Empty / null / undefined
 *  input returns empty string (mirrors the truncate helper's null handling
 *  per the Tier 1.4 hygiene cascade). Signature widened to accept null /
 *  undefined 2026-05-09 to absorb call sites with optional dates
 *  (e.g. Stripe invoice.createdAt which is string | null). */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Format as "Mar 17, 2026, 3:45 PM" (always en-US, UTC). Empty / null /
 *  undefined input returns empty string. Signature widened 2026-05-09 to
 *  match formatDate. */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}
