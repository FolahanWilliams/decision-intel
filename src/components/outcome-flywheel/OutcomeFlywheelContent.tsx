'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  DollarSign,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { IntelligenceBrief } from '@/components/ui/IntelligenceBrief';

interface FlywheelData {
  successDecisions: Array<{
    id: string;
    filename: string;
    score: number;
    outcome: string;
    biases: string[];
    impactScore: number | null;
    reportedAt: string;
  }>;
  failureDecisions: Array<{
    id: string;
    filename: string;
    score: number;
    outcome: string;
    biases: string[];
    impactScore: number | null;
    reportedAt: string;
  }>;
  biasCorrelations: Array<{
    biasType: string;
    successRate: number;
    failureRate: number;
    totalSeen: number;
    impactDelta: number;
  }>;
  accuracyTrend: {
    earlyAccuracy: number;
    recentAccuracy: number;
    improvementPct: number;
    message: string;
  };
  quarterlyImpact: {
    totalDecisions: number;
    improvedDecisions: number;
    estimatedSavings: number | null;
    currency: string;
    topCostlyBiases: Array<{ biasType: string; estimatedCost: number }>;
  };
  flywheelHealth: {
    outcomesLogged: number;
    totalDecisions: number;
    loopClosureRate: number;
  };
}

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function OutcomeFlywheelContent() {
  const [data, setData] = useState<FlywheelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/outcomes/flywheel');
        if (!res.ok) {
          setError('Failed to load flywheel data');
          return;
        }
        const result = await res.json();
        setData(result);
      } catch {
        setError('Network error loading flywheel data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center gap-sm"
        style={{ padding: '60px 0', color: 'var(--text-muted)' }}
      >
        <Loader2 size={20} className="animate-spin" />
        Loading outcome flywheel...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const {
    successDecisions,
    failureDecisions,
    biasCorrelations,
    accuracyTrend,
    quarterlyImpact,
    flywheelHealth,
  } = data;
  const hasOutcomes = flywheelHealth.outcomesLogged > 0;
  const healthCircumference = 2 * Math.PI * 40;
  const healthDashOffset =
    healthCircumference - (flywheelHealth.loopClosureRate / 100) * healthCircumference;

  const pendingOutcomes = Math.max(
    0,
    flywheelHealth.totalDecisions - flywheelHealth.outcomesLogged
  );

  return (
    <div>
      {/* Contextual Intelligence Brief — what to do next */}
      <IntelligenceBrief
        context="outcomes"
        metrics={{
          pendingOutcomes,
          loopClosureRate: flywheelHealth.loopClosureRate / 100,
        }}
      />

      {/* Row 1: Quarterly Impact + Flywheel Health + Accuracy Trend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        {/* Quarterly Impact Banner */}
        <div className="card">
          <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
            <div
              className="flex items-center gap-xs"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              <DollarSign size={12} />
              Quarterly Impact
            </div>
            {quarterlyImpact.estimatedSavings != null ? (
              <>
                <div
                  style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}
                >
                  {formatCurrency(quarterlyImpact.estimatedSavings, quarterlyImpact.currency)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>
                  estimated bias costs avoided this quarter
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {quarterlyImpact.improvedDecisions} improved
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                  of {quarterlyImpact.totalDecisions} decisions tracked this quarter
                </div>
              </>
            )}
            {quarterlyImpact.topCostlyBiases.length > 0 && (
              <div
                style={{
                  marginTop: 'var(--spacing-sm)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                }}
              >
                {quarterlyImpact.topCostlyBiases.slice(0, 3).map((b, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: 'var(--error)',
                    }}
                  >
                    {formatBiasName(b.biasType)}:{' '}
                    {formatCurrency(b.estimatedCost, quarterlyImpact.currency)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flywheel Health Ring */}
        <div className="card">
          <div
            className="card-body flex items-center gap-md"
            style={{ padding: 'var(--spacing-md)' }}
          >
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="6"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={healthCircumference}
                strokeDashoffset={healthDashOffset}
                transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <text
                x="48"
                y="44"
                textAnchor="middle"
                fill="var(--accent-primary)"
                fontSize="18"
                fontWeight="700"
              >
                {Math.round(flywheelHealth.loopClosureRate)}%
              </text>
              <text x="48" y="58" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                CLOSED
              </text>
            </svg>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                <Activity
                  size={12}
                  style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}
                />
                Feedback Loop Health
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                {flywheelHealth.outcomesLogged} of {flywheelHealth.totalDecisions}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                decisions have closed the outcome loop
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Trend */}
        <div className="card">
          <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
            <div
              className="flex items-center gap-xs"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              <Target size={12} />
              Detection Accuracy
            </div>
            <div className="flex items-center gap-sm">
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color:
                    accuracyTrend.improvementPct > 0
                      ? 'var(--success)'
                      : accuracyTrend.improvementPct < 0
                        ? 'var(--error)'
                        : 'var(--text-secondary)',
                }}
              >
                {accuracyTrend.recentAccuracy.toFixed(0)}%
              </span>
              {accuracyTrend.improvementPct !== 0 && (
                <span
                  className="flex items-center gap-xs"
                  style={{
                    fontSize: '12px',
                    color:
                      accuracyTrend.improvementPct > 0 ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  {accuracyTrend.improvementPct > 0 ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {Math.abs(accuracyTrend.improvementPct).toFixed(1)}pp
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              {accuracyTrend.message}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Decisions Split View */}
      {hasOutcomes && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          {/* Decisions That Paid Off */}
          <div className="card">
            <div className="card-header flex items-center gap-sm">
              <CheckCircle size={16} style={{ color: 'var(--success)' }} />
              <h3 className="text-sm font-semibold">Decisions That Paid Off</h3>
              <span
                style={{ fontSize: '11px', color: 'var(--success)', marginLeft: 'auto' }}
              >
                {successDecisions.length}
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {successDecisions.length === 0 ? (
                <div
                  style={{
                    padding: 'var(--spacing-lg)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  No successful outcomes recorded yet
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {successDecisions.map(d => (
                    <Link
                      key={d.id}
                      href={`/documents/${d.id}`}
                      className="flex items-center gap-sm transition-colors"
                      style={{
                        padding: '10px var(--spacing-md)',
                        borderBottom: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.filename}
                        </div>
                        <div className="flex items-center gap-sm" style={{ marginTop: 2 }}>
                          {d.impactScore != null && (
                            <span style={{ fontSize: '11px', color: 'var(--success)' }}>
                              Impact: {d.impactScore}/100
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {formatDate(d.reportedAt)}
                          </span>
                        </div>
                        {d.biases.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                            {d.biases.slice(0, 3).map((b, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '9px',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  color: 'var(--success)',
                                }}
                              >
                                {formatBiasName(b)}
                              </span>
                            ))}
                            {d.biases.length > 3 && (
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                +{d.biases.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Decisions That Didn't */}
          <div className="card">
            <div className="card-header flex items-center gap-sm">
              <XCircle size={16} style={{ color: 'var(--error)' }} />
              <h3 className="text-sm font-semibold">Decisions That Didn&apos;t</h3>
              <span style={{ fontSize: '11px', color: 'var(--error)', marginLeft: 'auto' }}>
                {failureDecisions.length}
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {failureDecisions.length === 0 ? (
                <div
                  style={{
                    padding: 'var(--spacing-lg)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  No failed outcomes recorded yet
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {failureDecisions.map(d => (
                    <Link
                      key={d.id}
                      href={`/documents/${d.id}`}
                      className="flex items-center gap-sm transition-colors"
                      style={{
                        padding: '10px var(--spacing-md)',
                        borderBottom: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.filename}
                        </div>
                        <div className="flex items-center gap-sm" style={{ marginTop: 2 }}>
                          {d.impactScore != null && (
                            <span style={{ fontSize: '11px', color: 'var(--error)' }}>
                              Impact: {d.impactScore}/100
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {formatDate(d.reportedAt)}
                          </span>
                        </div>
                        {d.biases.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                            {d.biases.slice(0, 3).map((b, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '9px',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: 'var(--error)',
                                }}
                              >
                                {formatBiasName(b)}
                              </span>
                            ))}
                            {d.biases.length > 3 && (
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                +{d.biases.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Bias-Outcome Correlation Table */}
      {biasCorrelations.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="card-header flex items-center gap-sm">
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <h3 className="text-sm font-semibold">Bias-Outcome Correlations</h3>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th
                    style={{
                      padding: '8px var(--spacing-md)',
                      textAlign: 'left',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Bias Type
                  </th>
                  <th
                    style={{
                      padding: '8px var(--spacing-md)',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Seen
                  </th>
                  <th
                    style={{
                      padding: '8px var(--spacing-md)',
                      textAlign: 'left',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      minWidth: 160,
                    }}
                  >
                    Success / Failure Rate
                  </th>
                  <th
                    style={{
                      padding: '8px var(--spacing-md)',
                      textAlign: 'right',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody>
                {biasCorrelations.slice(0, 15).map((bc, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td
                      style={{
                        padding: '8px var(--spacing-md)',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {formatBiasName(bc.biasType)}
                    </td>
                    <td
                      style={{
                        padding: '8px var(--spacing-md)',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {bc.totalSeen}
                    </td>
                    <td style={{ padding: '8px var(--spacing-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 16 }}>
                        <div
                          style={{
                            height: 8,
                            width: `${Math.max(bc.successRate * 100, 2)}%`,
                            background: 'var(--success)',
                            borderRadius: 4,
                            transition: 'width 0.3s ease',
                          }}
                        />
                        <div
                          style={{
                            height: 8,
                            width: `${Math.max(bc.failureRate * 100, 2)}%`,
                            background: 'var(--error)',
                            borderRadius: 4,
                            transition: 'width 0.3s ease',
                          }}
                        />
                        <span
                          style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}
                        >
                          {(bc.successRate * 100).toFixed(0)}% / {(bc.failureRate * 100).toFixed(0)}
                          %
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '8px var(--spacing-md)',
                        textAlign: 'right',
                        color: bc.impactDelta > 5 ? 'var(--error)' : 'var(--text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      {bc.impactDelta > 0
                        ? `-${bc.impactDelta.toFixed(1)}`
                        : bc.impactDelta.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasOutcomes && (
        <div
          className="card"
          style={{
            padding: 'var(--spacing-2xl)',
            textAlign: 'center',
          }}
        >
          <TrendingUp size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 8 }}>
            No outcomes tracked yet
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              maxWidth: 400,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            The flywheel gets smarter with every outcome you record. Analyze a document, then come
            back later to report whether the decision was successful. The more outcomes you track,
            the better your bias detection becomes.
          </p>
        </div>
      )}
    </div>
  );
}
