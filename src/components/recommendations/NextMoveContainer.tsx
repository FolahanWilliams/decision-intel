'use client';

/**
 * NextMoveContainer — top-level wrapper that composes the
 * IntelligentAntagonistPrompt with the NextMoveStrip and handles the
 * fetch lifecycle for both the recommendations + the user-priority
 * capture.
 *
 * Mounted on /dashboard/decisions as the recommendation engine's entry
 * point. Persists across the view-switcher pattern (kanban / log /
 * passed-on) so recommendations stay visible regardless of view.
 *
 * Locked 2026-05-10; constellation surface retired 2026-05-11 — decisions
 * page is now the canonical intelligent-antagonist surface.
 */

import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import type {
  CrossDecisionPattern,
  NextMoveRecommendation,
} from '@/lib/recommendations/recommendation-types';
import { IntelligentAntagonistPrompt } from './IntelligentAntagonistPrompt';
import { NextMoveStrip } from './NextMoveStrip';

interface RecommendationsResponse {
  recommendations: NextMoveRecommendation[];
  crossDecisionPatterns: CrossDecisionPattern[];
  computedAt: string;
  fromCache: boolean;
  llmAugmented: boolean;
}

interface PriorityCaptureResponse {
  capture: {
    id: string;
    capturedAt: string;
    userPriorityText: string;
    userPriorityContainerId: string | null;
    algoTopContainerId: string | null;
    algoTopReason: string | null;
    divergenceScore: number | null;
  } | null;
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export function NextMoveContainer({
  showAntagonistPrompt = true,
}: {
  /// When false, skip the antagonist prompt entirely and just render
  /// the strip. Defaults true on the canonical decisions page.
  showAntagonistPrompt?: boolean;
}) {
  const [includeLlm, setIncludeLlm] = useState(false);
  // Capture the mount time once so Date.now() doesn't fire during
  // render (react-hooks/purity rule). Minute-level precision is
  // enough for the 1-hour skip-prompt rule.
  const [mountTime] = useState(() => Date.now());

  // Recommendations — first paint without LLM, then re-fetch with
  // includeLlm=true to hydrate richer prose.
  const { data: recsData, isLoading: recsLoading } = useSWR<RecommendationsResponse>(
    `/api/recommendations?limit=10&includeLlm=${includeLlm}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30 * 1000 }
  );

  // Recent capture — used to skip the antagonist prompt when a fresh
  // one exists.
  const { data: captureData, mutate: mutateCapture } = useSWR<PriorityCaptureResponse>(
    showAntagonistPrompt ? '/api/constellation/priority-capture?window=recent' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Trigger LLM augmentation after the first paint lands.
  useEffect(() => {
    if (recsData && !includeLlm && recsData.recommendations.length > 0) {
      // Wait one tick so the strip paints with rule-based prose first.
      const t = setTimeout(() => setIncludeLlm(true), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [recsData, includeLlm]);

  const handlePriorityCapture = useCallback(
    async (userPriorityText: string, skipped: boolean) => {
      const algoTop = recsData?.recommendations[0] ?? null;
      const res = await fetch('/api/constellation/priority-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPriorityText: skipped ? '(skipped)' : userPriorityText,
          algoTopContainerId: algoTop?.containerId ?? null,
          algoTopReason: algoTop?.whyTrace ?? null,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to record priority');
      }
      await mutateCapture();
    },
    [recsData, mutateCapture]
  );

  const recentCapture = captureData?.capture ?? null;
  const hasRecentCapture =
    recentCapture !== null &&
    mountTime - new Date(recentCapture.capturedAt).getTime() < 60 * 60 * 1000;

  return (
    <>
      {showAntagonistPrompt && (
        <IntelligentAntagonistPrompt
          onCapture={handlePriorityCapture}
          initiallyHidden={hasRecentCapture}
        />
      )}
      <NextMoveStrip
        recommendations={recsData?.recommendations ?? []}
        crossDecisionPatterns={recsData?.crossDecisionPatterns ?? []}
        loading={recsLoading}
        llmAugmented={recsData?.llmAugmented ?? false}
        userPriorityCapture={
          hasRecentCapture && recentCapture
            ? {
                userPriorityText: recentCapture.userPriorityText,
                userPriorityContainerId: recentCapture.userPriorityContainerId,
                divergenceScore: recentCapture.divergenceScore,
              }
            : null
        }
      />
    </>
  );
}
