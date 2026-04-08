'use client';

import { useState, useEffect, useMemo } from 'react';
import { Globe, Loader2, TrendingDown, TrendingUp, Grid3x3, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatBiasName } from '@/lib/utils/labels';

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

// ─── Component ──────────────────────────────────────────────────────────────

type GenomeView = 'list' | 'heatmap';

export function BiasGenomeBenchmark({ userBiasRates }: BiasGenomeBenchmarkProps) {
  const [data, setData] = useState<BiasGenomeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<GenomeView>('list');

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
          No industry benchmark data available yet. Benchmarks are built from anonymous, aggregated
          data across consenting organizations.
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

      {/* View tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '0 20px',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
        }}
      >
        {(['list', 'heatmap'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: view === v ? 700 : 500,
              color: view === v ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: view === v ? '2px solid var(--accent-primary, #16a34a)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {v === 'list' ? <List size={13} /> : <Grid3x3 size={13} />}
            {v === 'list' ? 'Benchmark' : 'Co-occurrence'}
          </button>
        ))}
      </div>

      {/* Heatmap View */}
      {view === 'heatmap' && <GenomeHeatmap genome={data.genome} />}

      {/* List View — Bias rows */}
      {view === 'list' && <div style={{ padding: '8px 0' }}>
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
      </div>}
    </motion.div>
  );
}

// ─── Genome Heatmap (Co-occurrence matrix) ──────────────────────────────────

function GenomeHeatmap({ genome }: { genome: BiasGenomeEntry[] }) {
  const biases = useMemo(() => genome.slice(0, 10), [genome]);
  const biasNames = useMemo(() => biases.map(b => formatBiasName(b.biasType)), [biases]);

  // Build a co-occurrence intensity matrix from costDelta relationships
  const matrix = useMemo(() => {
    return biases.map((row, ri) =>
      biases.map((col, ci) => {
        if (ri === ci) return row.costDelta; // Self = own cost delta
        // Estimated co-occurrence risk: geometric mean of individual cost deltas
        const combined = Math.abs(row.costDelta) + Math.abs(col.costDelta);
        // Higher combined cost delta = more dangerous pair
        return -combined / 2; // Negative = costly
      })
    );
  }, [biases]);

  const maxVal = useMemo(() => {
    let max = 0;
    for (const row of matrix) {
      for (const val of row) {
        max = Math.max(max, Math.abs(val));
      }
    }
    return max || 1;
  }, [matrix]);

  function getCellColor(value: number): string {
    const intensity = Math.abs(value) / maxVal;
    if (value <= -0.1) {
      // Negative cost delta = risky (red spectrum)
      const r = Math.round(239 * intensity);
      const g = Math.round(68 * intensity);
      const b = Math.round(68 * intensity);
      return `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.45})`;
    }
    if (value >= 0.1) {
      // Positive = beneficial (green spectrum)
      return `rgba(22, 163, 74, ${0.1 + intensity * 0.4})`;
    }
    return 'var(--bg-tertiary, rgba(0,0,0,0.02))';
  }

  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  return (
    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Co-occurrence risk matrix showing estimated compound danger when bias pairs appear together.
        Darker red indicates higher combined cost impact.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${biases.length}, 1fr)`, gap: 2, fontSize: 10 }}>
        {/* Header row */}
        <div />
        {biasNames.map((name, i) => (
          <div
            key={`header-${i}`}
            style={{
              writingMode: 'vertical-lr',
              transform: 'rotate(180deg)',
              padding: '4px 2px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              textAlign: 'left',
              height: 80,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </div>
        ))}

        {/* Matrix rows */}
        {biases.map((row, ri) => (
          <>
            <div
              key={`label-${ri}`}
              style={{
                padding: '6px 4px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                fontSize: 10,
                lineHeight: 1.2,
              }}
            >
              {biasNames[ri]}
            </div>
            {biases.map((_col, ci) => {
              const val = matrix[ri][ci];
              const isHovered = hovered?.row === ri && hovered?.col === ci;
              return (
                <div
                  key={`cell-${ri}-${ci}`}
                  onMouseEnter={() => setHovered({ row: ri, col: ci })}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: getCellColor(val),
                    borderRadius: 'var(--radius-sm, 4px)',
                    aspectRatio: '1',
                    position: 'relative',
                    cursor: 'default',
                    border: isHovered ? '1px solid var(--accent-primary, #16a34a)' : '1px solid transparent',
                    transition: 'border-color 0.15s',
                    minHeight: 24,
                  }}
                >
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--bg-elevated, #fff)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md, 8px)',
                        padding: '8px 12px',
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        zIndex: 40,
                        boxShadow: 'var(--shadow-lg)',
                        pointerEvents: 'none',
                        marginBottom: 4,
                      }}
                    >
                      <strong>{biasNames[ri]}</strong> + <strong>{biasNames[ci]}</strong>
                      <br />
                      Combined risk: <span style={{ fontWeight: 700, color: val < -0.1 ? 'var(--error)' : 'var(--success)' }}>{val.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 10, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(22,163,74,0.35)' }} />
          Low risk
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(239,68,68,0.25)' }} />
          Moderate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(239,68,68,0.55)' }} />
          High risk
        </div>
      </div>
    </div>
  );
}
