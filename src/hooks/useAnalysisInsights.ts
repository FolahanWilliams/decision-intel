'use client';

/**
 * Deduped fetch hook for /api/analysis/[id]/insights (J.2 + M.2 lock
 * 2026-05-08).
 *
 * Multiple consumers on the document-detail page need the same insights
 * payload — PaperApplicationsCard renders the full SignalBlock grid;
 * VerdictBand renders the author-calibration chip from feedbackAdequacy.
 * Without dedupe, both would fan out independent fetches against the
 * same endpoint on every mount.
 *
 * Module-level cache + in-flight Promise sharing follows the
 * useOnboardingRole pattern. Cache key is analysisId. Fault-tolerant —
 * fetch failures log a warning and resolve to null so callers can
 * render fallback paths without an exception branch.
 *
 * State shape derives from the module cache via useMemo; useEffect only
 * triggers async re-renders via a tick counter (per the react-hooks/
 * set-state-in-effect rule — synchronous setState in an effect body
 * causes cascading renders).
 */

import { useEffect, useMemo, useState } from 'react';
import type { ValidityClassification } from '@/lib/learning/validity-classifier';
import type { ReferenceClassForecast } from '@/lib/learning/reference-class-forecast';
import type { FeedbackAdequacy } from '@/lib/learning/feedback-adequacy';
import type { CalibratedRejection } from '@/lib/learning/calibrated-rejection';
import type { FractionationOfExpertise } from '@/lib/learning/fractionation-of-expertise';
import type { DecisionRubric } from '@/lib/learning/decision-rubric';
import type { AlgorithmAversion } from '@/lib/learning/algorithm-aversion';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('useAnalysisInsights');

export interface AnalysisInsightsResponse {
  analysisId: string;
  validityClassification: ValidityClassification;
  referenceClassForecast: ReferenceClassForecast;
  feedbackAdequacy: FeedbackAdequacy;
  calibratedRejection: CalibratedRejection;
  fractionationOfExpertise: FractionationOfExpertise;
  decisionRubric: DecisionRubric;
  algorithmAversion: AlgorithmAversion;
  validitySource: 'persisted' | 'live';
}

const cache = new Map<string, AnalysisInsightsResponse>();
const errors = new Set<string>();
const inflight = new Map<string, Promise<AnalysisInsightsResponse | null>>();

async function fetchInsights(analysisId: string): Promise<AnalysisInsightsResponse | null> {
  const cached = cache.get(analysisId);
  if (cached) return cached;
  const existing = inflight.get(analysisId);
  if (existing) return existing;

  const promise = fetch(`/api/analysis/${analysisId}/insights`)
    .then(r => (r.ok ? r.json() : null))
    .then((data: AnalysisInsightsResponse | null) => {
      if (data && typeof data.analysisId === 'string') {
        cache.set(analysisId, data);
        return data;
      }
      errors.add(analysisId);
      return null;
    })
    .catch(err => {
      log.warn('insights fetch failed:', { analysisId, err });
      errors.add(analysisId);
      return null;
    })
    .finally(() => {
      inflight.delete(analysisId);
    });

  inflight.set(analysisId, promise);
  return promise;
}

export type UseAnalysisInsightsState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: AnalysisInsightsResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useAnalysisInsights(
  analysisId: string | null | undefined
): UseAnalysisInsightsState {
  // Tick counter — bumped only from the async fetch resolution. The
  // actual state lives in the module-level cache; useMemo re-derives
  // on every render, and tick forces re-render after a fetch settles.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!analysisId) return;
    // Skip fetch entirely when the cache (or error sentinel) already has
    // an answer for this id. fetchInsights internally dedupes by inflight
    // map, so concurrent mounts share one network call regardless.
    if (cache.has(analysisId) || errors.has(analysisId)) return;
    let cancelled = false;
    void fetchInsights(analysisId).then(() => {
      if (!cancelled) setTick(t => t + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  return useMemo<UseAnalysisInsightsState>(() => {
    void tick;
    if (!analysisId) return { status: 'loading', data: null, error: null };
    const cached = cache.get(analysisId);
    if (cached) return { status: 'ready', data: cached, error: null };
    if (errors.has(analysisId))
      return { status: 'error', data: null, error: 'insights-unavailable' };
    return { status: 'loading', data: null, error: null };
  }, [analysisId, tick]);
}
