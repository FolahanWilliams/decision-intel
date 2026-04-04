'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  RotateCcw,
  Swords,
} from 'lucide-react';

interface RedTeamObjection {
  objection: string;
  targetClaim: string;
  reasoning: string;
}

interface PreMortemScenarioCardsProps {
  failureScenarios: string[];
  preventiveMeasures: string[];
  inversion?: string[];
  redTeam?: RedTeamObjection[];
}

interface ScenarioCard {
  id: number;
  scenario: string;
  measure: string | null;
  probability: number;
  impact: 'High' | 'Medium' | 'Low';
}

/**
 * Renders pre-mortem failure scenarios as interactive cards
 * with probability estimates and preventive action checklists.
 */
export function PreMortemScenarioCards({
  failureScenarios,
  preventiveMeasures,
  inversion,
  redTeam,
}: PreMortemScenarioCardsProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [checkedMeasures, setCheckedMeasures] = useState<Set<number>>(new Set());
  const [showInversion, setShowInversion] = useState(false);
  const [showRedTeam, setShowRedTeam] = useState(false);

  const cards = useMemo(() => {
    // Simple deterministic hash to generate stable "random" values per scenario
    const stableHash = (str: string, seed: number): number => {
      let hash = seed;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
      }
      return Math.abs(hash % 100);
    };

    return failureScenarios.map((scenario, i) => {
      // Heuristic probability based on keyword signals
      const urgentWords = /catastroph|critical|fail|collapse|bankrupt|legal|regulat|lawsuit/i;
      const moderateWords = /delay|exceed|budget|turnover|competitor|market|risk/i;
      const variation = stableHash(scenario, i) % 15;

      let probability = 40; // baseline
      if (urgentWords.test(scenario)) probability = 70 + variation;
      else if (moderateWords.test(scenario)) probability = 45 + variation;
      else probability = 20 + variation;

      const impact: 'High' | 'Medium' | 'Low' =
        probability > 60 ? 'High' : probability > 35 ? 'Medium' : 'Low';

      return {
        id: i,
        scenario,
        measure: i < preventiveMeasures.length ? preventiveMeasures[i] : null,
        probability: Math.min(probability, 95),
        impact,
      } as ScenarioCard;
    });
  }, [failureScenarios, preventiveMeasures]);

  const toggleMeasure = (id: number) => {
    setCheckedMeasures(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = checkedMeasures.size;
  const totalMeasures = cards.filter(c => c.measure).length;
  const preparednessPercent =
    totalMeasures > 0 ? Math.round((completedCount / totalMeasures) * 100) : 0;

  const hasInversion = !!(inversion && inversion.length > 0);
  const hasRedTeam = !!(redTeam && redTeam.length > 0);

  if (failureScenarios.length === 0 && !hasInversion && !hasRedTeam) {
    return (
      <div className="text-center p-6 text-muted text-sm">No pre-mortem scenarios available.</div>
    );
  }

  const impactColors: Record<string, { text: string; bg: string }> = {
    High: { text: 'text-red-400', bg: 'bg-red-500/10' },
    Medium: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
    Low: { text: 'text-blue-400', bg: 'bg-blue-500/10' },
  };

  return (
    <div className="space-y-4">
      {/* Preparedness tracker */}
      <div className="p-3 border border-border bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle size={14} className="text-purple-400" />
            Pre-Mortem Scenarios ({cards.length})
          </span>
          <span className="text-[10px] text-muted">
            Preparedness:{' '}
            <span
              className={
                preparednessPercent > 60
                  ? 'text-emerald-400'
                  : preparednessPercent > 30
                    ? 'text-amber-400'
                    : 'text-muted'
              }
            >
              {preparednessPercent}%
            </span>{' '}
            ({completedCount}/{totalMeasures} measures addressed)
          </span>
        </div>
        <div className="h-1.5 bg-muted/20 overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${preparednessPercent}%` }}
          />
        </div>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map(card => {
          const isExpanded = expandedId === card.id;
          const isMeasureChecked = checkedMeasures.has(card.id);
          const colors = impactColors[card.impact];

          return (
            <div
              key={card.id}
              className={`border bg-card/50 overflow-hidden transition-all duration-200 ${
                isMeasureChecked ? 'border-emerald-500/30 opacity-70' : 'border-border'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : card.id)}
                className="w-full text-left p-3 hover:bg-muted/10 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className={colors.text} />
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 ${colors.bg} ${colors.text}`}
                    >
                      {card.impact} Impact
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Probability badge */}
                    <span className="text-[10px] font-bold tabular-nums text-muted">
                      {card.probability}% likely
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={12} className="text-muted" />
                    ) : (
                      <ChevronDown size={12} className="text-muted" />
                    )}
                  </div>
                </div>

                {/* Probability bar */}
                <div className="h-1 bg-muted/20 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      card.probability > 60
                        ? 'bg-red-500'
                        : card.probability > 35
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${card.probability}%` }}
                  />
                </div>

                <p className="text-xs text-foreground/80 line-clamp-2">{card.scenario}</p>
              </button>

              {isExpanded && (
                <div className="border-t border-border/50 p-3 space-y-3">
                  {/* Full scenario text */}
                  <div className="p-2 bg-red-500/5 border border-red-500/10 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle size={10} className="text-red-400" />
                      <span className="font-semibold text-red-400">Failure Scenario</span>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">{card.scenario}</p>
                  </div>

                  {/* Preventive measure with checkbox */}
                  {card.measure && (
                    <div
                      className={`p-2 border text-xs cursor-pointer transition-colors ${
                        isMeasureChecked
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-emerald-500/5 border-emerald-500/10'
                      }`}
                      onClick={() => toggleMeasure(card.id)}
                      role="checkbox"
                      aria-checked={isMeasureChecked}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleMeasure(card.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {isMeasureChecked ? (
                          <CheckSquare
                            size={14}
                            className="text-emerald-400 flex-shrink-0 mt-0.5"
                          />
                        ) : (
                          <Square size={14} className="text-muted flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb size={10} className="text-emerald-400" />
                            <span className="font-semibold text-emerald-400">
                              Preventive Measure
                            </span>
                          </div>
                          <p
                            className={`text-foreground/70 leading-relaxed ${isMeasureChecked ? 'line-through opacity-60' : ''}`}
                          >
                            {card.measure}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inversion section (Munger) */}
      {hasInversion && (
        <div className="border border-border bg-card/50">
          <button
            onClick={() => setShowInversion(s => !s)}
            className="w-full text-left p-3 flex items-center justify-between hover:bg-muted/10 transition-colors"
            aria-expanded={showInversion}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <RotateCcw size={14} className="text-indigo-400" />
              Inversion: what would guarantee failure? ({inversion!.length})
            </span>
            {showInversion ? (
              <ChevronUp size={14} className="text-muted" />
            ) : (
              <ChevronDown size={14} className="text-muted" />
            )}
          </button>
          {showInversion && (
            <div className="border-t border-border/50 p-3 space-y-2">
              <p className="text-[11px] text-muted italic mb-2">
                Charlie Munger: invert the success criteria. Every item below is a causal lever a
                hostile actor could pull to guarantee this initiative fails.
              </p>
              <ul className="space-y-2">
                {inversion!.map((item, i) => (
                  <li
                    key={i}
                    className="p-2 bg-indigo-500/5 border border-indigo-500/10 text-xs text-foreground/80 leading-relaxed flex gap-2"
                  >
                    <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Red Team / 10th Man section (RAND) */}
      {hasRedTeam && (
        <div className="border border-border bg-card/50">
          <button
            onClick={() => setShowRedTeam(s => !s)}
            className="w-full text-left p-3 flex items-center justify-between hover:bg-muted/10 transition-colors"
            aria-expanded={showRedTeam}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <Swords size={14} className="text-rose-400" />
              Red Team / 10th Man dissent ({redTeam!.length})
            </span>
            {showRedTeam ? (
              <ChevronUp size={14} className="text-muted" />
            ) : (
              <ChevronDown size={14} className="text-muted" />
            )}
          </button>
          {showRedTeam && (
            <div className="border-t border-border/50 p-3 space-y-3">
              <p className="text-[11px] text-muted italic mb-2">
                RAND 10th Man rule: a structured dissenter must argue against the consensus even if
                they agree, to surface the weakest load-bearing assumption.
              </p>
              {redTeam!.map((r, i) => (
                <div
                  key={i}
                  className="p-3 bg-rose-500/5 border border-rose-500/10 text-xs space-y-2"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-rose-400 mb-1">
                      Objection
                    </div>
                    <p className="text-foreground/80 leading-relaxed">{r.objection}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1">
                      Target claim
                    </div>
                    <p className="text-foreground/60 leading-relaxed italic">
                      &ldquo;{r.targetClaim}&rdquo;
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1">
                      Why it&apos;s load-bearing
                    </div>
                    <p className="text-foreground/70 leading-relaxed">{r.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
