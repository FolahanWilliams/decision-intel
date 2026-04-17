'use client';

/**
 * CaseBiasWeb
 *
 * Dedicated bias-network viz for the featured case on /proof. Shows
 * every bias flaggable from the pre-decision document, with curved
 * edges for every toxic-pair match. Pure SVG with radial layout and
 * motion entrance. Larger + more narrative than the compact
 * CaseStudyBiasGraph used on the case-study cards.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { formatBiasName } from '@/lib/utils/labels';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  red: '#DC2626',
  redLight: 'rgba(220, 38, 38, 0.12)',
  amber: '#F59E0B',
  violet: '#7C3AED',
};

const TOXIC_PAIRS: Array<{ name: string; biases: [string, string] }> = [
  { name: 'Echo Chamber', biases: ['confirmation_bias', 'groupthink'] },
  { name: 'Echo Chamber', biases: ['confirmation_bias', 'authority_bias'] },
  { name: 'Sunk Ship', biases: ['sunk_cost_fallacy', 'confirmation_bias'] },
  { name: 'Sunk Ship', biases: ['sunk_cost_fallacy', 'overconfidence_bias'] },
  { name: 'Blind Sprint', biases: ['overconfidence_bias', 'planning_fallacy'] },
  { name: 'Blind Sprint', biases: ['overconfidence_bias', 'anchoring_bias'] },
  { name: 'Yes Committee', biases: ['groupthink', 'authority_bias'] },
  { name: 'Yes Committee', biases: ['groupthink', 'bandwagon_effect'] },
  { name: 'Optimism Trap', biases: ['anchoring_bias', 'overconfidence_bias'] },
  { name: 'Optimism Trap', biases: ['overconfidence_bias', 'planning_fallacy'] },
  { name: 'Status Quo Lock', biases: ['status_quo_bias', 'loss_aversion'] },
  { name: 'Status Quo Lock', biases: ['status_quo_bias', 'anchoring_bias'] },
  { name: 'Doubling Down', biases: ['sunk_cost_fallacy', 'overconfidence_bias'] },
  { name: 'Doubling Down', biases: ['sunk_cost_fallacy', 'loss_aversion'] },
];

function normalize(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '_');
}

interface CaseBiasWebProps {
  biases: string[];
  primaryBias?: string;
  caseLabel: string;
  activePatterns?: string[];
}

export function CaseBiasWeb({
  biases,
  primaryBias,
  caseLabel,
  activePatterns = [],
}: CaseBiasWebProps) {
  const [hover, setHover] = useState<string | null>(null);

  const normalizedBiases = useMemo(() => biases.map(normalize), [biases]);
  const normalizedPrimary = primaryBias ? normalize(primaryBias) : null;
  const nodeCount = normalizedBiases.length;

  // Layout — fixed canvas; nodes arranged on a circle with the
  // primary bias at the top. Center node represents the decision.
  const vb = 520;
  const cx = vb / 2;
  const cy = vb / 2;
  const radius = 170;

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; angle: number }>();
    if (nodeCount === 0) return map;
    const orderBiases = [...normalizedBiases];
    if (normalizedPrimary && orderBiases.includes(normalizedPrimary)) {
      const idx = orderBiases.indexOf(normalizedPrimary);
      orderBiases.splice(idx, 1);
      orderBiases.unshift(normalizedPrimary);
    }
    orderBiases.forEach((b, i) => {
      const angle = (2 * Math.PI * i) / orderBiases.length - Math.PI / 2;
      map.set(b, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angle,
      });
    });
    return map;
  }, [normalizedBiases, normalizedPrimary, nodeCount, cx, cy, radius]);

  const edges = useMemo(() => {
    const present = new Set(normalizedBiases);
    const dedupe = new Set<string>();
    const result: Array<{ from: string; to: string; pattern: string }> = [];
    for (const pair of TOXIC_PAIRS) {
      const [a, b] = pair.biases;
      if (!present.has(a) || !present.has(b)) continue;
      const key = [a, b].sort().join('::') + '::' + pair.name;
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      result.push({ from: a, to: b, pattern: pair.name });
    }
    return result;
  }, [normalizedBiases]);

  // Pattern chips along bottom
  const uniquePatterns = useMemo(() => {
    return Array.from(new Set(edges.map(e => e.pattern)));
  }, [edges]);

  if (nodeCount === 0) return null;

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '24px 28px 22px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate400,
              marginBottom: 2,
            }}
          >
            Bias network · {caseLabel}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.slate900 }}>
            {nodeCount} biases · {edges.length} toxic connection{edges.length === 1 ? '' : 's'}
          </div>
        </div>
        {activePatterns.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {activePatterns.map(p => (
              <span
                key={p}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: C.redLight,
                  color: C.red,
                  border: `1px solid rgba(220, 38, 38, 0.2)`,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center' }}>
        <svg
          viewBox={`0 0 ${vb} ${vb}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', maxWidth: 520, height: 'auto' }}
          role="img"
          aria-label="Network of biases and the toxic patterns linking them"
        >
          {/* Ambient concentric rings */}
          {[60, 110, 160].map(r => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={C.slate100}
              strokeWidth={1}
              strokeDasharray="3 5"
            />
          ))}

          {/* Edges (behind nodes) */}
          {edges.map((e, i) => {
            const a = positions.get(e.from);
            const b = positions.get(e.to);
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            // Curve control — pull toward center slightly
            const curveDx = cx - mx;
            const curveDy = cy - my;
            const curveFactor = 0.18;
            const qx = mx + curveDx * curveFactor;
            const qy = my + curveDy * curveFactor;
            const isHighlighted = hover !== null && (hover === e.from || hover === e.to);
            return (
              <motion.path
                key={`${e.from}-${e.to}-${i}`}
                d={`M ${a.x} ${a.y} Q ${qx} ${qy} ${b.x} ${b.y}`}
                fill="none"
                stroke={C.red}
                strokeWidth={isHighlighted ? 2.4 : 1.4}
                strokeOpacity={isHighlighted ? 0.85 : 0.4}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.04, ease: 'easeOut' }}
              />
            );
          })}

          {/* Center decision node */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle cx={cx} cy={cy} r={36} fill={C.slate900} />
            <circle cx={cx} cy={cy} r={36} fill="none" stroke={C.green} strokeWidth={2} />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill={C.green}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              decision
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={C.white}
            >
              at risk
            </text>
          </motion.g>

          {/* Bias nodes */}
          {normalizedBiases.map((b, i) => {
            const pos = positions.get(b);
            if (!pos) return null;
            const isPrimary = b === normalizedPrimary;
            const isHover = hover === b;
            const r = isPrimary ? 22 : 18;
            const fill = isPrimary ? C.red : C.slate900;

            // Label position — nudge outward from center along the node's angle
            const labelOffset = r + 14;
            const lx = cx + (radius + labelOffset) * Math.cos(pos.angle);
            const ly = cy + (radius + labelOffset) * Math.sin(pos.angle);
            const textAnchor: 'start' | 'middle' | 'end' =
              Math.abs(Math.cos(pos.angle)) < 0.25
                ? 'middle'
                : Math.cos(pos.angle) > 0
                  ? 'start'
                  : 'end';

            return (
              <motion.g
                key={b}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.04 }}
                onMouseEnter={() => setHover(b)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'default' }}
              >
                {(isPrimary || isHover) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 6}
                    fill="none"
                    stroke={isPrimary ? C.red : C.violet}
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={fill}
                  stroke={isPrimary ? C.red : isHover ? C.violet : C.slate900}
                  strokeWidth={isPrimary ? 2.5 : isHover ? 2 : 0}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  fontSize={11.5}
                  fontWeight={isPrimary ? 700 : 600}
                  fill={isPrimary ? C.red : isHover ? C.violet : C.slate600}
                >
                  {formatBiasName(b)}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {uniquePatterns.length > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px dashed ${C.slate200}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: C.slate400,
              marginBottom: 8,
            }}
          >
            Toxic patterns active in this case
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {uniquePatterns.map(p => (
              <span
                key={p}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: C.slate100,
                  color: C.slate600,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
