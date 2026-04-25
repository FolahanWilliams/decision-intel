'use client';

/**
 * Cross-document conflict surface for the deal detail page (3.1 deep).
 *
 * Renders the most-recent DealCrossReference run with:
 *   - top-line summary + counts (X conflicts · Y high-severity)
 *   - per-finding cards (severity chip, type label, claim-A vs claim-B,
 *     why it matters, resolution question)
 *   - "Run cross-reference" button (manual trigger)
 *
 * When no run exists yet the card invites the first run, gated to
 * deals with ≥2 analyzed docs.
 */

import { useState, useCallback } from 'react';
import { GitCompare, AlertTriangle, Loader2, Clock, ChevronDown, ArrowRight } from 'lucide-react';
import type {
  DealCrossReferenceRun,
  DealCrossReferenceFinding,
  DealAggregationDto,
} from '@/types/deals';
import { useToast } from '@/components/ui/EnhancedToast';

const SEVERITY_HEX: Record<DealCrossReferenceFinding['severity'], string> = {
  critical: '#7F1D1D',
  high: '#DC2626',
  medium: '#D97706',
  low: '#2563EB',
};

const TYPE_LABEL: Record<DealCrossReferenceFinding['type'], string> = {
  numeric: 'Numeric',
  assumption: 'Assumption',
  timeline: 'Timeline',
  risk_treatment: 'Risk treatment',
  scope: 'Scope',
};

interface Props {
  dealId: string;
  initialRun: DealCrossReferenceRun | null;
  aggregation: DealAggregationDto | null;
  /** Called after a successful new run so the parent can refresh data. */
  onRunCompleted?: () => void;
}

function findingsArray(run: DealCrossReferenceRun | null): DealCrossReferenceFinding[] {
  if (!run) return [];
  if (Array.isArray(run.findings)) return run.findings;
  return run.findings.findings ?? [];
}

function topSummary(run: DealCrossReferenceRun | null): string {
  if (!run) return '';
  if (Array.isArray(run.findings)) return '';
  return run.findings.summary ?? '';
}

function truncationOf(run: DealCrossReferenceRun | null) {
  if (!run || Array.isArray(run.findings)) return null;
  const r = run.findings.truncationReport;
  if (!r) return null;
  if (r.truncatedDocs.length === 0 && r.excludedDocs.length === 0) return null;
  return r;
}

function formatRunAt(ts: string): string {
  try {
    const d = new Date(ts);
    const now = Date.now();
    const diffMs = now - d.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } catch {
    return ts;
  }
}

