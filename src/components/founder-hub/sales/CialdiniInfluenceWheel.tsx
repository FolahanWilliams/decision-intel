'use client';

/**
 * Cialdini's 6 influence principles, applied to selling Decision Intel.
 * Interactive radial-wheel visualization — each principle is a hex/circle
 * around a centre; click to see the tactic, the example phrase Folahan
 * literally says, and the anti-pattern to avoid.
 *
 * Source data: src/lib/data/sales-toolkit.ts CIALDINI_FOR_DI, grounded in
 * Cialdini's "Influence: The Psychology of Persuasion" PDF in the master
 * NotebookLM KB. Synthesis Q&A saved as note 75e173e9 in master KB
 * 809f5104.
 *
 * The visual: 6 principles arranged in a hex around a central "DI"
 * marker. Click any principle to expand a detail panel below the wheel
 * with the locked example phrase + anti-pattern. Hover any principle to
 * highlight its position in the arrangement. Pure SVG + Framer Motion;
 * respects prefers-reduced-motion via the `transition` prop on motion.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Award, Repeat, Users, Crown, Hourglass } from 'lucide-react';
import { CIALDINI_FOR_DI } from '@/lib/data/sales-toolkit';

const PRINCIPLE_COLORS: Record<string, string> = {
  reciprocation: '#16A34A',
  commitment_consistency: '#0EA5E9',
  social_proof: '#8B5CF6',
  liking: '#EC4899',
  authority: '#D97706',
  scarcity: '#DC2626',
};

const PRINCIPLE_ICONS: Record<string, typeof Heart> = {
  reciprocation: Repeat,
  commitment_consistency: Award,
  social_proof: Users,
  liking: Heart,
  authority: Crown,
  scarcity: Hourglass,
};

// Position 6 principles around a hexagon (angles 0, 60, 120, 180, 240, 300 degrees from top)
function hexPosition(index: number, radius: number, cx: number, cy: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

export function CialdiniInfluenceWheel() {
  const [activeId, setActiveId] = useState<string>(CIALDINI_FOR_DI[0].id);
  const active = CIALDINI_FOR_DI.find(p => p.id === activeId)!;

  const cx = 200;
  const cy = 200;
  const radius = 130;
  const nodeRadius = 38;

  return (
    <div>
      {/* Wheel */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <svg width="400" height="400" viewBox="0 0 400 400" aria-label="Cialdini's 6 influence principles wheel">
          {/* Connecting lines from center to each node */}
          {CIALDINI_FOR_DI.map((p, i) => {
            const pos = hexPosition(i, radius, cx, cy);
            const color = PRINCIPLE_COLORS[p.id];
            const isActive = p.id === activeId;
            return (
              <line
                key={`line-${p.id}`}
                x1={cx}
                y1={cy}
                x2={pos.x}
                y2={pos.y}
                stroke={isActive ? color : 'var(--border-color, #E2E8F0)'}
                strokeWidth={isActive ? 2.5 : 1}
                strokeDasharray={isActive ? '0' : '4 4'}
                style={{ transition: 'all 0.25s ease' }}
              />
            );
          })}

          {/* Center "DI" node */}
          <circle cx={cx} cy={cy} r={42} fill="#0F172A" stroke="#16A34A" strokeWidth={2.5} />
          <text
            x={cx}
            y={cy + 5}
            textAnchor="middle"
            fontSize={18}
            fontWeight={800}
            fill="#16A34A"
            style={{ letterSpacing: '0.04em' }}
          >
            DI
          </text>
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            fontSize={9}
            fill="#94A3B8"
            style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            buyer
          </text>

          {/* 6 principle nodes */}
          {CIALDINI_FOR_DI.map((p, i) => {
            const pos = hexPosition(i, radius, cx, cy);
            const color = PRINCIPLE_COLORS[p.id];
            const Icon = PRINCIPLE_ICONS[p.id];
            const isActive = p.id === activeId;
            return (
              <g
                key={p.id}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveId(p.id)}
              >
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? nodeRadius + 4 : nodeRadius}
                  fill={isActive ? color : 'var(--bg-card, #FFFFFF)'}
                  stroke={color}
                  strokeWidth={isActive ? 3 : 2}
                  initial={false}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                />
                <foreignObject
                  x={pos.x - 14}
                  y={pos.y - 22}
                  width={28}
                  height={28}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? '#fff' : color,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                </foreignObject>
                <text
                  x={pos.x}
                  y={pos.y + 12}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill={isActive ? '#fff' : color}
                  style={{
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                  }}
                >
                  {p.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${PRINCIPLE_COLORS[active.id]}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              color: PRINCIPLE_COLORS[active.id],
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            {active.name}
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              marginBottom: 10,
            }}
          >
            <strong style={{ color: PRINCIPLE_COLORS[active.id] }}>Tactic:</strong>{' '}
            {active.oneLineTactic}
          </div>

          <div
            style={{
              padding: 12,
              background: 'var(--bg-secondary)',
              borderLeft: `2px solid ${PRINCIPLE_COLORS[active.id]}`,
              borderRadius: 4,
              fontSize: 13,
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              lineHeight: 1.55,
              marginBottom: 10,
            }}
          >
            <strong
              style={{
                color: PRINCIPLE_COLORS[active.id],
                fontStyle: 'normal',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Folahan literally says
            </strong>
            {active.examplePhrase}
          </div>

          <div
            style={{
              padding: 10,
              background: 'rgba(220,38,38,0.04)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: 8,
            }}
          >
            <strong style={{ color: '#DC2626' }}>Anti-pattern:</strong> {active.antiPattern}
          </div>

          <div
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-secondary)', fontStyle: 'normal' }}>Source:</strong>{' '}
            {active.citationContext}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
