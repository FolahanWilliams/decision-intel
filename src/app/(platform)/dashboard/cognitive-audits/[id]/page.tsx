'use client';

import { use, useMemo, useState } from 'react';
import { useHumanDecision, type HumanDecisionNudge } from '@/hooks/useHumanDecisions';
import Link from 'next/link';
import {
  BrainCircuit,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  PenLine,
  Users,
  Activity,
  BarChart3,
  Bell,
  Shield,
  Eye,
  FileWarning,
  Zap,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { QualityGauge } from '@/components/visualizations/QualityMetrics';
import { SentimentGauge } from '@/components/visualizations/SentimentGauge';
import { createClientLogger } from '@/lib/utils/logger';
import {
  SOURCE_LABELS_LONG as SOURCE_LABELS,
  SOURCE_ICONS,
  SEVERITY_COLORS,
  NUDGE_TYPE_LABELS,
  getBiasArray,
  formatDate,
} from '@/lib/constants/human-audit';

const log = createClientLogger('CognitiveAuditDetail');

interface BiasItem {
  biasType: string;
  severity: string;
  excerpt: string;
  explanation: string;
  suggestion: string;
  confidence: number;
  found?: boolean;
}

function NoiseStatsCards({ noiseStats }: { noiseStats: { mean: number; stdDev: number; variance: number } | null }) {
  if (!noiseStats) return null;
  return (
    <>
      <div className="card">
        <div className="card-body text-center p-md">
          <div className="text-xs text-muted mb-sm">Judge Mean Score</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            {noiseStats.mean.toFixed(1)}
          </div>
          <div className="text-xs text-muted">Average across 3 judges</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center p-md">
          <div className="text-xs text-muted mb-sm">Standard Deviation</div>
          <div style={{
            fontSize: '2.5rem', fontWeight: 800,
            color: noiseStats.stdDev > 15 ? 'var(--error)' : noiseStats.stdDev > 8 ? 'var(--warning)' : 'var(--success)',
          }}>
            {noiseStats.stdDev.toFixed(1)}
          </div>
          <div className="text-xs text-muted">
            {noiseStats.stdDev > 15 ? 'High disagreement' : noiseStats.stdDev > 8 ? 'Moderate variance' : 'Good agreement'}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center p-md">
          <div className="text-xs text-muted mb-sm">Variance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            {noiseStats.variance.toFixed(1)}
          </div>
          <div className="text-xs text-muted">Statistical spread</div>
        </div>
      </div>
    </>
  );
}

export default function CognitiveAuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { decision, isLoading: loading, error, mutate: mutateDecision } = useHumanDecision(id);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'biases' | 'noise' | 'nudges' | 'compliance' | 'premortem' | 'twins'>('biases');

  // Use nudges from the decision response directly
  const decisionNudges: HumanDecisionNudge[] = decision?.nudges ?? [];

  const audit = decision?.cognitiveAudit ?? null;
  const biases = useMemo(() => getBiasArray<BiasItem>(audit?.biasFindings), [audit]);

  const qualityColor = !audit
    ? 'var(--text-muted)'
    : audit.decisionQualityScore >= 70
      ? 'var(--success)'
      : audit.decisionQualityScore >= 40
        ? 'var(--warning)'
        : 'var(--error)';

  const noiseColor = !audit
    ? 'var(--text-muted)'
    : audit.noiseScore >= 70
      ? 'var(--success)'
      : audit.noiseScore >= 40
        ? 'var(--warning)'
        : 'var(--error)';

  const handleAcknowledge = async (nudgeId: string, wasHelpful: boolean) => {
    setAcknowledging(nudgeId);
    try {
      const res = await fetch('/api/nudges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId, wasHelpful }),
      });
      if (res.ok) await mutateDecision();
    } catch (err) {
      log.error('Acknowledge failed:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  // Sentiment: convert -1..1 to 0..100 for gauge
  const sentimentScore = audit?.sentimentScore != null
    ? Math.round((audit.sentimentScore + 1) * 50)
    : null;

  const sentimentLabel = sentimentScore != null
    ? sentimentScore > 60 ? 'Positive' : sentimentScore < 40 ? 'Negative' : 'Neutral'
    : 'N/A';

  // Phase 2 data — typed from JSON blobs
  const compliance = audit?.complianceResult as {
    status: 'PASS' | 'WARN' | 'FAIL';
    riskScore: number;
    summary: string;
    regulations: Array<{ name: string; status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL'; description: string; riskLevel: string }>;
    searchQueries?: string[];
  } | undefined;

  const preMortem = audit?.preMortem as {
    failureScenarios: string[];
    preventiveMeasures: string[];
  } | undefined;

  const logicalAnalysis = audit?.logicalAnalysis as {
    score: number;
    verdict?: 'APPROVED' | 'REJECTED' | 'MIXED';
    twins?: Array<{ name: string; role: string; vote: 'APPROVE' | 'REJECT' | 'REVISE'; confidence: number; rationale: string; keyRiskIdentified: string }>;
    institutionalMemory?: { recallScore: number; similarEvents: Array<{ title: string; summary: string; outcome: string; similarity: number; lessonLearned: string }>; strategicAdvice: string };
    assumptions?: string[];
    conclusion?: string;
  } | undefined;

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
        <div className="card animate-pulse mb-xl">
          <div className="card-body">
            <div className="h-6 w-48 bg-white/10 mb-md" />
            <div className="h-4 w-96 bg-white/10 mb-lg" />
            <div className="grid grid-3 gap-md">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col items-center gap-sm">
                  <div className="w-24 h-24 bg-white/10" style={{ borderRadius: '50%' }} />
                  <div className="h-3 w-16 bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card animate-pulse">
          <div className="card-header"><div className="h-4 w-40 bg-white/10" /></div>
          <div className="card-body">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 w-full bg-white/10 mb-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cognitive Audits', href: '/dashboard/cognitive-audits' },
          { label: 'Not Found' },
        ]} />
        <div className="card">
          <div className="card-body flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-2xl)' }}>
            <AlertTriangle size={48} style={{ color: 'var(--error)' }} />
            <h2>Decision Not Found</h2>
            <p className="text-muted">This decision may have been deleted or you may not have access.</p>
            <Link href="/dashboard/cognitive-audits" className="btn btn-primary">
              <ArrowLeft size={16} /> Back to Audits
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SourceIcon = SOURCE_ICONS[decision.source] || PenLine;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Cognitive Audits', href: '/dashboard/cognitive-audits' },
        { label: SOURCE_LABELS[decision.source] || decision.source },
      ]} />

      {/* Header */}
      <header className="mb-xl animate-fade-in">
        <div className="flex items-center gap-md mb-sm">
          <SourceIcon size={28} style={{ color: 'var(--accent-primary)' }} />
          <h1>
            {SOURCE_LABELS[decision.source] || decision.source}
            {decision.channel && ` — ${decision.channel}`}
          </h1>
        </div>
        <div className="flex items-center gap-lg text-sm text-muted">
          <span>{formatDate(decision.createdAt, true)}</span>
          {decision.decisionType && (
            <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
              {decision.decisionType}
            </span>
          )}
          {decision.participants && decision.participants.length > 0 && (
            <span className="flex items-center gap-xs">
              <Users size={14} /> {decision.participants.length} participants
            </span>
          )}
          <span style={{
            padding: '2px 8px', fontSize: '10px', fontWeight: 600,
            background: decision.status === 'analyzed' ? 'var(--success)' : decision.status === 'error' ? 'var(--error)' : 'var(--warning)',
            color: '#fff',
          }}>
            {decision.status.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Score Gauges */}
      {audit && (
        <ErrorBoundary sectionName="Score Gauges">
          <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm"><BrainCircuit size={18} /> Cognitive Audit Summary</h3>
            </div>
            <div className="card-body">
              {/* Summary text */}
              <p style={{ marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
                {audit.summary}
              </p>

              {/* Gauges row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-xl)', justifyItems: 'center' }}>
                <QualityGauge
                  value={audit.decisionQualityScore}
                  maxValue={100}
                  size={140}
                  strokeWidth={12}
                  label="Decision Quality"
                  color={qualityColor}
                  sublabel={audit.decisionQualityScore >= 70 ? 'Good' : audit.decisionQualityScore >= 40 ? 'Moderate' : 'High Risk'}
                />
                <QualityGauge
                  value={audit.noiseScore}
                  maxValue={100}
                  size={140}
                  strokeWidth={12}
                  label="Consistency"
                  color={noiseColor}
                  sublabel={audit.noiseScore >= 70 ? 'Consistent' : audit.noiseScore >= 40 ? 'Variable' : 'Noisy'}
                />
                {sentimentScore !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <SentimentGauge score={sentimentScore} label={sentimentLabel} />
                  </div>
                )}
              </div>

              {/* Flags */}
              <div className="flex items-center gap-lg mt-lg" style={{ flexWrap: 'wrap' }}>
                {audit.teamConsensusFlag && (
                  <div className="flex items-center gap-sm" style={{
                    padding: '8px 16px', background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid var(--warning)', fontSize: '13px',
                  }}>
                    <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontWeight: 600 }}>Unanimous Consensus Detected</span>
                    <span className="text-muted">— Consider assigning a Devil&apos;s Advocate</span>
                  </div>
                )}
                {audit.dissenterCount > 0 && (
                  <div className="flex items-center gap-sm" style={{
                    padding: '8px 16px', background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid var(--success)', fontSize: '13px',
                  }}>
                    <Eye size={16} style={{ color: 'var(--success)' }} />
                    <span style={{ fontWeight: 600 }}>{audit.dissenterCount} Dissenting View{audit.dissenterCount > 1 ? 's' : ''}</span>
                    <span className="text-muted">— Healthy deliberation detected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Tabbed Content */}
      {audit && (
        <ErrorBoundary sectionName="Audit Details">
          <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Tab bar */}
            <div className="card-header" style={{ padding: 0 }}>
              <div className="flex" style={{ borderBottom: '1px solid var(--border-color)' }}>
                {[
                  { key: 'biases' as const, label: 'Bias Detection', icon: Shield, count: biases.length },
                  { key: 'noise' as const, label: 'Noise Analysis', icon: Activity },
                  { key: 'compliance' as const, label: 'Compliance', icon: FileWarning, count: compliance?.regulations?.length },
                  { key: 'premortem' as const, label: 'Pre-Mortem', icon: Zap, count: preMortem?.failureScenarios?.length },
                  { key: 'twins' as const, label: 'Decision Twins', icon: UserCheck, count: logicalAnalysis?.twins?.length },
                  { key: 'nudges' as const, label: 'Nudges', icon: Bell, count: decisionNudges.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '12px 20px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === tab.key ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span style={{
                        background: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                        padding: '1px 8px', fontSize: '11px', fontWeight: 600,
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="card-body">
              {/* Biases Tab */}
              {activeTab === 'biases' && (
                <div>
                  {biases.length === 0 ? (
                    <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-xl)' }}>
                      <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                      <p className="text-muted">No cognitive biases detected in this decision.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                      {biases.map((bias, idx) => (
                        <div
                          key={idx}
                          style={{
                            border: `1px solid ${SEVERITY_COLORS[bias.severity] || 'var(--border-color)'}`,
                            padding: 'var(--spacing-lg)',
                            background: `${SEVERITY_COLORS[bias.severity] || 'var(--border-color)'}10`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-sm">
                            <div className="flex items-center gap-md">
                              <span style={{ fontWeight: 700, fontSize: '16px' }}>
                                {bias.biasType}
                              </span>
                              <span style={{
                                fontSize: '10px', padding: '2px 8px',
                                background: SEVERITY_COLORS[bias.severity] || 'var(--text-muted)',
                                color: '#fff', fontWeight: 600,
                              }}>
                                {bias.severity.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-xs text-xs text-muted">
                              <BarChart3 size={12} />
                              {Math.round(bias.confidence * 100)}% confidence
                            </div>
                          </div>

                          {bias.excerpt && (
                            <div style={{
                              padding: '8px 12px', marginBottom: '8px',
                              borderLeft: `3px solid ${SEVERITY_COLORS[bias.severity] || 'var(--border-color)'}`,
                              background: 'rgba(0,0,0,0.2)', fontSize: '13px', fontStyle: 'italic',
                            }}>
                              &ldquo;{bias.excerpt}&rdquo;
                            </div>
                          )}

                          <p style={{ margin: '8px 0', fontSize: '14px', lineHeight: 1.5 }}>
                            {bias.explanation}
                          </p>

                          {bias.suggestion && (
                            <div className="flex items-start gap-sm" style={{
                              padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.3)', fontSize: '13px',
                            }}>
                              <CheckCircle size={14} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                              <span><strong>Suggestion:</strong> {bias.suggestion}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Noise Tab */}
              {activeTab === 'noise' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    <div className="card">
                      <div className="card-body text-center p-md">
                        <div className="text-xs text-muted mb-sm">Noise Score</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: noiseColor }}>
                          {Math.round(audit.noiseScore)}
                        </div>
                        <div className="text-xs text-muted">/ 100 (higher = more consistent)</div>
                      </div>
                    </div>
                    <NoiseStatsCards noiseStats={audit.noiseStats as { mean: number; stdDev: number; variance: number } | null} />
                  </div>

                  <div className="mt-lg" style={{ padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                    <strong>About Noise Analysis:</strong> Based on Kahneman&apos;s noise measurement methodology,
                    three independent AI judges evaluate the same decision. High standard deviation indicates
                    that similar decisions might receive inconsistent treatment — a key indicator of organizational
                    &ldquo;noise&rdquo; that degrades decision quality.
                  </div>
                </div>
              )}

              {/* Compliance Tab */}
              {activeTab === 'compliance' && (
                <div>
                  {!compliance ? (
                    <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-xl)' }}>
                      <FileWarning size={48} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-muted">No compliance analysis available for this decision.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Status + Risk Score */}
                      <div className="flex items-center gap-lg mb-lg">
                        <span style={{
                          padding: '6px 16px', fontWeight: 700, fontSize: '14px',
                          background: compliance.status === 'PASS' ? 'var(--success)' : compliance.status === 'FAIL' ? 'var(--error)' : 'var(--warning)',
                          color: compliance.status === 'WARN' ? '#000' : '#fff',
                        }}>
                          {compliance.status}
                        </span>
                        <div>
                          <span className="text-xs text-muted">Risk Score: </span>
                          <span style={{
                            fontWeight: 700, fontSize: '1.25rem',
                            color: compliance.riskScore >= 70 ? 'var(--error)' : compliance.riskScore >= 40 ? 'var(--warning)' : 'var(--success)',
                          }}>
                            {compliance.riskScore}/100
                          </span>
                        </div>
                      </div>

                      <p style={{ marginBottom: 'var(--spacing-lg)', lineHeight: 1.6, fontSize: '14px' }}>
                        {compliance.summary}
                      </p>

                      {/* Regulations Table */}
                      {compliance.regulations && compliance.regulations.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Regulation</th>
                                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600 }}>Status</th>
                                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600 }}>Risk Level</th>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {compliance.regulations.map((reg, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{reg.name}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                                      background: reg.status === 'COMPLIANT' ? 'var(--success)' : reg.status === 'NON_COMPLIANT' ? 'var(--error)' : 'var(--warning)',
                                      color: reg.status === 'PARTIAL' ? '#000' : '#fff',
                                    }}>
                                      {reg.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                                      background: SEVERITY_COLORS[reg.riskLevel] || 'var(--text-muted)',
                                      color: '#fff',
                                    }}>
                                      {reg.riskLevel.toUpperCase()}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{reg.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pre-Mortem Tab */}
              {activeTab === 'premortem' && (
                <div>
                  {!preMortem || (preMortem.failureScenarios.length === 0 && preMortem.preventiveMeasures.length === 0) ? (
                    <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-xl)' }}>
                      <Zap size={48} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-muted">No pre-mortem analysis available for this decision.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
                      {/* Failure Scenarios */}
                      <div>
                        <h4 className="flex items-center gap-sm mb-md" style={{ color: 'var(--error)' }}>
                          <AlertTriangle size={18} /> Failure Scenarios
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                          {preMortem.failureScenarios.map((scenario, idx) => (
                            <div key={idx} style={{
                              padding: 'var(--spacing-md)',
                              borderLeft: '3px solid var(--error)',
                              background: 'rgba(239, 68, 68, 0.05)',
                              fontSize: '14px', lineHeight: 1.5,
                            }}>
                              <span style={{ fontWeight: 600, color: 'var(--error)', marginRight: '8px' }}>
                                {idx + 1}.
                              </span>
                              {scenario}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Preventive Measures */}
                      <div>
                        <h4 className="flex items-center gap-sm mb-md" style={{ color: 'var(--success)' }}>
                          <Shield size={18} /> Preventive Measures
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                          {preMortem.preventiveMeasures.map((measure, idx) => (
                            <div key={idx} style={{
                              padding: 'var(--spacing-md)',
                              borderLeft: '3px solid var(--success)',
                              background: 'rgba(34, 197, 94, 0.05)',
                              fontSize: '14px', lineHeight: 1.5,
                            }}>
                              <span style={{ fontWeight: 600, color: 'var(--success)', marginRight: '8px' }}>
                                {idx + 1}.
                              </span>
                              {measure}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Decision Twins Tab */}
              {activeTab === 'twins' && (
                <div>
                  {!logicalAnalysis?.twins || logicalAnalysis.twins.length === 0 ? (
                    <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-xl)' }}>
                      <UserCheck size={48} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-muted">
                        Decision twin simulation not available.
                        <br />
                        <span className="text-xs">Runs for strategic and meeting transcript decisions.</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Verdict */}
                      {logicalAnalysis.verdict && (
                        <div className="flex items-center gap-lg mb-lg">
                          <span style={{
                            padding: '6px 16px', fontWeight: 700, fontSize: '14px',
                            background: logicalAnalysis.verdict === 'APPROVED' ? 'var(--success)' : logicalAnalysis.verdict === 'REJECTED' ? 'var(--error)' : 'var(--warning)',
                            color: logicalAnalysis.verdict === 'MIXED' ? '#000' : '#fff',
                          }}>
                            {logicalAnalysis.verdict}
                          </span>
                          <span className="text-muted text-sm">Overall verdict from {logicalAnalysis.twins.length} decision twins</span>
                        </div>
                      )}

                      {/* Twin Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
                        {logicalAnalysis.twins.map((twin, idx) => {
                          const voteColor = twin.vote === 'APPROVE' ? 'var(--success)' : twin.vote === 'REJECT' ? 'var(--error)' : 'var(--warning)';
                          return (
                            <div key={idx} style={{
                              border: `1px solid ${voteColor}`,
                              padding: 'var(--spacing-lg)',
                              background: `${voteColor}08`,
                            }}>
                              <div className="flex items-center justify-between mb-sm">
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{twin.name}</div>
                                  <div className="text-xs text-muted">{twin.role}</div>
                                </div>
                                <span style={{
                                  padding: '4px 12px', fontWeight: 700, fontSize: '12px',
                                  background: voteColor, color: twin.vote === 'REVISE' ? '#000' : '#fff',
                                }}>
                                  {twin.vote}
                                </span>
                              </div>

                              {/* Confidence bar */}
                              <div className="mb-sm">
                                <div className="flex items-center justify-between text-xs mb-xs">
                                  <span className="text-muted">Confidence</span>
                                  <span style={{ fontWeight: 600 }}>{Math.round(twin.confidence * 100)}%</span>
                                </div>
                                <div style={{ height: 6, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                  <div style={{ width: `${twin.confidence * 100}%`, height: '100%', background: voteColor }} />
                                </div>
                              </div>

                              <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '8px 0' }}>
                                {twin.rationale}
                              </p>

                              {twin.keyRiskIdentified && (
                                <div style={{
                                  padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)',
                                  borderLeft: '3px solid var(--error)', fontSize: '12px',
                                }}>
                                  <strong>Key Risk:</strong> {twin.keyRiskIdentified}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Institutional Memory */}
                      {logicalAnalysis.institutionalMemory && (
                        <div className="mt-xl">
                          <h4 className="flex items-center gap-sm mb-md">
                            <BookOpen size={18} style={{ color: 'var(--accent-secondary)' }} />
                            Institutional Memory
                            <span className="text-xs text-muted" style={{ fontWeight: 400 }}>
                              Recall Score: {logicalAnalysis.institutionalMemory.recallScore}%
                            </span>
                          </h4>

                          {logicalAnalysis.institutionalMemory.similarEvents.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                              {logicalAnalysis.institutionalMemory.similarEvents.map((event, idx) => (
                                <div key={idx} style={{
                                  padding: 'var(--spacing-md)',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '13px',
                                }}>
                                  <div className="flex items-center justify-between mb-xs">
                                    <span style={{ fontWeight: 600 }}>{event.title}</span>
                                    <div className="flex items-center gap-sm">
                                      <span style={{
                                        padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                                        background: event.outcome === 'SUCCESS' ? 'var(--success)' : event.outcome === 'FAILURE' ? 'var(--error)' : 'var(--warning)',
                                        color: event.outcome === 'MIXED' ? '#000' : '#fff',
                                      }}>
                                        {event.outcome}
                                      </span>
                                      <span className="text-xs text-muted">{Math.round(event.similarity * 100)}% similar</span>
                                    </div>
                                  </div>
                                  <p className="text-muted mb-xs">{event.summary}</p>
                                  <p style={{ color: 'var(--accent-secondary)' }}>
                                    <strong>Lesson:</strong> {event.lessonLearned}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{
                            padding: 'var(--spacing-md)',
                            background: 'rgba(99, 102, 241, 0.08)',
                            borderLeft: '3px solid var(--accent-primary)',
                            fontSize: '14px', lineHeight: 1.6,
                          }}>
                            <strong>Strategic Advice:</strong> {logicalAnalysis.institutionalMemory.strategicAdvice}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Nudges Tab */}
              {activeTab === 'nudges' && (
                <div>
                  {decisionNudges.length === 0 ? (
                    <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-xl)' }}>
                      <Bell size={48} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-muted">No nudges generated for this decision.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                      {decisionNudges.map((nudge) => {
                        const isAcking = acknowledging === nudge.id;
                        return (
                          <div
                            key={nudge.id}
                            style={{
                              padding: 'var(--spacing-lg)',
                              border: '1px solid var(--border-color)',
                              background: nudge.acknowledgedAt ? 'transparent' : 'rgba(245, 158, 11, 0.05)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-sm">
                              <div className="flex items-center gap-md">
                                <AlertTriangle size={16} style={{
                                  color: nudge.severity === 'critical' ? 'var(--error)' : nudge.severity === 'warning' ? 'var(--warning)' : 'var(--accent-primary)',
                                }} />
                                <span style={{ fontWeight: 600 }}>
                                  {NUDGE_TYPE_LABELS[nudge.nudgeType] || nudge.nudgeType}
                                </span>
                                <span style={{
                                  fontSize: '10px', padding: '2px 8px',
                                  background: nudge.severity === 'critical' ? 'var(--error)' : nudge.severity === 'warning' ? 'var(--warning)' : 'var(--accent-primary)',
                                  color: '#fff', fontWeight: 600,
                                }}>
                                  {nudge.severity.toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-muted">
                                {formatDate(nudge.createdAt, true)}
                              </span>
                            </div>
                            <p style={{ margin: '8px 0', fontSize: '14px', lineHeight: 1.5 }}>
                              {nudge.message}
                            </p>
                            <div className="flex items-center justify-between mt-sm">
                              <span className="text-xs text-muted">{nudge.triggerReason}</span>
                              {!nudge.acknowledgedAt ? (
                                <div className="flex items-center gap-sm">
                                  <button
                                    onClick={() => handleAcknowledge(nudge.id, true)}
                                    className="btn btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--success)' }}
                                    disabled={isAcking}
                                  >
                                    {isAcking ? <Loader2 size={14} className="animate-spin" /> : <><ThumbsUp size={14} /> Helpful</>}
                                  </button>
                                  <button
                                    onClick={() => handleAcknowledge(nudge.id, false)}
                                    className="btn btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--text-muted)' }}
                                    disabled={isAcking}
                                  >
                                    <ThumbsDown size={14} /> Dismiss
                                  </button>
                                </div>
                              ) : (
                                <span className="flex items-center gap-xs text-xs" style={{
                                  color: nudge.wasHelpful ? 'var(--success)' : 'var(--text-muted)',
                                }}>
                                  <CheckCircle size={12} />
                                  {nudge.wasHelpful ? 'Marked helpful' : 'Dismissed'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* No audit yet */}
      {!audit && decision.status === 'pending' && (
        <div className="card animate-fade-in">
          <div className="card-body flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-2xl)' }}>
            <Loader2 size={48} style={{ color: 'var(--accent-primary)' }} className="animate-spin" />
            <h3>Cognitive Audit In Progress</h3>
            <p className="text-muted">
              Analysis is running. This page will auto-refresh when results are available.
            </p>
          </div>
        </div>
      )}
      {!audit && decision.status === 'error' && (
        <div className="card animate-fade-in">
          <div className="card-body flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-2xl)' }}>
            <AlertTriangle size={48} style={{ color: 'var(--error)' }} />
            <h3>Analysis Failed</h3>
            <p className="text-muted">The cognitive audit encountered an error. The decision can be resubmitted.</p>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-xl">
        <Link href="/dashboard/cognitive-audits" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Cognitive Audits
        </Link>
      </div>
    </div>
  );
}
