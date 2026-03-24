'use client';

import { useState, useEffect } from 'react';
import { Globe, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BiasGenomeEntry {
  biasType: string;
  prevalence: number;
  successRate: number;
  costDelta: number;
  confirmationRate: number;
  sampleSize: number;
}

interface BiasGenomeResult {
  totalOrgs: number;
  totalDecisions: number;
  genome: BiasGenomeEntry[];
  computedAt: string;
}

interface BiasGenomeBenchmarkProps {
  /** User's own bias rates for comparison */
  userBiasRates?: Record<string, number>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BiasGenomeBenchmark({ userBiasRates }: BiasGenomeBenchmarkProps) {
  const [data, setData] = useState<BiasGenomeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchGenome() {
      try {
        const res = await fetch('/api/intelligence/bias-genome');
        if (!res.ok) throw new Error('Failed to fetch');
        const result: BiasGenomeResult = await res.json();
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchGenome();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        <Loader2 size={16} className="animate-spin" />
        Loading industry benchmarks...
      </div>
    );
  }

  if (error || !data || data.genome.length === 0) {
    return (
      <div
        style={{
          padding: '20px 24px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          textAlign: 'center',
        }}
      >
        <Globe size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          No industry benchmark data available yet. Benchmarks are built from anonymous,
          aggregated data across consenting organizations.
        </p>
      </div>
    );
  }

  const topBiases = data.genome.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        background: 'var(--bg-secondary, #1a1a2e)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Globe size={16} style={{ color: '#818cf8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Industry Benchmark
          </h3>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            {data.totalOrgs} org{data.totalOrgs !== 1 ? 's' : ''} &middot;{' '}
            {data.totalDecisions.toLocaleString()} decisions
          </p>
        </div>
      </div>

      {/* Bias rows */}
      <div style={{ padding: '8px 0' }}>
        {topBiases.map((entry, i) => {
          const userRate = userBiasRates?.[entry.biasType];
          const hasComparison = userRate !== undefined;
          const industryAvg = entry.prevalence;
          const isAboveAvg = hasComparison && userRate > industryAvg;
          const isBelowAvg = hasComparison && userRate <= industryAvg;

          return (
            <motion.div
              key={entry.biasType}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              style={{
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom:
                  i < topBiases.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
              }}
            >
              {/* Bias name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatBiasName(entry.biasType)}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {entry.sampleSize} data point{entry.sampleSize !== 1 ? 's' : ''}
                  {entry.costDelta !== 0 && (
                    <span
                      style={{
                        marginLeft: '6px',
                        color: entry.costDelta < 0 ? '#ef4444' : '#22c55e',
                      }}
                    >
                      {entry.costDelta > 0 ? '+' : ''}
                      {entry.costDelta}% success delta
                    </span>
                  )}
                </span>
              </div>

              {/* Rates comparison */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexShrink: 0,
                }}
              >
                {hasComparison && (
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        display: 'block',
                      }}
                    >
                      Your rate
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isAboveAvg ? '#ef4444' : '#22c55e',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {userRate.toFixed(0)}%
                    </span>
                  </div>
                )}
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      display: 'block',
                    }}
                  >
                    Industry avg
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {industryAvg.toFixed(0)}%
                  </span>
                </div>
                {hasComparison && (
                  <div style={{ flexShrink: 0, width: '16px' }}>
                    {isAboveAvg ? (
                      <TrendingUp size={14} style={{ color: '#ef4444' }} />
                    ) : isBelowAvg ? (
                      <TrendingDown size={14} style={{ color: '#22c55e' }} />
                    ) : null}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
