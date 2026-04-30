'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Network, ArrowUpRight, Award, Users } from 'lucide-react';

// Bias Genome contribution card (A3 deep, locked 2026-04-27).
//
// Surfaces the personal-org's contribution to the cross-org Bias Genome
// alongside cohort context. Without this, "the genome compounds quarter
// over quarter" stays a marketing claim — the contributor never sees
// the network effect they're funding.
//
// Buyer scenario: CSO at a Pan-African fund opens /dashboard/analytics
// after 12 audits + 4 outcomes. She wants to know: is this platform
// getting smarter for OUR sector specifically, or am I just feeding
// into a generic pool? The card answers in two beats — your specific
// contribution (X bias-pairs, top biases your team flagged) + cohort
// context (Y orgs in the genome, Z decisions analyzed) — so the
// network effect is concrete, not abstract.
//
// Empty states:
// - User has no org → card hides itself (personal accounts have no
//   contribution to surface).
// - User has org but 0 outcomes logged → discovery card naming the
//   moat without promising specific numbers, with "Run an audit + log
//   the outcome to start contributing" CTA.
// - User has org + outcomes → populated card with stats + cohort line.

interface ContributionPayload {
  orgId: string | null;
  isAnonymized: boolean;
  pairsContributed: number;
  outcomeValidatedAnalysesCount: number;
  /** Total distinct bias types this org has produced ground-truth signal on (D2 lock 2026-04-28). */
  distinctBiasTypesContributed: number;
  topContributedBiases: Array<{
    biasType: string;
    count: number;
    confirmedCount: number;
  }>;
  cohortTotalOrgs: number;
  cohortTotalDecisions: number;
  cohortPercentile: number | null;
  /** Platform calibration baseline shipped 2026-04-29 — F1 lock.
   *  Surfaced in the discovery state so a cold-start org sees a
   *  defensible Tetlock-anchored number before they have outcomes.
   *  Extended 2026-04-30 with the Margaret + James procurement-grade
   *  methodology footnote (n + 95% CI + iterations + seed + version). */
  platformBaseline: {
    n: number;
    meanBrier: number;
    meanCategory: 'excellent' | 'good' | 'fair' | 'poor';
    classificationAccuracy: number;
    brierCi95?: { lower: number; upper: number; halfWidth: number };
    bootstrapIterations?: number;
    bootstrapSeed?: number;
    methodologyVersion?: string;
    computedAt?: string;
  };
  computedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch contribution');
    return r.json();
  });

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function BiasGenomeContributionCard() {
  const { data, error, isLoading } = useSWR<ContributionPayload>(
    '/api/intelligence/bias-genome/contribution',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 600_000, // 10min — slow-changing data
      dedupingInterval: 60_000,
    }
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="card" aria-label="Bias Genome contribution loading">
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <Network size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Bias Genome
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
                    width: 80,
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

  // SWR error or no payload — fail soft (the dashboard shouldn't break
  // on a non-load-bearing surface; users can still reach the genome
  // via the public /bias-genome marketing page).
  if (error || !data) {
    return null;
  }

  // Personal account (no org) — nothing to contribute, hide.
  if (!data.orgId) {
    return null;
  }

  // Org exists but no outcomes logged yet — discovery card.
  if (data.outcomeValidatedAnalysesCount === 0) {
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
            <Network size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Bias Genome
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              · cross-org calibration network
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 12px 0',
            }}
          >
            Bias detection sharpens when outcomes get logged across organisations.
            {data.cohortTotalOrgs > 0 ? (
              <>
                {' '}
                {data.cohortTotalOrgs} consenting organisation
                {data.cohortTotalOrgs === 1 ? '' : 's'} contribute today, across{' '}
                {data.cohortTotalDecisions.toLocaleString()} decisions.
              </>
            ) : null}{' '}
            Log outcomes on your audits to start contributing — your team&apos;s confirmed +
            disconfirmed bias instances become part of the calibration signal everyone benefits
            from.
          </p>
          {data.platformBaseline ? (
            <PlatformBaselineCallout baseline={data.platformBaseline} />
          ) : null}
          <Link
            href="/dashboard/outcome-flywheel"
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
            Log an outcome → <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  // Populated state.
  const {
    pairsContributed,
    outcomeValidatedAnalysesCount,
    distinctBiasTypesContributed,
    topContributedBiases,
    cohortTotalOrgs,
    cohortTotalDecisions,
    cohortPercentile,
    isAnonymized,
  } = data;

  const topThree = topContributedBiases.slice(0, 3);

  return (
    <div className="card">
      <div className="card-body">
        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 'var(--spacing-md)',
            flexWrap: 'wrap',
          }}
        >
          <Network size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Bias Genome
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            · your team&apos;s contribution
          </span>
          {isAnonymized && cohortPercentile !== null && cohortPercentile >= 75 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(22, 163, 74, 0.12)',
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Award size={10} />
              Top {Math.max(1, 100 - cohortPercentile)}% contributor
            </span>
          )}
          <Link
            href="/bias-genome"
            target="_blank"
            rel="noopener"
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
            View public genome <ArrowUpRight size={12} />
          </Link>
        </div>

        {/* 3-stat row */}
        <div
          className="bg-stat-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <div>
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
              Pairs contributed
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              {pairsContributed.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 4,
              }}
            >
              outcome-validated bias instances
            </div>
          </div>
          <div>
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
              Audits with outcomes
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              {outcomeValidatedAnalysesCount.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 4,
              }}
            >
              loop closed; calibration signal live
            </div>
          </div>
          <div>
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
              Cohort context
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Users size={18} style={{ color: 'var(--text-muted)' }} />
              {cohortTotalOrgs.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 4,
              }}
            >
              {cohortTotalOrgs === 1 ? 'org' : 'orgs'} in the genome ·{' '}
              {cohortTotalDecisions.toLocaleString()} decisions
            </div>
          </div>
        </div>

        {/* Network-effect breadth — names the count of cross-org bias
            patterns this org's outcomes have produced validated signal on.
            Click-through opens /bias-genome where the cohort-wide effect
            of the org's contribution is visible. (D2 lock 2026-04-28.) */}
        {distinctBiasTypesContributed > 0 && (
          <Link
            href="/bias-genome"
            target="_blank"
            rel="noopener"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 'var(--spacing-md)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(22, 163, 74, 0.06)',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {distinctBiasTypesContributed}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                cross-org bias pattern
                {distinctBiasTypesContributed === 1 ? '' : 's'} sharpened
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                · your team has produced ground-truth signal on each
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--accent-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              See cohort effect <ArrowUpRight size={11} />
            </span>
          </Link>
        )}

        {/* Top contributions list */}
        {topThree.length > 0 && (
          <div>
            <div className="section-heading" style={{ marginBottom: 8 }}>
              Top biases your team flagged
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {topThree.map(b => {
                const confirmRate =
                  b.count > 0 ? Math.round((b.confirmedCount / b.count) * 100) : 0;
                return (
                  <Link
                    key={b.biasType}
                    href={`/dashboard/analytics?view=library#bias-card-${b.biasType}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-color)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {formatBiasName(b.biasType)}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span>{b.count} flagged</span>
                      <span>·</span>
                      <span
                        style={{
                          color: confirmRate >= 50 ? 'var(--success)' : 'var(--text-muted)',
                        }}
                      >
                        {confirmRate}% confirmed
                      </span>
                      <ArrowUpRight size={11} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Cohort percentile callout (only when consenting + computed) */}
        {isAnonymized && cohortPercentile !== null && (
          <div
            style={{
              marginTop: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '1px solid var(--border-color)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Your team ranks in the{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {ordinal(cohortPercentile)} percentile
            </strong>{' '}
            of contributors across the genome —{' '}
            {cohortPercentile >= 75
              ? 'every outcome you log measurably sharpens detection for the cohort.'
              : cohortPercentile >= 50
                ? 'logging more outcomes lifts both your calibration and the cohort signal.'
                : 'every outcome you add this quarter contributes meaningfully to the genome.'}
          </div>
        )}

        {/* Non-consenting reminder */}
        {!isAnonymized && (
          <div
            style={{
              marginTop: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '1px solid var(--border-color)',
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            Your team is not currently in the cross-org genome cohort. Enable anonymous contribution
            in{' '}
            <Link
              href="/dashboard/team"
              style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
            >
              Team settings
            </Link>{' '}
            to compare your calibration against the cohort and benefit from cross-org bias patterns.
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 720px) {
          .bg-stat-row {
            grid-template-columns: 1fr !important;
            gap: var(--spacing-md) !important;
          }
        }
      `}</style>
    </div>
  );
}

function PlatformBaselineCallout({
  baseline,
}: {
  baseline: ContributionPayload['platformBaseline'];
}) {
  const accuracyPct = Math.round(baseline.classificationAccuracy * 100);
  return (
    <div
      style={{
        margin: '0 0 12px 0',
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(99, 102, 241, 0.06)',
        border: '1px solid rgba(99, 102, 241, 0.20)',
        fontSize: 11.5,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          marginBottom: 2,
          fontWeight: 700,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'rgb(79, 70, 229)',
        }}
      >
        Until your outcomes accumulate
      </div>
      Platform calibration baseline · Brier{' '}
      <strong style={{ color: 'var(--text-primary)' }}>{baseline.meanBrier.toFixed(3)}</strong>
      {baseline.brierCi95 && (
        <>
          {' '}
          ± <strong>{baseline.brierCi95.halfWidth.toFixed(3)}</strong>
        </>
      )}{' '}
      ({baseline.meanCategory}) over {baseline.n} audited corporate decisions ·{' '}
      <strong style={{ color: 'var(--text-primary)' }}>{accuracyPct}%</strong> classification
      accuracy at the investigate-further cutoff. Per-org calibration replaces the seed once
      this organisation has ≥1 closed outcome.
      {baseline.brierCi95 && baseline.bootstrapIterations && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10.5,
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          95% CI from a {baseline.bootstrapIterations.toLocaleString('en-US')}-iteration bootstrap
          {baseline.bootstrapSeed ? ` (seed ${baseline.bootstrapSeed})` : ''}
          {baseline.methodologyVersion ? ` · methodology v${baseline.methodologyVersion}` : ''}
          {baseline.computedAt ? ` · computed ${baseline.computedAt}` : ''}.
        </div>
      )}
    </div>
  );
}
