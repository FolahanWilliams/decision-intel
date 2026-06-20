'use client';

import useSWR from 'swr';

/**
 * Single source of truth for the user's billing/plan/usage state.
 *
 * Replaces 7 independent `/api/billing` consumers (5 of them raw `fetch`,
 * un-deduped) that each fired on mount — on the dashboard alone the Sidebar +
 * UsageMeter + usePlanLabels all hit it separately. SWR dedupes by the shared
 * key `'/api/billing'`, so every consumer routed through this hook collapses to
 * ONE request + one cache entry.
 */
export interface BillingUsage {
  analysesUsed: number;
  /** -1 == unlimited. */
  analysesLimit: number;
  percentUsed: number;
}

export interface BillingLimits {
  analysesPerMonth: number;
  maxPages: number;
  biasTypes: number;
  maxUploadMB: number;
}

/** Mirrors the GET /api/billing response shape. */
export interface BillingData {
  plan: string;
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  hasStripeCustomer: boolean;
  upgradeAvailable: boolean;
  usage: BillingUsage;
  limits: BillingLimits;
}

const fetcher = (url: string): Promise<BillingData | null> =>
  fetch(url).then(r => (r.ok ? r.json() : null));

export interface UseBillingResult {
  billing: BillingData | null;
  /** Convenience accessor — defaults to 'free' until loaded. */
  plan: string;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useBilling(): UseBillingResult {
  const { data, error, isLoading, mutate } = useSWR<BillingData | null>('/api/billing', fetcher, {
    // The plan rarely changes within a session; no focus-storm, gentle dedup.
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  return {
    billing: data ?? null,
    plan: data?.plan ?? 'free',
    isLoading,
    error: error ?? null,
    mutate,
  };
}
