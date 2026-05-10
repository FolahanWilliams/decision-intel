'use client';

/**
 * ModalStackContext — priority-ordered banner/modal stack so the
 * /dashboard surface renders at most ONE first-load banner at a time.
 *
 * Locked 2026-05-10 (audit batch 4 #1, Section 3.5 brainstorm). Cold-
 * prospect first-load on a fresh design-partner account today can render
 * 4 banners simultaneously (SampleDataBanner + DraftOutcomeBanner +
 * OutcomeGateModal + future KGConsent). Catastrophic for procurement-
 * grade Margaret-class CSO. The single highest-priority "actionable"
 * surface should render; the rest queue.
 *
 * Architecture:
 *   - `<ModalStackProvider>` wraps the dashboard.
 *   - Each banner calls `useModalSlot(id, priority, isVisible)`. The
 *     hook returns `shouldRender` — true ONLY when this banner is the
 *     highest-priority currently-visible claimant.
 *   - When the top banner dismisses (sets `isVisible=false`), it
 *     auto-yields and the next-highest renders.
 *
 * Priority semantics (higher number = higher priority):
 *   100 — outcome_gate_hard (hard-blocking — flywheel unlock surface)
 *   90  — kg_consent (org-level data consent — pre-cohort gate)
 *   80  — outcome_gate_soft (soft reminder)
 *   60  — draft_outcome (auto-detected outcome ready to confirm)
 *   30  — sample_data (cold-start first-impression banner)
 *
 * The numeric scale leaves headroom for new banners between existing
 * tiers without re-numbering. New banners pick a number that places
 * them at the right semantic tier.
 *
 * Forward-looking rule: when adding a new dashboard banner / modal,
 * register it with `useModalSlot` and pick a priority on the documented
 * scale. Never render conditionally outside this context — that's the
 * stacking bug class this file exists to prevent.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ModalSlotId = string;

interface SlotClaim {
  id: ModalSlotId;
  priority: number;
}

interface ModalStackContextValue {
  /** Claim a slot. Returns the unique slot id for cleanup. */
  claim: (claim: SlotClaim) => void;
  /** Release the slot (banner dismissed or unmounted). */
  release: (id: ModalSlotId) => void;
  /** The current highest-priority claimed slot id, or null. */
  topSlotId: ModalSlotId | null;
}

const ModalStackContext = createContext<ModalStackContextValue | null>(null);

export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Map<ModalSlotId, number>>(new Map());

  const claim = useCallback(({ id, priority }: SlotClaim) => {
    setClaims(prev => {
      // Idempotent: re-claiming the same id with the same priority is a no-op.
      const existing = prev.get(id);
      if (existing === priority) return prev;
      const next = new Map(prev);
      next.set(id, priority);
      return next;
    });
  }, []);

  const release = useCallback((id: ModalSlotId) => {
    setClaims(prev => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const topSlotId = useMemo<ModalSlotId | null>(() => {
    if (claims.size === 0) return null;
    let topId: ModalSlotId | null = null;
    let topPriority = -Infinity;
    for (const [id, p] of claims.entries()) {
      if (p > topPriority) {
        topPriority = p;
        topId = id;
      }
    }
    return topId;
  }, [claims]);

  const value = useMemo<ModalStackContextValue>(
    () => ({ claim, release, topSlotId }),
    [claim, release, topSlotId]
  );

  return <ModalStackContext.Provider value={value}>{children}</ModalStackContext.Provider>;
}

/**
 * Hook each banner / modal calls to participate in the stack. Returns
 * `shouldRender` — true ONLY when this banner is currently the highest-
 * priority visible claimant. Banners do their own visibility logic (e.g.
 * read localStorage, fetch state) and pass `isVisible` here; this hook
 * gates the render itself.
 *
 * Implementation: useEffect drives the claim/release so React's rules-
 * of-hooks aren't violated (no setState during render). The one-frame
 * lag is invisible since banners typically have fade-in animations.
 *
 * No-op when the provider isn't mounted (graceful degradation — the
 * banner renders standalone if outside a ModalStackProvider tree).
 */
export function useModalSlot(id: ModalSlotId, priority: number, isVisible: boolean): boolean {
  const ctx = useContext(ModalStackContext);

  useEffect(() => {
    if (!ctx) return;
    if (isVisible) {
      ctx.claim({ id, priority });
      return () => ctx.release(id);
    }
    // When not visible, ensure any prior claim is released.
    ctx.release(id);
    return undefined;
  }, [ctx, id, priority, isVisible]);

  // Outside a provider, fall back to the banner's own isVisible check.
  if (!ctx) return isVisible;
  // Inside a provider, render only when this slot owns the top claim.
  return isVisible && ctx.topSlotId === id;
}

/**
 * Canonical priority constants. Banners import from here so the priority
 * ladder stays in lockstep across consumers — no magic numbers in the
 * banner files. Edit HERE when re-tiering.
 */
export const MODAL_STACK_PRIORITY = {
  outcome_gate_hard: 100,
  kg_consent: 90,
  outcome_gate_soft: 80,
  draft_outcome: 60,
  sample_data: 30,
} as const;
