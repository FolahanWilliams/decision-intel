'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';

interface RiskData {
  riskScore: number;
  potentialLoss: number | null;
  currency: string;
  topRisks: Array<{
    biasType: string;
    severity: string;
    failureRate: number;
    estimatedCost: number | null;
  }>;
  baselineComparison: string;
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

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getRiskColor(score: number): string {
  if (score < 30) return '#34d399';
  if (score < 60) return '#FBBF24';
  return '#f87171';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#f87171';
    case 'high':
      return '#fb923c';
    case 'medium':
      return '#FBBF24';
    case 'low':
      return '#34d399';
    default:
      return 'var(--text-muted)';
  }
}

interface RiskScoreCardProps {
  analysisId: string;
}

export function RiskScoreCard({ analysisId }: RiskScoreCardProps) {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRiskScore() {
      try {
        const res = await fetch(`/api/analysis/${analysisId}/risk-score`);
        if (cancelled) return;
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const result = await res.json();
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRiskScore();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div className="card" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div
          className="card-body flex items-center justify-center gap-sm"
          style={{ padding: 'var(--spacing-lg)', color: 'var(--text-muted)', fontSize: '13px' }}
        >
          <Loader2 size={14} className="animate-spin" />
          Calculating risk score...
        </div>
      </div>
    );
  }

  if (error || !data || (data.riskScore === 0 && data.topRisks.length === 0)) {
    return null;
  }

  const riskColor = getRiskColor(data.riskScore);
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (data.riskScore / 100) * circumference;

  return (
    <div className="card" style={{ border: `1px solid ${riskColor}20` }}>
      <div
        className="card-header flex items-center gap-sm"
        style={{ borderBottom: `1px solid ${riskColor}15` }}
      >
        <ShieldAlert size={16} style={{ color: riskColor }} />
        <h3 className="text-sm font-semibold">Risk-Adjusted Decision Score</h3>
      </div>

      <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'flex-start' }}>
          {/* Risk Gauge */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              {/* Background arc */}
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="8"
              />
              {/* Risk arc */}
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke={riskColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 44 44)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              {/* Score text */}
              <text
                x="44"
                y="40"
                textAnchor="middle"
                fill={riskColor}
                fontSize="20"
                fontWeight="700"
              >
                {data.riskScore}
              </text>
              <text x="44" y="54" textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                RISK
              </text>
            </svg>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Potential loss headline */}
            {data.potentialLoss != null && data.potentialLoss > 0 ? (
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div
                  className="flex items-center gap-xs"
                  style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}
                >
                  <TrendingDown size={12} />
                  Estimated Value at Risk
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: riskColor }}>
                  {formatCurrency(data.potentialLoss, data.currency)}
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                Set a monetary value on the decision frame to see estimated loss
              </div>
            )}

            {/* Baseline comparison */}
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              {data.baselineComparison}
            </div>

            {/* Top risks */}
            {data.topRisks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Top Risk Contributors
                </div>
                {data.topRisks.slice(0, 3).map((risk, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `2px solid ${getSeverityColor(risk.severity)}`,
                    }}
                  >
                    <div className="flex items-center gap-xs">
                      <AlertTriangle size={10} style={{ color: getSeverityColor(risk.severity) }} />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatBiasName(risk.biasType)}
                      </span>
                    </div>
                    <div className="flex items-center gap-sm" style={{ fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {(risk.failureRate * 100).toFixed(0)}% fail rate
                      </span>
                      {risk.estimatedCost != null && (
                        <span style={{ color: riskColor, fontWeight: 600 }}>
                          {formatCurrency(risk.estimatedCost, data.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
