'use client';

import { useEffect, useState } from 'react';
import { History, TrendingDown, TrendingUp, Clock, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatBiasName } from '@/lib/utils/labels';

/**
 * "Have we seen this before?" banner (M9.1 — Decision Graph Bloomberg-level).
 *
 * Fetches the top-3 structurally similar prior decisions from
 * /api/decision-graph/similar/[analysisId] and renders them as a compact
 * card row above the analysis results. Each card links directly to the
 * historical decision for a side-by-side read. The whole component is
 * gracefully absent when there are no similar decisions — no empty state
 * noise on first-analysis uploads.
 */

interface SimilarDecision {
  analysisId: string;
  documentId: string;
  filename: string;
  overallScore: number;
  createdAt: string;
  semanticSimilarity: number;
  matchScore: number;
  outcome: 'success' | 'partial_success' | 'failure' | 'too_early' | null;
  topBiases: string[];
  excerpt: string;
}

function outcomeColor(outcome: SimilarDecision['outcome']): string {
  switch (outcome) {
    case 'success':
      return '#22c55e';
    case 'partial_success':
      return '#eab308';
    case 'failure':
      return '#ef4444';
    case 'too_early':
      return '#60a5fa';
    default:
      return '#71717a';
  }
}

function outcomeLabel(outcome: SimilarDecision['outcome']): string {
  if (!outcome) return 'Pending';
  if (outcome === 'partial_success') return 'Partial';
  if (outcome === 'too_early') return 'Too Early';
  return outcome.charAt(0).toUpperCase() + outcome.slice(1);
}

function OutcomeIcon({ outcome }: { outcome: SimilarDecision['outcome'] }) {
  const color = outcomeColor(outcome);
  if (outcome === 'success' || outcome === 'partial_success') {
    return <TrendingUp size={11} style={{ color }} />;
  }
  if (outcome === 'failure') {
    return <TrendingDown size={11} style={{ color }} />;
  }
  return <Clock size={11} style={{ color }} />;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function SimilarDecisionsBanner({ analysisId }: { analysisId: string }) {
  const [decisions, setDecisions] = useState<SimilarDecision[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/decision-graph/similar/${analysisId}?limit=3`);
        if (cancelled) return;
        if (!res.ok) {
          setDecisions([]);
          return;
        }
        const data = (await res.json()) as { similar: SimilarDecision[] };
        setDecisions(data.similar || []);
      } catch {
        setDecisions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div
        className="card"
        style={{
          border: '1px solid rgba(139, 92, 246, 0.15)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 size={12} className="animate-spin" />
        Checking the decision graph for similar past decisions…
      </div>
    );
  }

  if (!decisions || decisions.length === 0) {
    return null;
  }

  // Count known outcomes for the header summary
  const withOutcomes = decisions.filter(
    d => d.outcome && d.outcome !== 'too_early'
  );
  const failures = decisions.filter(d => d.outcome === 'failure').length;

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(139, 92, 246, 0.25)',
        background:
          'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)',
      }}
    >
      <div
        className="card-header"
        style={{
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          padding: '12px var(--spacing-lg)',
        }}
      >
        <div className="flex items-center gap-sm">
          <History size={16} style={{ color: '#a78bfa' }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
            Have We Seen This Before?
          </h3>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginLeft: 4,
            }}
          >
            {decisions.length} structurally similar prior decision{decisions.length === 1 ? '' : 's'}
            {withOutcomes.length > 0 && (
              <>
                {' '}
                ·{' '}
                <span
                  style={{
                    fontWeight: 600,
                    color: failures > 0 ? '#f87171' : '#4ade80',
                  }}
                >
                  {failures > 0
                    ? `${failures} of ${withOutcomes.length} failed`
                    : `${withOutcomes.length} resolved`}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 10,
          }}
        >
          {decisions.map(d => {
            const color = outcomeColor(d.outcome);
            return (
              <Link
                key={d.analysisId}
                href={`/documents/${d.documentId}`}
                className="text-xs"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {d.filename}
                  </div>
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}
                  />
                </div>

                <div className="flex items-center gap-sm" style={{ fontSize: 10 }}>
                  <span
                    className="inline-flex items-center gap-1"
                    style={{
                      color,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <OutcomeIcon outcome={d.outcome} />
                    {outcomeLabel(d.outcome)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Score {Math.round(d.overallScore)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {relativeTime(d.createdAt)}
                  </span>
                </div>

                {d.topBiases.length > 0 && (
                  <div className="flex items-center gap-xs" style={{ flexWrap: 'wrap' }}>
                    {d.topBiases.slice(0, 3).map(b => (
                      <span
                        key={b}
                        style={{
                          fontSize: 9,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {formatBiasName(b)}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  Match score: {d.matchScore}/100
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
