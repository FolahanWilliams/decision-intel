'use client';

/**
 * Moment 02 illustration — AI boardroom simulation.
 *
 * 5 role-primed personas (CEO, CFO, Board, Division Lead, Legal) around
 * a table with vote chips. The memo sits at the center, questions stream
 * out from each persona.
 *
 * Mirrors the /how-it-works BoardroomSimViz pattern but slimmer.
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const C = {
  green: '#16A34A',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  white: '#FFFFFF',
  amber: '#F59E0B',
  red: '#EF4444',
  violet: '#7C3AED',
  blue: '#3B82F6',
};

const PERSONAS = [
  { id: 'ceo', label: 'CEO', x: 240, y: 40, color: C.green, vote: '?' },
  { id: 'cfo', label: 'CFO', x: 60, y: 120, color: C.amber, vote: '?' },
  { id: 'board', label: 'Board', x: 420, y: 120, color: C.blue, vote: '?' },
  { id: 'legal', label: 'Legal', x: 100, y: 250, color: C.violet, vote: '?' },
  { id: 'division', label: 'Division', x: 380, y: 250, color: C.red, vote: '?' },
];

export function BoardroomViz() {
  // Single IntersectionObserver on the outer SVG — `whileInView` on SVG
  // child elements is unreliable on iOS Safari; one observer + driving
  // each child's `animate` off this boolean fixes mobile rendering.
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { amount: 0.3 });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 480 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="AI boardroom — CEO, CFO, board, legal, and division-lead personas each surface objections before the meeting"
    >
      {/* Table ellipse */}
      <ellipse
        cx="240"
        cy="170"
        rx="140"
        ry="70"
        fill={C.slate100}
        stroke={C.slate200}
        strokeWidth="1.5"
      />
      <ellipse
        cx="240"
        cy="170"
        rx="100"
        ry="48"
        fill={C.white}
        stroke={C.slate200}
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Memo at center */}
      <motion.g
        initial={{ scale: 0.6, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <rect
          x="218"
          y="150"
          width="44"
          height="52"
          rx="3"
          fill={C.white}
          stroke={C.slate400}
          strokeWidth="1.4"
        />
        {[158, 164, 170, 176, 182, 188, 194].map((y, i) => (
          <rect
            key={y}
            x="222"
            y={y}
            width={i % 2 === 0 ? 36 : 28}
            height="2"
            rx="1"
            fill={C.slate300}
          />
        ))}
        <text
          x="240"
          y="220"
          fontSize="10"
          fontWeight="700"
          fill={C.slate700}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.04em"
        >
          MEMO
        </text>
      </motion.g>

      {/* Question lines from each persona → memo */}
      {PERSONAS.map((p, i) => (
        <motion.line
          key={`line-${p.id}`}
          x1={p.x}
          y1={p.y + 20}
          x2={240}
          y2={170}
          stroke={p.color}
          strokeWidth="1.3"
          strokeOpacity="0.45"
          strokeDasharray="3 4"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
        />
      ))}

      {/* Personas */}
      {PERSONAS.map((p, i) => (
        <motion.g
          key={p.id}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
        >
          {/* Seat */}
          <circle cx={p.x} cy={p.y + 10} r="18" fill={C.white} stroke={p.color} strokeWidth="2" />
          {/* Head silhouette */}
          <circle cx={p.x} cy={p.y + 3} r="7" fill={p.color} />
          <path
            d={`M ${p.x - 11} ${p.y + 22} Q ${p.x} ${p.y + 12} ${p.x + 11} ${p.y + 22}`}
            fill={p.color}
          />
          {/* Role label */}
          <text
            x={p.x}
            y={p.y + 48}
            fontSize="10.5"
            fontWeight="700"
            fill={C.slate900}
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {p.label}
          </text>
          {/* Vote chip (question mark → objection) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.9 + i * 0.08 }}
          >
            <rect
              x={p.x - 14}
              y={p.y - 18}
              width="28"
              height="16"
              rx="8"
              fill={p.color}
              fillOpacity="0.15"
              stroke={p.color}
              strokeWidth="1"
            />
            <text
              x={p.x}
              y={p.y - 7}
              fontSize="10"
              fontWeight="800"
              fill={p.color}
              textAnchor="middle"
              fontFamily="var(--font-mono, monospace)"
            >
              ?
            </text>
          </motion.g>
        </motion.g>
      ))}
    </svg>
  );
}
