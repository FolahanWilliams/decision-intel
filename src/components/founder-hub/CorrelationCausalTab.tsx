'use client';

import { useState, useMemo } from 'react';
import {
  Network,
  AlertTriangle,
  Target,
  BarChart3,
  Shield,
  CheckCircle,
  Zap,
  TrendingUp,
} from 'lucide-react';
import {
  computeCrossCaseCorrelations,
  getTopDangerousBiasPairs,
  getTopSeverityPredictors,
  getIndustryProfile,
} from '@/lib/data/case-correlations';
// Types used implicitly via the computed correlation data
// import type { BiasCooccurrenceEntry, IndustryRiskProfile, SeverityPredictor, ContextAmplifier, BiasOutcomeDivergence, SuccessPatternCorrelation } from '@/lib/data/case-correlations';
import { computeSeedWeights } from '@/lib/data/seed-weights';
import dynamic from 'next/dynamic';
import {
  computeStaticCausalWeights,
  getStaticCausalInsights,
} from '@/lib/data/case-study-causal-weights';
import type { CausalNodeData } from '@/components/visualizations/CausalGraph3DCanvas';

const CausalGraph3D = dynamic(() => import('@/components/visualizations/CausalGraph3DCanvas'), {
  ssr: false,
});
// Types used implicitly via the graph data
// import type { CausalGraphNode, CausalGraphEdge } from '@/lib/data/case-study-causal-weights';
import {
  card,
  sectionTitle,
  label,
  stat,
  badge,
  formatBias,
  formatIndustry,
} from './shared-styles';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CorrelationCausalTab() {
  const correlations = useMemo(() => computeCrossCaseCorrelations(), []);
  const topPairs = useMemo(() => getTopDangerousBiasPairs(15), []);
  const topPredictors = useMemo(() => getTopSeverityPredictors(10), []);
  const seedWeights = useMemo(() => computeSeedWeights(), []);
  const causalWeights = useMemo(() => computeStaticCausalWeights(), []);
  const [selectedCausalNode, setSelectedCausalNode] = useState<CausalNodeData | null>(null);
  const causalInsights = useMemo(() => getStaticCausalInsights(), []);

  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    correlations.industryProfiles[0]?.industry ?? ''
  );

  const industryProfile = selectedIndustry ? getIndustryProfile(selectedIndustry) : undefined;

  // Helpers ------------------------------------------------------------------

  const maxAmplification = useMemo(
    () => (topPairs.length > 0 ? Math.max(...topPairs.map(p => p.amplificationRatio)) : 1),
    [topPairs]
  );

  function barColor(ratio: number): string {
    if (ratio >= 1.8) return '#dc2626';
    if (ratio >= 1.3) return '#ef4444';
    return '#f59e0b';
  }

  const sortedDivergence = useMemo(
    () =>
      [...correlations.biasOutcomeDivergence]
        .sort((a, b) => b.failureRate - b.successRate - (a.failureRate - a.successRate))
        .slice(0, 12),
    [correlations]
  );

  // Active / inactive button styles
  const btnActive = (color: string): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    background: `${color}20`,
    color,
    border: `1px solid ${color}`,
    cursor: 'pointer',
  });

  const btnInactive: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    background: 'transparent',
    color: 'var(--text-secondary, #b4b4bc)',
    border: '1px solid var(--border-primary, #222)',
    cursor: 'pointer',
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Section 1: Header ────────────────────────────────────────────────── */}
      <div style={{ ...card, borderLeft: '3px solid #8b5cf6' }}>
        <div style={sectionTitle}>
          <Network size={20} color="#8b5cf6" />
          Correlation &amp; Causal Analysis
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #b4b4bc)' }}>
          Visualizing {correlations.totalCases} case studies — {correlations.totalFailureCases}{' '}
          failures, {correlations.totalSuccessCases} successes
        </div>
      </div>

      {/* ── Section 2: Dangerous Bias Pairs ──────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <AlertTriangle size={18} color="#ef4444" />
          Dangerous Bias Pairs
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {topPairs.map((pair, _i) => (
            <div
              key={`${pair.biasA}-${pair.biasB}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 80px 1fr 60px',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border-primary, #222)',
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 600 }}>
                {formatBias(pair.biasA)} + {formatBias(pair.biasB)}
              </span>
              <span style={{ ...badge(barColor(pair.amplificationRatio)), textAlign: 'center' }}>
                &times;{pair.amplificationRatio.toFixed(1)}
              </span>
              <div
                style={{
                  position: 'relative',
                  height: 10,
                  borderRadius: 5,
                  background: 'var(--bg-tertiary, #0a0a0a)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    borderRadius: 5,
                    width: `${(pair.amplificationRatio / maxAmplification) * 100}%`,
                    background: barColor(pair.amplificationRatio),
                    opacity: 0.7,
                  }}
                />
              </div>
              <span
                style={{ color: 'var(--text-muted, #71717a)', fontSize: 11, textAlign: 'right' }}
              >
                n={pair.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Industry Risk Profiles ────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <Shield size={18} color="#3b82f6" />
          Industry Risk Profiles
        </div>

        {/* Industry selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {correlations.industryProfiles.map(p => (
            <button
              key={p.industry}
              onClick={() => setSelectedIndustry(p.industry)}
              style={p.industry === selectedIndustry ? btnActive('#3b82f6') : btnInactive}
            >
              {formatIndustry(p.industry)}
            </button>
          ))}
        </div>

        {industryProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <div style={label}>Case Count</div>
                <div style={stat}>{industryProfile.caseCount}</div>
              </div>
              <div>
                <div style={label}>Avg Impact</div>
                <div style={stat}>{industryProfile.avgImpactScore.toFixed(1)}</div>
              </div>
              <div>
                <div style={label}>Catastrophic Rate</div>
                <div style={stat}>{(industryProfile.catastrophicRate * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Top Biases */}
            <div>
              <div style={label}>Top Biases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {industryProfile.topBiases.slice(0, 5).map(b => {
                  const maxFreq = industryProfile.topBiases[0]?.frequency ?? 1;
                  return (
                    <div key={b.bias} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 140,
                          fontSize: 12,
                          color: 'var(--text-primary, #fff)',
                          fontWeight: 500,
                        }}
                      >
                        {formatBias(b.bias)}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          background: 'var(--bg-tertiary, #0a0a0a)',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            borderRadius: 4,
                            width: `${(b.frequency / maxFreq) * 100}%`,
                            background: '#3b82f6',
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted, #71717a)',
                          minWidth: 32,
                          textAlign: 'right',
                        }}
                      >
                        {(b.frequency * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Patterns */}
            <div>
              <div style={label}>Top Patterns</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {industryProfile.topPatterns.map(p => (
                  <span key={p.pattern} style={badge('#8b5cf6')}>
                    {p.pattern} ({(p.frequency * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>

            {/* Context Profile */}
            <div>
              <div style={label}>Context Profile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(
                  [
                    ['High Stakes', industryProfile.contextProfile.highStakesRate],
                    ['Dissent Absent', industryProfile.contextProfile.dissentAbsentRate],
                    ['Time Pressure', industryProfile.contextProfile.timePressureRate],
                    ['Unanimous', industryProfile.contextProfile.unanimousRate],
                  ] as [string, number][]
                ).map(([name, rate]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 110,
                        fontSize: 12,
                        color: 'var(--text-primary, #fff)',
                        fontWeight: 500,
                      }}
                    >
                      {name}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        background: 'var(--bg-tertiary, #0a0a0a)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          borderRadius: 4,
                          width: `${rate * 100}%`,
                          background: '#f59e0b',
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted, #71717a)',
                        minWidth: 32,
                        textAlign: 'right',
                      }}
                    >
                      {(rate * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span
                    style={{
                      width: 110,
                      fontSize: 12,
                      color: 'var(--text-primary, #fff)',
                      fontWeight: 500,
                    }}
                  >
                    Avg Participants
                  </span>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #fff)' }}
                  >
                    {industryProfile.contextProfile.avgParticipantCount.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted, #71717a)' }}>
            No profile data for the selected industry.
          </div>
        )}
      </div>

      {/* ── Section 4: Severity Predictors ───────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} color="#f59e0b" />
          Catastrophic Outcome Predictors
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 100px 80px 1fr',
              gap: 8,
              padding: '8px 0',
              borderBottom: '2px solid var(--border-primary, #222)',
            }}
          >
            <span style={label}>Factor</span>
            <span style={label}>Category</span>
            <span style={label}>Lift</span>
            <span style={label}>Impact (present / absent)</span>
          </div>
          {topPredictors.map(pred => {
            const catColors: Record<string, string> = {
              bias: '#ef4444',
              context: '#f59e0b',
              pattern: '#8b5cf6',
              structural: '#3b82f6',
            };
            const catColor = catColors[pred.category] ?? '#71717a';
            return (
              <div
                key={pred.factor}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 100px 80px 1fr',
                  gap: 8,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 600 }}>
                  {formatBias(pred.factor)}
                </span>
                <span style={badge(catColor)}>{pred.category}</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                  &times;{pred.lift.toFixed(1)}
                </span>
                <span style={{ color: 'var(--text-secondary, #b4b4bc)' }}>
                  {pred.avgImpactPresent.toFixed(1)} / {pred.avgImpactAbsent.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 5: Context Amplifiers ────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <Target size={18} />
          Context Risk Amplifiers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {correlations.contextAmplifiers.map(amp => (
            <div
              key={amp.contextFactor}
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'var(--bg-tertiary, #0a0a0a)',
                border: '1px solid var(--border-primary, #222)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                  {formatBias(amp.contextFactor)}
                </span>
                <span style={badge('#f59e0b')}>&times;{amp.lift.toFixed(1)} lift</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontSize: 11,
                  color: 'var(--text-secondary, #b4b4bc)',
                  marginBottom: 8,
                }}
              >
                <span>
                  With: {amp.avgImpactWithFactor.toFixed(1)} impact (n={amp.countWith})
                </span>
                <span>
                  Without: {amp.avgImpactWithoutFactor.toFixed(1)} (n={amp.countWithout})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {amp.amplifiedBiases.slice(0, 3).map(b => (
                  <span key={b.bias} style={badge('#ef4444')}>
                    {formatBias(b.bias)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 6: Bias Outcome Divergence ───────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <BarChart3 size={18} />
          Bias Outcome Divergence
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortedDivergence.map(d => (
            <div
              key={d.bias}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 60px',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border-primary, #222)',
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 600 }}>
                {formatBias(d.bias)}
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {/* Failure bar (red) */}
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    height: 10,
                    borderRadius: 5,
                    background: 'var(--bg-tertiary, #0a0a0a)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      borderRadius: 5,
                      width: `${d.failureRate * 100}%`,
                      background: '#ef4444',
                      opacity: 0.7,
                    }}
                  />
                </div>
                {/* Success bar (green) */}
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    height: 10,
                    borderRadius: 5,
                    background: 'var(--bg-tertiary, #0a0a0a)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      borderRadius: 5,
                      width: `${d.successRate * 100}%`,
                      background: '#22c55e',
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
              <span style={badge('#8b5cf6')}>{(d.mitigationFrequency * 100).toFixed(0)}%</span>
            </div>
          ))}
          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: 11,
              color: 'var(--text-muted, #71717a)',
              marginTop: 4,
            }}
          >
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: '#ef4444',
                  marginRight: 4,
                }}
              />{' '}
              Failure Rate
            </span>
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: '#22c55e',
                  marginRight: 4,
                }}
              />{' '}
              Success Rate
            </span>
            <span>Badge = Mitigation Frequency</span>
          </div>
        </div>
      </div>

      {/* ── Section 7: Success Patterns ──────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <CheckCircle size={18} color="#22c55e" />
          Beneficial Decision Patterns
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {correlations.successPatterns.map(sp => (
            <div
              key={sp.pattern}
              style={{
                padding: 14,
                borderRadius: 10,
                background: '#22c55e08',
                border: '1px solid #22c55e30',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>
                {sp.pattern}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  fontSize: 11,
                  color: 'var(--text-secondary, #b4b4bc)',
                  marginBottom: 8,
                }}
              >
                <span>Freq: {(sp.frequency * 100).toFixed(0)}%</span>
                <span>Avg +Impact: {sp.avgPositiveImpact.toFixed(1)}</span>
                <span>n={sp.sampleSize}</span>
              </div>
              {sp.requiredConditions.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ ...label, marginBottom: 4 }}>Required Conditions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {sp.requiredConditions.map(c => (
                      <span key={c} style={badge('#22c55e')}>
                        {formatBias(c)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sp.associatedBiasesManaged.length > 0 && (
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Biases Managed</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {sp.associatedBiasesManaged.map(b => (
                      <span key={b} style={badge('#3b82f6')}>
                        {formatBias(b)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 8: Seed Weights ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <TrendingUp size={18} />
          Pattern-Level Risk Weights
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {seedWeights.map(sw => (
            <div
              key={sw.patternLabel}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 200px 60px 80px',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border-primary, #222)',
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 600 }}>
                {sw.patternLabel}
              </span>
              {/* Stacked bar: red = failure, green = success */}
              <div
                style={{
                  display: 'flex',
                  height: 10,
                  borderRadius: 5,
                  overflow: 'hidden',
                  background: 'var(--bg-tertiary, #0a0a0a)',
                }}
              >
                <div
                  style={{
                    width: `${sw.baseFailureRate * 100}%`,
                    background: '#ef4444',
                    opacity: 0.8,
                  }}
                />
                <div
                  style={{
                    width: `${sw.baseSuccessRate * 100}%`,
                    background: '#22c55e',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span
                style={{ color: 'var(--text-muted, #71717a)', fontSize: 11, textAlign: 'right' }}
              >
                n={sw.sampleSize}
              </span>
              <span
                style={{
                  color: 'var(--text-secondary, #b4b4bc)',
                  fontSize: 11,
                  textAlign: 'right',
                }}
              >
                Impact: {sw.avgImpactScore.toFixed(1)}
              </span>
            </div>
          ))}
          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: 11,
              color: 'var(--text-muted, #71717a)',
              marginTop: 4,
            }}
          >
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: '#ef4444',
                  marginRight: 4,
                }}
              />{' '}
              Failure Rate
            </span>
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: '#22c55e',
                  marginRight: 4,
                }}
              />{' '}
              Success Rate
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 9: 3D Causal Knowledge Graph ────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <Network size={18} color="#8b5cf6" />
          3D Causal Knowledge Graph: Bias &rarr; Outcome Relationships
        </div>
        <div
          style={{
            position: 'relative',
            background: '#080c14',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {causalWeights.length > 0 ? (
            <>
              <div style={{ height: 500 }}>
                <CausalGraph3D weights={causalWeights} onNodeSelect={setSelectedCausalNode} />
              </div>
              {/* Legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 14px',
                  borderTop: '1px solid #1E293B',
                  flexWrap: 'wrap',
                  gap: 6,
                  fontSize: 11,
                  color: '#64748B',
                }}
              >
                <span>Drag to rotate · Scroll to zoom · Click to explore</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: '#DC2626',
                        display: 'inline-block',
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                      }}
                    />
                    High danger
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: '#EAB308',
                        borderRadius: 1,
                        display: 'inline-block',
                        transform: 'rotate(45deg)',
                      }}
                    />
                    Moderate
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: '#EF4444',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                    />
                    Failure
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: '#22C55E',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                    />
                    Success
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 16,
                        height: 2,
                        background: '#DC2626',
                        borderRadius: 1,
                        display: 'inline-block',
                      }}
                    />
                    Toxic pair
                  </span>
                </div>
              </div>
              {/* Detail panel */}
              {selectedCausalNode?.nodeType === 'bias' && selectedCausalNode.biasType && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #1E293B',
                    background: '#0F172A',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0' }}>
                      {formatBias(selectedCausalNode.biasType)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background:
                          (selectedCausalNode.dangerMultiplier ?? 1) >= 1.3
                            ? '#DC262620'
                            : '#22C55E20',
                        color:
                          (selectedCausalNode.dangerMultiplier ?? 1) >= 1.3 ? '#EF4444' : '#22C55E',
                      }}
                    >
                      {(selectedCausalNode.dangerMultiplier ?? 1).toFixed(2)}× danger
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94A3B8' }}>
                    <span>
                      Failures:{' '}
                      <strong style={{ color: '#EF4444' }}>
                        {selectedCausalNode.failureCount ?? 0}
                      </strong>
                    </span>
                    <span>
                      Successes:{' '}
                      <strong style={{ color: '#22C55E' }}>
                        {selectedCausalNode.successCount ?? 0}
                      </strong>
                    </span>
                    <span>
                      Sample:{' '}
                      <strong style={{ color: '#E2E8F0' }}>
                        n={selectedCausalNode.sampleSize ?? 0}
                      </strong>
                    </span>
                    <span>
                      Correlation:{' '}
                      <strong style={{ color: '#E2E8F0' }}>
                        {(selectedCausalNode.outcomeCorrelation ?? 0).toFixed(3)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: '#71717a',
                fontSize: 13,
              }}
            >
              No causal graph data available.
            </div>
          )}
        </div>

        {/* Causal Insights */}
        {causalInsights.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {causalInsights.map((insight, i) => {
              const typeColors: Record<string, string> = {
                danger: '#ef4444',
                safe: '#22c55e',
                noise: '#71717a',
                twin: '#3b82f6',
              };
              const borderColor = typeColors[insight.type] ?? '#71717a';
              return (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--bg-tertiary, #0a0a0a)',
                    borderLeft: `3px solid ${borderColor}`,
                    border: '1px solid var(--border-primary, #222)',
                    borderLeftColor: borderColor,
                    borderLeftWidth: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'var(--text-primary, #fff)' }}>{insight.message}</span>
                  <span style={badge(borderColor)}>{(insight.confidence * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