export function CrossReferenceCard({ dealId, initialRun, aggregation, onRunCompleted }: Props) {
  const [run, setRun] = useState<DealCrossReferenceRun | null>(initialRun);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const analyzedCount = aggregation?.analyzedDocCount ?? 0;
  const canRun = analyzedCount >= 2;

  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/cross-reference`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(body.error || `Cross-reference failed (${res.status})`, 'error');
        return;
      }
      setRun(body.run ?? null);
      showToast('Cross-reference complete.', 'success');
      onRunCompleted?.();
    } catch {
      showToast('Cross-reference failed. Try again in a moment.', 'error');
    } finally {
      setRunning(false);
    }
  }, [dealId, running, onRunCompleted, showToast]);

  const findings = findingsArray(run);
  const headlineSummary = topSummary(run);
  const truncation = truncationOf(run);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft:
          findings.length > 0
            ? `3px solid ${findings.some(f => f.severity === 'critical' || f.severity === 'high') ? '#DC2626' : '#D97706'}`
            : '3px solid var(--accent-primary)',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: findings.length > 0 || run ? 10 : 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            <GitCompare size={12} />
            Cross-document review
            {run && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  textTransform: 'none',
                }}
              >
                · <Clock size={10} /> {formatRunAt(run.runAt)}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.45,
            }}
          >
            {!run
              ? canRun
                ? `Run cross-document review across the ${analyzedCount} analyzed doc${analyzedCount === 1 ? '' : 's'}`
                : 'Cross-document review needs at least two analyzed documents on this deal.'
              : findings.length === 0
                ? 'No cross-document conflicts detected on the available material.'
                : `${findings.length} conflict${findings.length === 1 ? '' : 's'} flagged · ${run.highSeverityCount} high-severity`}
          </div>
          {headlineSummary && findings.length > 0 && (
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                marginTop: 6,
                lineHeight: 1.55,
              }}
            >
              {headlineSummary}
            </div>
          )}
          {truncation && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'rgba(217,119,6,0.08)',
                border: '1px solid rgba(217,119,6,0.30)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                gap: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              <AlertTriangle size={13} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Partial scan.</strong>{' '}
                {truncation.truncatedDocs.length > 0 && (
                  <>
                    {truncation.truncatedDocs.length} doc{truncation.truncatedDocs.length === 1 ? '' : 's'} truncated to fit the cross-reference budget
                    {truncation.truncatedDocs.length <= 3 && (
                      <> ({truncation.truncatedDocs.map(d => d.documentName).join(', ')})</>
                    )}
                    .
                  </>
                )}
                {truncation.excludedDocs.length > 0 && (
                  <>
                    {' '}
                    {truncation.excludedDocs.length} doc{truncation.excludedDocs.length === 1 ? '' : 's'} excluded entirely once the {Math.round(truncation.totalCapChars / 1000)}K-char total cap was reached
                    {truncation.excludedDocs.length <= 3 && (
                      <> ({truncation.excludedDocs.map(d => d.documentName).join(', ')})</>
                    )}
                    .
                  </>
                )}{' '}
                Findings may miss conflicts in the truncated content. Trim long memos to the
                load-bearing sections (synergies / unit economics / risk treatment) and re-run for
                full coverage.
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={!canRun || running}
          className={canRun ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: canRun && !running ? 'pointer' : 'not-allowed',
            opacity: canRun ? 1 : 0.55,
          }}
        >
          {running ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <GitCompare size={13} />
          )}
          {running ? 'Running…' : run ? 'Re-run' : 'Run review'}
        </button>
      </div>

      {findings.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 12,
          }}
        >
          {findings.map((f, idx) => {
            const colour = SEVERITY_HEX[f.severity];
            const id = `${idx}-${f.summary.slice(0, 20)}`;
            const isOpen = expanded[id];
            return (
              <div
                key={id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${colour}`,
                  borderRadius: 8,
                  background: 'var(--bg-elevated)',
                }}
              >
                <button
                  onClick={() =>
                    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  aria-expanded={isOpen}
                >
                  <AlertTriangle
                    size={14}
                    style={{ color: colour, flexShrink: 0, marginTop: 2 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: colour,
                          background: `${colour}18`,
                          border: `1px solid ${colour}33`,
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {f.severity}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {TYPE_LABEL[f.type]}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.45,
                      }}
                    >
                      {f.summary}
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      marginTop: 4,
                      transform: isOpen ? 'rotate(180deg)' : undefined,
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 12px 12px 36px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {f.claims.map((c, i) => (
                        <div
                          key={`${c.documentId}-${i}`}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 6,
                            padding: '8px 10px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: 'var(--text-muted)',
                              marginBottom: 3,
                            }}
                          >
                            {c.documentName}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-primary)',
                              lineHeight: 1.5,
                              fontStyle: 'italic',
                            }}
                          >
                            “{c.excerpt}”
                          </div>
                        </div>
                      ))}
                    </div>
                    {f.whyItMatters && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.55,
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Why it matters:</strong>{' '}
                        {f.whyItMatters}
                      </div>
                    )}
                    {f.resolutionQuestion && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'flex-start',
                          gap: 6,
                        }}
                      >
                        <ArrowRight size={12} style={{ marginTop: 3, flexShrink: 0 }} />
                        <span>{f.resolutionQuestion}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!run && !canRun && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            marginTop: 8,
          }}
        >
          Upload at least one more document and run its audit before kicking off a cross-document review.
        </div>
      )}
    </div>
  );
}
