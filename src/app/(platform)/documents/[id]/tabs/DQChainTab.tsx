'use client';

import type { DQChainSummary } from '@/types';
import { AlertTriangle, Link2, GraduationCap } from 'lucide-react';

interface DQChainTabProps {
  dqChain?: DQChainSummary;
}

/**
 * Decision Quality Chain tab — Howard & Matheson process-quality scorecard.
 * Renders the six chain elements as horizontal bars, highlights the weakest
 * link (which drives the chain score), and explains the rationale for each.
 */
export function DQChainTab({ dqChain }: DQChainTabProps) {
  if (!dqChain || !dqChain.elements || dqChain.elements.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted text-sm">
          Decision Quality Chain is not available for this analysis.
        </div>
      </div>
    );
  }

  const { elements, chainScore, weakestLink, summary } = dqChain;

  const grade =
    chainScore >= 80 ? 'A' : chainScore >= 65 ? 'B' : chainScore >= 50 ? 'C' : chainScore >= 35 ? 'D' : 'F';
  const gradeColor =
    chainScore >= 80
      ? 'text-emerald-400'
      : chainScore >= 65
        ? 'text-blue-400'
        : chainScore >= 50
          ? 'text-amber-400'
          : chainScore >= 35
            ? 'text-orange-400'
            : 'text-red-400';

  const barColor = (score: number): string =>
    score >= 80
      ? 'bg-emerald-500'
      : score >= 65
        ? 'bg-blue-500'
        : score >= 50
          ? 'bg-amber-500'
          : score >= 35
            ? 'bg-orange-500'
            : 'bg-red-500';

  return (
    <div className="space-y-4">
      {/* Header card with chain score */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={16} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  Howard &amp; Matheson Decision Quality Chain
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Process Quality Scorecard</h3>
              <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
                A chain is only as strong as its weakest link. The chain score is the minimum
                across the six elements, because in practice the weakest link sinks the decision
                no matter how strong the others are.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-4xl font-bold tabular-nums ${gradeColor}`}>{chainScore}</div>
              <div className={`text-xs font-bold ${gradeColor}`}>Grade {grade}</div>
            </div>
          </div>
          <div className="p-3 border border-indigo-500/20 bg-indigo-500/5 text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
            <Link2 size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>{summary}</span>
          </div>
        </div>
      </div>

      {/* Six elements */}
      <div className="card">
        <div className="card-body space-y-4">
          {elements.map(el => {
            const isWeakest = el.id === weakestLink;
            return (
              <div
                key={el.id}
                className={`p-3 border ${
                  isWeakest ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{el.label}</span>
                    {isWeakest && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-400">
                        <AlertTriangle size={10} />
                        Weakest link
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {el.score}
                  </span>
                </div>
                <div className="h-2 bg-muted/20 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-500 ${barColor(el.score)}`}
                    style={{ width: `${el.score}%` }}
                  />
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed mb-2">{el.rationale}</p>
                {el.inputs.length > 0 && (
                  <div className="text-[10px] text-muted">
                    <span className="font-semibold">Inputs:</span> {el.inputs.join(' \u00b7 ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footnote */}
      <div className="text-[10px] text-muted text-center leading-relaxed">
        Framework: Ronald Howard &amp; James Matheson, Stanford Strategic Decisions Group. DQI
        scores the output of a decision. The DQ Chain scores the process that produced it.
      </div>
    </div>
  );
}
