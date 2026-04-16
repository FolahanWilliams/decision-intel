'use client';

/**
 * ToxicNetworkGraph
 *
 * Force-directed-looking network visualization of toxic combinations
 * across the entire genome. Biases = nodes (radius scaled by how many
 * patterns they participate in), toxic patterns = colored edges.
 *
 * Deterministic radial layout for server-render consistency — not a
 * running physics sim, just a tuned hub-and-ring positioning that
 * visually separates frequent hubs (e.g., overconfidence_bias) from
 * periphery nodes.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { formatBiasName } from '@/lib/utils/labels';
import type { ToxicPatternEntry } from '@/lib/data/bias-genome-seed';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  red: '#DC2626',
  amber: '#F59E0B',
  violet: '#7C3AED',
};

// One color per pattern to color its edges — recognizable legend.
const PATTERN_COLORS: Record<string, string> = {
  'Echo Chamber': '#DC2626',
  'Sunk Ship': '#EA580C',
  'Blind Sprint': '#F59E0B',
  'Yes Committee': '#7C3AED',
  'Optimism Trap': '#DB2777',
  'Status Quo Lock': '#0EA5E9',
  'Doubling Down': '#059669',
};

interface ToxicNetworkGraphProps {
  patterns: ToxicPatternEntry[];
}

export function ToxicNetworkGraph({ patterns }: ToxicNetworkGraphProps) {
  const [hoverPattern, setHoverPattern] = useState<string | null>(null);
  const [hoverBias, setHoverBias] = useState<string | null>(null);

  // Extract unique biases and their participation count
  const { biases, edges } = useMemo(() => {
    const biasCounts = new Map<string, number>();
    const edgeList: Array<{
      from: string;
      to: string;
      pattern: string;
      count: number;
    }> = [];
    for (const p of patterns) {
      const [a, b] = p.biases;
      biasCounts.set(a, (biasCounts.get(a) ?? 0) + 1);
      biasCounts.set(b, (biasCounts.get(b) ?? 0) + 1);
      edgeList.push({ from: a, to: b, pattern: p.name, count: p.caseCount });
    }
    const biasList = [...biasCounts.entries()].sort((a, b) => b[1] - a[1]);
    return { biases: biasList, edges: edgeList };
  }, [patterns]);

  // Layout — hubs in inner ring, periphery in outer ring
  const vb = 720;
  const cx = vb / 2;
  const cy = vb / 2;
  const innerR = 110;
  const outerR = 240;

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; angle: number }>();
    if (biases.length === 0) return map;

    // Hubs: top 4 by participation → inner ring
    const hubs = biases.slice(0, Math.min(4, biases.length)).map(([b]) => b);
    const periphery = biases.slice(hubs.length).map(([b]) => b);

    hubs.forEach((b, i) => {
      const angle = (2 * Math.PI * i) / hubs.length - Math.PI / 2;
      map.set(b, {
        x: cx + innerR * Math.cos(angle),
        y: cy + innerR * Math.sin(angle),
        angle,
      });
    });
    periphery.forEach((b, i) => {
      const angle =
        (2 * Math.PI * i) / Math.max(1, periphery.length) - Math.PI / 2 + Math.PI / periphery.length;
      map.set(b, {
        x: cx + outerR * Math.cos(angle),
        y: cy + outerR * Math.sin(angle),
        angle,
      });
    });
    return map;
  }, [biases, cx, cy, innerR, outerR]);

  const nodeR = (count: number) => 10 + Math.min(count, 4) * 4;

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
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 16,
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
            Toxic network
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.slate900 }}>
            How the biases combine
          </div>
          <div style={{ fontSize: 12, color: C.slate500, marginTop: 4, maxWidth: 520 }}>
            Inner ring: biases that participate in multiple toxic patterns. Edge color = pattern.
            Hover a pattern below to isolate its edges.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 440, justifyContent: 'flex-end' }}>
          {patterns.map(p => {
            const color = PATTERN_COLORS[p.name] ?? C.slate400;
            const isHover = hoverPattern === p.name;
            return (
              <button
                key={p.name}
                onMouseEnter={() => setHoverPattern(p.name)}
                onMouseLeave={() => setHoverPattern(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: isHover ? `${color}14` : C.slate100,
                  border: `1px solid ${isHover ? color : C.slate200}`,
                  color: isHover ? color : C.slate600,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'default',
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: color,
                  }}
                  aria-hidden
                />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Network of biases and the toxic patterns connecting them"
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 620 }}
      >
        {/* Ambient rings */}
        {[innerR, outerR].map(r => (
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

        {/* Edges */}
        {edges.map((e, i) => {
          const a = positions.get(e.from);
          const b = positions.get(e.to);
          if (!a || !b) return null;
          const pColor = PATTERN_COLORS[e.pattern] ?? C.slate400;

          const isHoveredPattern = hoverPattern === e.pattern;
          const isAnyPatternHover = hoverPattern !== null;
          const isBiasHover =
            hoverBias !== null && (hoverBias === e.from || hoverBias === e.to);

          // Visual priority: hovered pattern > bias hover > default
          const opacity = isAnyPatternHover
            ? isHoveredPattern
              ? 0.95
              : 0.08
            : isBiasHover
              ? 0.85
              : 0.45;
          const width = isHoveredPattern ? 2.6 : isBiasHover ? 2.2 : 1.4;

          // Curve away from center
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const curveDx = mx - cx;
          const curveDy = my - cy;
          const dist = Math.hypot(curveDx, curveDy) || 1;
          const bend = 24;
          const qx = mx + (curveDx / dist) * bend;
          const qy = my + (curveDy / dist) * bend;

          return (
            <motion.path
              key={`${e.from}-${e.to}-${e.pattern}-${i}`}
              d={`M ${a.x} ${a.y} Q ${qx} ${qy} ${b.x} ${b.y}`}
              fill="none"
              stroke={pColor}
              strokeWidth={width}
              strokeOpacity={opacity}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.025, ease: 'easeOut' }}
            />
          );
        })}

        {/* Nodes */}
        {biases.map(([b, count], i) => {
          const pos = positions.get(b);
          if (!pos) return null;
          const r = nodeR(count);
          const isHover = hoverBias === b;
          const isHub = i < 4;

          const labelOffset = r + 14;
          const lx = cx + ((isHub ? innerR : outerR) + labelOffset) * Math.cos(pos.angle);
          const ly = cy + ((isHub ? innerR : outerR) + labelOffset) * Math.sin(pos.angle);
          const textAnchor: 'start' | 'middle' | 'end' =
            Math.abs(Math.cos(pos.angle)) < 0.25
              ? 'middle'
              : Math.cos(pos.angle) > 0
                ? 'start'
                : 'end';

          return (
            <motion.g
              key={b}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.05 + i * 0.04 }}
              onMouseEnter={() => setHoverBias(b)}
              onMouseLeave={() => setHoverBias(null)}
              style={{ cursor: 'default' }}
            >
              {isHover && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + 5}
                  fill="none"
                  stroke={C.violet}
                  strokeOpacity={0.5}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={isHub ? C.slate900 : C.white}
                stroke={isHub ? C.red : C.slate600}
                strokeWidth={isHub ? 2 : 1.6}
              />
              {isHub && (
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill={C.white}
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {count}
                </text>
              )}
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize={11.5}
                fontWeight={isHub ? 700 : 600}
                fill={isHub ? C.slate900 : C.slate600}
              >
                {formatBiasName(b)}
              </text>
            </motion.g>
          );
        })}

        {/* Center label */}
        <g>
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            fontSize={9}
            fontWeight={700}
            fill={C.slate400}
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
          >
            Decisions
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fontSize={9}
            fontWeight={500}
            fill={C.slate400}
          >
            at compound risk
          </text>
        </g>
      </svg>

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px dashed ${C.slate200}`,
          fontSize: 11,
          color: C.slate500,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>
          {biases.length} biases · {patterns.length} named patterns · {edges.length} toxic edges
        </span>
        <span>Hub numbers = pattern participation count.</span>
      </div>
    </div>
  );
}
