'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { BiasInstance } from '@/types';
import {
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Search,
  Maximize2,
  Minimize2,
  BarChart3,
} from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';
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

const SEVERITY_HEX: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function getSeverityColor(severity: string) {
  return SEVERITY_COLORS[severity.toLowerCase()] ?? SEVERITY_COLORS.low;
}

function getConfidenceOpacity(confidence: number | null | undefined): number {
  if (confidence == null) return 1;
  if (confidence >= 0.8) return 1;
  if (confidence >= 0.5) return 0.7;
  return 0.4;
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

interface HeatMapBin {
  index: number;
  biasCount: number;
  maxSeverity: string;
  biasIndices: number[];
}

/**
 * Builds heat map data by dividing document into bins and counting bias density per bin.
 */
function buildHeatMapData(
  content: string,
  biases: BiasInstance[],
  binCount: number = 50
): HeatMapBin[] {
  const totalLen = content.length;
  if (totalLen === 0) return [];

  const binSize = Math.max(1, Math.ceil(totalLen / binCount));
  const lowerContent = content.toLowerCase();
  const bins: HeatMapBin[] = Array.from({ length: binCount }, (_, i) => ({
    index: i,
    biasCount: 0,
    maxSeverity: '',
    biasIndices: [],
  }));

  biases.forEach((bias, idx) => {
    if (!bias.excerpt) return;
    const pos = lowerContent.indexOf(bias.excerpt.toLowerCase());
    if (pos === -1) return;
    const binIdx = Math.min(Math.floor(pos / binSize), binCount - 1);
    bins[binIdx].biasCount++;
    bins[binIdx].biasIndices.push(idx);
    const sev = bias.severity.toLowerCase();
    if ((SEVERITY_RANK[sev] ?? 0) > (SEVERITY_RANK[bins[binIdx].maxSeverity] ?? 0)) {
      bins[binIdx].maxSeverity = sev;
    }
  });

  return bins;
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
  const [expanded, setExpanded] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [hoveredBiasIdx, setHoveredBiasIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const sidebarRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const highlightRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

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

  const uniqueBiasTypes = useMemo(() => Array.from(new Set(biases.map(b => b.biasType))), [biases]);

  const segments = useMemo(() => buildSegments(content, biases), [content, biases]);

  const heatMapData = useMemo(() => buildHeatMapData(content, biases), [content, biases]);

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

  const handleHighlightHover = useCallback(
    (biasIndex: number, e: React.MouseEvent) => {
      if (selectedBiasIdx !== null) return; // no tooltip when a bias is selected
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      setHoveredBiasIdx(biasIndex);
    },
    [selectedBiasIdx]
  );

  const handleHighlightLeave = useCallback(() => {
    setHoveredBiasIdx(null);
  }, []);

  // Click on heat map bin to scroll to that region of the document
  const handleHeatMapClick = useCallback((binIndex: number, binCount: number) => {
    if (!textRef.current) return;
    const scrollFraction = binIndex / binCount;
    const scrollTarget = textRef.current.scrollHeight * scrollFraction;
    textRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, []);

  // Keyboard: Escape to deselect, D to toggle detective mode, H for heat map, arrows for cycling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;

      if (e.key === 'Escape') setSelectedBiasIdx(null);
      if (e.key === 'd' || e.key === 'D') {
        setDetectiveMode(prev => !prev);
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowHeatMap(prev => !prev);
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (filteredBiasIndices.length === 0) return;
        setSelectedBiasIdx(prev => {
          if (prev === null) return filteredBiasIndices[0];
          const currentPos = filteredBiasIndices.indexOf(prev);
          if (currentPos === -1) return filteredBiasIndices[0];
          const next =
            e.key === 'ArrowRight'
              ? filteredBiasIndices[(currentPos + 1) % filteredBiasIndices.length]
              : filteredBiasIndices[
                  (currentPos - 1 + filteredBiasIndices.length) % filteredBiasIndices.length
                ];
          // Scroll both panels to the new bias
          setTimeout(() => {
            highlightRefs.current
              .get(next)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            sidebarRefs.current.get(next)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 0);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filteredBiasIndices]);

  if (!content || !biases.length) return null;

  const severities = ['critical', 'high', 'medium', 'low'];
  const severityCounts = severities.reduce(
    (acc, s) => {
      acc[s] = biases.filter(b => b.severity.toLowerCase() === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const panelMaxHeight = expanded ? 'calc(100vh - 200px)' : '700px';

  return (
    <div className="card h-full flex flex-col" ref={containerRef}>
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
                      onClick={() =>
                        setBiasTypeFilter(prev => (prev === biasType ? null : biasType))
                      }
                      className="text-[10px] font-semibold px-2 py-0.5 border rounded-full transition-all duration-150"
                      style={{
                        backgroundColor: biasTypeFilter === biasType ? color?.bg : 'transparent',
                        color: color?.text ?? '#a1a1aa',
                        borderColor: biasTypeFilter === biasType ? color?.border : 'var(--border)',
                      }}
                      aria-pressed={biasTypeFilter === biasType}
                    >
                      {formatBiasName(biasType)} ({count})
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
            {/* Heat map gutter toggle */}
            <button
              onClick={() => setShowHeatMap(p => !p)}
              className={`p-1 transition-colors rounded ${
                showHeatMap
                  ? 'text-emerald-400 bg-emerald-500/15'
                  : 'text-muted hover:text-foreground'
              }`}
              title={showHeatMap ? 'Hide heat map (H)' : 'Show heat map (H)'}
              aria-label={showHeatMap ? 'Hide heat map' : 'Show heat map'}
              aria-pressed={showHeatMap}
            >
              <BarChart3 size={14} />
            </button>
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
            {/* Expand/collapse toggle */}
            <button
              onClick={() => setExpanded(p => !p)}
              className="p-1 text-muted hover:text-foreground transition-colors"
              title={expanded ? 'Collapse view' : 'Expand view'}
              aria-label={expanded ? 'Collapse view' : 'Expand view'}
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className="card-body flex-1 flex flex-col md:flex-row gap-0 overflow-hidden"
        style={{ minHeight: '300px' }}
      >
        {/* Heat map density gutter */}
        {showHeatMap && (
          <div
            className="hidden md:flex flex-col flex-shrink-0 border-r border-border"
            style={{ width: '20px', maxHeight: panelMaxHeight, overflow: 'hidden' }}
            aria-label="Bias density heat map"
          >
            {heatMapData.map(bin => {
              const hasData = bin.biasCount > 0;
              const opacity = hasData
                ? bin.biasCount >= 3
                  ? 1
                  : bin.biasCount >= 2
                    ? 0.6
                    : 0.3
                : 0;
              const color = hasData
                ? (SEVERITY_HEX[bin.maxSeverity] ?? SEVERITY_HEX.low)
                : 'transparent';
              return (
                <div
                  key={bin.index}
                  className="cursor-pointer transition-opacity"
                  style={{
                    flex: 1,
                    minHeight: '2px',
                    backgroundColor: color,
                    opacity,
                  }}
                  onClick={() => handleHeatMapClick(bin.index, heatMapData.length)}
                  title={
                    hasData
                      ? `${bin.biasCount} bias${bin.biasCount > 1 ? 'es' : ''} (${bin.maxSeverity})`
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}

        {/* Document text panel */}
        <div
          ref={textRef}
          className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed whitespace-pre-wrap font-serif bg-muted/20 md:border-r border-b md:border-b-0 border-border"
          style={{ maxHeight: panelMaxHeight }}
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
            const confidenceOpacity = getConfidenceOpacity(bias.confidence);

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
                  aria-label={`${formatBiasName(bias.biasType)} (${bias.severity})`}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    isVisible ? 'underline decoration-2' : ''
                  }`}
                  style={
                    isVisible
                      ? {
                          backgroundColor: typeColor?.bg,
                          textDecorationColor: typeColor?.underline,
                          opacity: confidenceOpacity,
                          ...(isSelected
                            ? {
                                outline: `2px solid ${typeColor?.border}`,
                                outlineOffset: '1px',
                              }
                            : {}),
                        }
                      : { opacity: 0.55 }
                  }
                  onClick={e => {
                    e.stopPropagation();
                    handleHighlightClick(seg.biasIndex!);
                  }}
                  onMouseEnter={e => handleHighlightHover(seg.biasIndex!, e)}
                  onMouseLeave={handleHighlightLeave}
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
                      {formatBiasName(bias.biasType)}
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
                style={isVisible ? { opacity: confidenceOpacity } : undefined}
                onClick={e => {
                  e.stopPropagation();
                  handleHighlightClick(seg.biasIndex!);
                }}
                onMouseEnter={e => handleHighlightHover(seg.biasIndex!, e)}
                onMouseLeave={handleHighlightLeave}
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
          style={{ maxHeight: panelMaxHeight }}
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
                    borderLeftColor: isSelected
                      ? (typeColor?.border ?? 'transparent')
                      : 'transparent',
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
                      {formatBiasName(bias.biasType)}
                    </span>
                    <div className="flex items-center gap-1">
                      {bias.confidence != null && (
                        <span className="text-[9px] text-muted">
                          {Math.round(bias.confidence * 100)}%
                        </span>
                      )}
                      <ChevronRight
                        size={12}
                        className={`text-muted transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                      />
                    </div>
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
                  <div className="flex items-center gap-1">
                    {bias.confidence != null && (
                      <span className="text-[9px] text-muted">
                        {Math.round(bias.confidence * 100)}%
                      </span>
                    )}
                    <ChevronRight
                      size={12}
                      className={`text-muted transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                    />
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground mb-1">{formatBiasName(bias.biasType)}</p>
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

      {/* Hover tooltip */}
      {hoveredBiasIdx !== null && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="rounded-lg shadow-lg border border-border px-3 py-2"
            style={{
              backgroundColor: 'var(--bg-secondary, #1a1a2e)',
              maxWidth: '280px',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-foreground">
                {formatBiasName(biases[hoveredBiasIdx].biasType)}
              </span>
              <span
                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${SEVERITY_HEX[biases[hoveredBiasIdx].severity.toLowerCase()] ?? SEVERITY_HEX.low}30`,
                  color:
                    SEVERITY_HEX[biases[hoveredBiasIdx].severity.toLowerCase()] ?? SEVERITY_HEX.low,
                }}
              >
                {biases[hoveredBiasIdx].severity}
              </span>
              {biases[hoveredBiasIdx].confidence != null && (
                <span className="text-[9px] text-muted">
                  {Math.round(biases[hoveredBiasIdx].confidence! * 100)}% confidence
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted line-clamp-2">
              {biases[hoveredBiasIdx].explanation.length > 80
                ? biases[hoveredBiasIdx].explanation.slice(0, 80) + '…'
                : biases[hoveredBiasIdx].explanation}
            </p>
          </div>
        </div>
      )}

      <div className="p-2 text-center text-[10px] text-muted border-t border-border bg-secondary/20">
        Click highlighted text or sidebar items to link them &bull; Esc deselect &bull; D detective
        &bull; H heat map &bull; ←→ cycle biases
      </div>
    </div>
  );
}
