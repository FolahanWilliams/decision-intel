'use client';

import { useMemo, useState } from 'react';
import { useHumanDecisions, type HumanDecisionSummary } from '@/hooks/useHumanDecisions';
import Link from 'next/link';
import {
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trash2,
  Loader2,
  PenLine,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClientLogger } from '@/lib/utils/logger';
import {
  SOURCE_ICONS,
  SOURCE_LABELS,
  getQualityLevel,
  getBiasArray,
  formatDate,
} from '@/lib/constants/human-audit';

const log = createClientLogger('CognitiveAudits');

interface AuditSummary {
  totalDecisions: number;
  avgQualityScore: number;
  highRiskCount: number;
  totalBiases: number;
  consensusFlags: number;
}

export default function CognitiveAuditsPage() {
  const [page, setPage] = useState(1);
  const { decisions, total, totalPages, isLoading: loading, mutate } = useHumanDecisions(page, 20);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: '', label: '' });
  const [deleting, setDeleting] = useState(false);

  const auditedDecisions: HumanDecisionSummary[] = useMemo(() => {
    return decisions.filter((d: HumanDecisionSummary) => d.cognitiveAudit !== null);
  }, [decisions]);

  const summary = useMemo((): AuditSummary => {
    let totalScore = 0;
    let highRisk = 0;
    let totalBiases = 0;
    let consensusFlags = 0;

    auditedDecisions.forEach((d: HumanDecisionSummary) => {
      const audit = d.cognitiveAudit;
      if (!audit) return;

      totalScore += audit.decisionQualityScore;
      if (audit.decisionQualityScore < 40) highRisk++;
      totalBiases += getBiasArray(audit.biasFindings).length;
      if (audit.teamConsensusFlag) consensusFlags++;
    });

    return {
      totalDecisions: auditedDecisions.length,
      avgQualityScore:
        auditedDecisions.length > 0 ? Math.round(totalScore / auditedDecisions.length) : 0,
      highRiskCount: highRisk,
      totalBiases,
      consensusFlags,
    };
  }, [auditedDecisions]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/human-decisions/${deleteModal.id}`, { method: 'DELETE' });
      if (res.ok) {
        await mutate();
        setDeleteModal({ open: false, id: '', label: '' });
      }
    } catch (err) {
      log.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}
      >
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
        <div className="card animate-pulse">
          <div className="card-header">
            <div className="h-4 w-40 bg-white/10" />
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="flex items-center justify-between p-lg"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-lg">
                  <div className="w-12 h-12 bg-white/10" />
                  <div>
                    <div className="h-4 w-40 bg-white/10 mb-sm" />
                    <div className="h-3 w-24 bg-white/10" />
                  </div>
                </div>
                <div className="flex items-center gap-xl">
                  <div className="h-8 w-12 bg-white/10" />
                  <div className="h-8 w-12 bg-white/10" />
                  <div className="h-8 w-20 bg-white/10" />
                </div>
              </div>
            ))}
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
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cognitive Audits' }]}
      />

      <header className="mb-xl">
        <div className="flex items-center justify-between mb-sm">
          <div className="flex items-center gap-md">
            <BrainCircuit size={28} style={{ color: 'var(--accent-primary)' }} />
            <h1>Cognitive Audits</h1>
          </div>
          <div className="flex items-center gap-sm">
            <Link
              href="/dashboard/cognitive-audits/effectiveness"
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              Effectiveness
            </Link>
            <Link
              href="/dashboard/cognitive-audits/submit"
              className="btn btn-primary"
              style={{ fontSize: '13px' }}
            >
              + Submit Decision
            </Link>
          </div>
        </div>
        <p className="text-muted">
          Human decision quality analysis — bias detection, noise measurement, and behavioral nudges
        </p>
      </header>

      {/* Summary Cards */}
      <ErrorBoundary sectionName="Audit Summary">
        <div className="grid grid-4 mb-xl gap-md">
          <div className="card animate-fade-in">
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Total Audited</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {summary.totalDecisions}
              </div>
              <div className="text-xs text-muted">Decisions</div>
            </div>
          </div>

          <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Avg Quality</div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color:
                    summary.avgQualityScore >= 70
                      ? 'var(--success)'
                      : summary.avgQualityScore >= 40
                        ? 'var(--warning)'
                        : 'var(--error)',
                }}
              >
                {summary.avgQualityScore}
              </div>
              <div className="text-xs text-muted flex items-center justify-center gap-xs">
                {summary.avgQualityScore >= 50 ? (
                  <>
                    <TrendingUp size={12} style={{ color: 'var(--success)' }} /> Good
                  </>
                ) : (
                  <>
                    <TrendingDown size={12} style={{ color: 'var(--error)' }} /> Needs Attention
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">High Risk</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--error)' }}>
                {summary.highRiskCount}
              </div>
              <div className="text-xs text-muted">Decisions</div>
            </div>
          </div>

          <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Biases Detected</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>
                {summary.totalBiases}
              </div>
              <div className="text-xs text-muted">
                {summary.consensusFlags > 0 &&
                  `${summary.consensusFlags} consensus flag${summary.consensusFlags > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Quality Distribution */}
      {summary.totalDecisions > 0 && (
        <ErrorBoundary sectionName="Quality Distribution">
          <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <BarChart3 size={18} /> Quality Distribution
              </h3>
            </div>
            <div className="card-body">
              {(() => {
                const high = auditedDecisions.filter(
                  d => (d.cognitiveAudit?.decisionQualityScore ?? 0) < 40
                ).length;
                const med = auditedDecisions.filter(d => {
                  const s = d.cognitiveAudit?.decisionQualityScore ?? 0;
                  return s >= 40 && s < 70;
                }).length;
                const low = auditedDecisions.filter(
                  d => (d.cognitiveAudit?.decisionQualityScore ?? 0) >= 70
                ).length;
                return (
                  <div style={{ display: 'flex', height: '40px', overflow: 'hidden' }}>
                    {high > 0 && (
                      <div
                        style={{
                          flex: high,
                          background: 'var(--error)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        High Risk ({high})
                      </div>
                    )}
                    {med > 0 && (
                      <div
                        style={{
                          flex: med,
                          background: 'var(--warning)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Moderate ({med})
                      </div>
                    )}
                    {low > 0 && (
                      <div
                        style={{
                          flex: low,
                          background: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Good ({low})
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Decision List */}
      <ErrorBoundary sectionName="Decision List">
        <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="card-header">
            <h3 className="flex items-center gap-sm">
              <BrainCircuit size={18} /> Human Decision Audits
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {decisions.length === 0 ? (
              <div
                className="flex flex-col items-center gap-md"
                style={{ padding: 'var(--spacing-2xl)' }}
              >
                <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} />
                <p className="text-muted text-center">
                  No human decisions audited yet.
                  <br />
                  Submit decisions via the API, Slack integration, or manual entry to get started.
                </p>
              </div>
            ) : (
              decisions.map((decision: HumanDecisionSummary, idx: number) => {
                const audit = decision.cognitiveAudit;
                const quality = audit ? getQualityLevel(audit.decisionQualityScore) : null;
                const biases = audit ? getBiasArray(audit.biasFindings) : [];
                const SourceIcon = SOURCE_ICONS[decision.source] || PenLine;

                return (
                  <div
                    key={decision.id}
                    style={{
                      padding: 'var(--spacing-lg)',
                      borderBottom:
                        idx < decisions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: quality?.bg ?? 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-lg">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          background: 'var(--bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <SourceIcon
                          size={24}
                          style={{ color: quality?.color ?? 'var(--text-muted)' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          {SOURCE_LABELS[decision.source] || decision.source}
                          {decision.channel && ` — ${decision.channel}`}
                        </div>
                        <div className="flex items-center gap-md">
                          <span className="text-xs text-muted">
                            {formatDate(decision.createdAt)}
                          </span>
                          {decision.decisionType && (
                            <span className="text-xs" style={{ color: 'var(--accent-secondary)' }}>
                              {decision.decisionType}
                            </span>
                          )}
                          {decision.status === 'pending' && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                background: 'var(--text-muted)',
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            >
                              PENDING
                            </span>
                          )}
                          {quality && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                background: quality.color,
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            >
                              {quality.label}
                            </span>
                          )}
                          {audit?.teamConsensusFlag && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                background: 'var(--warning)',
                                color: '#000',
                                fontWeight: 600,
                              }}
                            >
                              CONSENSUS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-xl">
                      {audit && (
                        <>
                          <div className="text-center">
                            <div className="text-xs text-muted">Quality</div>
                            <div
                              style={{ fontSize: '1.5rem', fontWeight: 700, color: quality?.color }}
                            >
                              {Math.round(audit.decisionQualityScore)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted">Noise</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                              {Math.round(audit.noiseScore)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted">Biases</div>
                            <div className="flex items-center gap-xs">
                              <AlertTriangle
                                size={14}
                                style={{
                                  color: biases.length > 0 ? 'var(--warning)' : 'var(--text-muted)',
                                }}
                              />
                              <span style={{ fontWeight: 600 }}>{biases.length}</span>
                            </div>
                          </div>
                        </>
                      )}
                      <Link
                        href={`/dashboard/cognitive-audits/${decision.id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px' }}
                      >
                        View Details <ArrowRight size={14} />
                      </Link>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            id: decision.id,
                            label: `${SOURCE_LABELS[decision.source] || decision.source}${decision.channel ? ` — ${decision.channel}` : ''}`,
                          })
                        }
                        className="btn btn-ghost"
                        style={{ padding: '8px', color: 'var(--text-muted)' }}
                        title="Delete decision"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ErrorBoundary>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-lg mb-lg" style={{ fontSize: '13px' }}>
          <span className="text-muted">
            Page {page} of {totalPages} ({total} decisions)
          </span>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-3 mt-xl gap-md">
        <Link href="/dashboard/nudges" className="card" style={{ textDecoration: 'none' }}>
          <div className="card-body flex items-center gap-md">
            <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>View Nudges</div>
              <div className="text-xs text-muted">Behavioral nudges from audits</div>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/risk-audits" className="card" style={{ textDecoration: 'none' }}>
          <div className="card-body flex items-center gap-md">
            <BarChart3 size={24} style={{ color: 'var(--accent-secondary)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>AI Risk Audits</div>
              <div className="text-xs text-muted">Document-based AI analysis</div>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/trends" className="card" style={{ textDecoration: 'none' }}>
          <div className="card-body flex items-center gap-md">
            <TrendingUp size={24} style={{ color: 'var(--success)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>View Trends</div>
              <div className="text-xs text-muted">Historical analysis patterns</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ maxWidth: 400, width: '90%' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
                Delete Decision
              </h3>
            </div>
            <div className="card-body">
              <p className="mb-lg">
                Are you sure you want to delete <strong>{deleteModal.label}</strong>? This will
                remove the decision, its cognitive audit, and all nudges.
              </p>
              <div className="flex items-center gap-md justify-end">
                <button
                  onClick={() => setDeleteModal({ open: false, id: '', label: '' })}
                  className="btn btn-ghost"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn"
                  style={{ background: 'var(--error)', color: '#fff' }}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
