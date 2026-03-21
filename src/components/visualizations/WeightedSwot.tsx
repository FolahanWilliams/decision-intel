'use client';

import { useState, useMemo, useCallback } from 'react';
import { SwotAnalysisResult } from '@/types';
import { Scale, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface WeightedSwotProps {
  data: SwotAnalysisResult;
}

type QuadrantKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

const QUADRANT_META: Record<
  QuadrantKey,
  { label: string; color: string; bg: string; sign: number }
> = {
  strengths: { label: 'Strengths', color: 'text-emerald-400', bg: 'bg-emerald-500/10', sign: 1 },
  weaknesses: { label: 'Weaknesses', color: 'text-rose-400', bg: 'bg-rose-500/10', sign: -1 },
  opportunities: { label: 'Opportunities', color: 'text-blue-400', bg: 'bg-blue-500/10', sign: 1 },
  threats: { label: 'Threats', color: 'text-amber-400', bg: 'bg-amber-500/10', sign: -1 },
};

const WEIGHT_LABELS = ['', 'Low', 'Moderate', 'Important', 'High', 'Critical'];

export function WeightedSwot({ data }: WeightedSwotProps) {
  // weights[quadrant][itemIndex] = 1-5
  const [weights, setWeights] = useState<Record<QuadrantKey, number[]>>(() => ({
    strengths: data.strengths.map(() => 3),
    weaknesses: data.weaknesses.map(() => 3),
    opportunities: data.opportunities.map(() => 3),
    threats: data.threats.map(() => 3),
  }));

  const [expandedQuadrant, setExpandedQuadrant] = useState<QuadrantKey | null>(null);

  const setWeight = useCallback((quadrant: QuadrantKey, idx: number, value: number) => {
    setWeights(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].map((w, i) => (i === idx ? value : w)),
    }));
  }, []);

  const resetWeights = useCallback(() => {
    setWeights({
      strengths: data.strengths.map(() => 3),
      weaknesses: data.weaknesses.map(() => 3),
      opportunities: data.opportunities.map(() => 3),
      threats: data.threats.map(() => 3),
    });
  }, [data]);

  // Calculate weighted scores per quadrant and overall balance
  const scores = useMemo(() => {
    const quadrantScores: Record<QuadrantKey, number> = {
      strengths: 0,
      weaknesses: 0,
      opportunities: 0,
      threats: 0,
    };

    const keys: QuadrantKey[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];
    for (const key of keys) {
      const items = data[key];
      const w = weights[key];
      if (items.length === 0) continue;
      const totalWeight = w.reduce((sum, v) => sum + v, 0);
      quadrantScores[key] = totalWeight / items.length; // average weight (1-5)
    }

    // Balance: positive factors vs negative factors (normalized to -100..+100)
    const positiveScore =
      (quadrantScores.strengths + quadrantScores.opportunities) / 2;
    const negativeScore =
      (quadrantScores.weaknesses + quadrantScores.threats) / 2;
    // Map from [-4, +4] range to [-100, +100]
    const rawBalance = positiveScore - negativeScore; // -4 to +4
    const balanceScore = Math.round((rawBalance / 4) * 100);

    return { quadrantScores, balanceScore };
  }, [data, weights]);

  const balanceLabel =
    scores.balanceScore > 30
      ? 'Strongly Favorable'
      : scores.balanceScore > 10
        ? 'Favorable'
        : scores.balanceScore > -10
          ? 'Balanced'
          : scores.balanceScore > -30
            ? 'Unfavorable'
            : 'Strongly Unfavorable';

  const balanceColor =
    scores.balanceScore > 10
      ? 'text-emerald-400'
      : scores.balanceScore > -10
        ? 'text-yellow-400'
        : 'text-rose-400';

  const barWidth = Math.min(Math.abs(scores.balanceScore), 100);
  const barDirection = scores.balanceScore >= 0 ? 'right' : 'left';

  return (
    <div className="space-y-4">
      {/* Balance Score Banner */}
      <div className="p-4 border border-border bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-accent-primary" />
            <span className="text-sm font-semibold">SWOT Balance Score</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold tabular-nums ${balanceColor}`}>
              {scores.balanceScore > 0 ? '+' : ''}
              {scores.balanceScore}
            </span>
            <span className={`text-xs ${balanceColor}`}>{balanceLabel}</span>
            <button
              onClick={resetWeights}
              className="p-1 text-muted hover:text-foreground transition-colors"
              title="Reset all weights"
              aria-label="Reset all weights to default"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
        {/* Balance bar */}
        <div className="relative h-3 bg-muted/30 overflow-hidden">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/20" />
          {/* Score bar */}
          <div
            className="absolute top-0 bottom-0 transition-all duration-300"
            style={{
              width: `${barWidth / 2}%`,
              ...(barDirection === 'right'
                ? { left: '50%', background: 'linear-gradient(to right, transparent, rgba(52, 211, 153, 0.6))' }
                : { right: '50%', background: 'linear-gradient(to left, transparent, rgba(239, 68, 68, 0.6))' }),
            }}
          />
          {/* Labels */}
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-rose-400/60">
            Unfavorable
          </span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-emerald-400/60">
            Favorable
          </span>
        </div>
      </div>

      {/* Weighted Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.keys(QUADRANT_META) as QuadrantKey[]).map(key => {
          const meta = QUADRANT_META[key];
          const items = data[key];
          const isExpanded = expandedQuadrant === key;
          const avgWeight =
            items.length > 0
              ? (weights[key].reduce((a, b) => a + b, 0) / items.length).toFixed(1)
              : '0';

          return (
            <div key={key} className={`border border-border ${meta.bg} overflow-hidden`}>
              {/* Quadrant header */}
              <button
                onClick={() => setExpandedQuadrant(isExpanded ? null : key)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                  <span className="text-[10px] text-muted">({items.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">
                    Avg: <span className="font-semibold tabular-nums">{avgWeight}</span>/5
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-muted" />
                  ) : (
                    <ChevronDown size={14} className="text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded items with weight sliders */}
              {isExpanded && (
                <div className="border-t border-border/50 p-3 space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-black/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/80 leading-relaxed">{item}</p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={weights[key][i]}
                          onChange={e => setWeight(key, i, Number(e.target.value))}
                          className="w-16 h-1 accent-current"
                          style={{ accentColor: `var(--${key === 'strengths' ? 'success' : key === 'weaknesses' ? 'error' : key === 'opportunities' ? 'info' : 'warning'})` }}
                          aria-label={`Weight for: ${item.slice(0, 40)}`}
                        />
                        <span className="text-[9px] text-muted tabular-nums">
                          {weights[key][i]} — {WEIGHT_LABELS[weights[key][i]]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
