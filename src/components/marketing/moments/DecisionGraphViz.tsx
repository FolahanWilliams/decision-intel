'use client';

/**
 * Moment 01 illustration — Decision Knowledge Graph.
 *
 * Upgraded 2026-04-21: the simple "four satellites + central node" cluster
 * was replaced with a layered temporal graph that actually narrates the
 * value prop — the graph is alive, multi-typed, and compounds.
 *
 *   · Three concentric quarter-rings (Q3 inner → Q1 outer) — temporal depth
 *   · Three node kinds: decision (circle), bias (diamond), outcome (square)
 *   · Varied edge styles — solid for direct inheritance, dashed for loose
 *   · Central "today's memo" node with a steady pulse
 *   · A late-arriving "+1 Q4" node with its own edge drawing in, to make
 *     the point that the graph keeps growing after the reader looks away
 *
 * Pyramid-style: sits alongside copy, not a dominant focal point.
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const C = {
  green: '#16A34A',
  greenSoft: 'rgba(22,163,74,0.12)',
  greenDark: '#15803D',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  white: '#FFFFFF',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.15)',
  violet: '#7C3AED',
  violetSoft: 'rgba(124,58,237,0.15)',
  blue: '#3B82F6',
  blueSoft: 'rgba(59,130,246,0.15)',
};

type NodeKind = 'decision' | 'bias' | 'outcome';
type Quarter = 'Q1' | 'Q2' | 'Q3';

type Node = {
  id: string;
  x: number;
  y: number;
  kind: NodeKind;
  quarter: Quarter;
  label?: string;
};

const CENTRAL = { x: 240, y: 170 };

/** Hand-placed radial positions — avoids a live force simulation. Each
 *  node is tagged with its quarter so we can stage animations by ring. */
const NODES: Node[] = [
  // Q3 — inner ring (most recent, closest to central memo)
  { id: 'q3-d1', x: 185, y: 130, kind: 'decision', quarter: 'Q3' },
  { id: 'q3-b1', x: 305, y: 135, kind: 'bias', quarter: 'Q3' },
  { id: 'q3-o1', x: 240, y: 240, kind: 'outcome', quarter: 'Q3' },

  // Q2 — middle ring
  { id: 'q2-d1', x: 235, y: 68, kind: 'decision', quarter: 'Q2' },
  { id: 'q2-o1', x: 345, y: 205, kind: 'outcome', quarter: 'Q2' },
  { id: 'q2-b1', x: 150, y: 240, kind: 'bias', quarter: 'Q2' },

  // Q1 — outer ring (oldest)
  { id: 'q1-d1', x: 80, y: 165, kind: 'decision', quarter: 'Q1' },
  { id: 'q1-d2', x: 400, y: 155, kind: 'decision', quarter: 'Q1' },
  { id: 'q1-o1', x: 365, y: 285, kind: 'outcome', quarter: 'Q1' },
];

/** The "+1 Q4" node that arrives late — illustrates that the graph is
 *  live. Intentionally kept off the base NODES list. */
const LIVE_NODE = { id: 'q4-new', x: 295, y: 210, kind: 'decision' as const };

/** Edges connecting the rings, plus direct links to central. The shape
 *  is "Q1 feeds Q2 feeds Q3 feeds central" with a few cross-connections
 *  so the graph reads as a real web, not a wheel. */
const EDGES: Array<{ from: string; to: string; kind: 'strong' | 'loose' }> = [
  // Q3 → central (strong direct inheritance)
  { from: 'q3-d1', to: 'central', kind: 'strong' },
  { from: 'q3-b1', to: 'central', kind: 'strong' },
  { from: 'q3-o1', to: 'central', kind: 'strong' },

  // Q2 → Q3 (lessons flowing forward)
  { from: 'q2-d1', to: 'q3-d1', kind: 'strong' },
  { from: 'q2-o1', to: 'q3-b1', kind: 'loose' },
  { from: 'q2-b1', to: 'q3-o1', kind: 'loose' },

  // Q1 → Q2 (deeper history informs middle ring)
  { from: 'q1-d1', to: 'q2-b1', kind: 'loose' },
  { from: 'q1-d2', to: 'q2-d1', kind: 'loose' },
  { from: 'q1-o1', to: 'q2-o1', kind: 'strong' },
];

