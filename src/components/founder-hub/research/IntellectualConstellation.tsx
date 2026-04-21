'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';
import {
  THINKERS,
  CATEGORY_META,
  type Thinker,
  type ThinkerCategory,
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

export function IntellectualConstellation() {
  const [selectedId, setSelectedId] = useState<string | null>(THINKERS[0].id);
  const [activeCategory, setActiveCategory] = useState<ThinkerCategory | 'all'>('all');
  const [shippedFilter, setShippedFilter] = useState<'all' | 'shipped' | 'roadmap'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const shippedCount = THINKERS.filter(t => t.shipped).length;
  const totalCount = THINKERS.length;

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
      <div style={{ marginBottom: 14 }}>
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
          {totalCount} thinkers across four rings. {shippedCount} are shipped into the product;{' '}
          {totalCount - shippedCount} are roadmap. Click any node.
        </div>
      </div>

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
          aria-label="Intellectual constellation of Decision Intel thinkers"
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
                onClick={() => setSelectedId(t.id)}
              >
                {/* Connection line to center for selected */}
                {isSelected && (
                  <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={meta.color}
                    strokeWidth={1}
                    strokeDasharray="2 4"
                    opacity={0.5}
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
          · Rings (inner → outer): cognitive foundations · decision structuring · comms & GTM ·
          strategy & moat
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
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
