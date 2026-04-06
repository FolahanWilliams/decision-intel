'use client';

import { Globe, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { useBiasGenome } from '@/hooks/useBiasGenome';
import { formatBiasName } from '@/lib/utils/labels';

export function BiasGenomeBenchmark() {
  const { genome, orgStats, isLoading, error } = useBiasGenome();

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
        <div
          className="rounded-xl p-6"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-center gap-2 py-12 text-muted">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading benchmark data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !genome) {
    return null;
  }

  const hasGenomeData = genome.genome.length > 0;
  const hasOrgData = orgStats && orgStats.length > 0;

  // Build a merged comparison: global genome entries with org overlay
  const comparison = genome.genome.slice(0, 12).map(entry => {
    const orgEntry = orgStats?.find(o => o.biasType === entry.biasType);
    return {
      biasType: entry.biasType,
      globalPrevalence: entry.prevalence,
      orgPrevalence: orgEntry?.prevalence ?? null,
      costDelta: entry.costDelta,
      successRate: entry.successRate,
      sampleSize: entry.sampleSize,
    };
  });

  // Top 3 most costly biases
  const costliestBiases = genome.genome
    .filter(e => e.costDelta < 0)
    .slice(0, 3);

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
      <div
        className="rounded-xl p-6"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Benchmark vs. Industry
          </h2>
        </div>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
          {hasGenomeData
            ? `Based on ${genome.totalOrgs} organization${genome.totalOrgs !== 1 ? 's' : ''} and ${genome.totalDecisions.toLocaleString()} decisions`
            : 'Cross-organization benchmarks'}
        </p>

        {!hasGenomeData ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <Globe size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Not enough cross-organization data yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Benchmark data becomes available as more organizations use the platform and report
              outcomes.
            </p>
          </div>
        ) : (
          <>
            {/* Comparison bars */}
            <div className="space-y-3 mb-6">
              {comparison.map(row => {
                const delta =
                  row.orgPrevalence !== null ? row.orgPrevalence - row.globalPrevalence : null;
                const isWorse = delta !== null && delta > 5;
                const isBetter = delta !== null && delta < -5;

                return (
                  <div key={row.biasType}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatBiasName(row.biasType)}
                      </span>
                      <div className="flex items-center gap-2">
                        {delta !== null && (
                          <span className="flex items-center gap-0.5">
                            {isBetter ? (
                              <TrendingDown size={10} className="text-emerald-400" />
                            ) : isWorse ? (
                              <TrendingUp size={10} className="text-red-400" />
                            ) : null}
                            {(isBetter || isWorse) && (
                              <span
                                className={`text-[10px] font-mono ${isBetter ? 'text-emerald-400' : 'text-red-400'}`}
                              >
                                {delta > 0 ? '+' : ''}
                                {delta.toFixed(0)}%
                              </span>
                            )}
                          </span>
                        )}
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          n={row.sampleSize}
                        </span>
                      </div>
                    </div>
                    {/* Dual bar */}
                    <div className="space-y-1">
                      {row.orgPrevalence !== null && (
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] w-10 text-right"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            You
                          </span>
                          <div
                            className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{ background: 'var(--bg-tertiary)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(row.orgPrevalence, 100)}%`,
                                background: 'var(--accent-primary)',
                              }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-mono w-8 text-right"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {row.orgPrevalence.toFixed(0)}%
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] w-10 text-right"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Avg
                        </span>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ background: 'var(--bg-tertiary)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(row.globalPrevalence, 100)}%`,
                              background: 'var(--text-muted)',
                              opacity: 0.4,
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-mono w-8 text-right"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {row.globalPrevalence.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!hasOrgData && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Join an organization to see how your team compares to industry averages.
                </p>
              )}
            </div>

            {/* Costliest biases callout */}
            {costliestBiases.length > 0 && (
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <h3
                  className="text-xs font-semibold mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  MOST COSTLY BIASES (INDUSTRY-WIDE)
                </h3>
                <div className="space-y-2">
                  {costliestBiases.map(b => (
                    <div key={b.biasType} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatBiasName(b.biasType)}
                      </span>
                      <span className="text-[11px] font-mono text-red-400">
                        {b.costDelta.toFixed(1)}% success rate impact
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-2 rounded-full"
                  style={{ background: 'var(--accent-primary)' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Your org
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-2 rounded-full"
                  style={{ background: 'var(--text-muted)', opacity: 0.4 }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Industry average
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
