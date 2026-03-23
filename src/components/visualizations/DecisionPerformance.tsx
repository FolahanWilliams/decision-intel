'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  BarChart3,
  Users,
  AlertCircle,
  CheckCircle,
  Award,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalibrationBucket {
  bucket: string;
  midpoint: number;
  successRate: number;
  count: number;
}

interface BiasCostEntry {
  bias: string;
  successRateDelta: number;
  failedCount: number;
  totalCount: number;
}

interface PersonaLeaderboardEntry {
  name: string;
  accuracy: number;
  timesSelected: number;
}

interface DashboardData {
  kpis: {
    accuracyRate: number;
    avgImpactScore: number;
    decisionsTracked: number;
    biasDetectionAccuracy: number;
  };
  calibration: CalibrationBucket[];
  biasCosts: BiasCostEntry[];
  personaLeaderboard: PersonaLeaderboardEntry[];
  pendingOutcomes: number;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const glassCard: React.CSSProperties = {
  background: 'rgba(8, 11, 20, 0.58)',
  borderRadius: '20px',
  boxShadow:
    '0 12px 48px rgba(0,0,0,0.38), 0 1px 0 rgba(255,255,255,0.07) inset',
  padding: 'var(--spacing-lg)',
};

const tooltipStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.75)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '12px',
  backdropFilter: 'blur(24px) saturate(180%)',
  boxShadow:
    '0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08) inset',
  padding: '8px 12px',
  fontSize: '12px',
};

