'use client';

/**
 * ContainerDqiBreakdownPanel — clickable explainability surface for the
 * composite DQI on /dashboard/decisions/[id].
 *
 * Locked 2026-05-10 (Damien D1 persona-audit blocker). The per-doc
 * DqiBreakdownPanel answers "what in MY document drove this score" — but
 * on a multi-document decision (e.g. an acquisition with CIM + QofE +
 * synergy model + IC deck) the buyer wants TWO things at the composite
 * level:
 *
 *   1. WHICH WEIGHTED COMPONENT is dragging the composite? Bias load on
 *      the synergy model? Compliance risk on the counsel review?
 *   2. WHICH DOC is the worst offender → click through to its per-doc
 *      DqiBreakdownPanel for the full decomposition.
 *
 * This panel answers both. Section A (component drag) lazy-fetches each
 * member doc's full DQI, averages the 7 weighted components across docs,
 * and surfaces the 3 lowest-scoring (highest-impact-negative) components
 * with the docs that drove them. Section B (per-doc navigation) shows
 * member docs sorted worst-first with click-through to /documents/[id].
 *
 * Architecture rationale (per CLAUDE.md DPR explainability lock
 * 2026-05-09 evening): composite is a NAVIGATION SURFACE; decomposition
 * lives on the per-doc audit. This panel preserves both — the
 * component-drag section is a SUMMARY of the underlying per-doc
 * decomposition, NOT a re-decomposition. Click any component → routes
 * to the worst-offender doc's full DqiBreakdownPanel.
 *
 * Lazy-fetch on open keeps the container detail page fast — the ~200ms
 * per-doc fetch only fires when the user actually wants the breakdown.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowRight, FileText, GitCompareArrows, Loader2 } from 'lucide-react';
import { dqiColorFor } from '@/lib/utils/grade';
import { formatBiasName } from '@/lib/utils/labels';
import type { DQIResult } from '@/lib/scoring/dqi';
import type { ContainerDetail } from '@/types/containers';

// ─── Component metadata (mirrors per-doc DqiBreakdownPanel) ──────────────

interface ComponentMeta {
  key: keyof DQIResult['components'];
  displayName: string;
  description: string;
}

const COMPONENT_META: ComponentMeta[] = [
  {
    key: 'biasLoad',
    displayName: 'Cognitive biases detected',
    description: 'Severity-weighted count of biases across member documents.',
  },
  {
    key: 'noiseLevel',
    displayName: 'Reasoning consistency',
    description: 'How consistently independent expert judges scored each member memo.',
  },
  {
    key: 'evidenceQuality',
    displayName: 'Evidence quality',
    description: "Whether claims are backed by verifiable evidence — or contradicted by the record.",
  },
  {
    key: 'processMaturity',
    displayName: 'Decision process',
    description: 'Was dissent captured, was a prior recorded, will outcomes be tracked?',
  },
  {
    key: 'complianceRisk',
    displayName: 'Regulatory exposure',
    description: 'Risk patterns against frameworks in scope — not legal determinations.',
  },
  {
    key: 'historicalAlignment',
    displayName: 'Historical pattern match',
    description: 'How closely the decision pattern resembles cases in our 143-case library.',
  },
  {
    key: 'compoundRisk',
    displayName: 'Compound failure patterns',
    description:
      "Named patterns where biases combine to produce known catastrophic outcomes (Synergy Mirage, Winner's Curse, etc.).",
  },
];

// ─── Data shapes ─────────────────────────────────────────────────────────

export interface PerDocBreakdown {
  documentId: string;
  documentName: string;
  documentType: string | null;
  analysisId: string;
  overallScore: number;
  grade: string;
  dqi: DQIResult;
}

interface ComponentDrag {
  meta: ComponentMeta;
  averageScore: number;
  weight: number; // average across docs (should be near-identical post v2.2.0)
  worstDocs: Array<{
    documentId: string;
    documentName: string;
    score: number;
  }>;
}

// ─── Severity helper (matches per-doc panel) ─────────────────────────────

function severityColorForScore(score: number): { bar: string; bg: string; text: string } {
  if (score >= 85)
    return { bar: 'var(--success)', bg: 'rgba(22,163,74,0.08)', text: 'var(--success)' };
  if (score >= 70) return { bar: 'var(--info)', bg: 'rgba(59,130,246,0.08)', text: 'var(--info)' };
  if (score >= 55)
    return { bar: 'var(--warning)', bg: 'rgba(245,158,11,0.08)', text: 'var(--warning)' };
  if (score >= 40)
    return {
      bar: 'var(--severity-high)',
      bg: 'rgba(249,115,22,0.08)',
      text: 'var(--severity-high)',
    };
  return { bar: 'var(--error)', bg: 'rgba(220,38,38,0.08)', text: 'var(--error)' };
}

function gradeBand(grade: string | null): string {
  if (grade === 'A') return 'Excellent — committee-ready';
  if (grade === 'B') return 'Good — minor tightening before committee';
  if (grade === 'C') return 'Workable — material gaps to close before committee';
  if (grade === 'D') return 'Below threshold — significant rework needed';
  if (grade === 'F') return 'Failing — do not present in current form';
  return 'No audits yet';
}

// ─── Aggregation helper ──────────────────────────────────────────────────

function computeComponentDrag(perDocBreakdowns: PerDocBreakdown[]): ComponentDrag[] {
  if (perDocBreakdowns.length === 0) return [];
  return COMPONENT_META.map(meta => {
    const scores = perDocBreakdowns.map(d => d.dqi.components[meta.key]?.score ?? 0);
    const weights = perDocBreakdowns.map(d => d.dqi.components[meta.key]?.weight ?? 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const averageWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    // Worst 2 docs by component score (the docs dragging this component most).
    const worstDocs = perDocBreakdowns
      .map(d => ({
        documentId: d.documentId,
        documentName: d.documentName,
        score: d.dqi.components[meta.key]?.score ?? 0,
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
    return { meta, averageScore, weight: averageWeight, worstDocs };
  });
}

// ─── Main panel ──────────────────────────────────────────────────────────

/**
 * Fetch every member-doc's DQI in parallel. Pure async function — no
 * setState inside (the parent owns the loading/error/data state via
 * useState + this function as a side-effect-free utility).
 *
 * Per CLAUDE.md react-hooks/set-state-in-effect rule: setState inside
 * useEffect is forbidden for user-action-triggered fetches. The button
 * click in ContainerCompositeHero owns the fetch trigger; this function
 * is the data-loader the parent calls.
 */
