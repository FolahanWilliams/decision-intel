'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Filter,
  Route,
  ChevronLeft,
  ChevronRight,
  Spline,
  Quote,
  Swords,
} from 'lucide-react';
import {
  THINKERS,
  CATEGORY_META,
  LINEAGE,
  LINEAGE_KIND_META,
  THINKER_DEPTH,
  ARGUMENT_PATH,
  type Thinker,
  type ThinkerCategory,
  type LineageKind,
} from '@/lib/data/research-foundations';

// ─── SVG layout constants ──────────────────────────────────────────
const VIEW = 800;
const CENTER = VIEW / 2;
const RING_RADII: Record<1 | 2 | 3 | 4, number> = {
  1: 105,
  2: 195,
  3: 285,
  4: 365,
};
const NODE_R = 16;

interface NodePosition {
  thinker: Thinker;
  x: number;
  y: number;
  labelAngle: number;
}

function computePositions(): NodePosition[] {
  const positions: NodePosition[] = [];
  ([1, 2, 3, 4] as const).forEach(ring => {
    const inRing = THINKERS.filter(t => t.ring === ring);
    const count = inRing.length;
    if (count === 0) return;
    // Start angle offset for visual balance.
    const startAngle = ring === 1 ? -90 : ring === 2 ? -85 : ring === 3 ? -88 : -90;
    inRing.forEach((thinker, i) => {
      const angle = startAngle + (360 / count) * i;
      const rad = (angle * Math.PI) / 180;
      const r = RING_RADII[ring];
      positions.push({
        thinker,
        x: CENTER + r * Math.cos(rad),
        y: CENTER + r * Math.sin(rad),
        labelAngle: angle,
      });
    });
  });
  return positions;
}

const POSITIONS = computePositions();
const POSITION_BY_ID = new Map(POSITIONS.map(p => [p.thinker.id, p]));
const THINKER_BY_ID = new Map(THINKERS.map(t => [t.id, t]));

// Reverse lineage index: target id → who draws on it.
interface IncomingEdge {
  from: string;
  kind: LineageKind;
  note: string;
}
const REVERSE_LINEAGE: Record<string, IncomingEdge[]> = (() => {
  const r: Record<string, IncomingEdge[]> = {};
  for (const [from, edges] of Object.entries(LINEAGE)) {
    for (const e of edges) {
      (r[e.to] ??= []).push({ from, kind: e.kind, note: e.note });
    }
  }
  return r;
})();

const ALL_EDGES = Object.entries(LINEAGE).flatMap(([from, edges]) =>
  edges.map(e => ({ from, to: e.to, kind: e.kind }))
);