const CHART_COLORS = {
  white: '#FFFFFF',
  zinc200: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  success: '#22c55e',
  failure: '#ef4444',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

function formatPercent(v: number): string {
  return `${Math.round(v)}%`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  index,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  index: number;
  accentColor?: string;
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        ...glassCard,
        flex: '1 1 220px',
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${accentColor ?? CHART_COLORS.zinc600}22`,
          }}
        >
          <Icon
            size={18}
            style={{ color: accentColor ?? CHART_COLORS.zinc400 }}
          />
        </div>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          color: 'var(--text-primary)',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      {subtext && (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {subtext}
        </span>
      )}
    </motion.div>
  );
}

// ─── Custom Tooltips ────────────────────────────────────────────────────────

function CalibrationTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CalibrationBucket;
  return (
    <div style={tooltipStyle}>
      <div style={{ color: CHART_COLORS.white, fontWeight: 600, marginBottom: 4 }}>
        Confidence {d.bucket}
      </div>
      <div style={{ color: CHART_COLORS.zinc200 }}>
        Actual success: {formatPercent(d.successRate)}
      </div>
      <div style={{ color: CHART_COLORS.zinc400 }}>
        Decisions: {d.count}
      </div>
    </div>
  );
}

function BiasCostTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as BiasCostEntry;
  return (
    <div style={tooltipStyle}>
      <div style={{ color: CHART_COLORS.white, fontWeight: 600, marginBottom: 4 }}>
        {d.bias}
      </div>
      <div style={{ color: CHART_COLORS.failure }}>
        {formatPercent(Math.abs(d.successRateDelta))} lower success rate
      </div>
      <div style={{ color: CHART_COLORS.zinc400 }}>
        {d.failedCount} failed / {d.totalCount} total
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DecisionPerformance() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/outcomes/dashboard');
        if (!res.ok) {
          throw new Error(`Failed to load dashboard (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'An unexpected error occurred');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Calibration chart data augmented with perfect-calibration midpoint
  const calibrationData = useMemo(() => {
    if (!data?.calibration) return [];
    return data.calibration.map((b) => ({
      ...b,
      perfectCalibration: b.midpoint,
    }));
  }, [data?.calibration]);

  // Sort bias costs by impact (most negative first)
  const sortedBiasCosts = useMemo(() => {
    if (!data?.biasCosts) return [];
    return [...data.biasCosts].sort(
      (a, b) => a.successRateDelta - b.successRateDelta
    );
  }, [data?.biasCosts]);

  // Sort persona leaderboard by accuracy desc
  const sortedPersonas = useMemo(() => {
    if (!data?.personaLeaderboard) return [];
    return [...data.personaLeaderboard].sort(
      (a, b) => b.accuracy - a.accuracy
    );
  }, [data?.personaLeaderboard]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          color: 'var(--text-muted)',
          fontSize: 14,
          gap: 'var(--spacing-sm)',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          style={{ width: 20, height: 20 }}
        >
          <Target size={20} />
        </motion.div>
        Loading decision performance data...
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        style={{
          ...glassCard,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          color: CHART_COLORS.failure,
        }}
      >
        <AlertCircle size={20} />
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Failed to load Decision Performance
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (!data || data.kpis.decisionsTracked === 0) {
    return (
      <div
        style={{
          ...glassCard,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 'var(--spacing-md)',
          textAlign: 'center',
        }}
      >
        <Target size={40} style={{ color: CHART_COLORS.zinc500 }} />
        <div
          style={{
            color: 'var(--text-primary)',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          No decisions tracked yet
        </div>
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            maxWidth: 400,
          }}
        >
          Start analyzing documents and reporting outcomes to see your decision
          calibration, bias costs, and persona accuracy here.
        </div>
      </div>
    );
  }

  const { kpis } = data;

  // ── Dashboard ──────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
      }}
    >
      {/* ── Pending Outcomes Banner ────────────────────────────────────── */}
      {data.pendingOutcomes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            ...glassCard,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            border: `1px solid ${CHART_COLORS.zinc600}`,
          }}
        >
          <AlertCircle size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              You have {data.pendingOutcomes} decision
              {data.pendingOutcomes !== 1 ? 's' : ''} awaiting outcome reports.
            </span>{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              Track outcomes to improve your calibration.
            </span>
          </div>
          <a
            href="/outcomes/report"
            style={{
              color: CHART_COLORS.white,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.12)',
              transition: 'background 0.2s',
            }}
          >
            Report Outcomes
          </a>
        </motion.div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          flexWrap: 'wrap',
        }}
      >
        <KpiCard
          icon={Target}
          label="Decision Accuracy Rate"
          value={formatPercent(kpis.accuracyRate)}
          subtext="success + partial / total"
          index={0}
          accentColor={CHART_COLORS.success}
        />
        <KpiCard
          icon={TrendingUp}
          label="Avg Impact Score"
          value={String(Math.round(kpis.avgImpactScore))}
          subtext="out of 100"
          index={1}
          accentColor={CHART_COLORS.zinc200}
        />
        <KpiCard
          icon={BarChart3}
          label="Decisions Tracked"
          value={kpis.decisionsTracked.toLocaleString()}
          index={2}
          accentColor={CHART_COLORS.zinc400}
        />
        <KpiCard
          icon={CheckCircle}
          label="Bias Detection Accuracy"
          value={formatPercent(kpis.biasDetectionAccuracy)}
          subtext="confirmed / (confirmed + false positives)"
          index={3}
          accentColor="#a78bfa"
        />
      </div>

      {/* ── Confidence vs Reality Chart ─────────────────────────────── */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={glassCard}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <Target size={18} style={{ color: CHART_COLORS.zinc400 }} />
          <span
            style={{
              color: 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Confidence vs Reality (Calibration)
          </span>
        </div>
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 12,
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Points above the diagonal indicate overconfidence. Points below
          indicate underconfidence.
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={calibrationData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
            />
            <XAxis
              dataKey="bucket"
              tick={{ fill: CHART_COLORS.zinc400, fontSize: 12 }}
              axisLine={{ stroke: CHART_COLORS.zinc600 }}
              tickLine={false}
              label={{
                value: 'Predicted Confidence',
                position: 'insideBottom',
                offset: -4,
                style: { fill: CHART_COLORS.zinc500, fontSize: 12 },
              }}
            />
            <YAxis
              tick={{ fill: CHART_COLORS.zinc400, fontSize: 12 }}
              axisLine={{ stroke: CHART_COLORS.zinc600 }}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              label={{
                value: 'Actual Success Rate',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fill: CHART_COLORS.zinc500, fontSize: 12 },
              }}
            />
            <Tooltip content={<CalibrationTooltip />} />
            {/* Perfect calibration line */}
            <Line
              dataKey="perfectCalibration"
              type="linear"
              stroke={CHART_COLORS.zinc600}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              dot={false}
              name="Perfect Calibration"
              legendType="none"
            />
            {/* Actual success rate bars */}
            <Bar
              dataKey="successRate"
              name="Success Rate"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            >
              {calibrationData.map((entry, idx) => {
                const diff = entry.successRate - entry.midpoint;
                let fill = CHART_COLORS.zinc200;
                if (diff > 10) fill = CHART_COLORS.success;
                else if (diff < -10) fill = CHART_COLORS.failure;
                return <Cell key={idx} fill={fill} fillOpacity={0.75} />;
              })}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-lg)',
            justifyContent: 'center',
            marginTop: 'var(--spacing-sm)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: CHART_COLORS.success,
                display: 'inline-block',
              }}
            />
            Underconfident
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: CHART_COLORS.zinc200,
                display: 'inline-block',
              }}
            />
            Well Calibrated
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: CHART_COLORS.failure,
                display: 'inline-block',
              }}
            />
            Overconfident
          </span>
        </div>
      </motion.div>

      {/* ── Bottom row: Bias Costs + Persona Leaderboard ────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 'var(--spacing-lg)',
        }}
      >
        {/* ── Bias Cost Estimates ──────────────────────────────────── */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={glassCard}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <BarChart3 size={18} style={{ color: CHART_COLORS.failure }} />
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Bias Cost Estimates
            </span>
          </div>
          {sortedBiasCosts.length === 0 ? (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: 13,
                textAlign: 'center',
                padding: 'var(--spacing-xl) 0',
              }}
            >
              No bias cost data available yet.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(200, sortedBiasCosts.length * 44)}>
                <BarChart
                  data={sortedBiasCosts}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: CHART_COLORS.zinc400, fontSize: 11 }}
                    axisLine={{ stroke: CHART_COLORS.zinc600 }}
                    tickLine={false}
                    tickFormatter={(v: number) => `${Math.abs(v)}%`}
                    domain={['dataMin', 0]}
                  />
                  <YAxis
                    type="category"
                    dataKey="bias"
                    width={140}
                    tick={{ fill: CHART_COLORS.zinc200, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<BiasCostTooltip />} />
                  <Bar
                    dataKey="successRateDelta"
                    radius={[4, 0, 0, 4]}
                    maxBarSize={28}
                  >
                    {sortedBiasCosts.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS.failure}
                        fillOpacity={0.7 + (idx / sortedBiasCosts.length) * 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  marginTop: 'var(--spacing-sm)',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                }}
              >
                {sortedBiasCosts.map((b) => (
                  <div key={b.bias} style={{ marginBottom: 2 }}>
                    {b.bias} &mdash; correlated with{' '}
                    {formatPercent(Math.abs(b.successRateDelta))} lower success
                    rate
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* ── Decision Twin Leaderboard ────────────────────────────── */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={glassCard}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <Users size={18} style={{ color: '#a78bfa' }} />
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Decision Twin Leaderboard
            </span>
          </div>
          {sortedPersonas.length === 0 ? (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: 13,
                textAlign: 'center',
                padding: 'var(--spacing-xl) 0',
              }}
            >
              No persona data available yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 80px 80px',
                  gap: 'var(--spacing-sm)',
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                }}
              >
                <span>#</span>
                <span>Persona</span>
                <span style={{ textAlign: 'right' }}>Accuracy</span>
                <span style={{ textAlign: 'right' }}>Selected</span>
              </div>
              {/* Rows */}
              {sortedPersonas.map((persona, idx) => {
                const isTop = idx === 0;
                return (
                  <motion.div
                    key={persona.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.06 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr 80px 80px',
                      gap: 'var(--spacing-sm)',
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      alignItems: 'center',
                      background: isTop
                        ? 'rgba(255,255,255,0.03)'
                        : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isTop ? (
                        <Award
                          size={16}
                          style={{ color: '#fbbf24' }}
                        />
                      ) : (
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {idx + 1}
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontWeight: isTop ? 600 : 400,
                      }}
                    >
                      {persona.name}
                    </span>
                    <span
                      style={{
                        textAlign: 'right',
                        color: persona.accuracy >= 70
                          ? CHART_COLORS.success
                          : persona.accuracy >= 50
                            ? CHART_COLORS.zinc200
                            : CHART_COLORS.failure,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {formatPercent(persona.accuracy)}
                    </span>
                    <span
                      style={{
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}
                    >
                      {persona.timesSelected}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
