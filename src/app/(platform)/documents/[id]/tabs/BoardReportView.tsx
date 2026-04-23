'use client';

import { Presentation, Loader2, Download, Calendar, Lock, Unlock } from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';
import { R2FBadge } from '@/components/ui/R2FBadge';

// Keep in sync with src/lib/reports/board-report-generator.ts
const MAX_SUMMARY_CHARS = 500;
const MAX_EXCERPT_CHARS = 180;
const MAX_MITIGATION_CHARS = 400;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high: '#ea580c',
  medium: 'var(--warning)',
  low: 'var(--info, #3b82f6)',
};

function truncate(text: string | undefined, max: number): string {
  if (!text) return '';
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

function gradeFromScore(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function interpretGrade(grade: string): string {
  switch (grade) {
    case 'A':
      return 'Board-ready. Strong reasoning across the stack.';
    case 'B':
      return 'Mostly solid. Address the flagged biases before the vote.';
    case 'C':
      return 'Mixed. Several reasoning gaps need explicit treatment.';
    case 'D':
      return 'Weak. Rework required before the committee reviews.';
    default:
      return 'Critical. Reset the memo before re-circulating.';
  }
}

interface BiasLike {
  biasType: string;
  severity?: string;
  excerpt?: string;
  explanation?: string;
  suggestion?: string;
}

interface SimulationLike {
  twins?: Array<{
    name: string;
    role: string;
    vote: string;
    confidence: number;
    rationale: string;
  }>;
}

interface BoardReportViewProps {
  title: string;
  overallScore: number;
  summary: string;
  biases: BiasLike[];
  simulation?: SimulationLike;
  onExportPdf: () => Promise<void> | void;
  exporting?: boolean;
  /** When true, renders the CONFIDENTIAL ribbon + tinted footer so
   *  the preview matches the PDF a CSO would forward internally. */
  confidential?: boolean;
  onToggleConfidential?: () => void;
}

export function BoardReportView({
  title,
  overallScore,
  summary,
  biases,
  simulation,
  onExportPdf,
  exporting,
  confidential,
  onToggleConfidential,
}: BoardReportViewProps) {
  const topBiases = [...biases]
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity?.toLowerCase() || 'low'] ?? 4) -
        (SEVERITY_ORDER[b.severity?.toLowerCase() || 'low'] ?? 4)
    )
    .slice(0, 3);

  const score = Math.round(overallScore || 0);
  const grade = gradeFromScore(score);
  const interpretation = interpretGrade(grade);

  // CEO question — pick the twin with the lowest-confidence approval or rejection
  const ceoQuestion = (() => {
    const twins = simulation?.twins;
    if (!twins || twins.length === 0) {
      return 'No simulated questions yet — re-run analysis to generate.';
    }
    const sorted = [...twins].sort((a, b) => {
      const aScore = (a.vote === 'REJECT' ? 0 : 1) * 100 + a.confidence;
      const bScore = (b.vote === 'REJECT' ? 0 : 1) * 100 + b.confidence;
      return aScore - bScore;
    });
    const top = sorted[0];
    return `From ${top.name} (${top.role}): "${top.rationale}"`;
  })();

  // Mitigation — the suggestion from the most severe bias
  const mitigation = (() => {
    if (topBiases.length === 0) {
      return 'No material biases flagged. Proceed to the committee with the standard decision template.';
    }
    const primary = topBiases[0];
    if (primary.suggestion) return primary.suggestion;
    if (primary.explanation) return primary.explanation;
    return `Address ${formatBiasName(primary.biasType)} directly before the vote — request an independent review of the reasoning chain and capture the dissent in the board packet.`;
  })();

  return (
    <div className="mb-xl">
      <div
        className="card"
        style={{
          borderLeft: '3px solid var(--accent-primary)',
        }}
      >
        {/* Header */}
        <div className="card-header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Presentation size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0 }}>Board-Ready Report</h3>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(22, 163, 74, 0.08)',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                2-PAGE PREVIEW
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Calendar size={11} />
                {new Date().toLocaleDateString()}
              </span>
              {onToggleConfidential && (
                <button
                  onClick={onToggleConfidential}
                  title={
                    confidential
                      ? 'Classification: Confidential — click to remove'
                      : 'Mark as Confidential for internal forwarding'
                  }
                  style={{
                    fontSize: 11,
                    padding: '5px 10px',
                    gap: 5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: confidential ? 'rgba(220,38,38,0.08)' : 'var(--bg-card-hover)',
                    color: confidential ? 'var(--error)' : 'var(--text-secondary)',
                    border: `1px solid ${confidential ? 'rgba(220,38,38,0.25)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    fontWeight: confidential ? 600 : 500,
                    letterSpacing: confidential ? '0.04em' : 'normal',
                  }}
                >
                  {confidential ? <Lock size={11} /> : <Unlock size={11} />}
                  {confidential ? 'CONFIDENTIAL' : 'Classify'}
                </button>
              )}
              <button
                onClick={() => onExportPdf()}
                disabled={exporting}
                className="btn btn-primary"
                style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
              >
                {exporting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="card-body" style={{ padding: 0 }}>
          {/* ───────────── PAGE 1 ───────────── */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px dashed var(--border-color)',
              position: 'relative',
            }}
          >
            {confidential && <ConfidentialRibbon pageLabel="PAGE 1 OF 2" />}
            {/* Doc title */}
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 16,
                lineHeight: 1.3,
              }}
            >
              {title}
            </div>

            {/* DQI card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '16px 20px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card-hover)',
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  {score}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/100</span>
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                  }}
                >
                  {grade}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="section-heading" style={{ marginBottom: 2 }}>
                  Decision Quality Index
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{interpretation}</div>
              </div>
            </div>

            {/* Exec summary */}
            <div className="section-heading">Executive Summary</div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              {truncate(summary, MAX_SUMMARY_CHARS)}
            </p>

            {/* Top 3 biases */}
            <div className="section-heading">Top 3 Cognitive Risks</div>
            {topBiases.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--success)', fontStyle: 'italic' }}>
                No significant biases detected.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topBiases.map(bias => {
                  const sev = (bias.severity || 'medium').toLowerCase();
                  const color = SEVERITY_COLOR[sev] || 'var(--text-muted)';
                  const excerpt = truncate(bias.excerpt || bias.explanation, MAX_EXCERPT_CHARS);
                  return (
                    <div
                      key={bias.biasType}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '10px 12px',
                        borderLeft: `2px solid ${color}`,
                        background: 'var(--bg-card-hover)',
                        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {formatBiasName(bias.biasType)}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              color,
                              textTransform: 'uppercase',
                            }}
                          >
                            {sev}
                          </span>
                        </div>
                        {excerpt && (
                          <p
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              fontStyle: 'italic',
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            &ldquo;{excerpt}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ───────────── PAGE 2 ───────────── */}
          <div style={{ padding: '24px 28px', position: 'relative' }}>
            {confidential && <ConfidentialRibbon pageLabel="PAGE 2 OF 2" />}
            <div className="section-heading">Simulated CEO Question</div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              {ceoQuestion}
            </p>

            <div className="section-heading">Recommended Mitigation</div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {truncate(mitigation, MAX_MITIGATION_CHARS)}
            </p>
          </div>
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border-color)',
            background: confidential ? 'rgba(220,38,38,0.04)' : 'transparent',
            fontSize: 11,
            color: confidential ? 'var(--error)' : 'var(--text-muted)',
            fontWeight: confidential ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <span>
            {confidential
              ? 'CONFIDENTIAL — this preview + the exported PDF both carry the classification marker.'
              : 'This preview mirrors the exported PDF exactly — forward it to your committee as-is.'}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <R2FBadge size="xs" compact variant="outline" />
            {confidential ? '· CONFIDENTIAL · Generated by Decision Intel' : '· Generated by Decision Intel'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ConfidentialRibbon({ pageLabel }: { pageLabel: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 12,
        right: -1,
        padding: '3px 14px',
        background: 'rgba(220,38,38,0.08)',
        color: 'var(--error)',
        border: '1px solid rgba(220,38,38,0.25)',
        borderRight: 'none',
        borderTopLeftRadius: 'var(--radius-md)',
        borderBottomLeftRadius: 'var(--radius-md)',
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        zIndex: 2,
      }}
    >
      Confidential · {pageLabel}
    </div>
  );
}
