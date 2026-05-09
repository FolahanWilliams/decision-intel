'use client';

/**
 * Toxic Combination Trending — analytics card for the Insights page.
 *
 * Renders the top-N named patterns affecting the org over the last 90 days,
 * sorted by occurrence count, with severity coding by max-toxic-score.
 * Cross-references against the canonical NAMED_PATTERNS catalogue to
 * surface per-pattern bias-pair vocabulary + M&A tags + the description
 * the BiasDetailModal participates-in surface uses.
 *
 * Cascade-depth audit ship #5 — locked 2026-05-09 evening.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, GitCompareArrows } from 'lucide-react';
import { NAMED_PATTERNS } from '@/lib/learning/named-patterns';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('ToxicCombinationTrendingCard');

interface PatternRow {
  patternLabel: string;
  count: number;
  avgToxicScore: number;
  maxToxicScore: number;
}

const MNA_PATTERN_LABELS = new Set([
  'The Synergy Mirage',
  'The Conglomerate Fallacy',
  "The Winner's Curse",
]);

function severityForScore(score: number): {
  band: string;
  color: string;
} {
  if (score >= 80) return { band: 'critical', color: 'var(--severity-critical, #7F1D1D)' };
  if (score >= 60) return { band: 'high', color: 'var(--severity-high, #DC2626)' };
  if (score >= 40) return { band: 'medium', color: 'var(--warning, #D97706)' };
  return { band: 'low', color: 'var(--info, #2563EB)' };
}

interface Props {
  orgId: string | null;
}

export function ToxicCombinationTrendingCard({ orgId }: Props) {
  const [patterns, setPatterns] = useState<PatternRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const url = `/api/toxic-combinations/trends?days=90&groupBy=patternLabel${
          orgId ? `&orgId=${orgId}` : ''
        }`;
        const res = await fetch(url);
        if (!res.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const data = (await res.json().catch(() => null)) as { patterns?: PatternRow[] } | null;
        if (!cancelled) {
          setPatterns(data?.patterns ?? []);
        }
      } catch (err) {
        log.warn('Failed to load toxic-combination trending:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  if (loading) {
    return (
      <div className="card animate-slide-up" style={{ animationDelay: '0.66s' }}>
        <div className="card-header">
          <h3 style={{ fontSize: 12, fontWeight: 600 }}>
            <GitCompareArrows
              size={14}
              style={{
                display: 'inline',
                marginRight: 6,
                verticalAlign: 'middle',
                color: 'var(--warning)',
              }}
            />
            Toxic Combinations · Top Patterns (90d)
          </h3>
        </div>
        <div className="card-body" style={{ minHeight: 180, color: 'var(--text-muted)' }}>
          Loading pattern frequency…
        </div>
      </div>
    );
  }

  if (error || !patterns) {
    return (
      <div className="card" style={{ animationDelay: '0.66s' }}>
        <div className="card-header">
          <h3 style={{ fontSize: 12, fontWeight: 600 }}>
            <GitCompareArrows
              size={14}
              style={{
                display: 'inline',
                marginRight: 6,
                verticalAlign: 'middle',
                color: 'var(--warning)',
              }}
            />
            Toxic Combinations · Top Patterns (90d)
          </h3>
        </div>
        <div className="card-body" style={{ color: 'var(--text-muted)' }}>
          Pattern trending temporarily unavailable.
        </div>
      </div>
    );
  }

  const topPatterns = patterns.slice(0, 8);
  const maxCount = topPatterns[0]?.count ?? 1;

  return (
    <div className="card animate-slide-up" style={{ animationDelay: '0.66s' }}>
      <div className="card-header">
        <h3 style={{ fontSize: 12, fontWeight: 600 }}>
          <GitCompareArrows
            size={14}
            style={{
              display: 'inline',
              marginRight: 6,
              verticalAlign: 'middle',
              color: 'var(--warning)',
            }}
          />
          Toxic Combinations · Top Patterns (90d)
        </h3>
      </div>
      <div className="card-body">
        {topPatterns.length === 0 ? (
          <div
            style={{
              padding: '14px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px dashed var(--border-color)',
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.55,
            }}
          >
            No toxic combinations fired in the last 90 days. Either the deal flow has been
            clean or the team has been auditing decisions before they ship — check back
            after the next IC cycle.
          </div>
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
            {topPatterns.map(p => {
              const severity = severityForScore(p.maxToxicScore);
              const meta = NAMED_PATTERNS.find(n => n.label === p.patternLabel);
              const partners = meta
                ? meta.biasTypes
                    .map(b => b.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
                    .join(' + ')
                : null;
              const isMna = MNA_PATTERN_LABELS.has(p.patternLabel);
              const widthPct = Math.max(8, Math.round((p.count / maxCount) * 100));
              return (
                <li
                  key={p.patternLabel}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${severity.color}`,
                    background: 'var(--bg-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {p.patternLabel}
                      {isMna && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 9.5,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: 'rgba(22, 163, 74, 0.12)',
                            color: 'var(--accent-primary, #16A34A)',
                            border: '1px solid rgba(22, 163, 74, 0.3)',
                          }}
                        >
                          M&A
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 6,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 800, color: severity.color }}>
                        {p.count}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        fired
                      </span>
                    </div>
                  </div>
                  {partners && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {partners}
                    </div>
                  )}
                  <div
                    style={{
                      height: 4,
                      background: 'var(--bg-tertiary, #f3f4f6)',
                      borderRadius: 999,
                      overflow: 'hidden',
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${widthPct}%`,
                        background: severity.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: 12,
                    }}
                  >
                    <span>avg {p.avgToxicScore.toFixed(0)}</span>
                    <span>·</span>
                    <span>peak {p.maxToxicScore.toFixed(0)}</span>
                    <span>·</span>
                    <span style={{ color: severity.color, fontWeight: 700 }}>
                      {severity.band}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div
          style={{
            marginTop: 12,
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md, 8px)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <AlertTriangle size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Patterns are named compound failure modes — when two specific biases co-occur
            with required context, the combination historically destroys more value than
            either bias alone. Open any audit&rsquo;s toxic-combinations panel for per-deal
            evidence.
          </div>
        </div>
      </div>
    </div>
  );
}
