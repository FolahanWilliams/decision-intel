'use client';

/**
 * Deal-level DQI composite breakdown panel.
 *
 * The per-audit `DqiBreakdownPanel` decomposes ONE document's score
 * across the 7 weighted components. The deal-level panel is a different
 * shape — the composite is the simple average of per-document scores,
 * so the right decomposition is "where did this composite come from"
 * (per-document rows + cross-document recurring patterns), not "which
 * weighted component contributed what" (that's the per-audit view).
 *
 * Built from the buyer's seat (Head of Corp Dev / PE Deal Partner) —
 * plain language at every layer, no jargon, no internal stat names.
 * The panel is a navigation surface: it answers "why is the composite
 * a B" then routes the reader to the per-document audit for the deeper
 * read.
 *
 * Locked 2026-05-09 evening — DQI explainability ship surface 3.
 */

import Link from 'next/link';
import { ArrowRight, FileText, GitCompareArrows, Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dqiColorFor, gradeFromScore, type Grade } from '@/lib/utils/grade';
import { formatBiasName } from '@/lib/utils/labels';
import type { DealAggregationDto, DealDocument } from '@/types/deals';

const GRADE_BAND: Record<Grade, string> = {
  A: 'Audit-ready — present to committee',
  B: 'Defensible — minor gaps to close before committee',
  C: 'Workable — material gaps to close before committee',
  D: 'Below threshold — significant rework needed',
  F: 'Failing — do not present in current form',
};

const SEVERITY_HEX: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: 'var(--severity-critical, #7F1D1D)',
  high: 'var(--severity-high, #DC2626)',
  medium: 'var(--warning, #D97706)',
  low: 'var(--info, #2563EB)',
};

export interface DealDqiBreakdownPanelProps {
  /** Open state controlled by the caller. */
  open: boolean;
  /** Called when the dialog should close. */
  onOpenChange: (open: boolean) => void;
  /** The deal name for the header context. */
  dealName: string;
  /** The deal's full aggregation (composite + recurring patterns). */
  aggregation: DealAggregationDto;
  /** Total documents linked to the deal (analyzed + unanalyzed). */
  totalDocs: number;
  /** Document list with per-doc latest-analysis embedded. */
  documents: DealDocument[];
  /** Cross-document conflict count (from crossRefFindings.length). */
  conflictCount: number;
  /** Cross-document conflicts at high+ severity. */
  conflictHighCount: number;
}

