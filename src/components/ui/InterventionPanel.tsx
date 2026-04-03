'use client';

import { useState, useCallback } from 'react';
import { GitCompare, Loader2, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getBiasDisplayName } from '@/lib/utils/bias-normalize';
import type { BiasInstance } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InterventionResult {
  successProbability: number;
  baselineProbability: number;
  improvement: number;
  confidence: number;
  method: string;
  adjustedFor: string[];
}

interface InterventionPanelProps {
  analysisId: string;
  biases: BiasInstance[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getConfidenceColor(c: number): string {
  if (c >= 0.7) return '#22c55e';
  if (c >= 0.4) return '#fbbf24';
  return '#ef4444';
}

function getConfidenceLabel(c: number): string {
  if (c >= 0.7) return 'High';
  if (c >= 0.4) return 'Medium';
  return 'Low';
}

function getMethodLabel(method: string): { label: string; color: string } {
  if (method === 'backdoor') {
    return { label: 'SCM Do-Calculus', color: '#16A34A' };
  }
  return { label: 'Correlation Estimate', color: '#fbbf24' };
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function InterventionPanel({ analysisId, biases }: InterventionPanelProps) {
  const [selectedBiasTypes, setSelectedBiasTypes] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<InterventionResult | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBias = useCallback((biasType: string) => {
    setSelectedBiasTypes(prev => {
      const next = new Set(prev);
      if (next.has(biasType)) {
        next.delete(biasType);
      } else {
        next.add(biasType);
      }
      return next;
    });
  }, []);

  const runIntervention = useCallback(async () => {
    if (selectedBiasTypes.size === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/learning/causal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          remove: Array.from(selectedBiasTypes),
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data.result ?? null);
      setHasRun(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run intervention analysis');
    } finally {
      setLoading(false);
    }
  }, [analysisId, selectedBiasTypes]);

  if (biases.length === 0) return null;

  // Deduplicate bias types for the checkbox list
  const uniqueBiasTypes = Array.from(new Set(biases.map(b => b.biasType)));

  const improvementColor =
    result && result.improvement > 0
      ? '#22c55e'
      : result && result.improvement < 0
        ? '#ef4444'
        : '#60a5fa';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: '1px solid var(--bg-elevated)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--bg-card-hover)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <GitCompare size={16} style={{ color: '#16A34A' }} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            What-If Intervention
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: '1px',
            }}
          >
            Select biases to remove and estimate success probability changes
          </span>
        </div>
      </div>

      {/* Bias selection */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {uniqueBiasTypes.map(biasType => {
            const isSelected = selectedBiasTypes.has(biasType);
            return (
              <label
                key={biasType}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? 'rgba(22, 163, 74, 0.4)' : 'var(--bg-elevated)'}`,
                  background: isSelected ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                  color: isSelected ? '#c4b5fd' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleBias(biasType)}
                  style={{
                    accentColor: '#16A34A',
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer',
                  }}
                />
                {getBiasDisplayName(biasType)}
              </label>
            );
          })}
        </div>

        {/* Run button */}
        <button
          onClick={runIntervention}
          disabled={loading || selectedBiasTypes.size === 0}
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            cursor: loading || selectedBiasTypes.size === 0 ? 'not-allowed' : 'pointer',
            background:
              loading || selectedBiasTypes.size === 0
                ? 'var(--bg-card-hover)'
                : 'rgba(22, 163, 74, 0.15)',
            color: loading || selectedBiasTypes.size === 0 ? 'var(--text-muted)' : '#c4b5fd',
            transition: 'all 0.15s ease',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Running do-calculus...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Run Intervention
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ef4444',
            fontSize: '12px',
            background: 'rgba(239, 68, 68, 0.06)',
          }}
        >
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Null result — not enough data */}
      {hasRun && !loading && !error && result === null && (
        <div
          style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}
        >
          <AlertTriangle size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
          Track more decision outcomes to unlock causal analysis
        </div>
      )}

      {/* Results */}
      {hasRun && !loading && !error && result !== null && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Method badge + confidence */}
          <div
            style={{
              padding: '10px 18px',
              borderBottom: '1px solid var(--bg-card-hover)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                background: `${getMethodLabel(result.method).color}15`,
                color: getMethodLabel(result.method).color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {getMethodLabel(result.method).label}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Confidence:{' '}
              <span
                style={{
                  fontWeight: 600,
                  color: getConfidenceColor(result.confidence),
                }}
              >
                {getConfidenceLabel(result.confidence)} ({(result.confidence * 100).toFixed(0)}%)
              </span>
            </span>
          </div>

          {/* Side-by-side comparison */}
          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Baseline */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Baseline
              </span>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {formatPct(result.baselineProbability)}
              </span>
            </div>

            {/* Arrow */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>→</span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: improvementColor,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {result.improvement > 0 ? '+' : ''}
                {(result.improvement * 100).toFixed(1)}pp
              </span>
            </div>

            {/* Intervention */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Intervention
              </span>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: improvementColor,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {formatPct(result.successProbability)}
              </span>
            </div>
          </div>

          {/* Horizontal comparison bar */}
          <div style={{ padding: '0 18px 14px 18px' }}>
            <div
              style={{
                position: 'relative',
                height: '8px',
                borderRadius: '4px',
                background: 'var(--bg-card-hover)',
                overflow: 'hidden',
              }}
            >
              {/* Baseline bar (gray) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${Math.min(result.baselineProbability * 100, 100)}%`,
                  background: 'var(--border-color)',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }}
              />
              {/* Intervention bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${Math.min(result.successProbability * 100, 100)}%`,
                  background: improvementColor,
                  borderRadius: '4px',
                  opacity: 0.6,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '10px',
                color: 'var(--text-muted)',
              }}
            >
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Adjusted-for list */}
          {result.adjustedFor.length > 0 && (
            <div
              style={{
                padding: '10px 18px',
                borderTop: '1px solid var(--bg-card-hover)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <CheckCircle2
                size={12}
                style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }}
              />
              <span>
                Adjusted for confounders:{' '}
                {result.adjustedFor.map(v => getBiasDisplayName(v)).join(', ')}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
