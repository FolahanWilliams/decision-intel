'use client';

/**
 * First-audit experience signal — derives whether the user is in the
 * "first 5 minutes" arc the platform should treat specially.
 *
 * Shipped 2026-05-28 as Improvement #1 from the platform-improvement plan.
 * Drives the persona-aware first-visit empty state, the first-audit
 * guided overlay, and the post-first-audit "what's next" tile pack.
 *
 * Definitions:
 *   - isFirstVisit: total document count is exactly 0 (no audits ever)
 *   - isFirstAudit: a just-completed audit IS the user's first
 *     (totalDocsServer === 1 after the audit lands)
 *   - hasNoAudits: synonym for isFirstVisit, more readable in some sites
 *   - earlyArc: still within the first 3 audits (the cold-context
 *     vocabulary discipline window per CLAUDE.md)
 *
 * Reads from the per-request `documents/stats` endpoint with SWR-style
 * caching so multiple consumers don't fan out separate fetches.
 *
 * Uses sessionStorage to track the "first audit guided overlay has been
 * shown" signal so the overlay fires exactly once per user (not on every
 * refresh after the first audit completes).
 */

import { useEffect, useState } from 'react';

interface FirstAuditExperience {
  /** True when the server-side document count is exactly 0. */
  isFirstVisit: boolean;
  /** True when the user has 1-3 audits — still in cold-context window. */
  earlyArc: boolean;
  /** Server-reported total document count (null while loading). */
  totalDocs: number | null;
  /** True while still fetching the initial count. */
  loading: boolean;
}

// Module-level cache so multiple consumers on the same page don't
// fan out fetches. The count CAN change (when an audit completes), so
// callers pass `optimisticTotalDocs` from the dashboard's existing
// totalDocs SWR — that prop is the authoritative live count and bypasses
// this fetch entirely. (There is no refresh(); the optimistic prop IS the
// refresh mechanism.)
let cached: number | null = null;
let inflight: Promise<number | null> | null = null;

async function fetchTotalDocs(): Promise<number | null> {
  // Serve the cache so a second consumer doesn't re-fetch (this early-return
  // was missing, defeating the cache's purpose — every mount re-hit /stats).
  if (cached !== null) return cached;
  if (inflight) return inflight;
  inflight = fetch('/api/documents/stats')
    .then(r => (r.ok ? r.json() : null))
    .then((data: { totalDocs?: number } | null) => {
      const t = data?.totalDocs;
      if (typeof t === 'number') {
        cached = t;
        return t;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Get the first-audit experience signal. Optionally accept an
 * `optimisticTotalDocs` from the caller (the dashboard already
 * SWR-fetches this, no point fetching twice).
 */
export function useFirstAuditExperience(optimisticTotalDocs?: number | null): FirstAuditExperience {
  const [serverTotal, setServerTotal] = useState<number | null>(cached);
  // Distinguishes "the fetch hasn't returned yet" from "the fetch returned
  // null" (a network/parse failure). Without it, a null result leaves
  // `loading` true FOREVER (total stays null), sticking the consumer on a
  // skeleton. Initialised true when the cache is already warm.
  const [resolved, setResolved] = useState<boolean>(cached !== null);

  // Fetch the server total only when no optimistic count is provided.
  // When the optimistic count is present, it's the authoritative source
  // and no state mutation is needed (we read it directly below).
  useEffect(() => {
    if (optimisticTotalDocs != null) return undefined;
    let cancelled = false;
    void fetchTotalDocs().then(t => {
      if (cancelled) return;
      setServerTotal(t);
      setResolved(true);
    });
    return () => {
      cancelled = true;
    };
  }, [optimisticTotalDocs]);

  const total = optimisticTotalDocs ?? serverTotal;
  // Loading only while we genuinely don't know yet: no optimistic count AND
  // the fetch hasn't resolved. A resolved-but-null fetch ends loading (the
  // surface degrades to "not first visit" rather than spinning forever).
  const loading = total == null && optimisticTotalDocs == null && !resolved;

  return {
    isFirstVisit: total === 0,
    earlyArc: total != null && total <= 3,
    totalDocs: total,
    loading,
  };
}

/**
 * sessionStorage signal for "has the first-audit guided overlay been
 * shown this session". Fires once per session per user.
 */
const OVERLAY_SHOWN_KEY = 'di-first-audit-overlay-shown';

export function markFirstAuditOverlayShown(): void {
  try {
    sessionStorage.setItem(OVERLAY_SHOWN_KEY, '1');
  } catch {
    // sessionStorage may throw in private-mode Safari — silent per
    // CLAUDE.md fire-and-forget exceptions (the overlay reappearing
    // once per session is a tiny UX downgrade, not a bug).
  }
}

export function hasFirstAuditOverlayBeenShown(): boolean {
  try {
    return sessionStorage.getItem(OVERLAY_SHOWN_KEY) === '1';
  } catch {
    return false;
  }
}
