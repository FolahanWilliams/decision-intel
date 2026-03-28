/**
 * Lightweight product analytics — fires events to internal API.
 * Client-side only. Fire-and-forget pattern.
 */

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  // Fire and forget — don't await
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, properties: properties ?? {} }),
  }).catch(() => {
    // Silently ignore analytics failures
  });
}
