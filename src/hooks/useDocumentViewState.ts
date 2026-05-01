'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

/**
 * useDocumentViewState — the 3-state adaptive document detail page state machine.
 *
 * Locked 2026-05-01 from NotebookLM master-KB synthesis Q5. The user's intent
 * on `/documents/[id]` is NOT static; it shifts based on where they are in
 * the decision lifecycle. A single static page is wrong because it forces
 * one intent onto every visit. This hook resolves the right state from
 * three signals (in priority order):
 *
 *   1. URL `?mode=discovery|rehearsal|provenance|analyst` — explicit override.
 *   2. Outcome status — `outcome_logged` snaps to provenance (deliverable).
 *   3. Visit count — first visit = discovery; subsequent = rehearsal.
 *
 * State semantics:
 *   - `discovery`  — "Did I mess up? How bad?" (fresh upload, first read)
 *   - `rehearsal`  — "Walking into committee in 10 min — what will they ask?"
 *   - `provenance` — "Decision is made. Prove rigor to GC / board / LP."
 *   - `analyst`    — power-user dashboard (existing dense layout, escape hatch)
 *
 * Visit-count tracking: localStorage `di-doc-visits-{documentId}`. First
 * mount on a document increments the counter, so a user landing immediately
 * after upload is `visit_count = 1`. Server-side authoritative count is a
 * Phase-N follow-up; localStorage is the right tradeoff for tonight.
 */

export type DocumentViewState = 'discovery' | 'rehearsal' | 'provenance' | 'analyst';

const VALID_STATES: readonly DocumentViewState[] = [
  'discovery',
  'rehearsal',
  'provenance',
  'analyst',
] as const;

interface UseDocumentViewStateInput {
  documentId: string;
  outcomeStatus?: string | null | undefined;
  /** Optional: when null, the analysis hasn't completed — the page should
   *  show a pending-audit state and skip auto-state-detection. */
  hasAnalysis: boolean;
}

interface UseDocumentViewStateOutput {
  state: DocumentViewState;
  /** Set the state explicitly. Updates ?mode= in the URL so the choice
   *  persists across reloads. */
  setState: (next: DocumentViewState) => void;
  /** True when the state was forced by ?mode= URL param vs. auto-detected. */
  isOverridden: boolean;
  /** Visit count for this document on this device (1-indexed). */
  visitCount: number;
}

/** Coerce an unknown string into a valid DocumentViewState or null. */
function parseState(s: string | null | undefined): DocumentViewState | null {
  if (!s) return null;
  return (VALID_STATES as readonly string[]).includes(s) ? (s as DocumentViewState) : null;
}

/** Read + increment the per-document visit counter. Idempotent within a
 *  page mount — only the first call per mount bumps the counter. */
function bumpVisitCount(documentId: string): number {
  if (typeof window === 'undefined') return 1;
  const key = `di-doc-visits-${documentId}`;
  try {
    const raw = window.localStorage.getItem(key);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
    window.localStorage.setItem(key, String(next));
    return next;
  } catch {
    // localStorage unavailable (private mode Safari, etc.) — fall back to 1.
    return 1;
  }
}

/** Auto-derive the state from outcome status + visit count, ignoring URL. */
function deriveState(opts: { outcomeStatus?: string | null; visitCount: number }): DocumentViewState {
  if (opts.outcomeStatus === 'outcome_logged') return 'provenance';
  if (opts.visitCount > 1) return 'rehearsal';
  return 'discovery';
}

export function useDocumentViewState({
  documentId,
  outcomeStatus,
  hasAnalysis,
}: UseDocumentViewStateInput): UseDocumentViewStateOutput {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Visit count: bump once per documentId per mount. Lazy-init so SSR
  // returns 1 (matches the bump fallback) and we don't double-increment.
  const [visitCount, setVisitCount] = useState<number>(1);
  useEffect(() => {
    if (!documentId || !hasAnalysis) return;
    const next = bumpVisitCount(documentId);
    setVisitCount(next);
  }, [documentId, hasAnalysis]);

  const overrideFromUrl = parseState(searchParams.get('mode'));

  const state = useMemo<DocumentViewState>(() => {
    if (overrideFromUrl) return overrideFromUrl;
    if (!hasAnalysis) return 'discovery'; // empty page = discovery shell with pending state
    return deriveState({ outcomeStatus, visitCount });
  }, [overrideFromUrl, outcomeStatus, visitCount, hasAnalysis]);

  const setState = useCallback(
    (next: DocumentViewState) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', next);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return {
    state,
    setState,
    isOverridden: overrideFromUrl !== null,
    visitCount,
  };
}
