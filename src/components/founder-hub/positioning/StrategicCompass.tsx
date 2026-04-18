'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COMPASS_DIRECTIONS,
  type CompassDirection,
} from '@/lib/data/positioning-copilot';

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 140;
const LABEL_RADIUS = 175;

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + Math.cos(rad) * r, y: CENTER + Math.sin(rad) * r };
}

export function StrategicCompass() {
  const [activeId, setActiveId] = useState<string>(COMPASS_DIRECTIONS[0].id);
  const active = COMPASS_DIRECTIONS.find(d => d.id === activeId)!;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(260px, 1fr)',
        gap: 20,
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: SIZE, margin: '0 auto' }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label="Strategic thinking compass with 8 directions"
        >
          <defs>
            <radialGradient id="compass-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={CENTER} cy={CENTER} r={RADIUS + 30} fill="url(#compass-glow)" />

          {/* Outer ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS - 20}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.6"
          />

          {/* Tick marks every 15 degrees */}
          {Array.from({ length: 24 }, (_, i) => i * 15).map(a => {
            const outer = polar(a, RADIUS);
            const inner = polar(a, a % 45 === 0 ? RADIUS - 12 : RADIUS - 6);
            return (
              <line
                key={a}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="var(--border-color)"
                strokeWidth={a % 45 === 0 ? 1.5 : 0.75}
                opacity={a % 45 === 0 ? 1 : 0.5}
              />
            );
          })}

          {/* Compass rose */}
          {[0, 90, 180, 270].map(a => {
            const tip = polar(a, RADIUS - 30);
            const baseL = polar(a - 90, 16);
            const baseR = polar(a + 90, 16);
            return (
              <polygon
                key={`rose-${a}`}
                points={`${tip.x},${tip.y} ${baseL.x},${baseL.y} ${CENTER},${CENTER} ${baseR.x},${baseR.y}`}
                fill={a % 180 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)'}
                stroke="var(--border-color)"
                strokeWidth="1"
                opacity="0.85"
              />
            );
          })}
          <circle cx={CENTER} cy={CENTER} r={8} fill="#16A34A" opacity="0.9" />
          <circle cx={CENTER} cy={CENTER} r={3} fill="var(--bg-primary)" />

          {/* Active arc highlight */}
          <AnimatedArc angle={active.angle} />

          {/* Direction hotspots */}
          {COMPASS_DIRECTIONS.map(dir => {
            const pos = polar(dir.angle, LABEL_RADIUS);
            const isActive = dir.id === activeId;
            return (
              <g
                key={dir.id}
                onClick={() => setActiveId(dir.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? 30 : 26}
                  fill={isActive ? '#16A34A' : 'var(--bg-card)'}
                  stroke={isActive ? '#16A34A' : 'var(--border-color)'}
                  strokeWidth={isActive ? 2 : 1}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={isActive ? '#ffffff' : 'var(--text-primary)'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {dir.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div>
        <DirectionDetail dir={active} />
      </div>
    </div>
  );
}

function AnimatedArc({ angle }: { angle: number }) {
  const start = polar(angle - 22.5, RADIUS);
  const end = polar(angle + 22.5, RADIUS);
  const path = `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
  return (
    <motion.path
      d={path}
      fill="#16A34A"
      fillOpacity={0.1}
      stroke="#16A34A"
      strokeWidth={1}
      strokeOpacity={0.5}
      initial={false}
      animate={{ d: path }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    />
  );
}

function DirectionDetail({ dir }: { dir: CompassDirection }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dir.id}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.2 }}
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          {dir.angle}° · compass direction
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}
        >
          {dir.title}
        </div>
        <div
          style={{
            fontSize: 12,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            marginBottom: 12,
          }}
        >
          {dir.tagline}
        </div>

        <ul
          style={{
            margin: '0 0 14px',
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {dir.principles.map(p => (
            <li
              key={p}
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                paddingLeft: 14,
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 6,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#16A34A',
                  opacity: 0.6,
                }}
              />
              {p}
            </li>
          ))}
        </ul>

        <div
          style={{
            padding: 10,
            background: 'rgba(22, 163, 74, 0.06)',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#16A34A',
              marginBottom: 4,
            }}
          >
            Applied to Decision Intel
          </div>
          {dir.appliedToDecisionIntel}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