// Quadratic curve bowed gently toward the hub, so threads read as a web.
function edgePath(a: NodePosition, b: NodePosition): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (CENTER - mx) * 0.22;
  const cy = my + (CENTER - my) * 0.22;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function IntellectualConstellation() {
  const [selectedId, setSelectedId] = useState<string | null>(THINKERS[0].id);
  const [activeCategory, setActiveCategory] = useState<ThinkerCategory | 'all'>('all');
  const [shippedFilter, setShippedFilter] = useState<'all' | 'shipped' | 'roadmap'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllThreads, setShowAllThreads] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);

  const filteredIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return new Set(
      THINKERS.filter(t => {
        if (activeCategory !== 'all' && t.category !== activeCategory) return false;
        if (shippedFilter === 'shipped' && !t.shipped) return false;
        if (shippedFilter === 'roadmap' && t.shipped) return false;
        if (q) {
          const hay = `${t.name} ${t.summary} ${t.origin} ${t.shortName}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }).map(t => t.id)
    );
  }, [activeCategory, shippedFilter, searchQuery]);

  const selected = useMemo(() => THINKERS.find(t => t.id === selectedId) ?? null, [selectedId]);

  const activeEdges = useMemo(() => {
    if (showAllThreads) {
      return ALL_EDGES.map(e => ({ ...e, faint: true }));
    }
    if (!selectedId) return [];
    const out = (LINEAGE[selectedId] ?? []).map(e => ({
      from: selectedId,
      to: e.to,
      kind: e.kind,
      faint: false,
    }));
    const inc = (REVERSE_LINEAGE[selectedId] ?? []).map(e => ({
      from: e.from,
      to: selectedId,
      kind: e.kind,
      faint: false,
    }));
    return [...out, ...inc];
  }, [selectedId, showAllThreads]);

  const shippedCount = THINKERS.filter(t => t.shipped).length;
  const totalCount = THINKERS.length;

  // ─── Guided tour ("Walk the argument") ───
  function startTour() {
    setTourStep(0);
    setShowAllThreads(false);
    setSelectedId(ARGUMENT_PATH[0].id);
  }
  function goTour(next: number) {
    const clamped = Math.max(0, Math.min(ARGUMENT_PATH.length - 1, next));
    setTourStep(clamped);
    setSelectedId(ARGUMENT_PATH[clamped].id);
  }
  function pickNode(id: string) {
    setSelectedId(id);
    // Manual navigation leaves tour mode (unless they clicked the current beat).
    if (tourStep !== null && ARGUMENT_PATH[tourStep]?.id !== id) setTourStep(null);
  }

  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}
          >
            Intellectual Constellation
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {totalCount} thinkers across four rings, {shippedCount} shipped into the product. Click
            any node to see its lineage and the rebuttal it arms you with.
          </div>
        </div>
        <button
          onClick={startTour}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            background: 'var(--accent-primary)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Route size={13} />
          Walk the argument
        </button>
      </div>

      {/* Tour banner */}
      <AnimatePresence>
        {tourStep !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: 14,
                background: 'color-mix(in srgb, var(--accent-primary) 9%, var(--bg-card))',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 6,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--accent-primary)',
                  }}
                >
                  The argument · step {tourStep + 1} of {ARGUMENT_PATH.length} ·{' '}
                  {ARGUMENT_PATH[tourStep].title}
                </span>
                <button
                  onClick={() => setTourStep(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <X size={12} /> Exit
                </button>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                  marginBottom: 10,
                }}
              >
                {ARGUMENT_PATH[tourStep].beat}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => goTour(tourStep - 1)}
                  disabled={tourStep === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: tourStep === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm, 4px)',
                    cursor: tourStep === 0 ? 'not-allowed' : 'pointer',
                    opacity: tourStep === 0 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={12} /> Back
                </button>
                <button
                  onClick={() =>
                    tourStep === ARGUMENT_PATH.length - 1 ? setTourStep(null) : goTour(tourStep + 1)
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: 'var(--radius-sm, 4px)',
                    cursor: 'pointer',
                  }}
                >
                  {tourStep === ARGUMENT_PATH.length - 1 ? 'Finish' : 'Next'}
                  {tourStep !== ARGUMENT_PATH.length - 1 && <ChevronRight size={12} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            flex: '1 1 220px',
            minWidth: 200,
          }}
        >
          <Search size={12} style={{ color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search thinker, framework, concept..."
            style={{
              flex: 1,
              padding: 0,
              fontSize: 12,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Show-all-threads toggle */}
        <button
          onClick={() => setShowAllThreads(v => !v)}
          title="Show every lineage thread at once"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: showAllThreads ? '#fff' : 'var(--text-secondary)',
            background: showAllThreads ? 'var(--text-primary)' : 'var(--bg-card)',
            border: `1px solid ${showAllThreads ? 'var(--text-primary)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-sm, 4px)',
            cursor: 'pointer',
          }}
        >
          <Spline size={12} />
          All threads
        </button>

        {/* Shipped filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'shipped', 'roadmap'] as const).map(f => (
            <button
              key={f}
              onClick={() => setShippedFilter(f)}
              style={{
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: shippedFilter === f ? '#fff' : 'var(--text-secondary)',
                background:
                  shippedFilter === f
                    ? f === 'shipped'
                      ? '#16A34A'
                      : f === 'roadmap'
                        ? '#F59E0B'
                        : 'var(--text-secondary)'
                    : 'var(--bg-card)',
                border: `1px solid ${
                  shippedFilter === f
                    ? f === 'shipped'
                      ? '#16A34A'
                      : f === 'roadmap'
                        ? '#F59E0B'
                        : 'var(--text-secondary)'
                    : 'var(--border-color)'
                }`,
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 14,
          alignItems: 'center',
        }}
      >
        <Filter size={12} style={{ color: 'var(--text-muted)' }} />
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: activeCategory === 'all' ? '#fff' : 'var(--text-primary)',
            background: activeCategory === 'all' ? 'var(--text-primary)' : 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 4px)',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {(Object.keys(CATEGORY_META) as ThinkerCategory[]).map(cat => {
          const meta = CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? meta.color : 'var(--bg-card)',
                border: `1px solid ${isActive ? meta.color : 'var(--border-color)'}`,
                borderLeft: `3px solid ${meta.color}`,
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Constellation SVG */}
      <div style={{ width: '100%', overflowX: 'auto', marginBottom: 14 }}>
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          style={{
            width: '100%',
            maxWidth: 720,
            margin: '0 auto',
            display: 'block',
            height: 'auto',
          }}
          role="img"
          aria-label="Intellectual constellation of Decision Intel thinkers and the lineage between them"
        >
          <defs>
            <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ring backgrounds */}
          {([1, 2, 3, 4] as const).map(ring => (
            <circle
              key={`ring-${ring}`}
              cx={CENTER}
              cy={CENTER}
              r={RING_RADII[ring]}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={1}
              strokeDasharray="2 6"
              opacity={0.35}
            />
          ))}

          {/* Lineage edges (under the nodes) */}
          {activeEdges.map((e, i) => {
            const a = POSITION_BY_ID.get(e.from);
            const b = POSITION_BY_ID.get(e.to);
            if (!a || !b) return null;
            const color = CATEGORY_META[a.thinker.category].color;
            return (
              <path
                key={`edge-${e.from}-${e.to}-${i}`}
                d={edgePath(a, b)}
                fill="none"
                stroke={color}
                strokeWidth={e.faint ? 1 : 1.6}
                opacity={e.faint ? 0.1 : 0.55}
                strokeLinecap="round"
              />
            );
          })}

          {/* Center DI hub */}
          <circle cx={CENTER} cy={CENTER} r={80} fill="url(#center-glow)" />
          <circle cx={CENTER} cy={CENTER} r={38} fill="#16A34A" stroke="#fff" strokeWidth={2} />
          <text
            x={CENTER}
            y={CENTER - 2}
            textAnchor="middle"
            fontSize={13}
            fontWeight={800}
            fill="#fff"
          >
            Decision
          </text>
          <text
            x={CENTER}
            y={CENTER + 14}
            textAnchor="middle"
            fontSize={13}
            fontWeight={800}
            fill="#fff"
          >
            Intel
          </text>

          {/* Thinker nodes */}
          {POSITIONS.map(pos => {
            const t = pos.thinker;
            const meta = CATEGORY_META[t.category];
            const isVisible = filteredIds.has(t.id);
            const isSelected = selectedId === t.id;
            const opacity = isVisible ? 1 : 0.2;

            // Label offset: outside the node, positioned away from center
            const labelRad = (pos.labelAngle * Math.PI) / 180;
            const labelR = RING_RADII[t.ring] + NODE_R + 18;
            const lx = CENTER + labelR * Math.cos(labelRad);
            const ly = CENTER + labelR * Math.sin(labelRad);
            const anchor =
              Math.cos(labelRad) > 0.3 ? 'start' : Math.cos(labelRad) < -0.3 ? 'end' : 'middle';

            return (
              <g
                key={t.id}
                opacity={opacity}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onClick={() => pickNode(t.id)}
              >
                {/* Faint "feeds the hub" line for the selected node */}
                {isSelected && (
                  <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={meta.color}
                    strokeWidth={1}
                    strokeDasharray="2 4"
                    opacity={0.22}
                  />
                )}
                {/* Selected halo */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R + 8}
                    fill="none"
                    stroke={meta.color}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                  >
                    <animate
                      attributeName="r"
                      values={`${NODE_R + 8};${NODE_R + 14};${NODE_R + 8}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.5;0.15;0.5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R}
                  fill={isSelected ? meta.color : meta.bg}
                  stroke={meta.color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {/* Shipped indicator dot */}
                <circle
                  cx={pos.x + NODE_R - 4}
                  cy={pos.y - NODE_R + 4}
                  r={4}
                  fill={t.shipped ? '#16A34A' : '#F59E0B'}
                  stroke="var(--bg-secondary)"
                  strokeWidth={1}
                />
                {/* Short year */}
                <text
                  x={pos.x}
                  y={pos.y + 3}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill={isSelected ? '#fff' : meta.color}
                >
                  {t.year > 1900 ? `'${t.year.toString().slice(-2)}` : t.year}
                </text>
                {/* Label */}
                {isVisible && (
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    fontSize={10}
                    fontWeight={isSelected ? 700 : 500}
                    fill={isSelected ? meta.color : 'var(--text-primary)'}
                  >
                    {t.shortName}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 14,
          padding: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#16A34A',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Shipped</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#F59E0B',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Roadmap</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          · Threads = lineage (who built on whom). Rings (inner → outer): cognitive foundations ·
          decision structuring · comms & GTM · strategy & moat
        </span>
      </div>

      {/* Selected thinker detail */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${CATEGORY_META[selected.category].color}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: CATEGORY_META[selected.category].color,
                  padding: '3px 8px',
                  background: CATEGORY_META[selected.category].bg,
                  borderRadius: 4,
                }}
              >
                {CATEGORY_META[selected.category].label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: selected.shipped ? '#16A34A' : '#F59E0B',
                  padding: '3px 8px',
                  background: selected.shipped ? 'rgba(22,163,74,0.14)' : 'rgba(245,158,11,0.14)',
                  borderRadius: 4,
                }}
              >
                {selected.shipped ? 'Shipped' : 'Roadmap'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.year}</span>
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.3,
              }}
            >
              {selected.name}
            </div>
            <DetailLabel>Origin</DetailLabel>
            <DetailBody>{selected.origin}</DetailBody>
            <DetailLabel>Summary</DetailLabel>
            <DetailBody>{selected.summary}</DetailBody>
            <DetailLabel>Why it matters for Decision Intel</DetailLabel>
            <DetailBody>{selected.why}</DetailBody>
            <DetailLabel>Product surface</DetailLabel>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                padding: '6px 10px',
                background: 'var(--bg-elevated, var(--bg-secondary))',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--border-color)',
                wordBreak: 'break-all',
              }}
            >
              {selected.surface}
            </div>

            {/* Lineage */}
            <LineageSection id={selected.id} onPick={pickNode} />

            {/* Depth: quote, mechanism, in-the-room rebuttal */}
            {THINKER_DEPTH[selected.id] && (
              <DepthSection
                accent={CATEGORY_META[selected.category].color}
                depth={THINKER_DEPTH[selected.id]}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function LineageSection({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const out = LINEAGE[id] ?? [];
  const inc = REVERSE_LINEAGE[id] ?? [];
  if (out.length === 0 && inc.length === 0) return null;
  return (
    <>
      <DetailLabel>Lineage</DetailLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 6 }}>
        {out.map((e, i) => (
          <LineageRow
            key={`out-${i}`}
            heading="Draws on"
            target={THINKER_BY_ID.get(e.to)?.shortName ?? e.to}
            kind={e.kind}
            note={e.note}
            onClick={() => onPick(e.to)}
          />
        ))}
        {inc.map((e, i) => (
          <LineageRow
            key={`in-${i}`}
            heading="Influences"
            target={THINKER_BY_ID.get(e.from)?.shortName ?? e.from}
            kind={e.kind}
            note={e.note}
            onClick={() => onPick(e.from)}
          />
        ))}
      </div>
    </>
  );
}

function LineageRow({
  heading,
  target,
  kind,
  note,
  onClick,
}: {
  heading: string;
  target: string;
  kind: LineageKind;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '7px 10px',
        background: 'var(--bg-elevated, var(--bg-secondary))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm, 4px)',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
          }}
        >
          {heading}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          {target}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'lowercase',
            color: 'var(--accent-primary)',
            padding: '1px 6px',
            background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
            borderRadius: 3,
          }}
        >
          {LINEAGE_KIND_META[kind].label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: 3 }}>
        {note}
      </div>
    </button>
  );
}

