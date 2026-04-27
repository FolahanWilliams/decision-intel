'use client';

/**
 * TopCounterfactualsCard — "Top counterfactuals this quarter." Surfaces
 * the highest-impact bias-removal scenarios across the user's (or org's)
 * most recent audits, so the Analytics Intelligence tab reads like a
 * board-ready digest rather than a chart page.
 *
 * Data source: /api/counterfactuals/top — aggregates up to 15 recent
 * analyses, fans out computeCounterfactuals(), sorts by monetary impact
 * then expected improvement, de-dupes by (bias, document) so a single
 * memo can't dominate. Per-scope cached 15 min.
 *
 * Renders null when the window has no positive scenarios — a silent
 * fail-safe so the tab doesn't lead with "0 counterfactuals."
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitBranch, ArrowUpRight, TrendingUp } from 'lucide-react';
import { confidenceLabel } from '@/lib/utils/confidence';

interface TopScenario {
  analysisId: string;
  documentId: string;
  filename: string;
  analysisCreatedAt: string;
  biasRemoved: string;
  historicalSampleSize: number;
  expectedImprovement: number;
  confidence: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
}

interface TopResponse {
  scenarios: TopScenario[];
  windowDays: number;
  sampleAnalyses: number;
}

function formatBiasName(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatMonetary(value: number | null, currency: string): string | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}k`;
  return `${symbol}${Math.round(value)}`;
}

export function TopCounterfactualsCard() {
  const [data, setData] = useState<TopResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/counterfactuals/top')
      .then(r => (r.ok ? r.json() : null))
      .then((json: TopResponse | null) => {
        if (!cancelled) setData(json);
      })
      .catch(err => console.warn('[TopCounterfactualsCard] top-counterfactuals fetch failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;
  if (!data || data.scenarios.length === 0) return null;

  return (
    <section
      aria-labelledby="top-counterfactuals-heading"
      className="container"
      style={{ paddingTop: 'var(--spacing-xl, 24px)' }}
    >
      <div
        className="card"
        style={{
          borderLeft: '3px solid var(--accent-primary)',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitBranch
              size={18}
              strokeWidth={2.25}
              style={{ color: 'var(--accent-primary)' }}
              aria-hidden
            />
            <div>
              <h3
                id="top-counterfactuals-heading"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Top counterfactuals this quarter
              </h3>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                Ranked across {data.sampleAnalyses} recent audits · last {data.windowDays} days
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.22)',
              borderRadius: 'var(--radius-full, 9999px)',
            }}
          >
            <TrendingUp size={11} strokeWidth={2.5} aria-hidden />
            Board-ready digest
          </div>
        </header>

        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {data.scenarios.map((s, i) => {
            const money = formatMonetary(s.estimatedMonetaryImpact, s.currency);
            const improvement = Math.round(s.expectedImprovement * 100);
            return (
              <li
                key={`${s.analysisId}:${s.biasRemoved}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 22px',
                  borderBottom:
                    i === data.scenarios.length - 1 ? 'none' : '1px solid var(--border-color)',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    minWidth: 28,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Address{' '}
                    <span style={{ color: 'var(--accent-primary)' }}>
                      {formatBiasName(s.biasRemoved)}
                    </span>{' '}
                    in{' '}
                    <span style={{ fontStyle: 'italic' }}>
                      {s.filename.replace(/\.[^.]+$/, '')}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>+{improvement} pp success lift</span>
                    <span>·</span>
                    <span>n={s.historicalSampleSize}</span>
                    <span>·</span>
                    <span>{confidenceLabel(s.confidence)} confidence</span>
                  </div>
                </div>

                {money && (
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      fontFamily: 'var(--font-mono, monospace)',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {money}
                  </div>
                )}

                <Link
                  href={`/documents/${s.documentId}`}
                  aria-label={`Open ${s.filename}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-elevated, #fff)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full, 9999px)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Open
                  <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
