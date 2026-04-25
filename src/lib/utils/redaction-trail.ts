/**
 * Client-side helpers for the redaction audit trail (3.2 deep).
 *
 * The procurement bar: "prove you redacted before sending the memo, and
 * never log the originals." This module computes SHA-256 hashes of the
 * original and redacted texts entirely in the browser so the audit row
 * the server stores carries integrity evidence without any of the PII.
 *
 * The placeholder map is the inverse — it maps `[NAME_1] → "Real Name"`.
 * For the redactor's own replay UX it lives in sessionStorage on their
 * browser only. It NEVER touches the server. Other readers (teammates,
 * shared-link viewers) see the redacted text without the map and so see
 * only placeholders.
 */

import type { RedactionCategory } from './redaction-scanner';

export interface RedactionTrailPayload {
  /** Analysis row to attach the audit log to. May be undefined for paste-flows that haven't created an analysis yet. */
  analysisId?: string;
  /** SHA-256 of the original (un-redacted) memo. Hex. Empty when action='skipped' to make explicit nothing was scrubbed. */
  originalHash: string;
  /** SHA-256 of the text actually submitted (redacted = post-replacement, skipped = same as original). Hex. */
  submittedHash: string;
  /** What did the scanner find before the user picked. */
  detectedCounts: Record<RedactionCategory, number>;
  /** What did the user choose to redact. */
  redactedCounts: Record<RedactionCategory, number>;
  /** Outcome — applied = user clicked Redact; skipped = user continued without; cancelled means we don't log at all. */
  action: 'applied' | 'skipped';
  /** Free-form source surface — 'dashboard_paste' | 'demo_paste' | 'cognitive_audit' — used for analytics drilldowns. */
  source: string;
  /** How many unique placeholders were emitted (≥0; 0 when skipped). */
  placeholderCount: number;
}

const PLACEHOLDER_MAP_KEY_PREFIX = 'di-redaction-map-';

export interface PlaceholderMapEntry {
  /** Stable placeholder string the redacted text contains, e.g. `[NAME_1]`. */
  placeholder: string;
  /** Original value that was replaced. CLIENT ONLY — never sent to server. */
  original: string;
  /** Category that produced the placeholder, for UI grouping. */
  category: RedactionCategory;
}

/**
 * Compute a SHA-256 hex digest using the Web Crypto API. Pure browser
 * call; never imports server crypto so the bundle stays clean.
 */
export async function sha256Hex(input: string): Promise<string> {
  if (!input) return '';
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * Persist a placeholder map locally. Keyed by analysisId so the same
 * doc's audit page can replay later. We deliberately use sessionStorage
 * (not localStorage) so the map clears at tab close — the goal is to
 * support an in-session replay, not a permanent client-side ledger.
 */
export function savePlaceholderMap(
  analysisId: string,
  entries: PlaceholderMapEntry[]
): void {
  if (typeof window === 'undefined' || !analysisId) return;
  try {
    sessionStorage.setItem(
      `${PLACEHOLDER_MAP_KEY_PREFIX}${analysisId}`,
      JSON.stringify(entries)
    );
  } catch {
    // QuotaExceeded / disabled storage — not fatal; the placeholders
    // simply cannot be revealed locally.
  }
}

export function loadPlaceholderMap(analysisId: string): PlaceholderMapEntry[] | null {
  if (typeof window === 'undefined' || !analysisId) return null;
  try {
    const raw = sessionStorage.getItem(`${PLACEHOLDER_MAP_KEY_PREFIX}${analysisId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaceholderMapEntry[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlaceholderMap(analysisId: string): void {
  if (typeof window === 'undefined' || !analysisId) return;
  try {
    sessionStorage.removeItem(`${PLACEHOLDER_MAP_KEY_PREFIX}${analysisId}`);
  } catch {
    // ignore
  }
}

/**
 * Send the redaction audit row to the server. Fire-and-forget — the
 * audit trail is a defense-in-depth nice-to-have; an offline browser
 * shouldn't kill the submission.
 */
export async function postRedactionTrail(payload: RedactionTrailPayload): Promise<void> {
  try {
    await fetch('/api/redaction/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // No-op; we'd rather lose one audit row than block the user flow.
  }
}
