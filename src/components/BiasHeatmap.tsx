'use client';

import { useState } from 'react';
import { formatBiasName } from '@/lib/utils/labels';

interface Bias {
  biasType: string;
  severity: string;
  excerpt: string;
  explanation: string;
  suggestion: string;
}

interface BiasHeatmapProps {
  content: string;
  biases: Bias[];
}

export function BiasHeatmap({ content, biases }: BiasHeatmapProps) {
  const [selectedBiasIndex, setSelectedBiasIndex] = useState<number | null>(null);

  // Click outside handler could be added here for polish, but for now simple toggle is fine

  if (!content || !biases) return null;

  // Map severity to colors
  const getSeverityColor = (severity: string, isSelected: boolean) => {
    const base = isSelected ? 'ring-2 ring-offset-1 ring-offset-accents-2' : '';
    switch (severity.toLowerCase()) {
      case 'critical':
        return `${base} bg-error/30 hover:bg-error/50 border-b-2 border-error cursor-help`;
      case 'high':
        return `${base} bg-accent-primary/30 hover:bg-accent-primary/50 border-b-2 border-accent-primary cursor-help`;
      case 'medium':
        return `${base} bg-warning/30 hover:bg-warning/50 border-b-2 border-warning cursor-help`;
      default:
        return `${base} bg-info/30 hover:bg-info/50 border-b-2 border-info cursor-help`;
    }
  };

  // Construct text segments
  let parts: { text: string; bias?: Bias }[] = [{ text: content }];
  biases.forEach(bias => {
    if (!bias.excerpt) return;
    const newParts: { text: string; bias?: Bias }[] = [];
    parts.forEach(part => {
      if (part.bias) {
        newParts.push(part);
      } else {
        const split = part.text.split(bias.excerpt);
        if (split.length > 1) {
          split.forEach((fragment, i) => {
            if (fragment) newParts.push({ text: fragment });
            if (i < split.length - 1) {
              newParts.push({ text: bias.excerpt, bias: bias });
            }
          });
        } else {
          newParts.push(part);
        }
      }
    });
    parts = newParts;
  });

  return (
    <div className="card liquid-glass-textured liquid-glass-shimmer h-full border-l-4 border-l-accent-primary  flex flex-col">
      <div className="card-header pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">🔥</span> Cognitive Bias Heatmap
          </h3>
          <div className="flex gap-2">
            <span className="badge badge-error bg-error/10 text-error border-error/30">
              Critical
            </span>
            <span className="badge badge-warning bg-accent-primary/10 text-accent-primary border-accent-primary/30">
              High
            </span>
            <span className="badge badge-warning bg-warning/10 text-warning border-warning/30">
              Med
            </span>
          </div>
        </div>
      </div>
      <div className="card-body flex-1 overflow-y-auto" style={{ maxHeight: '420px' }}>
        <div
          className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-serif p-4 bg-muted/30  relative"
          onClick={() => setSelectedBiasIndex(null)} // Click background to deselect
        >
          {parts.map((part, i) =>
            part.bias ? (
              <div
                key={i}
                className="group inline relative"
                role="button"
                tabIndex={0}
                aria-label={`${part.bias.biasType} bias (${part.bias.severity})`}
                aria-expanded={selectedBiasIndex === i}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedBiasIndex(selectedBiasIndex === i ? null : i);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedBiasIndex(selectedBiasIndex === i ? null : i);
                  }
                }}
              >
                <span
                  className={`px-0.5  transition-all duration-200 ${getSeverityColor(part.bias.severity, selectedBiasIndex === i)}`}
                >
                  {part.text}
                </span>

                {/* Tooltip - Visible on Hover OR Selection */}
                <div
                  className={`
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 
                                    bg-secondary text-foreground text-xs                                      transition-all duration-200 pointer-events-none z-50  border border-white/10
                                    ${selectedBiasIndex === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
                                `}
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                    <p className="font-bold text-warning text-sm">{formatBiasName(part.bias.biasType)}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold
                                            ${
                                              part.bias.severity === 'critical'
                                                ? 'bg-error/20 text-error'
                                                : part.bias.severity === 'high'
                                                  ? 'bg-accent-primary/20 text-accent-primary'
                                                  : 'bg-warning/20 text-warning'
                                            }`}
                    >
                      {part.bias.severity}
                    </span>
                  </div>
                  <p className="text-muted mb-3 italic">&quot;{part.bias.excerpt}&quot;</p>
                  <p className="text-muted mb-3">{part.bias.explanation}</p>
                  <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 ">
                    <span className="font-semibold text-accent-primary block mb-1 flex items-center gap-1">
                      <span>💡</span> Suggestion
                    </span>
                    {part.bias.suggestion}
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-secondary"></div>
                </div>
              </div>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )}
        </div>
      </div>

      {/* Mobile Hint */}
      <div className="p-2 text-center text-[10px] text-muted border-t border-border bg-secondary/20">
        Tap highlighted text to pin details
      </div>
    </div>
  );
}
