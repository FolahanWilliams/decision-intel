'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { BiasInstance } from '@/types';
import { AlertTriangle, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface DocumentTextHighlighterProps {
  content: string;
  biases: BiasInstance[];
  /** Called when user clicks a bias — parent can use for cross-tab linking */
  onBiasSelect?: (bias: BiasInstance) => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string; underline: string }> = {
  critical: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-400',
    underline: 'decoration-red-500',
  },
  high: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500',
    text: 'text-orange-400',
    underline: 'decoration-orange-500',
  },
  medium: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    underline: 'decoration-yellow-500',
  },
  low: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-400',
    underline: 'decoration-blue-500',
  },
};

function getSeverityColor(severity: string) {
  return SEVERITY_COLORS[severity.toLowerCase()] ?? SEVERITY_COLORS.low;
}

interface TextSegment {
  text: string;
  biasIndex: number | null; // index into the biases array
}

/**
 * Splits document content into segments, marking which portions match bias excerpts.
 * Uses case-insensitive substring matching with deduplication.
 */
function buildSegments(content: string, biases: BiasInstance[]): TextSegment[] {
  // Find all excerpt positions
  const matches: { start: number; end: number; biasIndex: number }[] = [];
  const lowerContent = content.toLowerCase();

  biases.forEach((bias, idx) => {
    if (!bias.excerpt) return;
    const lowerExcerpt = bias.excerpt.toLowerCase();
    const pos = lowerContent.indexOf(lowerExcerpt);
    if (pos !== -1) {
      matches.push({ start: pos, end: pos + bias.excerpt.length, biasIndex: idx });
    }
  });

  // Sort by position, resolve overlaps (earlier match wins)
  matches.sort((a, b) => a.start - b.start);
  const resolved: typeof matches = [];
  for (const m of matches) {
    const last = resolved[resolved.length - 1];
    if (!last || m.start >= last.end) {
      resolved.push(m);
    }
  }

  // Build segments
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const m of resolved) {
    if (cursor < m.start) {
      segments.push({ text: content.slice(cursor, m.start), biasIndex: null });
    }
    segments.push({ text: content.slice(m.start, m.end), biasIndex: m.biasIndex });
    cursor = m.end;
  }
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), biasIndex: null });
  }

  return segments;
}

