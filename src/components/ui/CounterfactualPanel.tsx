'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('CounterfactualPanel');

// ─── Types ──────────────────────────────────────────────────────────────────

interface CounterfactualScenario {
  biasRemoved: string;
  historicalSampleSize: number;
  successRateWithBias: number;
  successRateWithoutBias: number;
  expectedImprovement: number;
  confidence: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
}

interface CounterfactualResult {
  analysisId: string;
  biasCount: number;
  scenarios: CounterfactualScenario[];
  aggregateImprovement: number;
  weightedImprovement: number;
  dataAsOf: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface CounterfactualPanelProps {
  analysisId: string;
  /**
   * `full` — default, shows all scenarios in a scrollable list (original behavior).
   * `featured` — hero card with the single highest-impact scenario, meant to sit
   * above the analysis tabs as a demo-grade ROI statement.
   */
  variant?: 'full' | 'featured';
}

function formatBiasName(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getConfidenceColor(c: number): string {
  if (c >= 0.7) return '#22c55e';
  if (c >= 0.4) return '#fbbf24';
  return '#ef4444';
}

export function CounterfactualPanel({ analysisId, variant = 'full' }: CounterfactualPanelProps) {
  const [data, setData] = useState<CounterfactualResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(`/api/counterfactual?analysisId=${analysisId}`);
        if (res.ok) {
          const result = await res.json();
          if (!cancelled) setData(result);
        }
      } catch (err) {
        log.warn('Failed to fetch counterfactual data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        Computing counterfactuals...
      </div>
    );
  }

  if (!data || data.scenarios.length === 0) return null;

  // ─── Featured variant — hero ROI card for the top-impact scenario ────────
  if (variant === 'featured') {
    const top = [...data.scenarios].sort(
      (a, b) => b.expectedImprovement - a.expectedImprovement
    )[0];
    if (!top || top.expectedImprovement <= 0) return null;

    const currencySymbol =
      top.currency === 'GBP' ? '£' : top.currency === 'USD' ? '$' : top.currency;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{
          borderLeft: '3px solid var(--accent-primary)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div
          className="card-body"
          style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(22, 163, 74, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GitBranch size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="section-heading" style={{ marginBottom: 2 }}>
                Counterfactual — What If
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                }}
              >
                Remove {formatBiasName(top.biasRemoved)} →{' '}
                <span
                  style={{
                    color: 'var(--accent-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +{top.expectedImprovement.toFixed(1)}pp
                </span>{' '}
                success lift
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span>Based on {top.historicalSampleSize} similar decisions</span>
                <span style={{ color: getConfidenceColor(top.confidence), fontWeight: 600 }}>
                  · {(top.confidence * 100).toFixed(0)}% confidence
                </span>
                {data.scenarios.length > 1 && (
                  <span>
                    · {data.scenarios.length - 1} more scenario
                    {data.scenarios.length - 1 === 1 ? '' : 's'} below
                  </span>
                )}
              </div>
            </div>
          </div>
          {top.estimatedMonetaryImpact != null && top.estimatedMonetaryImpact > 0 && (
            <div
              style={{
                borderLeft: '1px solid var(--border-color)',
                paddingLeft: 20,
                minWidth: 140,
              }}
            >
              <div className="section-heading" style={{ marginBottom: 2 }}>
                Estimated Impact
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ~{currencySymbol}
                {top.estimatedMonetaryImpact.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <GitBranch size={16} style={{ color: '#60a5fa' }} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Counterfactual Analysis
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: '1px',
            }}
          >
            What if these biases were removed? Based on{' '}
            {data.scenarios.reduce((s, sc) => s + sc.historicalSampleSize, 0)} historical decisions
          </span>
        </div>
      </div>

      {/* Aggregate summary */}
      {data.weightedImprovement > 0 && (
        <div
          style={{
            padding: '12px 18px',
            background: 'rgba(96, 165, 250, 0.06)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={14} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Removing all detected biases would improve expected success rate by{' '}
            <span
              style={{
                fontWeight: 700,
                color: '#60a5fa',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              +{data.weightedImprovement.toFixed(1)}pp
            </span>{' '}
            (confidence-weighted)
          </span>
        </div>
      )}

      {/* Per-bias scenarios */}
      <div style={{ padding: '8px 0' }}>
        {data.scenarios.map((scenario, i) => (
          <motion.div
            key={scenario.biasRemoved}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: '10px 18px',
              borderBottom:
                i < data.scenarios.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertTriangle size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'block',
                }}
              >
                Without {formatBiasName(scenario.biasRemoved)}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {scenario.historicalSampleSize} similar decisions &middot;{' '}
                <span style={{ color: getConfidenceColor(scenario.confidence) }}>
                  {(scenario.confidence * 100).toFixed(0)}% confidence
                </span>
              </span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: scenario.expectedImprovement > 0 ? '#22c55e' : 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                +{scenario.expectedImprovement.toFixed(1)}pp
              </span>
              {scenario.estimatedMonetaryImpact != null && scenario.estimatedMonetaryImpact > 0 && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                  ~
                  {scenario.currency === 'GBP'
                    ? '£'
                    : scenario.currency === 'USD'
                      ? '$'
                      : scenario.currency}
                  {scenario.estimatedMonetaryImpact.toLocaleString()}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
