'use client';

import { useMemo, useState } from 'react';
import { SwotAnalysisResult } from '@/types';
import { Sparkles, ChevronDown, ChevronUp, Target, Clock, Users } from 'lucide-react';

interface StrategicActionCardsProps {
  data: SwotAnalysisResult;
}

interface ActionCard {
  id: string;
  strength: string;
  opportunity: string;
  recommendation: string;
  confidence: number;
  timeline: string;
  effort: 'Low' | 'Medium' | 'High';
}

/**
 * For each Strength × Opportunity pair, generates an actionable recommendation
 * card with confidence score, timeline estimate, and effort level.
 * Uses keyword-overlap heuristics to identify the most relevant pairings.
 */
export function StrategicActionCards({ data }: StrategicActionCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const actionCards = useMemo(() => {
    const cards: ActionCard[] = [];

    data.strengths.forEach((strength, si) => {
      data.opportunities.forEach((opportunity, oi) => {
        // Calculate relevance via keyword overlap
        const sWords = new Set(
          strength
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
        );
        const oWords = opportunity
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 3);
        const overlap = oWords.filter(w => sWords.has(w)).length;
        const totalWords = new Set([...sWords, ...oWords]).size;
        const relevance = totalWords > 0 ? overlap / totalWords : 0;

        // Confidence based on specificity of both items
        const specificityScore = Math.min((strength.length + opportunity.length) / 200, 1);
        const confidence = Math.round(Math.min(relevance * 60 + specificityScore * 30 + 20, 95));

        // Timeline heuristic
        const urgentKeywords = /immediate|urgent|now|quick|fast|rapid/i;
        const longTermKeywords = /long.?term|future|eventual|gradual|strategic/i;
        const timeline = urgentKeywords.test(strength + opportunity)
          ? '1-3 months'
          : longTermKeywords.test(strength + opportunity)
            ? '12-18 months'
            : '3-6 months';

        // Effort heuristic based on opportunity complexity
        const effort: 'Low' | 'Medium' | 'High' =
          opportunity.length > 100 || /complex|significant|major|transform/i.test(opportunity)
            ? 'High'
            : opportunity.length > 50
              ? 'Medium'
              : 'Low';

        // Generate recommendation text
        const recommendation = `Leverage "${strength.slice(0, 60)}${strength.length > 60 ? '…' : ''}" to capitalize on "${opportunity.slice(0, 60)}${opportunity.length > 60 ? '…' : ''}". ${
          relevance > 0.1
            ? 'These items share thematic alignment, suggesting a natural strategic fit.'
            : 'While not directly overlapping, combining these could create a differentiated advantage.'
        }`;

        cards.push({
          id: `${si}-${oi}`,
          strength,
          opportunity,
          recommendation,
          confidence,
          timeline,
          effort,
        });
      });
    });

    // Sort by confidence (highest first), take top pairs
    return cards.sort((a, b) => b.confidence - a.confidence);
  }, [data]);

  if (data.strengths.length === 0 || data.opportunities.length === 0) {
    return (
      <div className="text-center p-6 text-muted text-sm">
        Need both strengths and opportunities for strategic action cards.
      </div>
    );
  }

  const visibleCards = showAll ? actionCards : actionCards.slice(0, 4);

  const effortColors: Record<string, string> = {
    Low: 'text-emerald-400 bg-emerald-500/10',
    Medium: 'text-yellow-400 bg-yellow-500/10',
    High: 'text-rose-400 bg-rose-500/10',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent-primary" />
          <span className="text-sm font-semibold">Strategic Action Cards</span>
          <span className="text-[10px] text-muted">
            ({actionCards.length} S×O pair{actionCards.length !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleCards.map(card => {
          const isExpanded = expandedId === card.id;

          return (
            <div
              key={card.id}
              className={`border border-border bg-card/50 overflow-hidden transition-all duration-200 ${
                isExpanded ? 'ring-1 ring-accent-primary/30' : ''
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : card.id)}
                className="w-full text-left p-3 hover:bg-muted/10 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  {/* Confidence badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 tabular-nums ${
                        card.confidence >= 60
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : card.confidence >= 40
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-muted/30 text-muted'
                      }`}
                    >
                      {card.confidence}%
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 ${effortColors[card.effort]}`}>
                      {card.effort} effort
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-muted flex-shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-muted flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-foreground/80 line-clamp-2">{card.recommendation}</p>
              </button>

              {isExpanded && (
                <div className="border-t border-border/50 p-3 space-y-3">
                  {/* Strength source */}
                  <div className="p-2 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Target size={10} className="text-emerald-400" />
                      <span className="font-semibold text-emerald-400">Strength</span>
                    </div>
                    <p className="text-foreground/70">{card.strength}</p>
                  </div>

                  {/* Opportunity source */}
                  <div className="p-2 bg-blue-500/5 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles size={10} className="text-blue-400" />
                      <span className="font-semibold text-blue-400">Opportunity</span>
                    </div>
                    <p className="text-foreground/70">{card.opportunity}</p>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {card.timeline}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {card.effort} resource investment
                    </span>
                  </div>

                  {/* Confidence bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-muted mb-1">
                      <span>Confidence</span>
                      <span className="tabular-nums">{card.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-muted/20 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          card.confidence >= 60
                            ? 'bg-emerald-400'
                            : card.confidence >= 40
                              ? 'bg-yellow-400'
                              : 'bg-muted'
                        }`}
                        style={{ width: `${card.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actionCards.length > 4 && (
        <button
          onClick={() => setShowAll(p => !p)}
          className="w-full text-center text-xs text-accent-primary hover:text-accent-primary/80 py-2 border border-border/50 hover:bg-muted/10 transition-colors"
        >
          {showAll ? `Show top 4 cards` : `Show all ${actionCards.length} action cards`}
        </button>
      )}
    </div>
  );
}
