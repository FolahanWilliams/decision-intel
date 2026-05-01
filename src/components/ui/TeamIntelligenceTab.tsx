'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Loader2,
  BarChart3,
  ShieldAlert,
  Minus,
} from 'lucide-react';
import { SparklineChart } from '@/components/ui/SparklineChart';
import { getBiasDisplayName } from '@/lib/utils/bias-normalize';
import { getBiasColor } from '@/lib/utils/bias-colors';
import { SEVERITY_COLORS } from '@/lib/constants/human-audit';

// 8% / 19% alpha tints. SEVERITY_COLORS resolves to var() so the
// `${hex}15` / `${hex}30` concatenations no longer apply.
function severityTint(level: string, alphaPct: number): string {
  const color = SEVERITY_COLORS[level] || 'var(--text-muted)';
  return `color-mix(in srgb, ${color} ${alphaPct}%, transparent)`;
}

interface CausalWeight {
  biasType: string;
  outcomeCorrelation: number;
  dangerMultiplier: number;
  sampleSize: number;
  confidence: number;
}

interface TeamIntelligenceData {
  profile: {
    avgDecisionQuality: number;
    avgNoiseScore: number;
    totalDecisions: number;
    topBiases: Array<{ biasType: string; count: number; avgSeverity: string }> | null;
    nudgeEffectiveness: { sent: number; acknowledged: number; helpfulRate: number } | null;
    consistencyTrend: Array<{ date: string; score: number }> | null;
  } | null;
  causalWeights: CausalWeight[];
  maturityScore: {
    score: number;
    grade: string;
    breakdown: Record<string, number>;
    peerBenchmark: number | null;
  } | null;
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

const GRADE_COLORS: Record<string, string> = {
  A: '#34d399',
  B: '#38bdf8',
  C: '#fbbf24',
  D: '#fb923c',
  F: '#f87171',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  outcomeTrackingRate: 'Outcome Tracking',
  biasAccuracy: 'Bias Accuracy',
  qualityTrend: 'Quality Trend',
  nudgeResponsiveness: 'Nudge Response',
  dissentHealth: 'Dissent Health',
  priorSubmissionRate: 'Prior Capture',
};

export default function TeamIntelligenceTab({ orgId }: { orgId: string }) {
  const { data, isLoading } = useSWR<TeamIntelligenceData>(
    orgId ? '/api/team/intelligence' : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  if (!data || (!data.profile && data.causalWeights.length === 0 && !data.maturityScore)) {
    return (
      <div
        className="card animate-fade-in"
        style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}
      >
        <BarChart3
          size={32}
          style={{ margin: '0 auto var(--spacing-md)', color: 'var(--text-muted)' }}
        />
        <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>No Intelligence Data Yet</h3>
        <p className="text-muted text-sm" style={{ maxWidth: 400, margin: '0 auto' }}>
          Analyze at least 3 documents as a team, then log outcomes to unlock team intelligence
          insights. The system learns which biases actually hurt your organization.
        </p>
      </div>
    );
  }

  const { profile, causalWeights, maturityScore } = data;
  const trendData = profile?.consistencyTrend?.map(t => t.score) || [];
  const trendDirection =
    trendData.length >= 2
      ? trendData[trendData.length - 1] > trendData[0]
        ? 'up'
        : trendData[trendData.length - 1] < trendData[0]
          ? 'down'
          : 'flat'
      : 'flat';

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
    >
      {/* Section 1: Team Pulse — 3 mini stat cards */}
      {profile && (
        <div className="card liquid-glass-premium">
          <div className="card-header" style={{ paddingBottom: 'var(--spacing-sm)' }}>
            <h3 className="flex items-center gap-sm text-sm font-semibold">
              <Target size={16} />
              Team Pulse
              <span className="text-xs text-muted font-normal" style={{ marginLeft: 'auto' }}>
                Last 30 days
              </span>
            </h3>
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-md)',
              }}
            >
              {/* Avg Decision Quality */}
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'var(--bg-card-hover)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div
                  className="flex items-center justify-center gap-xs"
                  style={{ marginBottom: '4px' }}
                >
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-highlight)',
                    }}
                  >
                    {Math.round(profile.avgDecisionQuality)}
                  </span>
                  {trendDirection === 'up' && <TrendingUp size={14} style={{ color: '#34d399' }} />}
                  {trendDirection === 'down' && (
                    <TrendingDown size={14} style={{ color: '#f87171' }} />
                  )}
                  {trendDirection === 'flat' && (
                    <Minus size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Quality</div>
                {trendData.length >= 2 && (
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center' }}>
                    <SparklineChart
                      data={trendData}
                      color={
                        trendDirection === 'up'
                          ? '#34d399'
                          : trendDirection === 'down'
                            ? '#f87171'
                            : '#A1A1AA'
                      }
                      width={60}
                      height={20}
                    />
                  </div>
                )}
              </div>

              {/* Avg Noise */}
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'var(--bg-card-hover)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: profile.avgNoiseScore > 40 ? '#fbbf24' : 'var(--text-highlight)',
                    }}
                  >
                    {Math.round(profile.avgNoiseScore)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Avg Noise <span style={{ fontSize: '9px', opacity: 0.6 }}>(lower = better)</span>
                </div>
              </div>

              {/* Total Decisions */}
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'var(--bg-card-hover)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-highlight)',
                    }}
                  >
                    {profile.totalDecisions}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Decisions Analyzed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Dangerous Biases */}
      {causalWeights.length > 0 && (
        <div className="card liquid-glass-premium">
          <div className="card-header" style={{ paddingBottom: 'var(--spacing-sm)' }}>
            <h3 className="flex items-center gap-sm text-sm font-semibold">
              <ShieldAlert size={16} style={{ color: '#f87171' }} />
              Most Dangerous Biases
              <span className="text-xs text-muted font-normal" style={{ marginLeft: 'auto' }}>
                Learned from outcomes
              </span>
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {causalWeights.slice(0, 5).map((w, idx) => {
              const color = getBiasColor(w.biasType);
              const dangerLevel =
                w.dangerMultiplier >= 2
                  ? 'critical'
                  : w.dangerMultiplier >= 1.5
                    ? 'high'
                    : 'medium';
              return (
                <div
                  key={w.biasType}
                  className="flex items-center"
                  style={{
                    padding: '10px var(--spacing-md)',
                    borderBottom:
                      idx < Math.min(causalWeights.length, 5) - 1
                        ? '1px solid var(--bg-card-hover)'
                        : 'none',
                    gap: 'var(--spacing-sm)',
                  }}
                >
                  {/* Rank */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      width: '16px',
                      textAlign: 'center',
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* Bias name with color dot */}
                  <div className="flex items-center gap-xs" style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: color.bg,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getBiasDisplayName(w.biasType)}
                    </span>
                  </div>

                  {/* Danger badge */}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: severityTint(dangerLevel, 8),
                      color: SEVERITY_COLORS[dangerLevel],
                      border: `1px solid ${severityTint(dangerLevel, 19)}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w.dangerMultiplier.toFixed(1)}x
                  </span>

                  {/* Correlation bar */}
                  <div
                    style={{
                      width: '48px',
                      height: '4px',
                      background: 'var(--bg-elevated)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.abs(w.outcomeCorrelation) * 100)}%`,
                        height: '100%',
                        background: w.outcomeCorrelation < 0 ? '#f87171' : '#34d399',
                        borderRadius: '2px',
                      }}
                    />
                  </div>

                  {/* Sample size */}
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    n={w.sampleSize}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Maturity Breakdown */}
      {maturityScore && (
        <div className="card liquid-glass-premium">
          <div
            className="card-header flex items-center justify-between"
            style={{ paddingBottom: 'var(--spacing-sm)', cursor: 'pointer' }}
            onClick={() => setExpandedSection(expandedSection === 'maturity' ? null : 'maturity')}
          >
            <h3 className="flex items-center gap-sm text-sm font-semibold">
              <BarChart3 size={16} />
              Decision Maturity
            </h3>
            <div className="flex items-center gap-sm">
              {maturityScore.peerBenchmark != null && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Peers: {maturityScore.peerBenchmark}
                </span>
              )}
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-highlight)',
                }}
              >
                {maturityScore.score}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: `${GRADE_COLORS[maturityScore.grade] || '#A1A1AA'}20`,
                  color: GRADE_COLORS[maturityScore.grade] || '#A1A1AA',
                }}
              >
                {maturityScore.grade}
              </span>
            </div>
          </div>
          {(expandedSection === 'maturity' || !profile) && maturityScore.breakdown && (
            <div className="card-body" style={{ paddingTop: 0 }}>
              {Object.entries(maturityScore.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      width: '120px',
                      flexShrink: 0,
                    }}
                  >
                    {BREAKDOWN_LABELS[key] || key}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '6px',
                      background: 'var(--bg-card-hover)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, value)}%`,
                        height: '100%',
                        background: value >= 70 ? '#34d399' : value >= 40 ? '#fbbf24' : '#f87171',
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                    {/* Peer benchmark marker */}
                    {maturityScore.peerBenchmark != null && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${Math.min(100, maturityScore.peerBenchmark)}%`,
                          top: '-1px',
                          width: '2px',
                          height: '8px',
                          background: 'var(--text-muted)',
                          borderRadius: '1px',
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      width: '28px',
                      textAlign: 'right',
                    }}
                  >
                    {Math.round(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 4: Nudge Effectiveness */}
      {profile?.nudgeEffectiveness && profile.nudgeEffectiveness.sent > 0 && (
        <div className="card liquid-glass-premium">
          <div className="card-header" style={{ paddingBottom: 'var(--spacing-sm)' }}>
            <h3 className="flex items-center gap-sm text-sm font-semibold">
              <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
              Nudge Effectiveness
            </h3>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-lg">
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-highlight)',
                  }}
                >
                  {profile.nudgeEffectiveness.sent}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sent</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-highlight)',
                  }}
                >
                  {profile.nudgeEffectiveness.acknowledged}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Acknowledged</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: profile.nudgeEffectiveness.helpfulRate > 0.5 ? '#34d399' : '#fbbf24',
                  }}
                >
                  {Math.round(profile.nudgeEffectiveness.helpfulRate * 100)}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Found Helpful</div>
              </div>
            </div>
            {/* Effectiveness bar */}
            <div
              style={{
                marginTop: 'var(--spacing-sm)',
                height: '4px',
                background: 'var(--bg-card-hover)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, profile.nudgeEffectiveness.helpfulRate * 100)}%`,
                  height: '100%',
                  background: profile.nudgeEffectiveness.helpfulRate > 0.5 ? '#34d399' : '#fbbf24',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
