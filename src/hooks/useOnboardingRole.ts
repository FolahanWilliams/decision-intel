'use client';

/**
 * Onboarding-role store hook (4.2 deep; upgraded to a live store
 * 2026-06-17).
 *
 * One-shot GET /api/onboarding on first mount, cached at the module
 * level so multiple consumers on the same page don't fan out independent
 * fetches. Returns the captured onboardingRole or null; falls back to
 * null on auth/network errors so callers render generic copy without an
 * exception path.
 *
 * The role used to be treated as immutable inside a session — but it
 * DRIVES every persona-aware surface (dashboard headline/subtitle, the
 * upload-guidance panel, sample bundles, empty states), and a mis-tagged
 * user got actively mis-targeted guidance with no way to correct it. So
 * the module is now a tiny pub/sub store: `setOnboardingRole` updates the
 * cache, notifies every live consumer (so the dashboard re-targets
 * instantly), and persists the correction via PATCH /api/onboarding.
 */

import { useEffect, useState } from 'react';
import type { EmptyStateRole } from '@/lib/onboarding/role-empty-states';

let cached: EmptyStateRole | null = null;
let inflight: Promise<EmptyStateRole | null> | null = null;
const listeners = new Set<(r: EmptyStateRole | null) => void>();

function notify() {
  for (const listener of listeners) listener(cached);
}

async function fetchRole(): Promise<EmptyStateRole | null> {
  if (cached !== null) return cached;
  if (inflight) return inflight;
  inflight = fetch('/api/onboarding')
    .then(r => (r.ok ? r.json() : null))
    .then((data: { onboardingRole?: string | null } | null) => {
      const role = data?.onboardingRole;
      if (
        role === 'cso' ||
        role === 'ma' ||
        role === 'bizops' ||
        role === 'pe_vc' ||
        role === 'eta' ||
        role === 'other'
      ) {
        cached = role;
        return role;
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
 * Persist + broadcast a role correction. Updates the module cache and
 * notifies every live consumer so persona-aware surfaces re-target in the
 * same tick, then PATCHes the server. Fire-and-forget persistence: a
 * failed PATCH is logged but the in-session UI still reflects the choice.
 */
export function setOnboardingRole(role: EmptyStateRole) {
  cached = role;
  notify();
  void fetch('/api/onboarding', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ onboardingRole: role }),
  }).catch((err: unknown) => {
    // Non-fatal: the session UI already reflects the correction; the next
    // page load re-fetches the (unpersisted) server value.
    console.warn('[useOnboardingRole] failed to persist role:', err);
  });
}

export function useOnboardingRole(): EmptyStateRole | null {
  const [role, setRole] = useState<EmptyStateRole | null>(cached);
  useEffect(() => {
    let cancelled = false;
    const listener = (r: EmptyStateRole | null) => {
      if (!cancelled) setRole(r);
    };
    listeners.add(listener);
    void fetchRole().then(r => {
      if (!cancelled) setRole(r);
    });
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);
  return role;
}