export async function fetchPerDocBreakdowns(
  container: ContainerDetail
): Promise<PerDocBreakdown[]> {
  const docsWithAnalysis = container.documents.filter(d => d.document.latestAnalysis != null);
  if (docsWithAnalysis.length === 0) return [];
  return Promise.all(
    docsWithAnalysis.map(async d => {
      const analysisId = d.document.latestAnalysis!.id;
      const res = await fetch(`/api/dqi?analysisId=${encodeURIComponent(analysisId)}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(
          errBody?.error ?? `Failed to fetch DQI for ${d.document.filename} (${res.status})`
        );
      }
      // Route shape: { analysisId, dqi: DQIResult, badge }.
      const json = (await res.json()) as { analysisId: string; dqi: DQIResult };
      return {
        documentId: d.documentId,
        documentName: d.document.filename,
        documentType: d.document.documentType,
        analysisId,
        overallScore: json.dqi.score,
        grade: json.dqi.grade,
        dqi: json.dqi,
      } satisfies PerDocBreakdown;
    })
  );
}

interface ContainerDqiBreakdownPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: ContainerDetail;
  /**
   * Per-doc DQI breakdowns — populated by the parent's click handler
   * (which calls fetchPerDocBreakdowns and tracks loading/error).
   * Empty array on first open before the fetch resolves.
   */
  perDoc: PerDocBreakdown[];
  loading: boolean;
  fetchError: string | null;
}

export function ContainerDqiBreakdownPanel({
  open,
  onOpenChange,
  container,
  perDoc,
  loading,
  fetchError,
}: ContainerDqiBreakdownPanelProps) {
  const componentDrag = computeComponentDrag(perDoc);
  const dragSorted = [...componentDrag].sort((a, b) => a.averageScore - b.averageScore);
  const top3Drag = dragSorted.slice(0, 3);

  const docsWorstFirst = [...perDoc].sort((a, b) => a.overallScore - b.overallScore);

  const compositeScore = container.compositeDqi;
  const compositeColor =
    compositeScore != null ? dqiColorFor(compositeScore) : 'var(--text-muted)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: 720,
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>
            Composite Decision Quality
          </DialogTitle>
          <DialogDescription
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            The composite DQI is the simple average of the per-document scores below. Section A
            shows which weighted component is dragging the composite across documents; section B
            routes to the worst-offender per-doc audit for the full decomposition.
          </DialogDescription>
        </DialogHeader>

        {/* ── Composite header ─────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(140px, auto) 1fr',
            gap: 16,
            alignItems: 'center',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            marginTop: 8,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'var(--fs-3xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Composite DQI
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: compositeColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {compositeScore != null ? Math.round(compositeScore) : '—'}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Grade {container.compositeGrade ?? '—'}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {gradeBand(container.compositeGrade)}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              Averaged across {container.analyzedDocCount} of {container.documentCount} documents.
              {container.documentCount - container.analyzedDocCount > 0
                ? ` ${container.documentCount - container.analyzedDocCount} pending audit.`
                : ''}
            </div>
          </div>
        </div>

        {/* ── Section A: Component drag ────────────────────────────── */}
        <section style={{ marginTop: 18 }}>
          <header
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--fs-md)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Where the composite is being dragged
            </h3>
            <span
              style={{
                fontSize: 'var(--fs-3xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              Top 3 of 7 components
            </span>
          </header>
          {loading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 14,
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              <Loader2 size={14} className="animate-spin" />
              Loading per-document breakdowns…
            </div>
          )}
          {fetchError && (
            <div
              style={{
                padding: 12,
                fontSize: 'var(--fs-sm)',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
              }}
            >
              {fetchError}
            </div>
          )}
          {!loading && !fetchError && perDoc.length === 0 && (
            <div
              style={{
                padding: 12,
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              No analyzed documents yet. Upload and analyze at least one document to see the
              component drag breakdown.
            </div>
          )}
          {!loading && !fetchError && top3Drag.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {top3Drag.map(drag => {
                const sev = severityColorForScore(drag.averageScore);
                return (
                  <li
                    key={drag.meta.key}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${sev.bar}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 'var(--fs-sm)',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {drag.meta.displayName}
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--fs-xs)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            marginTop: 2,
                          }}
                        >
                          {drag.meta.description}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: sev.text,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {Math.round(drag.averageScore)}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Weight: {Math.round(drag.weight * 100)}% of composite · Worst:{' '}
                      {drag.worstDocs.map((d, i) => (
                        <span key={d.documentId}>
                          <a
                            href={`/documents/${d.documentId}`}
                            style={{
                              color: 'var(--accent-primary)',
                              textDecoration: 'none',
                            }}
                          >
                            {d.documentName}
                          </a>{' '}
                          ({Math.round(d.score)})
                          {i < drag.worstDocs.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Section A.5: Cross-document signal ─────────────────────
         * Recurring biases + named patterns + cross-doc conflicts that
         * fire ACROSS documents in this container. Component drag (Section
         * A) shows AVERAGED scores; this section surfaces the underlying
         * pattern signals — which the per-doc panel only sees one doc at
         * a time. The whole point of the container surface is cross-doc
         * coherence: this section makes it visible inside the breakdown.
         */}
        <CrossDocSignalSection container={container} />

        {/* ── Section B: Per-doc rows worst-first ──────────────────── */}
        <section style={{ marginTop: 18 }}>
          <header style={{ marginBottom: 8 }}>
            <h3
              style={{
                fontSize: 'var(--fs-md)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Per-document audits (worst first)
            </h3>
            <p
              style={{
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
                lineHeight: 1.5,
              }}
            >
              Click into the worst-offender to see the full per-component decomposition with
              evidence excerpts.
            </p>
          </header>
          {docsWorstFirst.length === 0 && !loading && (
            <div
              style={{
                padding: 12,
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              No per-document audits yet.
            </div>
          )}
          {docsWorstFirst.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              {docsWorstFirst.map(d => {
                const sev = severityColorForScore(d.overallScore);
                return (
                  <li key={d.documentId}>
                    <a
                      href={`/documents/${d.documentId}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(40px, auto) 1fr auto',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'border-color 0.15s, transform 0.15s',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          minWidth: 40,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: sev.text,
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1,
                          }}
                        >
                          {Math.round(d.overallScore)}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {d.grade}
                        </span>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 'var(--fs-sm)',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <FileText size={12} />
                          {d.documentName}
                        </div>
                        {d.documentType && (
                          <div
                            style={{
                              fontSize: 'var(--fs-2xs)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              marginTop: 2,
                            }}
                          >
                            {d.documentType.replace(/_/g, ' ')}
                          </div>
                        )}
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Methodology footer ──────────────────────────────────── */}
        <p
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Composite is the simple average of per-document overall scores. Component drag is the
          weighted-average score per component across documents — same scoring engine as the per-
          document panel, aggregated. Methodology version stamps appear on each per-document audit
          and on the Decision Provenance Record.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cross-doc signal section (Section A.5) ─────────────────────────────

/**
 * Surfaces what's repeating across documents in the container — the
 * cross-doc coherence signal that's the whole point of the container
 * surface. Reads from container.aggregation (recurring biases + named
 * patterns aggregated across member docs) and the cross-ref summary
 * counts on the container summary itself.
 *
 * Top-N caps: 5 recurring biases (more than 5 is noise; the buyer wants
 * the strongest signals). All named patterns rendered (max 5 in practice
 * given the 13 NAMED_PATTERNS catalogue).
 *
 * Severity-coded chips per row mirror the per-doc panel severity colour
 * discipline. Recurring biases sort by document occurrence count desc;
 * named patterns sort by severity (critical → low) then doc count desc.
 */
function CrossDocSignalSection({ container }: { container: ContainerDetail }) {
  const recurringBiases = (container.aggregation?.allBiases ?? [])
    .slice()
    .sort((a, b) => {
      if (b.documentIds.length !== a.documentIds.length) {
        return b.documentIds.length - a.documentIds.length;
      }
      return b.count - a.count;
    })
    .slice(0, 5);

  const namedPatterns = (container.aggregation?.namedPatterns ?? [])
    .slice()
    .sort((a, b) => {
      const sevRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const sa = sevRank[a.severity] ?? 0;
      const sb = sevRank[b.severity] ?? 0;
      if (sb !== sa) return sb - sa;
      return b.documentCount - a.documentCount;
    });

  const crossRefConflicts = container.crossRefConflictCount ?? 0;
  const crossRefHighSeverity = container.crossRefHighSeverityCount ?? 0;

  // Hide the section when nothing fires — keep the panel terse on
  // small/clean containers where there's no cross-doc signal to report.
  if (recurringBiases.length === 0 && namedPatterns.length === 0 && crossRefConflicts === 0) {
    return null;
  }

  return (
    <section style={{ marginTop: 18 }}>
      <header style={{ marginBottom: 8 }}>
        <h3
          style={{
            fontSize: 'var(--fs-md)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          What&rsquo;s repeating across documents
        </h3>
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
            lineHeight: 1.5,
          }}
        >
          The cross-doc signal the per-document panel can&rsquo;t see — biases that fire in more
          than one memo, named failure patterns the audit caught at the deal level, conflicts where
          two documents say different things.
        </p>
      </header>

      {namedPatterns.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Named failure patterns
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            {namedPatterns.map(p => {
              const sev = severityColorForPatternBand(p.severity);
              return (
                <li
                  key={p.patternLabel}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${sev.bar}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {p.patternLabel}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Fired in {p.documentCount}{' '}
                      {p.documentCount === 1 ? 'document' : 'documents'}
                      {p.maxToxicScore != null
                        ? ` · max toxic score ${Math.round(p.maxToxicScore)}`
                        : ''}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: sev.bg,
                      color: sev.text,
                    }}
                  >
                    {p.severity}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {recurringBiases.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Recurring biases
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {recurringBiases.map(b => {
              const sev = severityColorForPatternBand(
                (b.severity as 'critical' | 'high' | 'medium' | 'low') ?? 'medium'
              );
              const docCount = b.documentIds.length;
              return (
                <li
                  key={b.biasType}
                  title={`${formatBiasName(b.biasType)} fired in ${docCount} ${docCount === 1 ? 'document' : 'documents'} (${b.count} total occurrences) at ${b.severity} severity`}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: sev.bg,
                    border: `1px solid ${sev.bar}`,
                    fontSize: 'var(--fs-2xs)',
                    fontWeight: 600,
                    color: sev.text,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{formatBiasName(b.biasType)}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {docCount} doc{docCount === 1 ? '' : 's'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {crossRefConflicts > 0 && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${crossRefHighSeverity > 0 ? 'var(--severity-high)' : 'var(--warning)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitCompareArrows
              size={14}
              style={{
                color: crossRefHighSeverity > 0 ? 'var(--severity-high)' : 'var(--warning)',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Cross-document conflicts
              </div>
              <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                {crossRefConflicts} flagged
                {crossRefHighSeverity > 0 ? ` · ${crossRefHighSeverity} at high severity` : ''}
                {' · '}two documents say different things on the same claim
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Severity-band → palette mapping for pattern + bias chips. Mirrors the
 * platform severity tokens; centralised here to avoid drift with the
 * per-component score colour helper above.
 */
function severityColorForPatternBand(band: 'critical' | 'high' | 'medium' | 'low'): {
  bar: string;
  bg: string;
  text: string;
} {
  switch (band) {
    case 'critical':
      return {
        bar: 'var(--severity-critical)',
        bg: 'rgba(220,38,38,0.08)',
        text: 'var(--severity-critical)',
      };
    case 'high':
      return {
        bar: 'var(--severity-high)',
        bg: 'rgba(249,115,22,0.08)',
        text: 'var(--severity-high)',
      };
    case 'medium':
      return { bar: 'var(--warning)', bg: 'rgba(245,158,11,0.08)', text: 'var(--warning)' };
    case 'low':
      return { bar: 'var(--success)', bg: 'rgba(22,163,74,0.08)', text: 'var(--success)' };
  }
}
