/**
 * AuditDeliverable — the universal wrapper.
 *
 * SLIDESHOW LAYOUT (locked 2026-05-20 evening rebuild). Replaces the
 * prior linear-scroll layout with paginated slides:
 *
 *   Page 1 → Cover (SCQA + radial DQI gauge)
 *   Page 2 → Reasoning Risks (scatter + finding cards)
 *   Page 3 → Stress Test (donut + comparative matrix)
 *   Page 4 → Historical Analogs (matrix)
 *   Page 5 → Counterfactuals (lift bar chart + scenario sliders + Munger inversion)
 *   Page 6 → Provenance (Tetlock calibration + regulatory heatmap + claims)
 *
 * Navigation:
 *   - Top sticky tab bar (DeliverablePageNav) with prev/next arrows
 *   - Keyboard ←/→ to switch slides
 *   - Tab labels carry badge counts (critical findings, red-team count)
 *
 * Per the Deep Research synthesis §9 cross-context calibration:
 *   - 'demo'      → constrained, single CTA pinned to the cover slide
 *   - 'executive' → in-product default (same slideshow, no CTA)
 *   - 'analyst'   → controlled-density (comparative grids switch to
 *                   dense rows; everything else identical)
 */

'use client';

import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  ScrollText,
  Users,
  BarChart3,
  Wrench,
  ShieldCheck,
  Network,
} from 'lucide-react';
import type { AuditDeliverable as AuditDeliverableData } from '@/lib/deliverable/types';
import { SCQAExecutiveSummary } from './SCQAExecutiveSummary';
import { ReasoningRisksBucket } from './buckets/ReasoningRisksBucket';
import { StressTestBucket } from './buckets/StressTestBucket';
import { HistoricalAnalogsBucket } from './buckets/HistoricalAnalogsBucket';
import { CounterfactualsBucket } from './buckets/CounterfactualsBucket';
import { ProvenanceBucket } from './buckets/ProvenanceBucket';
import { DecisionNetworkPanel } from './DecisionNetworkPanel';
import { DeliverablePageNav, type DeliverablePage } from './DeliverablePageNav';

export type DeliverableViewMode = 'demo' | 'executive' | 'analyst';

interface AuditDeliverableProps {
  deliverable: AuditDeliverableData;
  mode: DeliverableViewMode;
  /** Single CTA for the cover — DR Choice Paradox discipline. The
   *  `/demo` surface uses this; in-product surfaces typically omit. */
  primaryCta?: { label: string; onClick: () => void };
  /** Real analysis id. When present (in-product, not demo), unlocks the
   *  7th "Decision network" tab — the document-scoped 3D decision graph. */
  analysisId?: string;
}

export function AuditDeliverable({
  deliverable,
  mode,
  primaryCta,
  analysisId,
}: AuditDeliverableProps) {
  const density: 'standard' | 'dense' = mode === 'analyst' ? 'dense' : 'standard';

  // Build page manifest from the deliverable data
  const pages = useMemo<DeliverablePage[]>(() => {
    const r = deliverable.reasoningRisks;
    const s = deliverable.stressTest;
    const totalRisks = r.counts.critical + r.counts.high + r.counts.medium + r.counts.low;
    const dissent = s.counts.reject + s.counts.revise + s.counts.redTeam;
    return [
      {
        id: 'cover',
        label: 'Executive cover',
        shortLabel: 'Cover',
        icon: LayoutDashboard,
      },
      {
        id: 'reasoning',
        label: 'What the audit found',
        shortLabel: 'Reasoning',
        icon: ScrollText,
        badge: totalRisks,
        badgeColor: r.counts.critical > 0 ? '#b91c1c' : r.counts.high > 0 ? '#ef4444' : '#64748B',
      },
      {
        id: 'stress',
        label: 'How the room reacts',
        shortLabel: 'Stress test',
        icon: Users,
        badge: dissent,
        badgeColor: s.counts.reject > 0 ? '#b91c1c' : '#d97706',
      },
      {
        id: 'analogs',
        label: 'Comparables',
        shortLabel: 'Analogs',
        icon: BarChart3,
        badge: deliverable.historicalAnalogs.forgottenQuestions.length,
        badgeColor: '#d97706',
      },
      {
        id: 'fixes',
        label: 'What to fix',
        shortLabel: 'Fixes',
        icon: Wrench,
        badge: deliverable.counterfactuals.scenarios.length,
        badgeColor: '#16A34A',
      },
      {
        id: 'provenance',
        label: 'How we know',
        shortLabel: 'Provenance',
        icon: ShieldCheck,
      },
      // 7th tab — only with a real analysis id (in-product, never demo).
      ...(analysisId
        ? [
            {
              id: 'graph',
              label: 'Decision network',
              shortLabel: 'Graph',
              icon: Network,
            } as DeliverablePage,
          ]
        : []),
    ];
  }, [deliverable, analysisId]);

  const [activeId, setActiveId] = useState<string>('cover');

  const slideStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        width: '100%',
        minWidth: 0,
      }}
      className="audit-deliverable-shell"
    >
      <DeliverablePageNav pages={pages} activeId={activeId} onChange={setActiveId} />

      {activeId === 'cover' ? (
        <section style={slideStyle}>
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
        </section>
      ) : null}

      {activeId === 'reasoning' ? (
        <section style={slideStyle}>
          <ReasoningRisksBucket bucket={deliverable.reasoningRisks} />
        </section>
      ) : null}

      {activeId === 'stress' ? (
        <section style={slideStyle}>
          <StressTestBucket bucket={deliverable.stressTest} density={density} />
        </section>
      ) : null}

      {activeId === 'analogs' ? (
        <section style={slideStyle}>
          <HistoricalAnalogsBucket bucket={deliverable.historicalAnalogs} density={density} />
        </section>
      ) : null}

      {activeId === 'fixes' ? (
        <section style={slideStyle}>
          <CounterfactualsBucket bucket={deliverable.counterfactuals} />
        </section>
      ) : null}

      {activeId === 'provenance' ? (
        <section style={slideStyle}>
          <ProvenanceBucket bucket={deliverable.provenance} />
        </section>
      ) : null}

      {activeId === 'graph' && analysisId ? (
        <section style={slideStyle}>
          <DecisionNetworkPanel
            findings={deliverable.reasoningRisks.findings}
            dqi={deliverable.cover.dqi}
          />
        </section>
      ) : null}
    </div>
  );
}
