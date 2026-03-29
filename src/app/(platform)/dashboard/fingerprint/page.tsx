'use client';

import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Fingerprint,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFingerprint } from '@/hooks/useFingerprint';
import { type ContextualPattern } from '@/lib/learning/fingerprint-engine';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function TrendIcon({ trend }: { trend: string | null }) {
  if (trend === 'decreasing') return <TrendingDown size={12} className="text-emerald-400" />;
  if (trend === 'increasing') return <TrendingUp size={12} className="text-red-400" />;
  return <Minus size={12} className="text-zinc-400" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 border ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

function PrevalenceBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 70 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted/20 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted w-8 text-right">{pct}%</span>
    </div>
  );
}

function buildHeatmapData(quarterlyPatterns: Record<string, ContextualPattern[]> | undefined) {
  if (!quarterlyPatterns)
    return {
      biasTypes: [] as string[],
      quarters: [] as string[],
      cells: {} as Record<string, number>,
    };

  const biasSet = new Set<string>();
  const quarterSet = new Set<string>();

  for (const [quarter, patterns] of Object.entries(quarterlyPatterns)) {
    quarterSet.add(quarter);
    for (const p of patterns) biasSet.add(p.biasType);
  }

  const biasTypes = [...biasSet].slice(0, 10);
  const quarters = [...quarterSet].sort();

  const cells: Record<string, number> = {};
  for (const [quarter, patterns] of Object.entries(quarterlyPatterns)) {
    for (const p of patterns) {
      cells[`${p.biasType}::${quarter}`] = p.prevalenceRate;
    }
  }

  return { biasTypes, quarters, cells };
}