function kindStyle(kind: NodeKind) {
  switch (kind) {
    case 'decision':
      return { fill: C.white, stroke: C.blue, tint: C.blueSoft };
    case 'bias':
      return { fill: C.white, stroke: C.amber, tint: C.amberSoft };
    case 'outcome':
      return { fill: C.white, stroke: C.violet, tint: C.violetSoft };
  }
}

/** Renders a node at (cx,cy) whose shape depends on kind. Circle for
 *  decisions, diamond for biases, rounded square for outcomes. */
function NodeShape({
  n,
  animDelay,
  inView,
}: {
  n: Node | typeof LIVE_NODE;
  animDelay: number;
  inView: boolean;
}) {
  const { x, y, kind } = n;
  const style = kindStyle(kind);
  const r = 6.5;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.4 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
      transition={{ duration: 0.4, delay: animDelay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* tinted halo */}
      <circle cx={x} cy={y} r={r + 5} fill={style.tint} />
      {kind === 'decision' && (
        <circle cx={x} cy={y} r={r} fill={style.fill} stroke={style.stroke} strokeWidth="1.6" />
      )}
      {kind === 'bias' && (
        <g transform={`translate(${x} ${y}) rotate(45)`}>
          <rect
            x={-r * 0.9}
            y={-r * 0.9}
            width={r * 1.8}
            height={r * 1.8}
            rx="1.5"
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth="1.6"
          />
        </g>
      )}
      {kind === 'outcome' && (
        <rect
          x={x - r}
          y={y - r}
          width={r * 2}
          height={r * 2}
          rx="2"
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth="1.6"
        />
      )}
    </motion.g>
  );
}

/** Lookup a node's position by id, falling back to CENTRAL for 'central'. */
function nodePos(id: string): { x: number; y: number } {
  if (id === 'central') return CENTRAL;
  const n = NODES.find(x => x.id === id);
  if (n) return { x: n.x, y: n.y };
  return LIVE_NODE;
}

/** Quarter-ring positions — drawn as faint concentric arcs for structure
 *  without dominating the visual. Only the right half is shown so the
 *  rings read as "older ← newer" without overwhelming the nodes. */
function QuarterArcs() {
  return (
    <g>
      {[
        { r: 72, label: 'Q3' },
        { r: 118, label: 'Q2' },
        { r: 162, label: 'Q1' },
      ].map(ring => (
        <g key={ring.label}>
          <circle
            cx={CENTRAL.x}
            cy={CENTRAL.y}
            r={ring.r}
            fill="none"
            stroke={C.slate200}
            strokeWidth="0.8"
            strokeDasharray="3 5"
            opacity="0.7"
          />
          <text
            x={CENTRAL.x + ring.r + 6}
            y={CENTRAL.y + 3}
            fontSize="8"
            fontWeight="700"
            fill={C.slate400}
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.1em"
          >
            {ring.label}
          </text>
        </g>
      ))}
    </g>
  );
}

