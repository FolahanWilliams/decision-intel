'use client';

/**
 * Lightweight role-fetch hook (4.2 deep).
 *
 * One-shot GET /api/onboarding on mount; returns the captured
 * onboardingRole or null. Falls back to null on auth/network errors so
 * callers can render generic copy without an exception path.
 *
 * Cached at the module level so multiple consumers on the same page
 * don't fan out independent fetches — the role doesn't change inside
 * a session.
 */

import { useEffect, useState } from 'react';
import type { EmptyStateRole } from '@/lib/onboarding/role-empty-states';

let cached: EmptyStateRole | null = null;
let inflight: Promise<EmptyStateRole | null> | null = null;

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

export function useOnboardingRole(): EmptyStateRole | null {
  const [role, setRole] = useState<EmptyStateRole | null>(cached);
  useEffect(() => {
    let cancelled = false;
    void fetchRole().then(r => {
      if (!cancelled) setRole(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return role;
}