function DepthSection({
  accent,
  depth,
}: {
  accent: string;
  depth: (typeof THINKER_DEPTH)[string];
}) {
  return (
    <>
      {/* Quote */}
      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          background: 'var(--bg-elevated, var(--bg-secondary))',
          borderLeft: `3px solid ${accent}`,
          borderRadius: 'var(--radius-sm, 4px)',
        }}
      >
        <div style={{ display: 'flex', gap: 7 }}>
          <Quote size={14} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div
              style={{
                fontSize: 13,
                fontStyle: 'italic',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
              }}
            >
              {depth.quote}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
              {depth.quoteSource}
            </div>
          </div>
        </div>
      </div>

      <DetailLabel>What Decision Intel operationalizes</DetailLabel>
      <DetailBody>{depth.mechanism}</DetailBody>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 5,
          marginTop: 8,
        }}
      >
        <Swords size={11} /> In the room
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div
          style={{
            padding: '8px 10px',
            background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
            borderLeft: '3px solid var(--warning)',
            borderRadius: 'var(--radius-sm, 4px)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--warning)',
              marginBottom: 3,
            }}
          >
            They say
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {depth.objection}
          </div>
        </div>
        <div
          style={{
            padding: '8px 10px',
            background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
            borderLeft: '3px solid var(--accent-primary)',
            borderRadius: 'var(--radius-sm, 4px)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent-primary)',
              marginBottom: 3,
            }}
          >
            You answer
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {depth.rebuttal}
          </div>
        </div>
      </div>
    </>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        marginBottom: 3,
        marginTop: 8,
      }}
    >
      {children}
    </div>
  );
}

function DetailBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-primary)',
        lineHeight: 1.55,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
