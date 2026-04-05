'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDecisionDNA } from '@/hooks/useDecisionDNA';
import {
  COPILOT_AGENTS,
  AGENT_LABELS,
  AGENT_COLORS,
  type CopilotAgentType,
} from '@/lib/copilot/types';
// Breadcrumbs handled by parent page
import { BackToTop } from '@/components/ui/BackToTop';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from 'recharts';
import {
  Brain,
  Shield,
  Target,
  Clock,
  TrendingUp,
  Award,
  Sparkles,
  Lightbulb,
  RefreshCw,
  ArrowRight,
  Zap,
} from 'lucide-react';

/* ── Reusable sub-components ─────────────────────────────────── */

function SectionLabel({ children, index }: { children: string; index: number }) {
  return (
    <div
      className="animate-slide-up"
      style={{
        animationDelay: `${index * 0.08}s`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: 'var(--spacing-md)',
        marginTop: index > 0 ? 'var(--spacing-xl)' : undefined,
      }}
    >
      <span
        style={{
          color: 'var(--accent-primary)',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {String(index).padStart(2, '0')}
      </span>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}
      >
        {children}
      </span>
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(to right, var(--glass-border), transparent)',
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  suffix,
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
  delay: number;
}) {
  return (
    <div
      className="card card-glow animate-slide-up"
      style={{ animationDelay: `${delay}s`, overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          opacity: 0.4,
        }}
      />
      <div
        className="card-body"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            background: `${color}10`,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color,
              lineHeight: 1,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {value}
            {suffix && (
              <span style={{ fontSize: '12px', opacity: 0.5, marginLeft: '2px' }}>{suffix}</span>
            )}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      <div
        style={{
          marginBottom: 'var(--spacing-xl)',
          paddingBottom: 'var(--spacing-md)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 320, height: 12 }} />
      </div>
      <div className="grid grid-3 gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="card">
            <div className="card-body" style={{ padding: '14px 18px' }}>
              <div className="flex items-center gap-md">
                <div className="skeleton" style={{ width: 36, height: 36 }} />
                <div>
                  <div className="skeleton" style={{ width: 60, height: 22, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: 90, height: 10 }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-2 gap-md">
        {[0, 1].map(i => (
          <div key={i} className="card">
            <div className="card-header">
              <div className="skeleton" style={{ width: 160, height: 14 }} />
            </div>
            <div className="card-body" style={{ height: 280 }}>
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Constants ────────────────────────────────────────────────── */

const OUTCOME_COLORS: Record<string, string> = {
  success: '#30d158',
  partial_success: '#ffd60a',
  failure: '#ff453a',
  inconclusive: '#8e8e93',
};

const OUTCOME_LABELS: Record<string, string> = {
  success: 'Success',
  partial_success: 'Partial',
  failure: 'Failure',
  inconclusive: 'Inconclusive',
};

const RISK_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  conservative: { bg: '#30d15815', text: '#30d158', border: '#30d15840' },
  moderate: { bg: '#ffd60a15', text: '#ffd60a', border: '#ffd60a40' },
  aggressive: { bg: '#ff453a15', text: '#ff453a', border: '#ff453a40' },
};

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

/* ── Main Page ────────────────────────────────────────────────── */

export function DecisionDNAPageContent() {
  const { dna, isLoading, error, mutate } = useDecisionDNA();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div
        className="container"
        style={{
          paddingTop: 'var(--spacing-2xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
        }}
      >
        <p style={{ color: 'var(--error)' }}>Failed to load Decision DNA</p>
        <button className="btn btn-primary" onClick={() => mutate()}>
          Retry
        </button>
      </div>
    );
  }

  if (!dna) return null;

  // Empty state
  if (dna.totals.totalDecisions === 0 && !dna.decisionStyle) {
    return (
      <div
        className="container"
        style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)' }}
      >
        {/* Breadcrumbs handled by parent */}
        <div
          className="card card-glow animate-slide-up"
          style={{
            maxWidth: 560,
            margin: '80px auto',
            textAlign: 'center',
            padding: 'var(--spacing-2xl)',
          }}
        >
          <Brain size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Build Your Decision DNA
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Start making decisions with the Copilot to build your unique decision profile. The more
            you decide, the smarter your agents become.
          </p>
          <Link
            href="/dashboard/ask?mode=copilot"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={16} />
            Open Decision Copilot
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const style = dna.decisionStyle;
  const riskBadge =
    RISK_BADGE_COLORS[style?.riskTolerance ?? 'moderate'] ?? RISK_BADGE_COLORS.moderate;

  // Prepare bias bar chart data
  const biasBarData = (() => {
    if (!style) return [];
    const allBiases = new Map<
      string,
      { count: number; type: 'confirmed' | 'false_positive' | 'normal' }
    >();
    for (const b of style.confirmedBiasPatterns) {
      allBiases.set(b, { count: (allBiases.get(b)?.count ?? 0) + 1, type: 'confirmed' });
    }
    for (const b of style.falsePositiveBiasPatterns) {
      if (!allBiases.has(b)) allBiases.set(b, { count: 0, type: 'false_positive' });
      else allBiases.get(b)!.type = 'false_positive';
    }
    // Supplement from bias timeline totals
    const timelineTotals = new Map<string, number>();
    for (const item of dna.biasTimeline) {
      timelineTotals.set(item.biasType, (timelineTotals.get(item.biasType) ?? 0) + item.count);
    }
    for (const [bias, count] of timelineTotals) {
      if (!allBiases.has(bias)) {
        allBiases.set(bias, { count, type: 'normal' });
      } else {
        allBiases.get(bias)!.count = count;
      }
    }
    return Array.from(allBiases.entries())
      .map(([name, data]) => ({
        name: name.length > 20 ? name.slice(0, 18) + '…' : name,
        fullName: name,
        count: data.count,
        fill:
          data.type === 'confirmed'
            ? '#ff453a'
            : data.type === 'false_positive'
              ? '#8e8e93'
              : '#38bdf8',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  })();

  // Prepare bias timeline area chart
  const biasAreaData = (() => {
    const months = new Map<string, Record<string, number>>();
    const biasTypes = new Set<string>();
    for (const item of dna.biasTimeline) {
      biasTypes.add(item.biasType);
      if (!months.has(item.month)) months.set(item.month, {});
      months.get(item.month)![item.biasType] = item.count;
    }
    const topBiases = Array.from(biasTypes).slice(0, 5);
    return {
      data: Array.from(months.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, counts]) => ({
          month: month.slice(5), // MM only
          ...Object.fromEntries(topBiases.map(b => [b, counts[b] ?? 0])),
        })),
      keys: topBiases,
    };
  })();

  // Prepare outcome pie data
  const outcomePieData = (() => {
    const counts: Record<string, number> = {};
    for (const o of dna.outcomeHistory) {
      counts[o.outcome] = (counts[o.outcome] ?? 0) + 1;
    }
    return Object.entries(counts).map(([outcome, count]) => ({
      name: OUTCOME_LABELS[outcome] ?? outcome,
      value: count,
      fill: OUTCOME_COLORS[outcome] ?? '#8e8e93',
    }));
  })();

  // Prepare velocity scatter data
  const velocityScatter = dna.decisionVelocity.map((v, i) => ({
    x: v.deliberationHours,
    y:
      v.outcome === 'success'
        ? 3
        : v.outcome === 'partial_success'
          ? 2
          : v.outcome === 'failure'
            ? 1
            : 0,
    label: v.outcome ?? 'pending',
    key: i,
  }));

  // Agent effectiveness sorted
  const agentRanking = dna.agentEffectiveness
    ? Object.entries(dna.agentEffectiveness)
        .map(([agent, data]) => ({ agent, ...data }))
        .sort((a, b) => b.accuracyRate - a.accuracyRate)
    : [];

  const AREA_COLORS = ['#3b82f6', '#ef4444', '#8b5cf6', '#22c55e', '#f59e0b'];

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      {/* Breadcrumbs handled by parent */}
      <BackToTop />

      {/* Header */}
      <div
        className="animate-slide-up"
        style={{
          marginBottom: 'var(--spacing-xl)',
          paddingBottom: 'var(--spacing-md)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Decision DNA
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Your unique decision profile — how you decide, where you excel, and what to watch.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn btn-ghost"
          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── [01] YOUR DECISION PROFILE ─────────────────────────────── */}
      <SectionLabel index={1}>YOUR DECISION PROFILE</SectionLabel>
      <div className="grid grid-3 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <StatCard
          label="Risk Tolerance"
          value={
            (style?.riskTolerance ?? 'moderate').charAt(0).toUpperCase() +
            (style?.riskTolerance ?? 'moderate').slice(1)
          }
          icon={<Shield size={20} />}
          color={riskBadge.text}
          delay={0.1}
        />
        <StatCard
          label="Total Decisions"
          value={dna.totals.totalDecisions}
          icon={<Brain size={20} />}
          color="#38bdf8"
          delay={0.18}
        />
        <StatCard
          label="Success Rate"
          value={Math.round(dna.totals.successRate * 100)}
          icon={<Target size={20} />}
          color="#30d158"
          suffix="%"
          delay={0.26}
        />
        <StatCard
          label="Avg Impact"
          value={dna.totals.avgImpact}
          icon={<Zap size={20} />}
          color="#ffd60a"
          suffix="/10"
          delay={0.34}
        />
        <StatCard
          label="Avg Deliberation"
          value={formatHours(style?.avgDecisionSpeed ? style.avgDecisionSpeed * 24 : 0)}
          icon={<Clock size={20} />}
          color="#bf5af2"
          delay={0.42}
        />
        <StatCard
          label="Belief Delta"
          value={Math.round(style?.avgBeliefDelta ?? 0)}
          icon={<TrendingUp size={20} />}
          color="#ff9f0a"
          suffix="%"
          delay={0.5}
        />
      </div>

      {/* ── [02] BIAS DNA ──────────────────────────────────────────── */}
      <SectionLabel index={2}>BIAS DNA</SectionLabel>
      <div className="grid grid-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
        {/* Bias frequency bar chart */}
        <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.56s' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Top Biases
            </h3>
            <div style={{ display: 'flex', gap: 12, fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>
                <span style={{ color: '#ff453a' }}>●</span> Confirmed
              </span>
              <span>
                <span style={{ color: '#38bdf8' }}>●</span> Detected
              </span>
              <span>
                <span style={{ color: '#8e8e93' }}>●</span> False Positive
              </span>
            </div>
          </div>
          <div className="card-body" style={{ height: 'clamp(220px, 35vw, 320px)' }}>
            {biasBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={biasBarData}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {biasBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                No bias data yet
              </div>
            )}
          </div>
        </div>

        {/* Bias timeline area chart */}
        <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.64s' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Bias Trend Over Time
            </h3>
          </div>
          <div className="card-body" style={{ height: 'clamp(220px, 35vw, 320px)' }}>
            {biasAreaData.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={biasAreaData.data}
                  margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  {biasAreaData.keys.map((key, i) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stackId="1"
                      stroke={AREA_COLORS[i % AREA_COLORS.length]}
                      fill={AREA_COLORS[i % AREA_COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                No timeline data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── [03] AGENT EFFECTIVENESS ──────────────────────────────── */}
      <SectionLabel index={3}>AGENT EFFECTIVENESS</SectionLabel>
      <div
        className="animate-slide-up"
        style={{
          animationDelay: '0.72s',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        {agentRanking.length > 0
          ? agentRanking.map((item, i) => {
              const agentColor = AGENT_COLORS[item.agent as CopilotAgentType] ?? '#8e8e93';
              const isTop = i === 0;
              return (
                <div
                  key={item.agent}
                  className="card card-glow"
                  style={{
                    overflow: 'hidden',
                    border: isTop ? `1px solid ${agentColor}40` : undefined,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      background: agentColor,
                      opacity: isTop ? 0.6 : 0.3,
                    }}
                  />
                  <div className="card-body" style={{ padding: '16px' }}>
                    {isTop && (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}
                      >
                        <Award size={12} style={{ color: '#ffd60a' }} />
                        <span style={{ fontSize: '10px', color: '#ffd60a', fontWeight: 600 }}>
                          MOST EFFECTIVE
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: agentColor,
                        marginBottom: 12,
                      }}
                    >
                      {AGENT_LABELS[item.agent as CopilotAgentType] ?? item.agent}
                    </div>
                    <div
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        lineHeight: 1,
                      }}
                    >
                      {Math.round(item.accuracyRate * 100)}
                      <span style={{ fontSize: '12px', opacity: 0.5 }}>%</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4 }}>
                      accuracy · {item.sampleSize} decisions
                    </div>
                    {item.avgImpact > 0 && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                        avg impact: {Math.round(item.avgImpact * 10) / 10}/10
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          : COPILOT_AGENTS.map(agent => (
              <div key={agent} className="card" style={{ opacity: 0.5 }}>
                <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: AGENT_COLORS[agent],
                      marginBottom: 8,
                    }}
                  >
                    {AGENT_LABELS[agent]}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No data yet</div>
                </div>
              </div>
            ))}
      </div>

      {/* ── [04] OUTCOME TRACK RECORD ────────────────────────────── */}
      <SectionLabel index={4}>OUTCOME TRACK RECORD</SectionLabel>
      <div className="grid grid-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
        {/* Outcome distribution pie */}
        <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.80s' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Outcome Distribution
            </h3>
          </div>
          <div
            className="card-body"
            style={{
              height: 'clamp(220px, 35vw, 300px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {outcomePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {outcomePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No outcomes yet</div>
            )}
            {outcomePieData.length > 0 && (
              <div
                style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {outcomePieData.map(d => (
                  <div
                    key={d.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Decision velocity scatter */}
        <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.88s' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Decision Velocity vs. Outcome
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Does thinking longer help?
            </span>
          </div>
          <div className="card-body" style={{ height: 'clamp(220px, 35vw, 300px)' }}>
            {velocityScatter.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name="Hours"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    label={{
                      value: 'Hours',
                      position: 'bottom',
                      style: { fontSize: 10, fill: 'var(--text-muted)' },
                    }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={[0, 3]}
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(v: number) => ['?', 'Fail', 'Partial', 'Success'][v]}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value, name) => {
                      const v = Number(value);
                      if (name === 'Hours') return [`${v}h`, 'Deliberation'];
                      return [['?', 'Failure', 'Partial', 'Success'][v] ?? '?', 'Outcome'];
                    }}
                  />
                  <Scatter data={velocityScatter} fill="#38bdf8" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                No velocity data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── [05] LESSONS & INSIGHTS ──────────────────────────────── */}
      <SectionLabel index={5}>LESSONS & INSIGHTS</SectionLabel>
      <div className="grid grid-2 gap-md animate-slide-up" style={{ animationDelay: '0.96s' }}>
        {/* Follow vs Ignore analysis */}
        <div className="card card-glow">
          <div className="card-header">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Follow Analysis vs. Go With Gut
            </h3>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            {style && style.sampleSize > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Followed Analysis
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#30d158',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {Math.round(style.followAnalysisSuccessRate * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--glass-bg)' }}>
                    <div
                      style={{
                        width: `${style.followAnalysisSuccessRate * 100}%`,
                        height: '100%',
                        borderRadius: 4,
                        background: 'linear-gradient(to right, #30d158, #34d399)',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Went With Gut
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#ff9f0a',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {Math.round(style.ignoreAnalysisSuccessRate * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--glass-bg)' }}>
                    <div
                      style={{
                        width: `${style.ignoreAnalysisSuccessRate * 100}%`,
                        height: '100%',
                        borderRadius: 4,
                        background: 'linear-gradient(to right, #ff9f0a, #fbbf24)',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
                {style.mostAccurateTwin && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Award
                      size={12}
                      style={{ display: 'inline', marginRight: 6, color: '#ffd60a' }}
                    />
                    Most accurate predictor:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {style.mostAccurateTwin}
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                Need more decisions with priors to compare
              </div>
            )}
          </div>
        </div>

        {/* Top Lessons */}
        <div className="card card-glow">
          <div className="card-header">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Lightbulb
                size={14}
                style={{ display: 'inline', marginRight: 6, color: '#ffd60a' }}
              />
              Your Top Lessons
            </h3>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            {style && style.topLessons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {style.topLessons.map((lesson, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent-primary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginRight: 8,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {lesson}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                Lessons from resolved decisions will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
