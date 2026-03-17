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

/** Format as "Mar 17, 2026" (always en-US, UTC) */
export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Format as "Mar 17, 2026, 3:45 PM" (always en-US, UTC) */
export function formatDateTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}
