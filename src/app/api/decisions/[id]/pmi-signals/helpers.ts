/**
 * Co-located helpers for the /api/decisions/[id]/pmi-signals route.
 *
 * Next.js App Router strictly validates route module exports — only
 * the route handlers (GET / POST / PATCH / DELETE / etc.) plus a
 * narrow set of config exports (dynamic / revalidate / etc.) are
 * legal at the route module's top level. Arbitrary helper exports
 * trip TS2344 at .next/types codegen time.
 *
 * This file separates the route's helpers + types so the route
 * module stays clean. Co-located under the route folder so the
 * coupling is obvious from any future audit.
 *
 * Note: PmiSignalKey + PMI_SIGNAL_KEYS are ALSO exported from
 * src/lib/pmi/extract-from-memo.ts (the canonical SSOT — the
 * extract route reads them there). The duplication here is
 * intentional: this file is local to the route + carries the
 * Brier-scoring helpers + the PmiSignal / PmiSignalsBlob shapes
 * the route handlers consume. When the canonical key set
 * changes, update both in lockstep per the extract-from-memo
 * lock comment.
 */

export type PmiSignalKey =
  | 'synergy_realisation_pct'
  | 'talent_retention_pct'
  | 'integration_cost_vs_forecast'
  | 'day_one_milestone_hit_rate'
  | 'customer_retention_pct'
  | 'revenue_growth_vs_forecast';

export const PMI_SIGNAL_KEYS: ReadonlyArray<PmiSignalKey> = [
  'synergy_realisation_pct',
  'talent_retention_pct',
  'integration_cost_vs_forecast',
  'day_one_milestone_hit_rate',
  'customer_retention_pct',
  'revenue_growth_vs_forecast',
];

export interface PmiSignal {
  key: PmiSignalKey;
  proxy: string;
  horizonDays: 90 | 180 | 365;
  predictedConfidence: number;
  observedValue?: number;
  observedAt?: string;
  brierScore?: number;
  resolution?: 'hit' | 'miss' | 'partial' | 'unmeasured';
}

export interface PmiSignalsBlob {
  signals: PmiSignal[];
  capturedAt: string;
  capturedByUserId: string;
  lastUpdatedAt?: string;
}

/**
 * Compute a Brier score for a single signal.
 *
 * Brier for a binary outcome (hit / miss) is (predicted - observed)².
 * Here we use percent-realised vs predicted-confidence as a 0-1 proxy:
 * - observedValue normalised to 0-1 (most PMI metrics are already %)
 * - predictedConfidence is 0-1
 * - Brier = (predicted - observed)² capped at [0, 1]
 */
export function computeSignalBrier(predicted: number, observed: number): number {
  const obs = Math.max(0, Math.min(1, observed));
  const pred = Math.max(0, Math.min(1, predicted));
  return Math.round((pred - obs) ** 2 * 1000) / 1000;
}

/**
 * Resolution band thresholds:
 *   ≥ 0.85 observed → 'hit'
 *   0.50 - 0.85    → 'partial'
 *   < 0.50         → 'miss'
 *   undefined      → 'unmeasured'
 */
export function resolveBand(observed: number | undefined): PmiSignal['resolution'] {
  if (observed === undefined) return 'unmeasured';
  if (observed >= 0.85) return 'hit';
  if (observed >= 0.5) return 'partial';
  return 'miss';
}
