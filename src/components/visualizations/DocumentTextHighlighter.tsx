'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { BiasInstance } from '@/types';
import { AlertTriangle, ChevronRight, Eye, EyeOff, Search } from 'lucide-react';
import { getBiasDisplayName } from '@/lib/utils/bias-normalize';
import { getBiasColor, resetBiasColors, type BiasColorSet } from '@/lib/utils/bias-colors';

interface DocumentTextHighlighterProps {
  content: string;
  biases: BiasInstance[];
  /** Called when user clicks a bias — parent can use for cross-tab linking */
  onBiasSelect?: (bias: BiasInstance) => void;
  /** Start in detective mode (color-coded by bias type, not severity) */
  defaultDetectiveMode?: boolean;
}

const SEVERITY_COLORS: Record<
  string,
  { bg: string; border: string; text: string; underline: string }
> = {
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
  defaultDetectiveMode = false,
}: DocumentTextHighlighterProps) {
  const [selectedBiasIdx, setSelectedBiasIdx] = useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [detectiveMode, setDetectiveMode] = useState(defaultDetectiveMode);
  const [biasTypeFilter, setBiasTypeFilter] = useState<string | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const sidebarRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const highlightRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Assign colors to each unique bias type for detective mode
  const biasTypeColors = useMemo(() => {
    resetBiasColors();
    const uniqueTypes = Array.from(new Set(biases.map(b => b.biasType)));
    const map = new Map<string, BiasColorSet>();
    for (const t of uniqueTypes) {
      map.set(t, getBiasColor(t));
    }
    return map;
  }, [biases]);

  const uniqueBiasTypes = useMemo(
    () => Array.from(new Set(biases.map(b => b.biasType))),
    [biases]
  );

  const segments = useMemo(() => buildSegments(content, biases), [content, biases]);

  const filteredBiasIndices = useMemo(() => {
    return biases
      .map((_, i) => i)
      .filter(i => {
        if (detectiveMode) {
          return !biasTypeFilter || biases[i].biasType === biasTypeFilter;
        }
        return !severityFilter || biases[i].severity.toLowerCase() === severityFilter;
      });
  }, [biases, severityFilter, detectiveMode, biasTypeFilter]);

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

  // Keyboard: Escape to deselect, D to toggle detective mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBiasIdx(null);
      if (e.key === 'd' || e.key === 'D') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        setDetectiveMode(prev => !prev);
      }
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
          <div className="flex items-center gap-2 flex-wrap">
            {detectiveMode ? (
              /* Bias-type filter pills in detective mode */
              <>
                {uniqueBiasTypes.map(biasType => {
                  const color = biasTypeColors.get(biasType);
                  const count = biases.filter(b => b.biasType === biasType).length;
                  return (
                    <button
                      key={biasType}
                      onClick={() => setBiasTypeFilter(prev => (prev === biasType ? null : biasType))}
                      className="text-[10px] font-semibold px-2 py-0.5 border rounded-full transition-all duration-150"
                      style={{
                        backgroundColor: biasTypeFilter === biasType ? color?.bg : 'transparent',
                        color: color?.text ?? '#a1a1aa',
                        borderColor: biasTypeFilter === biasType ? color?.border : 'var(--border)',
                      }}
                      aria-pressed={biasTypeFilter === biasType}
                    >
                      {getBiasDisplayName(biasType)} ({count})
                    </button>
                  );
                })}
              </>
            ) : (
              /* Severity filter pills in normal mode */
              <>
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
              </>
            )}
            {/* Detective mode toggle */}
            <button
              onClick={() => {
                setDetectiveMode(p => !p);
                setBiasTypeFilter(null);
                setSeverityFilter(null);
              }}
              className={`p-1 transition-colors rounded ${
                detectiveMode
                  ? 'text-purple-400 bg-purple-500/15'
                  : 'text-muted hover:text-foreground'
              }`}
              title={detectiveMode ? 'Exit Detective Mode (D)' : 'Enter Detective Mode (D)'}
              aria-label={detectiveMode ? 'Exit Detective Mode' : 'Enter Detective Mode'}
              aria-pressed={detectiveMode}
            >
              <Search size={14} />
            </button>
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

      <div
        className="card-body flex-1 flex flex-col md:flex-row gap-0 overflow-hidden"
        style={{ minHeight: '300px' }}
      >
        {/* Document text panel */}
        <div
          ref={textRef}
          className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed whitespace-pre-wrap font-serif bg-muted/20 md:border-r border-b md:border-b-0 border-border"
          style={{ maxHeight: '500px' }}
          onClick={() => setSelectedBiasIdx(null)}
        >
          {segments.map((seg, i) => {
            if (seg.biasIndex === null) {
              return (
                <span
                  key={i}
                  style={detectiveMode && showHighlights ? { opacity: 0.55 } : undefined}
                >
                  {seg.text}
                </span>
              );
            }

            const bias = biases[seg.biasIndex];
            const isSelected = selectedBiasIdx === seg.biasIndex;

            if (detectiveMode) {
              // Detective mode: color by bias type with inline labels
              const typeColor = biasTypeColors.get(bias.biasType);
              const isTypeFiltered = biasTypeFilter && bias.biasType !== biasTypeFilter;
              const isVisible = showHighlights && !isTypeFiltered;

              return (
                <span
                  key={i}
                  ref={el => {
                    if (el) highlightRefs.current.set(seg.biasIndex!, el);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${getBiasDisplayName(bias.biasType)} (${bias.severity})`}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    isVisible ? 'underline decoration-2' : ''
                  }`}
                  style={isVisible ? {
                    backgroundColor: typeColor?.bg,
                    textDecorationColor: typeColor?.underline,
                    ...(isSelected ? {
                      outline: `2px solid ${typeColor?.border}`,
                      outlineOffset: '1px',
                    } : {}),
                  } : { opacity: 0.55 }}
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
                  {/* Floating bias type label */}
                  {isVisible && (
                    <span
                      className="absolute -top-5 left-0 text-[9px] font-bold px-1 py-px rounded whitespace-nowrap pointer-events-none z-10"
                      style={{
                        backgroundColor: typeColor?.border,
                        color: '#fff',
                      }}
                    >
                      {getBiasDisplayName(bias.biasType)}
                    </span>
                  )}
                  {seg.text}
                </span>
              );
            }

            // Normal mode: color by severity
            const colors = getSeverityColor(bias.severity);
            const isFiltered = severityFilter && bias.severity.toLowerCase() !== severityFilter;
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
          className="w-full md:w-64 lg:w-72 overflow-y-auto flex-shrink-0 bg-secondary/30"
          style={{ maxHeight: '500px' }}
        >
          <div className="p-2 text-[10px] text-muted border-b border-border uppercase tracking-wider font-semibold">
            {filteredBiasIndices.length} bias{filteredBiasIndices.length !== 1 ? 'es' : ''} detected
          </div>
          {filteredBiasIndices.map(idx => {
            const bias = biases[idx];
            const isSelected = selectedBiasIdx === idx;

            if (detectiveMode) {
              // Detective mode sidebar: colored by bias type
              const typeColor = biasTypeColors.get(bias.biasType);
              return (
                <button
                  key={idx}
                  ref={el => {
                    if (el) sidebarRefs.current.set(idx, el);
                  }}
                  onClick={() => handleBiasClick(idx)}
                  className={`w-full text-left p-3 border-b border-border transition-all duration-150 group border-l-2`}
                  style={{
                    backgroundColor: isSelected ? typeColor?.bg : undefined,
                    borderLeftColor: isSelected ? typeColor?.border ?? 'transparent' : 'transparent',
                  }}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: typeColor?.bg,
                        color: typeColor?.text,
                      }}
                    >
                      {getBiasDisplayName(bias.biasType)}
                    </span>
                    <ChevronRight
                      size={12}
                      className={`text-muted transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                    />
                  </div>
                  <p className="text-[11px] text-muted italic line-clamp-2">
                    &quot;{bias.excerpt}&quot;
                  </p>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                      <p className="text-[11px] text-muted">{bias.explanation}</p>
                      <div className="p-2 bg-accent-primary/10 border border-accent-primary/20 text-[11px] text-accent-primary">
                        <span className="font-semibold block mb-0.5">Suggestion</span>
                        {bias.suggestion}
                      </div>
                    </div>
                  )}
                </button>
              );
            }

            // Normal mode sidebar
            const colors = getSeverityColor(bias.severity);

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
                aria-pressed={isSelected}
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
                    <p className="text-[11px] text-muted">{bias.explanation}</p>
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
        Click highlighted text or sidebar items to link them &bull; Press Esc to deselect &bull; Press D for{' '}
        {detectiveMode ? 'normal mode' : 'detective mode'}
      </div>
    </div>
  );
}