export default function FingerprintPage() {
  const { fingerprint, isLoading, error } = useFingerprint();

  // Build heatmap data from quarterly patterns
  const heatmapData = buildHeatmapData(fingerprint?.quarterlyPatterns);

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
        <div className="flex items-center justify-center p-16">
          <Loader2 size={24} className="animate-spin text-muted" />
          <span className="ml-2 text-muted">Loading decision fingerprint...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
        <div className="card border-l-4 border-l-red-500">
          <div className="card-body">
            <p className="text-sm text-red-400">
              {error instanceof Error ? error.message : 'Failed to load fingerprint data'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!fingerprint || fingerprint.totalAnalysesAllTime === 0) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
        <Breadcrumbs
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Decision Fingerprint' }]}
        />
        <div className="card mt-6">
          <div className="card-body text-center p-12">
            <Fingerprint size={48} className="mx-auto mb-4 text-muted" />
            <h2 className="text-lg font-semibold mb-2">No Decision Fingerprint Yet</h2>
            <p className="text-sm text-muted mb-4">
              Analyze documents across different contexts to build your organization&apos;s
              contextual bias profile. The fingerprint reveals how biases vary by document type,
              deal type, and season.
            </p>
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      <Breadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Decision Fingerprint' }]}
      />

      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="flex items-center gap-md">
          <Link href="/dashboard" className="btn btn-ghost p-2" aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Decision Fingerprint</h1>
            <p className="text-sm text-muted">
              {fingerprint.totalAnalysesAllTime} decisions across {fingerprint.quartersSpanned}{' '}
              quarter(s) — contextual cognitive profile
            </p>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-6">
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Total Decisions</h4>
            <Brain size={16} className="text-blue-400" />
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-400">
              {fingerprint.totalAnalysesAllTime}
            </div>
            <p className="text-xs text-muted">All time</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Quarters Tracked</h4>
            <BarChart3 size={16} className="text-violet-400" />
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-violet-400">{fingerprint.quartersSpanned}</div>
            <p className="text-xs text-muted">Longitudinal span</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Top Patterns</h4>
            <Fingerprint size={16} className="text-cyan-400" />
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-cyan-400">{fingerprint.topPatterns.length}</div>
            <p className="text-xs text-muted">Contextual bias patterns</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Active Warnings</h4>
            <ShieldAlert size={16} className="text-orange-400" />
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-orange-400">
              {fingerprint.activeWarnings.length}
            </div>
            <p className="text-xs text-muted">Predictive alerts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Top Contextual Patterns */}
        <ErrorBoundary sectionName="Top Contextual Patterns">
          <div className="card">
            <div className="card-header">
              <h4 className="text-sm font-semibold">Top Contextual Patterns</h4>
              <p className="text-xs text-muted mt-1">
                Highest prevalence bias patterns by context (document type, deal type, quarter)
              </p>
            </div>
            <div className="card-body">
              {fingerprint.topPatterns.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Not enough data yet. Run the fingerprint cron to compute patterns.
                </p>
              ) : (
                <div className="space-y-3">
                  {fingerprint.topPatterns.map((pattern, i) => (
                    <div key={i} className="p-3 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground capitalize">
                          {pattern.biasType.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <TrendIcon trend={pattern.trend} />
                          <span className="text-[10px] text-muted">{pattern.quarter}</span>
                        </div>
                      </div>
                      <PrevalenceBar rate={pattern.prevalenceRate} />
                      <div className="flex gap-2 mt-1">
                        {pattern.documentType && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {pattern.documentType}
                          </span>
                        )}
                        {pattern.dealType && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {pattern.dealType}
                          </span>
                        )}
                        <span className="text-[10px] text-muted ml-auto">
                          {pattern.occurrenceCount}/{pattern.totalAnalyses} analyses
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>

        {/* Active Predictive Warnings */}
        <ErrorBoundary sectionName="Predictive Warnings">
          <div className="card">
            <div className="card-header">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={14} className="text-orange-400" />
                Predictive Warnings
              </h4>
              <p className="text-xs text-muted mt-1">
                Alerts when current conditions match historically problematic patterns
              </p>
            </div>
            <div className="card-body">
              {fingerprint.activeWarnings.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No active warnings. Patterns are within normal ranges.
                </p>
              ) : (
                <div className="space-y-2">
                  {fingerprint.activeWarnings.map(warning => {
                    const borderColor =
                      warning.severity === 'critical'
                        ? 'border-l-red-500'
                        : warning.severity === 'warning'
                          ? 'border-l-amber-500'
                          : 'border-l-blue-500';
                    return (
                      <div
                        key={warning.id}
                        className={`p-3 border border-border border-l-4 ${borderColor}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <SeverityBadge severity={warning.severity} />
                          <span className="text-[10px] text-muted">
                            {new Date(warning.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-foreground">{warning.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>

        {/* Bias × Quarter Heatmap */}
        <ErrorBoundary sectionName="Bias Heatmap">
          <div className="card md:col-span-2">
            <div className="card-header">
              <h4 className="text-sm font-semibold">Bias Prevalence Heatmap</h4>
              <p className="text-xs text-muted mt-1">
                Rows = bias types, columns = quarters. Intensity = prevalence rate.
              </p>
            </div>
            <div className="card-body overflow-x-auto">
              {heatmapData.biasTypes.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Not enough data to generate a heatmap.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `140px repeat(${heatmapData.quarters.length}, 1fr)`,
                    gap: '2px',
                  }}
                >
                  {/* Header row */}
                  <div className="text-[10px] text-muted font-medium p-1" />
                  {heatmapData.quarters.map(q => (
                    <div key={q} className="text-[10px] text-muted font-medium p-1 text-center">
                      {q}
                    </div>
                  ))}

                  {/* Data rows */}
                  {heatmapData.biasTypes.map(bias => (
                    <>
                      <div
                        key={`label-${bias}`}
                        className="text-[10px] text-foreground p-1 capitalize truncate"
                      >
                        {bias.replace(/_/g, ' ')}
                      </div>
                      {heatmapData.quarters.map(q => {
                        const rate = heatmapData.cells[`${bias}::${q}`] ?? 0;
                        const opacity = Math.max(0.05, rate);
                        const bg =
                          rate >= 0.7
                            ? `rgba(239, 68, 68, ${opacity})`
                            : rate >= 0.4
                              ? `rgba(245, 158, 11, ${opacity})`
                              : `rgba(59, 130, 246, ${opacity})`;
                        return (
                          <div
                            key={`${bias}-${q}`}
                            className="text-[10px] text-center p-1 border border-border/30"
                            style={{ backgroundColor: bg }}
                            title={`${bias}: ${Math.round(rate * 100)}% in ${q}`}
                          >
                            {rate > 0 ? `${Math.round(rate * 100)}` : ''}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>

        {/* Longitudinal Quality Trend */}
        <ErrorBoundary sectionName="Longitudinal Trend">
          <div className="card md:col-span-2">
            <div className="card-header">
              <h4 className="text-sm font-semibold">Longitudinal Quality Trend</h4>
              <p className="text-xs text-muted mt-1">
                Quarterly average decision quality and noise score over time
              </p>
            </div>
            <div className="card-body">
              {fingerprint.longitudinalTrend.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Not enough quarterly data yet. Run the team profiles cron to populate trends.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={fingerprint.longitudinalTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'rgb(161, 161, 170)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(161, 161, 170)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(24, 24, 27)',
                        border: '1px solid rgb(63, 63, 70)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgDecisionQuality"
                      name="Decision Quality"
                      stroke="rgb(52, 211, 153)"
                      fill="rgba(52, 211, 153, 0.15)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgNoiseScore"
                      name="Noise Score"
                      stroke="rgb(251, 146, 60)"
                      fill="rgba(251, 146, 60, 0.1)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
