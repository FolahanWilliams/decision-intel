'use client';

import { SimilarDecisionsBanner } from '@/components/analysis/SimilarDecisionsBanner';
import { RiskScoreCard } from '@/components/analysis/RiskScoreCard';
import { ActOnThisPanel } from '@/components/analysis/ActOnThisPanel';
import type { BiasInstance } from '@/types';

/**
 * Decision Scorecard (S-1 — cognitive load consolidation)
 *
 * Wraps SimilarDecisionsBanner + RiskScoreCard + ActOnThisPanel into
 * ONE card with three internal sections. This reduces the above-fold
 * card count on the document detail page from 11 → 9 and unifies
 * the mental model: "Here is how this decision scores, here is how
 * it compares to your history, here is what to do next."
 *
 * Each section is visually distinct (subtle dividers) but shares
 * one outer border — so the user scrolls ONE thing, not three.
 */

interface DecisionScorecardProps {
  analysisId: string;
  biases: Pick<BiasInstance, 'biasType' | 'severity' | 'confidence'>[];
  documentType?: string | null;
}

export function DecisionScorecard({ analysisId, biases, documentType }: DecisionScorecardProps) {
  const hasBiases = biases && biases.length > 0;

  return (
    <div
      className="card"
      style={{
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--bg-primary, #fff)',
      }}
    >
      {/* Section 1: Similar Past Decisions */}
      <div>
        <SimilarDecisionsBanner analysisId={analysisId} />
      </div>

      {/* Section 2: Risk Assessment */}
      <div
        style={{
          borderTop: '1px solid var(--border-color, #E2E8F0)',
        }}
      >
        <RiskScoreCard analysisId={analysisId} />
      </div>

      {/* Section 3: Recommended Playbooks (only if biases exist) */}
      {hasBiases && (
        <div
          style={{
            borderTop: '1px solid var(--border-color, #E2E8F0)',
          }}
        >
          <ActOnThisPanel analysisId={analysisId} biases={biases} documentType={documentType} />
        </div>
      )}
    </div>
  );
}