export function DocumentTextHighlighter({
  content,
  biases,
  onBiasSelect,
}: DocumentTextHighlighterProps) {
  const [selectedBiasIdx, setSelectedBiasIdx] = useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const sidebarRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const highlightRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const segments = useMemo(() => buildSegments(content, biases), [content, biases]);

  const filteredBiasIndices = useMemo(() => {
    return biases
      .map((_, i) => i)
      .filter(i => !severityFilter || biases[i].severity.toLowerCase() === severityFilter);
  }, [biases, severityFilter]);

  const handleBiasClick = useCallback(
    (idx: number) => {
      setSelectedBiasIdx(prev => (prev === idx ? null : idx));
      // Scroll the highlighted text into view
      const el = highlightRefs.current.get(idx);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (onBiasSelect) {
        onBiasSelect(biases[idx]);
      }
    },
    [biases, onBiasSelect]
  );

  const handleHighlightClick = useCallback(
    (biasIndex: number) => {
      setSelectedBiasIdx(prev => (prev === biasIndex ? null : biasIndex));
      // Scroll sidebar item into view
      const el = sidebarRefs.current.get(biasIndex);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (onBiasSelect) {
        onBiasSelect(biases[biasIndex]);
      }
    },
    [biases, onBiasSelect]
  );

  // Keyboard: Escape to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBiasIdx(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!content || !biases.length) return null;

  const severities = ['critical', 'high', 'medium', 'low'];
  const severityCounts = severities.reduce(
    (acc, s) => {
      acc[s] = biases.filter(b => b.severity.toLowerCase() === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header pb-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            Document Bias Highlighter
          </h3>
          <div className="flex items-center gap-2">
            {/* Severity filter pills */}
            {severities.map(s => {
              const colors = getSeverityColor(s);
              const count = severityCounts[s];
              if (count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(prev => (prev === s ? null : s))}
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 border transition-all duration-150 ${
                    severityFilter === s
                      ? `${colors.bg} ${colors.text} ${colors.border} ring-1 ring-offset-1 ring-offset-transparent`
                      : `border-border text-muted hover:${colors.text}`
                  }`}
                  aria-pressed={severityFilter === s}
                >
                  {s} ({count})
                </button>
              );
            })}
            {/* Toggle highlights */}
            <button
              onClick={() => setShowHighlights(p => !p)}
              className="p-1 text-muted hover:text-foreground transition-colors"
              title={showHighlights ? 'Hide highlights' : 'Show highlights'}
              aria-label={showHighlights ? 'Hide highlights' : 'Show highlights'}
            >
              {showHighlights ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="card-body flex-1 flex gap-0 overflow-hidden" style={{ minHeight: '400px' }}>
        {/* Document text panel */}
        <div
          ref={textRef}
          className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed whitespace-pre-wrap font-serif bg-muted/20 border-r border-border"
          style={{ maxHeight: '500px' }}
          onClick={() => setSelectedBiasIdx(null)}
        >
          {segments.map((seg, i) => {
            if (seg.biasIndex === null) {
              return <span key={i}>{seg.text}</span>;
            }

            const bias = biases[seg.biasIndex];
            const colors = getSeverityColor(bias.severity);
            const isSelected = selectedBiasIdx === seg.biasIndex;
            const isFiltered =
              severityFilter && bias.severity.toLowerCase() !== severityFilter;
            const isVisible = showHighlights && !isFiltered;

            return (
              <span
                key={i}
                ref={el => {
                  if (el) highlightRefs.current.set(seg.biasIndex!, el);
                }}
                role="button"
                tabIndex={0}
                aria-label={`${bias.biasType} (${bias.severity})`}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isVisible
                    ? `underline decoration-2 ${colors.underline} ${colors.bg} ${
                        isSelected
                          ? `ring-2 ring-offset-1 ring-offset-transparent ${colors.border} ${colors.bg}`
                          : `hover:${colors.bg}`
                      }`
                    : ''
                }`}
                onClick={e => {
                  e.stopPropagation();
                  handleHighlightClick(seg.biasIndex!);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleHighlightClick(seg.biasIndex!);
                  }
                }}
              >
                {seg.text}
              </span>
            );
          })}
        </div>

        {/* Bias sidebar */}
        <div
          className="w-64 lg:w-72 overflow-y-auto flex-shrink-0 bg-secondary/30"
          style={{ maxHeight: '500px' }}
        >
          <div className="p-2 text-[10px] text-muted border-b border-border uppercase tracking-wider font-semibold">
            {filteredBiasIndices.length} bias{filteredBiasIndices.length !== 1 ? 'es' : ''} detected
          </div>
          {filteredBiasIndices.map(idx => {
            const bias = biases[idx];
            const colors = getSeverityColor(bias.severity);
            const isSelected = selectedBiasIdx === idx;

            return (
              <button
                key={idx}
                ref={el => {
                  if (el) sidebarRefs.current.set(idx, el);
                }}
                onClick={() => handleBiasClick(idx)}
                className={`w-full text-left p-3 border-b border-border transition-all duration-150 group ${
                  isSelected
                    ? `${colors.bg} border-l-2 ${colors.border}`
                    : 'hover:bg-muted/30 border-l-2 border-l-transparent'
                }`}
                aria-selected={isSelected}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${colors.bg} ${colors.text}`}
                  >
                    {bias.severity}
                  </span>
                  <ChevronRight
                    size={12}
                    className={`text-muted transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                  />
                </div>
                <p className="text-xs font-semibold text-foreground mb-1">{bias.biasType}</p>
                <p className="text-[11px] text-muted italic line-clamp-2">
                  &quot;{bias.excerpt}&quot;
                </p>

                {/* Expanded details */}
                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                    <p className="text-[11px] text-slate-400">{bias.explanation}</p>
                    <div className="p-2 bg-accent-primary/10 border border-accent-primary/20 text-[11px] text-accent-primary">
                      <span className="font-semibold block mb-0.5">Suggestion</span>
                      {bias.suggestion}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-2 text-center text-[10px] text-muted border-t border-border bg-secondary/20">
        Click highlighted text or sidebar items to link them &bull; Press Esc to deselect
      </div>
    </div>
  );
}