export function DecisionGraphViz() {
  // Single IntersectionObserver on the outer SVG — `whileInView` on SVG
  // child elements fires unreliably on iOS Safari, leaving every motion
  // node/edge stuck at opacity 0. One observer + driving each child's
  // `animate` off this boolean fixes mobile while preserving desktop UX.
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { amount: 0.3 });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 480 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="Decision Knowledge Graph — three quarters of historical decisions, biases, and outcomes feeding today's memo, with a new Q4 node arriving live"
    >
      {/* Grid backdrop */}
      <defs>
        <pattern id="grid-01" width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="rgba(148,163,184,0.06)"
            strokeWidth="0.8"
          />
        </pattern>
        <radialGradient id="central-glow-01" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="340" fill="url(#grid-01)" />

      {/* Quarter arcs */}
      <QuarterArcs />

      {/* Edges — drawn in with staggered delays. Strong edges solid,
          loose edges dashed so the reader can parse "direct inheritance"
          vs "correlated pattern." */}
      {EDGES.map((edge, i) => {
        const from = nodePos(edge.from);
        const to = nodePos(edge.to);
        const isStrong = edge.kind === 'strong';
        return (
          <motion.line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isStrong ? C.green : C.slate400}
            strokeWidth={isStrong ? 1.4 : 1}
            strokeOpacity={isStrong ? 0.6 : 0.35}
            strokeDasharray={isStrong ? undefined : '3 4'}
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.5 + i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        );
      })}

      {/* Central glow */}
      <motion.circle
        cx={CENTRAL.x}
        cy={CENTRAL.y}
        r="56"
        fill="url(#central-glow-01)"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      />

      {/* Satellite nodes — staged by quarter (Q1 first = deepest history,
          then Q2, then Q3 closest to present). */}
      {NODES.map(n => {
        const ringDelay = n.quarter === 'Q1' ? 0.05 : n.quarter === 'Q2' ? 0.2 : 0.35;
        return <NodeShape key={n.id} n={n} animDelay={ringDelay} inView={inView} />;
      })}

      {/* Central today's-memo node */}
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.55, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <circle
          cx={CENTRAL.x}
          cy={CENTRAL.y}
          r="18"
          fill={C.green}
          stroke={C.greenDark}
          strokeWidth="2"
        />
        <circle cx={CENTRAL.x} cy={CENTRAL.y} r="8" fill={C.white} />
        <text
          x={CENTRAL.x}
          y={CENTRAL.y + 38}
          fontSize="11"
          fontWeight="700"
          fill={C.slate900}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Today&rsquo;s memo
        </text>
        <motion.circle
          cx={CENTRAL.x}
          cy={CENTRAL.y}
          r="18"
          fill="none"
          stroke={C.green}
          strokeWidth="2"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.g>

      {/* Late-arriving +1 node — makes the graph feel alive. Draws its
          own edge in at 2.6s so the reader sees growth, not a frozen state. */}
      <motion.line
        x1={LIVE_NODE.x}
        y1={LIVE_NODE.y}
        x2={CENTRAL.x}
        y2={CENTRAL.y}
        stroke={C.green}
        strokeWidth="1.6"
        strokeOpacity="0.8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.6, delay: 2.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <NodeShape n={LIVE_NODE} animDelay={2.5} inView={inView} />
      <motion.g
        initial={{ opacity: 0, y: -4 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.35, delay: 2.8 }}
      >
        <rect
          x={LIVE_NODE.x + 10}
          y={LIVE_NODE.y - 18}
          width="30"
          height="14"
          rx="7"
          fill={C.green}
        />
        <text
          x={LIVE_NODE.x + 25}
          y={LIVE_NODE.y - 8}
          fontSize="8"
          fontWeight="800"
          fill={C.white}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.04em"
        >
          +1 Q4
        </text>
      </motion.g>

      {/* Legend — tiny, bottom-left. Gives the reader a key without
          cluttering the graph. */}
      <g transform="translate(20, 300)">
        <LegendChip x={0} label="Decision" swatch="circle" color={C.blue} />
        <LegendChip x={78} label="Bias" swatch="diamond" color={C.amber} />
        <LegendChip x={130} label="Outcome" swatch="square" color={C.violet} />
      </g>

      {/* Footer badge: reframed from "inherits 4 lessons" to compounds-quarterly */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, delay: 1.8 }}
      >
        <rect
          x="300"
          y="300"
          width="160"
          height="22"
          rx="11"
          fill={C.greenSoft}
          stroke="rgba(22,163,74,0.25)"
          strokeWidth="1"
        />
        <text
          x="380"
          y="315"
          fontSize="9.5"
          fontWeight="800"
          fill={C.greenDark}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.08em"
        >
          COMPOUNDS QUARTERLY
        </text>
      </motion.g>
    </svg>
  );
}

/** Tiny inline legend chip — shape + label. Swatch shape mirrors the
 *  corresponding node kind so the reader can map visuals instantly. */
function LegendChip({
  x,
  label,
  swatch,
  color,
}: {
  x: number;
  label: string;
  swatch: 'circle' | 'diamond' | 'square';
  color: string;
}) {
  const size = 5;
  return (
    <g transform={`translate(${x} 0)`}>
      {swatch === 'circle' && (
        <circle cx="5" cy="5" r={size} fill={C.white} stroke={color} strokeWidth="1.4" />
      )}
      {swatch === 'diamond' && (
        <g transform="translate(5 5) rotate(45)">
          <rect
            x={-size * 0.9}
            y={-size * 0.9}
            width={size * 1.8}
            height={size * 1.8}
            rx="1"
            fill={C.white}
            stroke={color}
            strokeWidth="1.4"
          />
        </g>
      )}
      {swatch === 'square' && (
        <rect
          x={5 - size}
          y={5 - size}
          width={size * 2}
          height={size * 2}
          rx="1.5"
          fill={C.white}
          stroke={color}
          strokeWidth="1.4"
        />
      )}
      <text
        x="15"
        y="9"
        fontSize="8.5"
        fontWeight="600"
        fill={C.slate500}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}
