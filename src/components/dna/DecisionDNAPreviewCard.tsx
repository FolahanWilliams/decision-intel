'use client';

import Link from 'next/link';
import { Brain, ArrowRight } from 'lucide-react';
import { useDecisionDNA } from '@/hooks/useDecisionDNA';

// Personal-calibration moat preview for the main dashboard. Three stats sourced
// from /api/decision-dna: top-triggered bias (computed from biasTimeline by
// summing count per biasType), belief-delta % and follow-analysis success rate
// (both from DecisionStyleProfile, which requires sampleSize ≥ a few outcomes).
//
// Three states: loading skeleton, discovery state when the user has no data
// yet, and the populated 3-stat row. Discovery state names the moat without
// promising specific numbers — the goal is "run more audits to unlock yours,"
// not "this product is broken."

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function topBiasFromTimeline(
  biasTimeline: Array<{ biasType: string; count: number }>
): { biasType: string; total: number } | null {
  if (biasTimeline.length === 0) return null;
  const totals = new Map<string, number>();
  for (const row of biasTimeline) {
    totals.set(row.biasType, (totals.get(row.biasType) ?? 0) + row.count);
  }
  let topBias: string | null = null;
  let topCount = 0;
  for (const [biasType, count] of totals) {
    if (count > topCount) {
      topCount = count;
      topBias = biasType;
    }
  }
  return topBias ? { biasType: topBias, total: topCount } : null;
}

function StatCell({
  label,
  value,
  sub,
  unlocked,
}: {
  label: string;
  value: string;
  sub?: string;
  unlocked: boolean;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={value}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function DecisionDNAPreviewCard() {
  const { dna, isLoading, error } = useDecisionDNA();

  // Loading skeleton matches the populated 3-stat row footprint so first paint
  // doesn't shift when SWR resolves.
  if (isLoading) {
    return (
      <div className="card" aria-label="Decision DNA loading">
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Decision DNA
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1 }}>
                <div
                  style={{
                    height: 11,
                    width: 96,
                    background: 'var(--bg-card-hover)',
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 24,
                    width: 120,
                    background: 'var(--bg-card-hover)',
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SWR error: fail loud at the warn level so the founder sees fetch issues
  // in console, but render a graceful card so the dashboard doesn't break.
  if (error || !dna) {
    return null;
  }

  const hasAnyData = dna.totals.totalDecisions > 0 || dna.biasTimeline.length > 0;

  // Discovery state: no audits yet. Tease the moat without promising specific
  // numbers. The CTA still goes to /dashboard/decision-dna so a curious user
  // can preview the page (its own empty state lives there).
  if (!hasAnyData) {
    return (
      <Link
        href="/dashboard/decision-dna"
        className="card"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Decision DNA
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              · personal calibration
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Open <ArrowRight size={12} />
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            The biases you trip most, the agents that help you most, the outcomes you log over time.
            Recalibrated for you specifically — not a generic benchmark. Run a few audits and log
            their outcomes to unlock yours.
          </p>
        </div>
      </Link>
    );
  }

  const topBias = topBiasFromTimeline(dna.biasTimeline);
  const style = dna.decisionStyle;
  const sampleSize = style?.sampleSize ?? 0;
  const beliefDeltaUnlocked = !!style && sampleSize >= 3;
  const followRateUnlocked = !!style && sampleSize >= 3;

  return (
    <Link
      href="/dashboard/decision-dna"
      className="card"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div className="card-body">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Decision DNA
          </span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            · personal calibration
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: 'var(--accent-primary)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Open your DNA <ArrowRight size={12} />
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-lg)',
            flexWrap: 'wrap',
          }}
          className="dna-preview-stats"
        >
          <StatCell
            label="Most-triggered bias"
            value={topBias ? formatBiasName(topBias.biasType) : '—'}
            sub={
              topBias ? `${topBias.total} instance${topBias.total === 1 ? '' : 's'}` : 'No bias data yet'
            }
            unlocked={!!topBias}
          />
          <StatCell
            label="Belief delta"
            value={
              beliefDeltaUnlocked && style
                ? `${Math.round((style.avgBeliefDelta ?? 0) * 100)}%`
                : '—'
            }
            sub={
              beliefDeltaUnlocked
                ? 'after analysis'
                : `Unlocks at ${Math.max(0, 3 - sampleSize)} more outcome${sampleSize === 2 ? '' : 's'}`
            }
            unlocked={beliefDeltaUnlocked}
          />
          <StatCell
            label="Follow-success rate"
            value={
              followRateUnlocked && style
                ? `${Math.round((style.followAnalysisSuccessRate ?? 0) * 100)}%`
                : '—'
            }
            sub={
              followRateUnlocked
                ? 'when you followed the audit'
                : 'Unlocks once you log outcomes'
            }
            unlocked={followRateUnlocked}
          />
        </div>
      </div>
      <style>{`
        @media (max-width: 700px) {
          .dna-preview-stats {
            flex-direction: column;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </Link>
  );
}
