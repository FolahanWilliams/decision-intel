'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBiasName } from '@/lib/utils/labels';

interface RootCauseAttribution {
  biasType: string;
  contributionScore: number;
  evidence: string;
  causalStrength: number;
  severity: string;
}

interface RootCauseSectionProps {
  analysisId: string;
  orgId: string;
}

export function RootCauseSection({ analysisId, orgId }: RootCauseSectionProps) {
  const [attributions, setAttributions] = useState<RootCauseAttribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRootCauses() {
      try {
        const res = await fetch(
          `/api/decision-graph/root-cause?analysisId=${encodeURIComponent(analysisId)}&orgId=${encodeURIComponent(orgId)}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setAttributions(data.attributions || []);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRootCauses();
    return () => {
      cancelled = true;
    };
  }, [analysisId, orgId]);

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 py-4 text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        <Loader2 size={14} className="animate-spin" />
        Analyzing root causes...
      </div>
    );
  }

  if (attributions.length === 0) return null;

  const maxScore = Math.max(...attributions.map(a => Math.abs(a.contributionScore)), 0.01);

  return (
    <div
      className={cn('p-6 rounded-xl mt-8', 'liquid-glass')}
      style={{ border: '1px solid var(--border-color)' }}
    >
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Root Cause Analysis
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        How much each detected bias contributed to the decision outcome, based on historical
        patterns and graph topology.
      </p>
      <div className="space-y-3">
        {attributions.map((attr, i) => {
          const isNegative = attr.contributionScore < 0;
          const barWidth = Math.round((Math.abs(attr.contributionScore) / maxScore) * 100);

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isNegative ? (
                    <TrendingDown size={12} className="text-green-400" />
                  ) : (
                    <TrendingUp size={12} className="text-red-400" />
                  )}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatBiasName(attr.biasType)}
                  </span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                      attr.severity === 'critical' && 'bg-red-500/20 text-red-400',
                      attr.severity === 'high' && 'bg-orange-500/20 text-orange-400',
                      attr.severity === 'medium' && 'bg-yellow-500/20 text-yellow-400',
                      attr.severity === 'low' && 'bg-green-500/20 text-green-400'
                    )}
                  >
                    {attr.severity}
                  </span>
                </div>
                <span
                  className="text-xs font-mono"
                  style={{
                    color: isNegative ? '#22c55e' : '#ef4444',
                  }}
                >
                  {isNegative ? '' : '+'}
                  {Math.round(attr.contributionScore * 100)}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-card-hover)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    background: isNegative
                      ? 'linear-gradient(to right, #22c55e, #16a34a)'
                      : 'linear-gradient(to right, #ef4444, #dc2626)',
                  }}
                />
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {attr.evidence}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
