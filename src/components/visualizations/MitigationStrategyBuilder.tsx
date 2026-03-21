'use client';

import { useState, useMemo, useCallback } from 'react';
import { CognitiveAnalysisResult } from '@/types';
import { Shield, CheckCircle, Circle, TrendingUp } from 'lucide-react';

interface MitigationStrategyBuilderProps {
  blindSpots: CognitiveAnalysisResult['blindSpots'];
  blindSpotGap: number;
}

interface Strategy {
  id: string;
  blindSpotIdx: number;
  label: string;
  description: string;
  effort: 'Low' | 'Medium' | 'High';
  impact: number; // 1-5 impact on diversity score
}

const EFFORT_STYLES: Record<string, { text: string; bg: string }> = {
  Low: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  Medium: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
  High: { text: 'text-rose-400', bg: 'bg-rose-500/10' },
};

/**
 * Generates mitigation strategies for each blind spot and lets users
 * select which ones to apply. Shows projected diversity score improvement.
 */
export function MitigationStrategyBuilder({
  blindSpots,
  blindSpotGap,
}: MitigationStrategyBuilderProps) {
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());

  // Generate strategies for each blind spot
  const strategies = useMemo(() => {
    const result: Strategy[] = [];

    blindSpots.forEach((spot, idx) => {
      const name = spot.name.toLowerCase();

      // Strategy templates based on common blind spot patterns
      const templates: Array<{ label: string; description: string; effort: 'Low' | 'Medium' | 'High'; impact: number }> = [];

      // Always generate a "seek external perspective" strategy
      templates.push({
        label: 'Seek External Perspective',
        description: `Consult with a domain expert or external advisor who specializes in ${spot.name.toLowerCase()} to identify overlooked aspects.`,
        effort: 'Medium',
        impact: 3,
      });

      // Generate a data-driven strategy
      if (/stakeholder|customer|user|employee|partner/i.test(name + spot.description)) {
        templates.push({
          label: 'Conduct Stakeholder Analysis',
          description: `Map all affected stakeholders related to "${spot.name}" and gather their perspectives through interviews or surveys.`,
          effort: 'High',
          impact: 4,
        });
      } else if (/risk|threat|vulnerab|secur/i.test(name + spot.description)) {
        templates.push({
          label: 'Run Risk Assessment Workshop',
          description: `Organize a structured risk assessment session specifically targeting "${spot.name}" to uncover hidden vulnerabilities.`,
          effort: 'High',
          impact: 5,
        });
      } else if (/market|competitor|industry|trend/i.test(name + spot.description)) {
        templates.push({
          label: 'Commission Market Research',
          description: `Gather competitive intelligence and market data to address the "${spot.name}" gap in the analysis.`,
          effort: 'Medium',
          impact: 4,
        });
      } else {
        templates.push({
          label: 'Conduct Literature Review',
          description: `Research academic and industry publications addressing "${spot.name}" to build a knowledge base.`,
          effort: 'Low',
          impact: 3,
        });
      }

      // Quick-win strategy
      templates.push({
        label: 'Add Checklist Item',
        description: `Add "${spot.name}" as a mandatory review item in the decision-making checklist to ensure it is considered in future analyses.`,
        effort: 'Low',
        impact: 2,
      });

      templates.forEach((t, ti) => {
        result.push({
          id: `${idx}-${ti}`,
          blindSpotIdx: idx,
          ...t,
        });
      });
    });

    return result;
  }, [blindSpots]);

  const toggleStrategy = useCallback((id: string) => {
    setSelectedStrategies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Calculate projected score improvement
  const projectedImprovement = useMemo(() => {
    let totalImpact = 0;
    for (const id of selectedStrategies) {
      const strategy = strategies.find(s => s.id === id);
      if (strategy) totalImpact += strategy.impact;
    }
    // Each impact point adds ~3 points to the diversity score, capped at 100
    return Math.min(totalImpact * 3, 100 - blindSpotGap);
  }, [selectedStrategies, strategies, blindSpotGap]);

  const projectedScore = Math.min(blindSpotGap + projectedImprovement, 100);

  if (blindSpots.length === 0) {
    return (
      <div className="text-center p-6 text-muted text-sm">No blind spots to mitigate.</div>
    );
  }

  // Group strategies by blind spot
  const grouped = new Map<number, Strategy[]>();
  for (const s of strategies) {
    if (!grouped.has(s.blindSpotIdx)) grouped.set(s.blindSpotIdx, []);
    grouped.get(s.blindSpotIdx)!.push(s);
  }

  const scoreColor = (score: number) =>
    score < 50 ? 'text-red-400' : score < 80 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-4">
      {/* Projected score banner */}
      <div className="p-4 border border-border bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent-primary" />
            <span className="text-sm font-semibold">Mitigation Strategy Builder</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted">
              Current: <span className={`font-bold ${scoreColor(blindSpotGap)}`}>{blindSpotGap}</span>
            </span>
            {projectedImprovement > 0 && (
              <>
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-muted">
                  Projected: <span className={`font-bold ${scoreColor(projectedScore)}`}>{projectedScore}</span>
                  <span className="text-emerald-400 ml-1">(+{projectedImprovement})</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Score comparison bar */}
        <div className="relative h-3 bg-muted/20 overflow-hidden">
          {/* Current score */}
          <div
            className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${
              blindSpotGap < 50 ? 'bg-red-500/40' : blindSpotGap < 80 ? 'bg-amber-500/40' : 'bg-emerald-500/40'
            }`}
            style={{ width: `${blindSpotGap}%` }}
          />
          {/* Projected improvement overlay */}
          {projectedImprovement > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-emerald-400/30 border-r-2 border-emerald-400 transition-all duration-300"
              style={{
                left: `${blindSpotGap}%`,
                width: `${projectedImprovement}%`,
              }}
            />
          )}
          {/* Labels */}
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] text-foreground/50">0</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-foreground/50">100</span>
        </div>

        <p className="text-[10px] text-muted mt-2">
          Select mitigation strategies below to see projected diversity score improvement.
          {selectedStrategies.size > 0 && ` ${selectedStrategies.size} selected.`}
        </p>
      </div>

      {/* Strategies grouped by blind spot */}
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([bsIdx, groupStrategies]) => (
          <div key={bsIdx} className="border border-border bg-card/50">
            <div className="p-3 border-b border-border/50 bg-orange-500/5">
              <span className="text-xs font-semibold text-orange-400">
                {blindSpots[bsIdx].name}
              </span>
              <p className="text-[10px] text-muted mt-0.5">
                {blindSpots[bsIdx].description}
              </p>
            </div>
            <div className="p-2 space-y-1">
              {groupStrategies.map(strategy => {
                const isSelected = selectedStrategies.has(strategy.id);
                const effortStyle = EFFORT_STYLES[strategy.effort];

                return (
                  <button
                    key={strategy.id}
                    onClick={() => toggleStrategy(strategy.id)}
                    className={`w-full text-left p-2 flex items-start gap-2 transition-all duration-150 ${
                      isSelected
                        ? 'bg-accent-primary/10 border border-accent-primary/20'
                        : 'hover:bg-muted/10 border border-transparent'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? (
                      <CheckCircle size={14} className="text-accent-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={14} className="text-muted flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">
                          {strategy.label}
                        </span>
                        <span className={`text-[9px] font-bold px-1 py-0 ${effortStyle.bg} ${effortStyle.text}`}>
                          {strategy.effort}
                        </span>
                        <span className="text-[9px] text-muted tabular-nums">
                          +{strategy.impact * 3} pts
                        </span>
                      </div>
                      <p className="text-[10px] text-muted leading-relaxed">{strategy.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
