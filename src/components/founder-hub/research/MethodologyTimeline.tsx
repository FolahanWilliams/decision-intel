'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { TIMELINE, CATEGORY_META, type ThinkerCategory } from '@/lib/data/research-foundations';

// 260+ years of decision science plotted on a horizontal timeline.
// Each milestone is a clickable marker colored by category.
// Uses a logarithmic-ish mapping so the 1763 → 1900 gap doesn't crush
// the dense 2000–2026 era.

const VIEW_W = 960;
const VIEW_H = 240;
const TRACK_Y = 100;
const TRACK_X1 = 80;
const TRACK_X2 = VIEW_W - 40;

// Map a year to an x position using a sqrt curve to emphasize recent years.
function yearToX(year: number): number {
  const minY = 1763;
  const maxY = 2026;
  const normalized = (year - minY) / (maxY - minY); // 0..1
  // sqrt curve compresses the left (older), spreads the right
  const t = Math.sqrt(normalized);
  return TRACK_X1 + t * (TRACK_X2 - TRACK_X1);
}

export function MethodologyTimeline() {
  const [activeYear, setActiveYear] = useState<number>(2026);
  const [activeCategory, setActiveCategory] = useState<ThinkerCategory | 'all'>('all');

  const filteredMilestones = useMemo(() => {
    if (activeCategory === 'all') return TIMELINE;
    return TIMELINE.filter(m => m.category === activeCategory);
  }, [activeCategory]);

  const activeMilestone = useMemo(
    () => TIMELINE.find(m => m.year === activeYear) ?? TIMELINE[TIMELINE.length - 1],
    [activeYear]
  );

  // Track label ticks at round decades
  const TICKS = [1763, 1800, 1850, 1900, 1950, 1970, 1990, 2000, 2010, 2020, 2026];

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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(139, 92, 246, 0.18)',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Clock size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            260 years of decision science
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            From Bayes&rsquo; 1763 essay to the Decision Knowledge Graph shipping in 2026. Click any
            marker.
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '4px 10px',
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
        {(Object.keys(CATEGORY_META) as ThinkerCategory[]).map(c => {
          const meta = CATEGORY_META[c];
          const isActive = activeCategory === c;
          return (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                padding: '4px 10px',
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

      {/* Timeline SVG */}
      <div style={{ width: '100%', overflowX: 'auto', marginBottom: 14 }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{ width: '100%', minWidth: 700, height: 'auto', display: 'block' }}
          role="img"
          aria-label="Historical timeline of decision science milestones"
        >
          {/* Main track */}
          <line
            x1={TRACK_X1}
            y1={TRACK_Y}
            x2={TRACK_X2}
            y2={TRACK_Y}
            stroke="var(--border-color)"
            strokeWidth={2}
          />

          {/* Decade ticks */}
          {TICKS.map(y => (
            <g key={y}>
              <line
                x1={yearToX(y)}
                y1={TRACK_Y - 4}
                x2={yearToX(y)}
                y2={TRACK_Y + 4}
                stroke="var(--text-muted)"
                strokeWidth={1}
              />
              <text
                x={yearToX(y)}
                y={TRACK_Y + 18}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {y}
              </text>
            </g>
          ))}

          {/* Milestones */}
          {filteredMilestones.map((m, i) => {
            const x = yearToX(m.year);
            const isActive = activeYear === m.year;
            const meta = CATEGORY_META[m.category];
            // Alternate above/below to reduce overlap
            const yOffset = i % 2 === 0 ? -36 : 36;
            const labelY = TRACK_Y + yOffset;
            return (
              <g
                key={`${m.year}-${m.label}`}
                onClick={() => setActiveYear(m.year)}
                style={{ cursor: 'pointer' }}
              >
                {/* Connector line */}
                <line
                  x1={x}
                  y1={TRACK_Y}
                  x2={x}
                  y2={labelY + (yOffset < 0 ? 6 : -6)}
                  stroke={meta.color}
                  strokeWidth={isActive ? 1.5 : 1}
                  opacity={isActive ? 0.6 : 0.3}
                />
                {/* Milestone dot */}
                <circle
                  cx={x}
                  cy={TRACK_Y}
                  r={isActive ? 6 : 4}
                  fill={isActive ? meta.color : 'var(--bg-card)'}
                  stroke={meta.color}
                  strokeWidth={2}
                />
                {/* Year label (only active) */}
                {isActive && (
                  <text
                    x={x}
                    y={labelY + (yOffset < 0 ? -6 : 14)}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={meta.color}
                  >
                    {m.year}
                  </text>
                )}
                {/* Short label */}
                <text
                  x={x}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={isActive ? 700 : 500}
                  fill={isActive ? meta.color : 'var(--text-primary)'}
                  opacity={isActive ? 1 : 0.6}
                >
                  {m.label.length > 18 ? m.label.slice(0, 16) + '…' : m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active milestone detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMilestone.year}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${CATEGORY_META[activeMilestone.category].color}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: CATEGORY_META[activeMilestone.category].color,
                lineHeight: 1,
              }}
            >
              {activeMilestone.year}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {activeMilestone.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              — {activeMilestone.thinker}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>
            {activeMilestone.significance}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
