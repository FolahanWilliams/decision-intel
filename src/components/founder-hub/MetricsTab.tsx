'use client';

/**
 * GTM v3.5 Founder Hub Metrics Tab — real-time dashboard for the
 * Phase 1 graduation gate + Phase 2 bridge prep + running data-moat health.
 *
 * Aggregates the most important signals into one surface:
 *   1. Phase 1 funnel — sign-ups, demos completed, meetings, paid customers
 *   2. PMF Engine — Vohra HXC "very disappointed" % vs graduation gate
 *   3. Engagement — audits, outcomes, micro-deliberation events
 *   4. Moat — Brier baseline, per-org Brier, Bias Genome contribution
 *   5. Cadence — days-since-X tripwires
 *
 * Pulls /api/founder-hub/metrics with auto-refresh every 60s. Safe to
 * leave open during a coffee chat — the founder can glance at PMF % +
 * funnel state mid-conversation.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Target,
  Brain,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  PHASE_1_CUSTOMER_BASELINE_MIN,
  PHASE_1_CUSTOMER_BASELINE_MAX,
  PHASE_1_CUSTOMER_STRETCH_MIN,
  PHASE_1_CUSTOMER_KILL_BY_MONTH_4,
  VOHRA_PMF_GRADUATION_THRESHOLD,
  VOHRA_PMF_KILL_THRESHOLD,
  getPhase1Persona,
} from '@/lib/constants/icp';

interface MetricsResponse {
  funnel: {
    totalSignUps: number;
    hxcSignUps: number;
    nonHxcSignUps: number;
    paidCustomers: number;
    paidHxcCustomersRetained90Days: number;
    demosCompleted: number;
    demosThisWeek: number;
    perPersona: Array<{ persona: string; signUps: number }>;
  };
  pmf: {
    veryDisappointedPct: number;
    sampleSize: number;
    pendingSurveys: number;
    completedSurveys: number;
    graduationGatePassed: boolean;
    killThresholdHit: boolean;
    graduationThreshold: number;
    killThreshold: number;
    daysSinceLastSurveyResponse: number | null;
    perPersona: Array<{
      personaId: string;
      personaLabel: string;
      respondents: number;
      veryDisappointedPct: number;
    }>;
  };
  engagement: {
    totalAuditsAllTime: number;
    auditsThisWeek: number;
    auditsThisMonth: number;
    auditsByHxcUsersThisWeek: number;
    avgAuditsPerHxcUserThisWeek: number;
    outcomesClosedLast90Days: number;
    outcomeClosureRate: number;
    microDeliberationEvents: number;
    microDeliberationConfirmed: number;
    microDeliberationRefuted: number;
    microDeliberationConfirmationRate: number;
  };
  moat: {
    platformBrierSeed: number;
    platformBrierAccuracy: number;
    platformBrierSampleSize: number;
    perOrgBrierLatest: number | null;
    perOrgBrierSampleSize: number;
    biasGenomeDistinctBiases: number;
    biasGenomeAuditsContributed: number;
  };
  cadence: {
    daysSinceLastAudit: number | null;
    daysSinceLastPaidCustomer: number | null;
    daysSinceLastVohraResponse: number | null;
    daysSinceLastMicroDeliberation: number | null;
  };
  meta: {
    asOf: string;
    weekStart: string;
    monthStart: string;
    quarterStart: string;
  };
}

interface MetricsTabProps {
  founderPass: string;
}

const REFRESH_INTERVAL_MS = 60_000;

function formatPct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function formatBrier(v: number | null): string {
  if (v == null) return '—';
  return v.toFixed(3);
}

interface TileColor {
  border: string;
  iconColor: string;
  iconBg: string;
}

const COLOR_GREEN: TileColor = {
  border: 'var(--accent-primary)',
  iconColor: 'var(--accent-primary)',
  iconBg: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
};
const COLOR_AMBER: TileColor = {
  border: 'var(--warning)',
  iconColor: 'var(--warning)',
  iconBg: 'color-mix(in srgb, var(--warning) 12%, transparent)',
};
const COLOR_RED: TileColor = {
  border: 'var(--error)',
  iconColor: 'var(--error)',
  iconBg: 'color-mix(in srgb, var(--error) 12%, transparent)',
};
const COLOR_NEUTRAL: TileColor = {
  border: 'var(--border-color)',
  iconColor: 'var(--text-secondary)',
  iconBg: 'var(--bg-tertiary)',
};

function Tile({
  label,
  value,
  subline,
  status,
  icon,
}: {
  label: string;
  value: string | number;
  subline?: string;
  status?: 'green' | 'amber' | 'red' | 'neutral';
  icon?: React.ReactNode;
}) {
  const color =
    status === 'green'
      ? COLOR_GREEN
      : status === 'amber'
        ? COLOR_AMBER
        : status === 'red'
          ? COLOR_RED
          : COLOR_NEUTRAL;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${color.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-full)',
              background: color.iconBg,
              color: color.iconColor,
            }}
          >
            {icon}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subline && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {subline}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12, marginTop: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {icon}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
      </div>
      {subtitle && (
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function MetricsTab({ founderPass }: MetricsTabProps) {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-hub/metrics', {
        headers: { 'x-founder-pass': founderPass },
        cache: 'no-store',
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errBody?.error ?? `Metrics endpoint returned ${res.status}`);
      }
      const json = (await res.json()) as MetricsResponse;
      setData(json);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [founderPass]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading && !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading real-time metrics…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        style={{
          padding: 16,
          background: 'color-mix(in srgb, var(--error) 8%, transparent)',
          border: '1px solid var(--error)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--error)',
        }}
      >
        Failed to load metrics: {error}
        <button
          type="button"
          onClick={fetchMetrics}
          style={{
            marginLeft: 12,
            padding: '4px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ─── Status calculations ──────────────────────────────────────────────
  const phase1HxcRetainedStatus =
    data.funnel.paidHxcCustomersRetained90Days >= PHASE_1_CUSTOMER_BASELINE_MIN
      ? 'green'
      : data.funnel.paidHxcCustomersRetained90Days >= PHASE_1_CUSTOMER_KILL_BY_MONTH_4
        ? 'amber'
        : 'red';

  const pmfStatus = data.pmf.killThresholdHit
    ? 'red'
    : data.pmf.graduationGatePassed
      ? 'green'
      : data.pmf.sampleSize >= 5
        ? 'amber'
        : 'neutral';

  const auditCadenceStatus =
    data.cadence.daysSinceLastAudit == null
      ? 'neutral'
      : data.cadence.daysSinceLastAudit > 7
        ? 'red'
        : data.cadence.daysSinceLastAudit > 3
          ? 'amber'
          : 'green';

  const paidCustomerCadenceStatus =
    data.cadence.daysSinceLastPaidCustomer == null
      ? 'neutral'
      : data.cadence.daysSinceLastPaidCustomer > 30
        ? 'red'
        : data.cadence.daysSinceLastPaidCustomer > 14
          ? 'amber'
          : 'green';

  const outcomeClosureStatus =
    data.engagement.outcomeClosureRate >= 0.5
      ? 'green'
      : data.engagement.outcomeClosureRate >= 0.25
        ? 'amber'
        : 'red';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Phase 1 metrics — real-time
          </h2>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              lineHeight: 1.5,
              maxWidth: 720,
            }}
          >
            The signals that decide Phase 1 graduation, kill, or pivot. Auto-refreshes every 60
            seconds. Founder-ratified GTM v3.5 thresholds: Vohra ≥{VOHRA_PMF_GRADUATION_THRESHOLD}%
            on HXC cohort + {PHASE_1_CUSTOMER_BASELINE_MIN}-{PHASE_1_CUSTOMER_BASELINE_MAX} paid HXC
            customers retained 90+ days = graduation; &lt;{PHASE_1_CUSTOMER_KILL_BY_MONTH_4} by
            month 4 OR Vohra &lt;{VOHRA_PMF_KILL_THRESHOLD}% = kill criterion.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMetrics}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: refreshing ? 'wait' : 'pointer',
            opacity: refreshing ? 0.6 : 1,
          }}
          aria-label="Refresh metrics"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : 'Refresh'}
        </button>
      </div>

      {/* PHASE 1 FUNNEL */}
      <SectionHeader
        title="Phase 1 acquisition funnel"
        subtitle="Sign-ups → demos → paid customers. The only number that matters for Phase 1 graduation is paid HXC customers retained 90+ days."
        icon={<Target size={16} style={{ color: 'var(--accent-primary)' }} />}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <Tile
          label="Total sign-ups"
          value={data.funnel.totalSignUps}
          subline={`${data.funnel.hxcSignUps} HXC · ${data.funnel.nonHxcSignUps} other`}
          status="neutral"
          icon={<Users size={13} />}
        />
        <Tile
          label="Demos completed"
          value={data.funnel.demosCompleted}
          subline={`${data.funnel.demosThisWeek} this week`}
          status="neutral"
          icon={<CheckCircle2 size={13} />}
        />
        <Tile
          label="Paid customers"
          value={data.funnel.paidCustomers}
          subline={`${data.funnel.paidHxcCustomersRetained90Days} HXC retained 90+ days`}
          status={data.funnel.paidCustomers > 0 ? 'green' : 'neutral'}
          icon={<CheckCircle2 size={13} />}
        />
        <Tile
          label="Paid HXC retained 90d"
          value={data.funnel.paidHxcCustomersRetained90Days}
          subline={`Baseline ${PHASE_1_CUSTOMER_BASELINE_MIN}-${PHASE_1_CUSTOMER_BASELINE_MAX} · stretch ${PHASE_1_CUSTOMER_STRETCH_MIN}+ · kill <${PHASE_1_CUSTOMER_KILL_BY_MONTH_4} by mo 4`}
          status={phase1HxcRetainedStatus}
          icon={<TrendingUp size={13} />}
        />
      </div>
      {data.funnel.perPersona.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Sign-ups by persona
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.funnel.perPersona.map(p => {
              const persona = getPhase1Persona(p.persona);
              const isHxc = persona?.hxcEligible ?? false;
              return (
                <span
                  key={p.persona}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    background: isHxc
                      ? 'color-mix(in srgb, var(--accent-primary) 8%, transparent)'
                      : 'var(--bg-tertiary)',
                    border: `1px solid ${isHxc ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {persona?.label ?? p.persona}: {p.signUps}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* PMF ENGINE (Vohra HXC) */}
      <SectionHeader
        title="PMF Engine — Vohra HXC cohort"
        subtitle="The Sean Ellis / Rahul Vohra 'very disappointed' threshold is the canonical pre-eminent measure of B2B PMF and the locked Phase 1 graduation gate."
        icon={<Brain size={16} style={{ color: 'var(--accent-primary)' }} />}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <Tile
          label="Vohra HXC %"
          value={`${data.pmf.veryDisappointedPct}%`}
          subline={`Graduation ≥${data.pmf.graduationThreshold}% · kill <${data.pmf.killThreshold}% (n=${data.pmf.sampleSize})`}
          status={pmfStatus}
          icon={
            data.pmf.graduationGatePassed ? (
              <CheckCircle2 size={13} />
            ) : data.pmf.killThresholdHit ? (
              <AlertTriangle size={13} />
            ) : (
              <Target size={13} />
            )
          }
        />
        <Tile
          label="HXC respondents"
          value={data.pmf.completedSurveys}
          subline={`${data.pmf.pendingSurveys} pending in queue`}
          status={data.pmf.completedSurveys >= 5 ? 'green' : 'neutral'}
          icon={<Users size={13} />}
        />
        <Tile
          label="Days since last response"
          value={
            data.pmf.daysSinceLastSurveyResponse == null
              ? '—'
              : `${data.pmf.daysSinceLastSurveyResponse}d`
          }
          subline="Vohra survey trigger fires after 2 audits in 14 days"
          status={
            data.pmf.daysSinceLastSurveyResponse == null
              ? 'neutral'
              : data.pmf.daysSinceLastSurveyResponse > 30
                ? 'red'
                : data.pmf.daysSinceLastSurveyResponse > 14
                  ? 'amber'
                  : 'green'
          }
          icon={<Clock size={13} />}
        />
      </div>
      {data.pmf.perPersona.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Per-persona Vohra breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.pmf.perPersona.map(p => (
              <div
                key={p.personaId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  padding: '4px 0',
                  color: 'var(--text-primary)',
                }}
              >
                <span>{p.personaLabel}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.veryDisappointedPct}% · n={p.respondents}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ENGAGEMENT */}
      <SectionHeader
        title="Engagement"
        subtitle="Audit volume, outcome closure, and micro-deliberation events. Outcome closure rate compounds the Cloverpop-defense data moat — micro-deliberation events compound it faster (days vs years)."
        icon={<Activity size={16} style={{ color: 'var(--accent-primary)' }} />}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <Tile
          label="Audits this week"
          value={data.engagement.auditsThisWeek}
          subline={`${data.engagement.auditsThisMonth} this month · ${data.engagement.totalAuditsAllTime} all-time`}
          status="neutral"
          icon={<Activity size={13} />}
        />
        <Tile
          label="HXC audits this week"
          value={data.engagement.auditsByHxcUsersThisWeek}
          subline={`Avg ${data.engagement.avgAuditsPerHxcUserThisWeek.toFixed(1)} per HXC user`}
          status={data.engagement.avgAuditsPerHxcUserThisWeek >= 2 ? 'green' : 'amber'}
          icon={<Users size={13} />}
        />
        <Tile
          label="Outcome closure rate"
          value={formatPct(data.engagement.outcomeClosureRate)}
          subline={`${data.engagement.outcomesClosedLast90Days} closed of last 90d audits`}
          status={outcomeClosureStatus}
          icon={<CheckCircle2 size={13} />}
        />
        <Tile
          label="Micro-deliberation events"
          value={data.engagement.microDeliberationEvents}
          subline={`${data.engagement.microDeliberationConfirmed} confirmed · ${data.engagement.microDeliberationRefuted} refuted`}
          status={data.engagement.microDeliberationEvents >= 10 ? 'green' : 'neutral'}
          icon={<TrendingUp size={13} />}
        />
        <Tile
          label="Micro-confirmation rate"
          value={formatPct(data.engagement.microDeliberationConfirmationRate)}
          subline={
            data.engagement.microDeliberationConfirmed + data.engagement.microDeliberationRefuted >=
            5
              ? 'Predictions surfacing as expected'
              : 'Need more events for signal (5+ judged)'
          }
          status={
            data.engagement.microDeliberationConfirmationRate >= 0.5
              ? 'green'
              : data.engagement.microDeliberationConfirmed +
                    data.engagement.microDeliberationRefuted <
                  5
                ? 'neutral'
                : 'amber'
          }
          icon={<Brain size={13} />}
        />
      </div>

      {/* MOAT */}
      <SectionHeader
        title="Moat — Calibration + Bias Genome"
        subtitle="Brier-scored calibration and Bias Genome contribution are the structural defense against Cloverpop's data advantage attack vector. Per-org Brier replaces the platform seed once customer outcomes accumulate."
        icon={<TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <Tile
          label="Platform Brier (seed)"
          value={formatBrier(data.moat.platformBrierSeed)}
          subline={`${formatPct(data.moat.platformBrierAccuracy)} accuracy on n=${data.moat.platformBrierSampleSize} cases`}
          status="neutral"
          icon={<Target size={13} />}
        />
        <Tile
          label="Per-org Brier (latest)"
          value={formatBrier(data.moat.perOrgBrierLatest)}
          subline={`n=${data.moat.perOrgBrierSampleSize} customer outcomes scored`}
          status={
            data.moat.perOrgBrierLatest == null
              ? 'neutral'
              : data.moat.perOrgBrierLatest <= 0.2
                ? 'green'
                : data.moat.perOrgBrierLatest <= 0.35
                  ? 'amber'
                  : 'red'
          }
          icon={<Activity size={13} />}
        />
        <Tile
          label="Bias Genome — distinct biases"
          value={data.moat.biasGenomeDistinctBiases}
          subline={`Across ${data.moat.biasGenomeAuditsContributed} outcome-validated audits`}
          status={data.moat.biasGenomeDistinctBiases >= 10 ? 'green' : 'neutral'}
          icon={<Brain size={13} />}
        />
      </div>

      {/* CADENCE TRIPWIRES */}
      <SectionHeader
        title="Cadence tripwires"
        subtitle="Days-since-X signals. The longer these get, the more likely the wedge motion is breaking. Investigate when amber; act when red."
        icon={<Clock size={16} style={{ color: 'var(--accent-primary)' }} />}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <Tile
          label="Last audit"
          value={
            data.cadence.daysSinceLastAudit == null
              ? '—'
              : `${data.cadence.daysSinceLastAudit}d ago`
          }
          subline="Across all users (incl. founder + demos)"
          status={auditCadenceStatus}
          icon={<Clock size={13} />}
        />
        <Tile
          label="Last paid customer"
          value={
            data.cadence.daysSinceLastPaidCustomer == null
              ? '—'
              : `${data.cadence.daysSinceLastPaidCustomer}d ago`
          }
          subline={
            data.funnel.paidCustomers === 0 ? 'No paid customers yet' : 'Most recent paid sign-up'
          }
          status={paidCustomerCadenceStatus}
          icon={<Users size={13} />}
        />
        <Tile
          label="Last Vohra response"
          value={
            data.cadence.daysSinceLastVohraResponse == null
              ? '—'
              : `${data.cadence.daysSinceLastVohraResponse}d ago`
          }
          subline="Vohra HXC sample size update"
          status={
            data.cadence.daysSinceLastVohraResponse == null
              ? 'neutral'
              : data.cadence.daysSinceLastVohraResponse > 30
                ? 'red'
                : data.cadence.daysSinceLastVohraResponse > 14
                  ? 'amber'
                  : 'green'
          }
          icon={<Brain size={13} />}
        />
        <Tile
          label="Last micro-deliberation"
          value={
            data.cadence.daysSinceLastMicroDeliberation == null
              ? '—'
              : `${data.cadence.daysSinceLastMicroDeliberation}d ago`
          }
          subline="Logged from a real IC / board review"
          status={
            data.cadence.daysSinceLastMicroDeliberation == null
              ? 'neutral'
              : data.cadence.daysSinceLastMicroDeliberation > 30
                ? 'amber'
                : 'green'
          }
          icon={<Activity size={13} />}
        />
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '14px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>How to read this dashboard:</strong> green
        tiles mean the metric is at-or-above v3.5 baseline; amber means below baseline but above
        kill threshold; red means kill criterion fired. The Phase 1 graduation gate fires when the
        Vohra HXC % crosses {VOHRA_PMF_GRADUATION_THRESHOLD}% AND paid HXC retained 90+ days hits{' '}
        {PHASE_1_CUSTOMER_BASELINE_MIN}-{PHASE_1_CUSTOMER_BASELINE_MAX}. The kill criterion fires at
        month 4 if either signal collapses below threshold — halt scaling, run a product-discovery
        sprint with the somewhat-disappointed + not-disappointed cohorts. Last refresh:{' '}
        {lastFetched ? lastFetched.toLocaleString() : '—'}.
      </div>
    </div>
  );
}
