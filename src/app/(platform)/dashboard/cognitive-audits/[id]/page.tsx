'use client';

import { use, useMemo, useState } from 'react';
import { useHumanDecision } from '@/hooks/useHumanDecisions';
import Link from 'next/link';
import {
  BrainCircuit,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquare,
  Users,
  Mail,
  Ticket,
  PenLine,
  Activity,
  BarChart3,
  Bell,
  Shield,
  Eye,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { QualityGauge } from '@/components/visualizations/QualityMetrics';
import { SentimentGauge } from '@/components/visualizations/SentimentGauge';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('CognitiveAuditDetail');

const SOURCE_LABELS: Record<string, string> = {
  slack: 'Slack Conversation',
  meeting_transcript: 'Meeting Transcript',
  email: 'Email Thread',
  jira: 'Jira Ticket',
  manual: 'Manual Submission',
};

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  slack: MessageSquare,
  meeting_transcript: Users,
  email: Mail,
  jira: Ticket,
  manual: PenLine,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'var(--error)',
  high: '#f97316',
  medium: 'var(--warning)',
  low: 'var(--success)',
};

const NUDGE_TYPE_LABELS: Record<string, string> = {
  anchor_alert: 'Anchor Alert',
  dissent_prompt: 'Dissent Prompt',
  base_rate_reminder: 'Base Rate Reminder',
  pre_mortem_trigger: 'Pre-Mortem Trigger',
  noise_check: 'Noise Check',
};

interface BiasItem {
  biasType: string;
  severity: string;
  excerpt: string;
  explanation: string;
  suggestion: string;
  confidence: number;
  found?: boolean;
}

function getBiasArray(biasFindings: unknown): BiasItem[] {
  if (Array.isArray(biasFindings)) return biasFindings;
  return [];
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
  const [activeTab, setActiveTab] = useState<'biases' | 'noise' | 'nudges'>('biases');

  // Use nudges from the decision response directly
  const decisionNudges = decision?.nudges ?? [];

  const audit = decision?.cognitiveAudit ?? null;
  const biases = useMemo(() => getBiasArray(audit?.biasFindings), [audit]);

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
          <span>{new Date(decision.createdAt).toLocaleString()}</span>
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
                                {nudge.createdAt ? new Date(nudge.createdAt).toLocaleString() : ''}
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
      {!audit && (
        <div className="card animate-fade-in">
          <div className="card-body flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-2xl)' }}>
            <Loader2 size={48} style={{ color: 'var(--accent-primary)' }} className="animate-spin" />
            <h3>Analysis In Progress</h3>
            <p className="text-muted">The cognitive audit is still running. This page will update when results are available.</p>
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
