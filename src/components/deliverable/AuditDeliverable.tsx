/**
 * AuditDeliverable — the universal wrapper.
 *
 * Renders an AuditDeliverable (composed via buildAuditDeliverable)
 * across the three context-calibrated views per the Deep Research
 * synthesis locked 2026-05-20:
 *
 *   - 'demo'      → constrained, single CTA, no view toggle
 *   - 'executive' → default in-product view, action-title-driven,
 *                   linear scroll with progressive disclosure
 *   - 'analyst'   → controlled-density grid, expanded comparative
 *                   matrices, raw metadata accessible inline
 *
 * The same composed AuditDeliverable powers all three. Density +
 * disclosure defaults flip; underlying data stays identical.
 *
 * Pyramid Principle layout: SCQA cover at top → 5 MECE buckets in
 * canonical order (reasoning risks → stress test → historical
 * analogs → counterfactuals → provenance).
 */

'use client';

import type { AuditDeliverable as AuditDeliverableData } from '@/lib/deliverable/types';
import { SCQAExecutiveSummary } from './SCQAExecutiveSummary';
import { ReasoningRisksBucket } from './buckets/ReasoningRisksBucket';
import { StressTestBucket } from './buckets/StressTestBucket';
import { HistoricalAnalogsBucket } from './buckets/HistoricalAnalogsBucket';
import { CounterfactualsBucket } from './buckets/CounterfactualsBucket';
import { ProvenanceBucket } from './buckets/ProvenanceBucket';

export type DeliverableViewMode = 'demo' | 'executive' | 'analyst';

interface AuditDeliverableProps {
  deliverable: AuditDeliverableData;
  mode: DeliverableViewMode;
  /** Single CTA for the cover — DR Choice Paradox discipline. The
   *  `/demo` surface uses this; in-product surfaces typically omit. */
  primaryCta?: { label: string; onClick: () => void };
}

export function AuditDeliverable({ deliverable, mode, primaryCta }: AuditDeliverableProps) {
  const density: 'standard' | 'dense' = mode === 'analyst' ? 'dense' : 'standard';
  const sectionGap = mode === 'analyst' ? 24 : 32;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: sectionGap,
        width: '100%',
      }}
    >
      {/* APEX — SCQA Executive Summary */}
      <SCQAExecutiveSummary
        cover={deliverable.cover}
        primaryCta={primaryCta}
        eyebrow={
          mode === 'demo'
            ? 'Audit deliverable · sample run'
            : mode === 'analyst'
              ? 'Audit deliverable · analyst view'
              : 'Audit deliverable'
        }
      />

      {/* BUCKET 1 — What the audit found */}
      <ReasoningRisksBucket bucket={deliverable.reasoningRisks} />

      {/* BUCKET 2 — How the room will react */}
      <StressTestBucket bucket={deliverable.stressTest} density={density} />

      {/* BUCKET 3 — What the comparables say */}
      <HistoricalAnalogsBucket bucket={deliverable.historicalAnalogs} density={density} />

      {/* BUCKET 4 — What to fix */}
      <CounterfactualsBucket bucket={deliverable.counterfactuals} />

      {/* BUCKET 5 — How we know */}
      <ProvenanceBucket bucket={deliverable.provenance} />
    </div>
  );
}