export function DealDqiBreakdownPanel({
  open,
  onOpenChange,
  dealName,
  aggregation,
  totalDocs,
  documents,
  conflictCount,
  conflictHighCount,
}: DealDqiBreakdownPanelProps) {
  const compositeScore = aggregation.compositeDqi ?? 0;
  const compositeGrade = aggregation.compositeGrade ?? gradeFromScore(compositeScore);
  const compositeColor = dqiColorFor(compositeScore);

  const analyzedDocs = documents.filter(
    (d): d is DealDocument & { analyses: NonNullable<DealDocument['analyses']> } =>
      Array.isArray(d.analyses) && d.analyses.length > 0
  );
  const sortedDocs = [...analyzedDocs].sort(
    (a, b) => (a.analyses[0].overallScore ?? 0) - (b.analyses[0].overallScore ?? 0)
  );

  const recurring = aggregation.recurringBiases.slice(0, 5);
  const namedPatterns = aggregation.namedPatterns.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: 920,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
        }}
      >
        {/* Header — composite score + grade band */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: compositeColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(compositeScore)}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <DialogTitle
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  {dealName} — composite breakdown
                </DialogTitle>
                <DialogDescription
                  style={{
                    fontSize: 13.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  Grade {compositeGrade} · {GRADE_BAND[compositeGrade]}. The composite is the simple
                  average of {aggregation.analyzedDocCount} analyzed document
                  {aggregation.analyzedDocCount === 1 ? '' : 's'}
                  {totalDocs > aggregation.analyzedDocCount
                    ? ` (${totalDocs - aggregation.analyzedDocCount} document${
                        totalDocs - aggregation.analyzedDocCount === 1 ? '' : 's'
                      } not yet analyzed).`
                    : '.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div
          style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}
        >
          {/* SECTION 1 — Per-document rows. The composite is the average of these. */}
          <Section
            eyebrow="Where the composite came from"
            title="Document-by-document"
            description="Each row is one analyzed document on this deal. Click any to see the full per-component breakdown for that audit."
          >
            {sortedDocs.length === 0 ? (
              <EmptyRow text="No documents have been analyzed yet on this deal." />
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {sortedDocs.map(doc => {
                  const latest = doc.analyses[0];
                  const score = latest?.overallScore ?? 0;
                  const grade = gradeFromScore(score);
                  const color = dqiColorFor(score);
                  return (
                    <li key={doc.id}>
                      <Link
                        href={`/documents/${doc.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md, 8px)',
                          border: '1px solid var(--border-color)',
                          borderLeft: `3px solid ${color}`,
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'background 120ms',
                        }}
                      >
                        <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.filename}
                          </div>
                          {doc.documentType && (
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                textTransform: 'capitalize',
                                marginTop: 1,
                              }}
                            >
                              {doc.documentType.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 800,
                              color,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {Math.round(score)}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {grade}
                          </span>
                        </div>
                        <ArrowRight
                          size={14}
                          style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* SECTION 2 — Recurring biases across docs. */}
          <Section
            eyebrow="Cognitive biases"
            title="Recurring across the deal"
            description="Biases that surfaced in two or more analyzed documents on this deal. Same pattern repeating across artefacts is a stronger signal than any single flag."
          >
            {recurring.length === 0 ? (
              <EmptyRow text="No recurring bias patterns. Each analyzed document has its own per-bias decomposition — open one above to see it." />
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {recurring.map(b => (
                  <li
                    key={b.biasType}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${SEVERITY_HEX[b.topSeverity]}`,
                      background: 'var(--bg-card)',
                    }}
                  >
                    <Users size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatBiasName(b.biasType)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        Appeared in {b.documentCount} of {aggregation.analyzedDocCount} document
                        {aggregation.analyzedDocCount === 1 ? '' : 's'} · {b.totalOccurrences} total
                        flag
                        {b.totalOccurrences === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: SEVERITY_HEX[b.topSeverity],
                        flexShrink: 0,
                      }}
                    >
                      {b.topSeverity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* SECTION 3 — Named compound failure patterns (M&A toxic combos). */}
          <Section
            eyebrow="Compound failure patterns"
            title="Named patterns detected on this deal"
            description="When two specific biases co-occur, they create patterns that historically destroy more value than either bias alone — Synergy Mirage, Winner's Curse, Conglomerate Fallacy, and others."
          >
            {namedPatterns.length === 0 ? (
              <EmptyRow text="No compound failure patterns detected across the deal's analyzed documents." />
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {namedPatterns.map(p => (
                  <li
                    key={p.patternLabel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${SEVERITY_HEX[p.topSeverity]}`,
                      background: 'var(--bg-card)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.patternLabel}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        Detected in {p.documentCount} of {aggregation.analyzedDocCount} document
                        {aggregation.analyzedDocCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: SEVERITY_HEX[p.topSeverity],
                        flexShrink: 0,
                      }}
                    >
                      {p.topSeverity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* SECTION 4 — Cross-document conflicts. */}
          {conflictCount > 0 && (
            <Section
              eyebrow="Cross-document conflicts"
              title="Where the deal's documents disagree"
              description="Claims in one document that another document either contradicts or fails to support. Open the cross-reference card on the deal page for the per-claim detail."
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${
                    conflictHighCount > 0
                      ? 'var(--severity-high, #DC2626)'
                      : 'var(--warning, #D97706)'
                  }`,
                  background: 'var(--bg-card)',
                }}
              >
                <GitCompareArrows
                  size={16}
                  style={{
                    color:
                      conflictHighCount > 0
                        ? 'var(--severity-high, #DC2626)'
                        : 'var(--warning, #D97706)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {conflictCount} cross-document conflict{conflictCount === 1 ? '' : 's'} flagged
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {conflictHighCount > 0
                      ? `${conflictHighCount} at high severity — close these before committee.`
                      : 'No high-severity conflicts; review the medium and low flags before signing.'}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Methodology footer */}
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              padding: '14px 0 0',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <strong style={{ color: 'var(--text-secondary)' }}>How this is computed.</strong>{' '}
            Composite is the simple average of per-document DQI scores. Recurring biases and named
            patterns are aggregated server-side across every analyzed document on the deal — same
            input always yields the same output. To see what made any one document score the way it
            did, open that document above and click its DQI score.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md, 8px)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X size={13} />
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: 4,
          }}
        >
          {eyebrow}
        </div>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            margin: '4px 0 0',
          }}
        >
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px dashed var(--border-color)',
        fontSize: 12.5,
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}
