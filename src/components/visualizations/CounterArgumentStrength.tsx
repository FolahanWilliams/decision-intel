'use client';

import { useState, useMemo } from 'react';
import { CognitiveAnalysisResult } from '@/types';
import { AlertTriangle, ExternalLink, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

interface CounterArgumentStrengthProps {
  counterArguments: CognitiveAnalysisResult['counterArguments'];
}

type SortField = 'confidence' | 'perspective';
type SortDir = 'asc' | 'desc';

/**
 * Horizontal bar meter for each counter-argument, sorted by strength.
 * Replaces the flat card list with a ranked, scannable view.
 */
export function CounterArgumentStrength({ counterArguments }: CounterArgumentStrengthProps) {
  const [sortField, setSortField] = useState<SortField>('confidence');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const sorted = useMemo(() => {
    const items = counterArguments.map((arg, i) => ({ ...arg, originalIdx: i }));
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'confidence') {
        cmp = a.confidence - b.confidence;
      } else {
        cmp = a.perspective.localeCompare(b.perspective);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return items;
  }, [counterArguments, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (counterArguments.length === 0) {
    return (
      <div className="text-center p-6 text-muted text-sm">No counter-arguments available.</div>
    );
  }

  const getBarColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-red-500';
    if (confidence >= 0.4) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getBarBg = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-red-500/10';
    if (confidence >= 0.4) return 'bg-amber-500/10';
    return 'bg-blue-500/10';
  };

  const getThreatLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'Critical Threat';
    if (confidence >= 0.4) return 'Moderate Threat';
    return 'Minor Threat';
  };

  return (
    <div className="space-y-3">
      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-sm font-semibold">
            Counter-Argument Strength ({counterArguments.length})
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-muted">Sort by:</span>
          <button
            onClick={() => toggleSort('confidence')}
            className={`px-2 py-0.5 border transition-colors flex items-center gap-1 ${
              sortField === 'confidence'
                ? 'border-accent-primary/30 text-accent-primary bg-accent-primary/10'
                : 'border-border text-muted hover:text-foreground'
            }`}
          >
            Strength
            {sortField === 'confidence' && (
              <ArrowUpDown size={8} className={sortDir === 'asc' ? 'rotate-180' : ''} />
            )}
          </button>
          <button
            onClick={() => toggleSort('perspective')}
            className={`px-2 py-0.5 border transition-colors flex items-center gap-1 ${
              sortField === 'perspective'
                ? 'border-accent-primary/30 text-accent-primary bg-accent-primary/10'
                : 'border-border text-muted hover:text-foreground'
            }`}
          >
            Name
            {sortField === 'perspective' && (
              <ArrowUpDown size={8} className={sortDir === 'asc' ? 'rotate-180' : ''} />
            )}
          </button>
        </div>
      </div>

      {/* Ranked list */}
      <div className="space-y-2">
        {sorted.map((arg, idx) => {
          const pct = Math.round(arg.confidence * 100);
          const isExpanded = expandedIdx === idx;

          return (
            <div key={arg.originalIdx} className="border border-border bg-card/50 overflow-hidden">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full text-left p-3 hover:bg-muted/10 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold tabular-nums text-muted w-5 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {arg.perspective}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 ${getBarBg(arg.confidence)} ${
                        arg.confidence >= 0.7
                          ? 'text-red-400'
                          : arg.confidence >= 0.4
                            ? 'text-amber-400'
                            : 'text-blue-400'
                      }`}
                    >
                      {getThreatLabel(arg.confidence)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={12} className="text-muted" />
                    ) : (
                      <ChevronDown size={12} className="text-muted" />
                    )}
                  </div>
                </div>
                {/* Strength bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted/20 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getBarColor(arg.confidence)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-muted w-8 text-right">
                    {pct}%
                  </span>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border/50 p-3 space-y-2">
                  <p className="text-xs text-foreground/80 leading-relaxed">{arg.argument}</p>
                  {arg.sourceUrl && (
                    <a
                      href={arg.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline"
                    >
                      View Source <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-2 bg-muted/10 border border-border/50 text-[10px] text-muted flex items-center justify-between">
        <span>
          {sorted.filter(a => a.confidence >= 0.7).length} critical ·{' '}
          {sorted.filter(a => a.confidence >= 0.4 && a.confidence < 0.7).length} moderate ·{' '}
          {sorted.filter(a => a.confidence < 0.4).length} minor
        </span>
        <span>
          Avg strength:{' '}
          {Math.round(
            (counterArguments.reduce((s, a) => s + a.confidence, 0) / counterArguments.length) * 100
          )}
          %
        </span>
      </div>
    </div>
  );
}
