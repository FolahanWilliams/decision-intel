'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Bell,
  ArrowLeft,
  BrainCircuit,
  AlertTriangle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SOURCE_LABELS } from '@/lib/constants/human-audit';

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

interface EffectivenessData {
  period: number;
  totalDecisions: number;
  avgQualityScore: number;
  avgNoiseScore: number;
  topBiases: Array<{ biasType: string; count: number }>;
  qualityTrend: Array<{ week: string; avgScore: number; count: number }>;
  sourceDistribution: Record<string, number>;
  nudgeEffectiveness: {
    total: number;
    acknowledged: number;
    helpful: number;
    notHelpful: number;
    pending: number;
    helpfulRate: number;
  };
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: 'All time' },
];

export default function EffectivenessPage() {
  const [period, setPeriod] = useState(30);
  const { data, isLoading } = useSWR<EffectivenessData>(
    `/api/human-decisions/effectiveness?period=${period}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  if (isLoading || !data) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
        <div className="grid grid-4 mb-xl gap-md">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="card-body text-center p-md">
                <div className="h-3 w-24 bg-white/10 mx-auto mb-sm" />
                <div className="h-10 w-16 bg-white/10 mx-auto mb-sm" />
                <div className="h-3 w-16 bg-white/10 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { nudgeEffectiveness: ne } = data;
  const maxBiasCount = data.topBiases.length > 0 ? data.topBiases[0].count : 1;
  const maxTrendScore = Math.max(...data.qualityTrend.map(t => t.avgScore), 100);

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Cognitive Audits', href: '/dashboard/cognitive-audits' },
        { label: 'Effectiveness' },
      ]} />

      <header className="mb-xl animate-fade-in">
        <div className="flex items-center justify-between mb-sm">
          <div className="flex items-center gap-md">
            <TrendingUp size={28} style={{ color: 'var(--success)' }} />
            <h1>Decision Effectiveness</h1>
          </div>
          <div className="flex items-center gap-sm">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`btn ${period === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-muted">Track decision quality trends, bias patterns, and nudge effectiveness over time</p>
      </header>

      {/* Summary Cards */}
      <ErrorBoundary sectionName="Summary">
        <div className="grid grid-4 mb-xl gap-md">
          <div className="card animate-fade-in">
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Avg Quality</div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 800,
                color: data.avgQualityScore >= 70 ? 'var(--success)' : data.avgQualityScore >= 40 ? 'var(--warning)' : 'var(--error)',
              }}>
                {data.avgQualityScore}
              </div>
              <div className="text-xs text-muted flex items-center justify-center gap-xs">
                {data.avgQualityScore >= 50 ? (
                  <><TrendingUp size={12} style={{ color: 'var(--success)' }} /> Good</>
                ) : (
                  <><TrendingDown size={12} style={{ color: 'var(--error)' }} /> Needs Work</>
                )}
              </div>
            </div>
          </div>
          <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Avg Consistency</div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 800,
                color: data.avgNoiseScore >= 70 ? 'var(--success)' : data.avgNoiseScore >= 40 ? 'var(--warning)' : 'var(--error)',
              }}>
                {data.avgNoiseScore}
              </div>
              <div className="text-xs text-muted">{data.totalDecisions} decisions</div>
            </div>
          </div>
          <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Nudge Helpful Rate</div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 800,
                color: ne.helpfulRate >= 60 ? 'var(--success)' : ne.helpfulRate >= 30 ? 'var(--warning)' : 'var(--text-muted)',
              }}>
                {ne.helpfulRate}%
              </div>
              <div className="text-xs text-muted">{ne.helpful} of {ne.acknowledged} acknowledged</div>
            </div>
          </div>
          <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Total Nudges</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {ne.total}
              </div>
              <div className="text-xs text-muted">{ne.pending} pending review</div>
            </div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Quality Trend */}
      <ErrorBoundary sectionName="Quality Trend">
        <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <h3 className="flex items-center gap-sm"><BarChart3 size={18} /> Quality Trend (Weekly)</h3>
          </div>
          <div className="card-body">
            {data.qualityTrend.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: 'var(--spacing-lg)' }}>
                Not enough data for trend analysis yet.
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 180 }}>
                {data.qualityTrend.map((week) => {
                  const height = Math.max(8, (week.avgScore / maxTrendScore) * 160);
                  const color = week.avgScore >= 70 ? 'var(--success)' : week.avgScore >= 40 ? 'var(--warning)' : 'var(--error)';
                  return (
                    <div
                      key={week.week}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 600 }}>{week.avgScore}</span>
                      <div style={{
                        width: '100%', maxWidth: 40, height, background: color,
                        transition: 'height 0.3s ease',
                      }} title={`Week of ${week.week}: ${week.avgScore} avg (${week.count} decisions)`} />
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(week.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Top Biases */}
        <ErrorBoundary sectionName="Top Biases">
          <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm"><AlertTriangle size={18} /> Top Biases Detected</h3>
            </div>
            <div className="card-body">
              {data.topBiases.length === 0 ? (
                <p className="text-muted text-center" style={{ padding: 'var(--spacing-lg)' }}>No biases detected yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {data.topBiases.map((bias, idx) => (
                    <div key={bias.biasType} className="flex items-center gap-md" style={{ fontSize: '13px' }}>
                      <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center justify-between mb-xs">
                          <span style={{ fontWeight: 600 }}>{bias.biasType}</span>
                          <span className="text-muted">{bias.count}x</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${(bias.count / maxBiasCount) * 100}%`,
                            height: '100%',
                            background: idx < 3 ? 'var(--error)' : 'var(--warning)',
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>

        {/* Nudge & Source Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Nudge Effectiveness */}
          <ErrorBoundary sectionName="Nudge Effectiveness">
            <div className="card animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="card-header">
                <h3 className="flex items-center gap-sm"><Bell size={18} /> Nudge Effectiveness</h3>
              </div>
              <div className="card-body">
                {ne.total === 0 ? (
                  <p className="text-muted text-center" style={{ padding: 'var(--spacing-md)' }}>No nudges generated yet.</p>
                ) : (
                  <div>
                    {/* Stacked bar */}
                    <div style={{ display: 'flex', height: 32, overflow: 'hidden', marginBottom: 'var(--spacing-md)' }}>
                      {ne.helpful > 0 && (
                        <div style={{
                          flex: ne.helpful, background: 'var(--success)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '11px', fontWeight: 600,
                        }}>
                          Helpful ({ne.helpful})
                        </div>
                      )}
                      {ne.notHelpful > 0 && (
                        <div style={{
                          flex: ne.notHelpful, background: 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '11px', fontWeight: 600,
                        }}>
                          Dismissed ({ne.notHelpful})
                        </div>
                      )}
                      {ne.pending > 0 && (
                        <div style={{
                          flex: ne.pending, background: 'var(--warning)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#000', fontSize: '11px', fontWeight: 600,
                        }}>
                          Pending ({ne.pending})
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted text-center">
                      {ne.helpfulRate}% helpful rate ({ne.helpful}/{ne.acknowledged} acknowledged)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ErrorBoundary>

          {/* Source Distribution */}
          <ErrorBoundary sectionName="Source Distribution">
            <div className="card animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <div className="card-header">
                <h3 className="flex items-center gap-sm"><BrainCircuit size={18} /> Decisions by Source</h3>
              </div>
              <div className="card-body">
                {Object.keys(data.sourceDistribution).length === 0 ? (
                  <p className="text-muted text-center" style={{ padding: 'var(--spacing-md)' }}>No data yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {Object.entries(data.sourceDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => {
                        const maxCount = Math.max(...Object.values(data.sourceDistribution));
                        return (
                          <div key={source} className="flex items-center gap-md" style={{ fontSize: '13px' }}>
                            <span style={{ width: 80, fontWeight: 600 }}>
                              {SOURCE_LABELS[source] || source}
                            </span>
                            <div style={{ flex: 1, height: 20, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                              <div style={{
                                width: `${(count / maxCount) * 100}%`,
                                height: '100%',
                                background: 'var(--accent-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                paddingRight: 8,
                              }}>
                                <span style={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}>{count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-xl">
        <Link href="/dashboard/cognitive-audits" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Cognitive Audits
        </Link>
      </div>
    </div>
  );
}
