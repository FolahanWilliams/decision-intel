/**
 * Priors draft handoff (locked 2026-05-10 per T2.3).
 *
 * Pre-container priors capture: when the user starts a new decision
 * BEFORE the container exists, we persist conviction + kill criteria +
 * micro-predictions to localStorage keyed off a stable draft key. On
 * container creation, the priors get flushed to the container via the
 * existing /api/decisions/[id]/priors endpoint.
 *
 * Paper anchor: Ch 1 / Finding #1 (formalization-reality discontinuity)
 * — the cognitive commitment is forged BEFORE the artefact lands.
 * Capturing conviction at the moment the user types the name (or
 * uploads the first doc) is the earliest the audit can fire ex-ante.
 */

const DRAFT_KEY = 'di-priors-draft-v1';

export interface DraftPriorsPayload {
  convictionLevel: 'low' | 'medium' | 'high' | 'very_high';
  convictionRationale: string;
  killCriteria: string[];
  microPredictions: Array<{
    prediction: string;
    horizonDays: number;
    confidence: number;
  }>;
  /** Stamped when draft was created; used to expire ancient drafts. */
  draftedAt: string;
}

export function saveDraftPriors(payload: DraftPriorsPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private browsing, quota)
  }
}

export function loadDraftPriors(): DraftPriorsPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPriorsPayload;
    // Expire drafts older than 24h — stale priors shouldn't auto-flush
    // onto unrelated future containers.
    const draftedAt = new Date(parsed.draftedAt).getTime();
    if (Date.now() - draftedAt > 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraftPriors(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignored
  }
}

/**
 * Fire-and-forget flush of cached priors to the container. Idempotent —
 * the API endpoint is `POST` but the underlying handler captures the
 * conviction snapshot ONCE per container (immutable for audit-comparison
 * shape). Subsequent calls update only the micro-prediction list.
 *
 * On any failure, leaves the draft in place so the user can retry from
 * the container detail page.
 */
export async function flushDraftPriorsToContainer(containerId: string): Promise<boolean> {
  const draft = loadDraftPriors();
  if (!draft) return false;
  try {
    const res = await fetch(`/api/decisions/${containerId}/priors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        convictionLevel: draft.convictionLevel,
        convictionRationale: draft.convictionRationale,
        killCriteria: draft.killCriteria,
        microPredictions: draft.microPredictions,
      }),
    });
    if (!res.ok) return false;
    clearDraftPriors();
    return true;
  } catch {
    return false;
  }
}
