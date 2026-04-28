'use client';

import Link from 'next/link';
import { Brain, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useDecisionDNA } from '@/hooks/useDecisionDNA';
import { SparklineChart } from '@/components/ui/SparklineChart';

// Personal-calibration moat preview for the main dashboard. Three stats sourced
// from /api/decision-dna: top-triggered bias (computed from biasTimeline by
// summing count per biasType), belief-delta % and follow-analysis success rate
// (both from DecisionStyleProfile, which requires sampleSize ≥ 3 outcomes).
//
// Three states: loading skeleton, discovery state when the user has no data,
// and the populated 3-stat row. Discovery state's CTA routes to upload (the
// real next action), not to /dashboard/decision-dna (a sibling empty state).
//
// Per category-grade depth audit (2026-04-27): the most-triggered bias name
// is a deep-link to /dashboard/analytics?view=library#bias-card-{biasType}
// — the bias library cards already render id="bias-card-{key}" so the
// browser handles the auto-scroll. A small sparkline next to the count
// shows the last 6 months of that bias's frequency (the data is in
// dna.biasTimeline). Sample-size provenance ("X audits · Y outcomes")
// renders below the stats so the buyer knows what's grounding the numbers.

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function topBiasFromTimeline(
  biasTimeline: Array<{ biasType: string; month: string; count: number }>
): { biasType: string; total: number; monthlyCounts: number[] } | null {
  if (biasTimeline.length === 0) return null;

  // Sum counts per biasType to find the most-triggered.
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
  if (!topBias) return null;

  // Build last-6-months sparkline. Months absent from the data become 0 so
  // the sparkline shows real cadence (gaps included), not a compressed view.
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    monthKeys.push(key);
  }
  const byMonth = new Map<string, number>();
  for (const row of biasTimeline) {
    if (row.biasType !== topBias) continue;
    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.count);
  }
  const monthlyCounts = monthKeys.map(k => byMonth.get(k) ?? 0);

  return { biasType: topBias, total: topCount, monthlyCounts };
}

function StatCell({
  label,
  value,
  sub,
  unlocked,
  trailing,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  unlocked: boolean;
  trailing?: React.ReactNode;
  href?: string;
}) {
  const valueNode = (
    <span
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
        lineHeight: 1.1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textDecoration: 'none',
      }}
      title={value}
    >
      {value}
      {href && unlocked && (
        <ArrowUpRight
          size={13}
          style={{ color: 'var(--text-muted)', opacity: 0.6, flexShrink: 0 }}
          aria-hidden
        />
      )}
    </span>
  );

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
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        {href && unlocked ? (
          <Link
            href={href}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 0,
              flex: 1,
            }}
            onClick={e => e.stopPropagation()}
          >
            {valueNode}
          </Link>
        ) : (
          valueNode
        )}
        {trailing}
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

  // Loading skeleton matches the populated 3-stat row footprint so first
  // paint doesn't shift when SWR resolves.
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

  // SWR error: don't break the dashboard. Returning null is OK here because
  // the card is a non-load-bearing surface (the buyer can still reach DNA
  // via sidebar / palette); the underlying error surfaces in console.
  if (error || !dna) {
    return null;
  }

  const hasAnyData = dna.totals.totalDecisions > 0 || dna.biasTimeline.length > 0;

  // Discovery state: no audits yet. Tease the moat AND route the click to
  // the actual next action (upload), not to a sibling empty state. This was
  // the category-grade audit gap caught 2026-04-27 — "Open →" was a
  // look-at-more-data CTA, not an action; "Run your first audit →" is.
  if (!hasAnyData) {
    return (
      <div className="card">
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
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· personal calibration</span>
            <Link
              href="/dashboard/decision-dna"
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              Preview empty surface →
            </Link>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 12px 0',
            }}
          >
            The biases you trip most, the agents that help you most, the outcomes you log over time.
            Recalibrated for you specifically — not a generic benchmark. Run a few audits and log
            their outcomes to unlock yours.
          </p>
          <Link
            href="/dashboard?view=upload"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-primary)',
              background: 'rgba(22, 163, 74, 0.06)',
            }}
          >
            Run your first audit <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  const topBias = topBiasFromTimeline(dna.biasTimeline);
  const style = dna.decisionStyle;
  const sampleSize = style?.sampleSize ?? 0;
  const beliefDeltaUnlocked = !!style && sampleSize >= 3;
  const followRateUnlocked = !!style && sampleSize >= 3;

  // Provenance: ground the stats with the sample size so a procurement-stage
  // reader knows what they're looking at. Categorically more credible than
  // bare numbers.
  const provenanceParts: string[] = [];
  if (dna.totals.totalDecisions > 0) {
    provenanceParts.push(
      `${dna.totals.totalDecisions} audit${dna.totals.totalDecisions === 1 ? '' : 's'}`
    );
  }
  if (dna.totals.totalOutcomes > 0) {
    provenanceParts.push(
      `${dna.totals.totalOutcomes} outcome${dna.totals.totalOutcomes === 1 ? '' : 's'} logged`
    );
  }
  const provenance = provenanceParts.join(' · ');

  // Sparkline color: neutral muted; this is volume cadence, not a benchmark
  // up/down signal (more instances of confirmation_bias isn't necessarily
  // bad — could mean more audits this month, not worse calibration).
  const sparklineColor = 'var(--text-muted)';

  return (
    <div className="card">
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
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· personal calibration</span>
          <Link
            href="/dashboard/decision-dna"
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: 'var(--accent-primary)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
            }}
          >
            Open your DNA <ArrowRight size={12} />
          </Link>
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
              topBias
                ? `${topBias.total} instance${topBias.total === 1 ? '' : 's'} · click to study`
                : 'No bias data yet'
            }
            unlocked={!!topBias}
            href={
              topBias
                ? `/dashboard/analytics?view=library#bias-card-${topBias.biasType}`
                : undefined
            }
            trailing={
              topBias && topBias.monthlyCounts.some(c => c > 0) ? (
                <SparklineChart
                  data={topBias.monthlyCounts}
                  color={sparklineColor}
                  width={56}
                  height={20}
                  strokeWidth={1.5}
                />
              ) : undefined
            }
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
                ? 'how often you change your mind after analysis'
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
              followRateUnlocked ? 'when you followed the audit' : 'Unlocks once you log outcomes'
            }
            unlocked={followRateUnlocked}
          />
        </div>
        {provenance && (
          <div
            style={{
              marginTop: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '1px solid var(--border-color)',
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Calibrated on {provenance}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 700px) {
          .dna-preview-stats {
            flex-direction: column;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
}
