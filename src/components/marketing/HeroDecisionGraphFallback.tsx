'use client';

/**
 * HeroDecisionGraphFallback
 *
 * Static SVG version of the hero 3D knowledge graph. Renders on devices
 * where WebGL is unavailable or weak (older laptops, restricted
 * enterprise browsers, headless crawlers). Same narrative content as the
 * 3D canvas — WeWork S-1, 11 pre-decision biases, 3 outcomes — rendered
 * as a radial hub-spoke diagram so the hero never shows an empty frame.
 *
 * No WebGL, no three.js, no reagraph. Pure SVG + Framer Motion. Loads
 * instantly, passes `prefers-reduced-motion`, and carries the same
 * "Click any node to explore" affordance as the 3D version (click a bias
 * → detail panel opens below, identical UX to the canvas).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Data model: mirrors the 3D graph's node story ──────────────────────────

interface FallbackNode {
  id: string;
  label: string;
  type: 'decision' | 'bias' | 'outcome';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  excerpt: string;
  insight: string;
}

const CENTER: FallbackNode = {
  id: 'wework',
  label: 'WeWork S-1',
  type: 'decision',
  excerpt: 'Office-leasing business positioned as a tech platform with a valuation to match.',
  insight:
    'The single pre-decision document the entire IPO attempt rested on. 11 cognitive biases were visible in its first 60 pages.',
};

const BIASES: FallbackNode[] = [
  {
    id: 'b1',
    label: 'Founder Worship',
    type: 'bias',
    severity: 'critical',
    excerpt: '“Adam Neumann has transformed the built world…”',
    insight:
      'Early-stage loyalty becomes a late-stage bug. The memo elevates one person\u2019s vision over replicable playbooks.',
  },
  {
    id: 'b2',
    label: 'Definitional Drift',
    type: 'bias',
    severity: 'critical',
    excerpt: '“Community-Adjusted EBITDA” appears 23 times in the filing.',
    insight:
      'Custom metrics are a classic tell. When standard accounting doesn\u2019t flatter, definitions get redrawn.',
  },
  {
    id: 'b3',
    label: 'Halo Effect',
    type: 'bias',
    severity: 'high',
    excerpt: 'SoftBank $47B valuation cited as primary validation signal.',
    insight:
      'One strong endorser drowns out fundamentals. The memo borrows credibility instead of building it.',
  },
  {
    id: 'b4',
    label: 'Narrative Fallacy',
    type: 'bias',
    severity: 'high',
    excerpt: '“Elevate the world\u2019s consciousness” framing throughout.',
    insight:
      'Mission language replaces unit economics. When the story is loudest, the numbers usually can\u2019t carry it.',
  },
  {
    id: 'b5',
    label: 'Overconfidence',
    type: 'bias',
    severity: 'high',
    excerpt: 'Growth projections extrapolate peak quarters indefinitely.',
    insight:
      'Best-case curves presented as baseline forecasts. No downside scenarios, no counterfactuals.',
  },
  {
    id: 'b6',
    label: 'Groupthink',
    type: 'bias',
    severity: 'medium',
    excerpt: 'Board composition shows limited external challenge.',
    insight: 'Insufficient adversarial review before the most consequential corporate moment.',
  },
  {
    id: 'b7',
    label: 'Sunk Cost',
    type: 'bias',
    severity: 'high',
    excerpt: '$12B+ in cumulative losses framed as investment vintage.',
    insight:
      'Past spend reframed as future leverage. Sunk-cost logic shows up in every IPO that shouldn\u2019t happen.',
  },
  {
    id: 'b8',
    label: 'Optimism Bias',
    type: 'bias',
    severity: 'medium',
    excerpt: 'Market size claims reference the total real-estate universe.',
    insight: 'TAM inflation through category recategorization — office rental treated as tech.',
  },
  {
    id: 'b9',
    label: 'Anchoring',
    type: 'bias',
    severity: 'medium',
    excerpt: 'Every valuation comparison anchors on the SoftBank round.',
    insight:
      'One number sets the ceiling and the floor. Public markets anchor on fundamentals instead.',
  },
  {
    id: 'b10',
    label: 'Confirmation Bias',
    type: 'bias',
    severity: 'medium',
    excerpt: 'Customer-success metrics exclude churned members.',
    insight: 'The data the memo shows is the data that agrees with the memo.',
  },
  {
    id: 'b11',
    label: 'Self-Serving Bias',
    type: 'bias',
    severity: 'low',
    excerpt: 'Related-party transactions disclosed but not contextualized.',
    insight:
      'Risks re-framed as alignment. A light-touch disclosure where a flag should have been.',
  },
];

const OUTCOMES: FallbackNode[] = [
  {
    id: 'o1',
    label: 'IPO withdrawn',
    type: 'outcome',
    excerpt: 'September 2019 — S-1 pulled six weeks after filing.',
    insight:
      'The public market challenged what the private market accepted. Every flagged bias got priced in.',
  },
  {
    id: 'o2',
    label: 'Valuation collapse',
    type: 'outcome',
    excerpt: '$47B → $2.9B in under a month.',
    insight: '94% of the paper value erased by the scrutiny the memo never survived.',
  },
  {
    id: 'o3',
    label: 'Governance reset',
    type: 'outcome',
    excerpt: 'CEO removed, board restructured, SoftBank bailout.',
    insight:
      'The structural issues the biases masked became the structural changes required to survive.',
  },
];

// ─── Layout: radial hub-spoke ───────────────────────────────────────────────

const WIDTH = 560;
const HEIGHT = 420;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const BIAS_RADIUS = 130;
const OUTCOME_RADIUS = 185;

function polar(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

const BIAS_POSITIONS = BIASES.map((_, i) => polar(BIAS_RADIUS, (360 / BIASES.length) * i));
const OUTCOME_POSITIONS = OUTCOMES.map((_, i) =>
  polar(OUTCOME_RADIUS, 30 + (300 / (OUTCOMES.length - 1)) * i)
);

// ─── Colors ─────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
};

const TYPE_COLORS: Record<string, string> = {
  decision: '#60A5FA',
  bias: '#EF4444',
  outcome: '#A78BFA',
};

function nodeColor(n: FallbackNode): string {
  if (n.type === 'bias' && n.severity) return SEVERITY_COLORS[n.severity] ?? '#EF4444';
  return TYPE_COLORS[n.type] ?? '#64748B';
}

const TYPE_LABELS: Record<string, string> = {
  decision: 'Decision',
  bias: 'Cognitive Bias',
  outcome: 'Outcome',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function HeroDecisionGraphFallback() {
  const [selected, setSelected] = useState<FallbackNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          background: '#FFFFFF',
        }}
      >
        {/* Header (matches the 3D version) */}
        <div
          style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#16A34A',
                background: 'rgba(22, 163, 74, 0.10)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                padding: '2px 7px',
                borderRadius: 4,
              }}
            >
              Sample output
            </span>
            <span
              style={{
                fontSize: 'clamp(11px, 2.5vw, 12px)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#7C3AED',
              }}
            >
              Decision Knowledge Graph
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: '#475569',
              lineHeight: 1.45,
            }}
          >
            <span style={{ fontWeight: 600, color: '#0F172A' }}>11 pre-decision biases</span>{' '}
            Decision Intel would have flagged in{' '}
            <span style={{ fontWeight: 600, color: '#0F172A' }}>WeWork&rsquo;s S-1 (Aug 2019)</span>
            &nbsp;&mdash; before{' '}
            <span style={{ fontWeight: 600, color: '#DC2626' }}>$39B was destroyed</span>. Click any
            node to explore.
          </div>
        </div>

        {/* SVG canvas */}
        <div style={{ height: 420, position: 'relative', background: '#FAFAFA' }}>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block' }}
            aria-label="WeWork S-1 decision knowledge graph: 11 pre-decision biases linked to 3 outcomes"
          >
            {/* Subtle grid overlay */}
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(15,23,42,0.05)"
                  strokeWidth="1"
                />
              </pattern>
              <radialGradient id="hero-grid-mask">
                <stop offset="30%" stopColor="rgba(0,0,0,0.7)" />
                <stop offset="80%" stopColor="rgba(0,0,0,0.15)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <mask id="hero-grid-clip">
                <rect width="100%" height="100%" fill="url(#hero-grid-mask)" />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#hero-grid)"
              mask="url(#hero-grid-clip)"
            />

            {/* Edges: center → biases */}
            {BIASES.map((b, i) => {
              const p = BIAS_POSITIONS[i];
              const isActive = hovered === b.id || selected?.id === b.id;
              return (
                <motion.line
                  key={`edge-${b.id}`}
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke={nodeColor(b)}
                  strokeWidth={isActive ? 2.4 : 1.2}
                  strokeOpacity={isActive ? 0.85 : 0.35}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.04, ease: 'easeOut' }}
                />
              );
            })}

            {/* Outcome edges: center → outcomes (dashed, purple) */}
            {OUTCOMES.map((o, i) => {
              const p = OUTCOME_POSITIONS[i];
              const isActive = hovered === o.id || selected?.id === o.id;
              return (
                <motion.line
                  key={`edge-${o.id}`}
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke={TYPE_COLORS.outcome}
                  strokeWidth={isActive ? 2.4 : 1.4}
                  strokeDasharray="4 4"
                  strokeOpacity={isActive ? 0.9 : 0.45}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.08, ease: 'easeOut' }}
                />
              );
            })}

            {/* Bias nodes */}
            {BIASES.map((b, i) => {
              const p = BIAS_POSITIONS[i];
              const color = nodeColor(b);
              const isActive = hovered === b.id || selected?.id === b.id;
              return (
                <motion.g
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.35 + i * 0.03, ease: 'easeOut' }}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(b)}
                  style={{ cursor: 'pointer' }}
                >
                  {isActive && (
                    <circle cx={p.x} cy={p.y} r={18} fill={color} fillOpacity={0.18} />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 10 : 8}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </motion.g>
              );
            })}

            {/* Outcome nodes (cylinders — rendered as rounded rects) */}
            {OUTCOMES.map((o, i) => {
              const p = OUTCOME_POSITIONS[i];
              const isActive = hovered === o.id || selected?.id === o.id;
              return (
                <motion.g
                  key={o.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.9 + i * 0.06, ease: 'easeOut' }}
                  onMouseEnter={() => setHovered(o.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(o)}
                  style={{ cursor: 'pointer' }}
                >
                  {isActive && (
                    <rect
                      x={p.x - 22}
                      y={p.y - 14}
                      width={44}
                      height={28}
                      rx={7}
                      fill={TYPE_COLORS.outcome}
                      fillOpacity={0.18}
                    />
                  )}
                  <rect
                    x={p.x - 16}
                    y={p.y - 10}
                    width={32}
                    height={20}
                    rx={5}
                    fill={TYPE_COLORS.outcome}
                    stroke="#FFFFFF"
                    strokeWidth={1.6}
                  />
                  <text
                    x={p.x}
                    y={p.y + 3}
                    fontSize={8}
                    fontWeight={700}
                    fill="#FFFFFF"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {o.label.split(' ')[0].toUpperCase()}
                  </text>
                </motion.g>
              );
            })}

            {/* Center node — the decision */}
            <motion.g
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onMouseEnter={() => setHovered(CENTER.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(CENTER)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={CX} cy={CY} r={28} fill="#60A5FA" fillOpacity={0.15} />
              <circle
                cx={CX}
                cy={CY}
                r={20}
                fill={TYPE_COLORS.decision}
                stroke="#FFFFFF"
                strokeWidth={2.5}
              />
              <text
                x={CX}
                y={CY + 4}
                fontSize={10}
                fontWeight={800}
                fill="#FFFFFF"
                textAnchor="middle"
                pointerEvents="none"
              >
                S-1
              </text>
            </motion.g>

            {/* Hover label */}
            {hovered &&
              (() => {
                const allNodes = [CENTER, ...BIASES, ...OUTCOMES];
                const n = allNodes.find(x => x.id === hovered);
                if (!n) return null;
                const pos =
                  n.id === CENTER.id
                    ? { x: CX, y: CY }
                    : n.type === 'bias'
                      ? BIAS_POSITIONS[BIASES.findIndex(b => b.id === n.id)]
                      : OUTCOME_POSITIONS[OUTCOMES.findIndex(o => o.id === n.id)];
                return (
                  <g pointerEvents="none">
                    <rect
                      x={pos.x - 55}
                      y={pos.y - 32}
                      width={110}
                      height={18}
                      rx={4}
                      fill="#0F172A"
                      fillOpacity={0.94}
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 20}
                      fontSize={10}
                      fontWeight={600}
                      fill="#FFFFFF"
                      textAnchor="middle"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })()}
          </svg>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            Hover a node · Click to explore
          </span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <LegendDot color="#60A5FA" label="Decision" />
            <LegendDot color="#EF4444" label="Bias" />
            <LegendDot color="#A78BFA" label="Outcome" />
          </div>
        </div>

        {/* Detail panel (slides open when a node is clicked) */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: nodeColor(selected),
                        background: nodeColor(selected) + '18',
                        padding: '2px 7px',
                        borderRadius: 4,
                      }}
                    >
                      {TYPE_LABELS[selected.type]}
                      {selected.severity ? ` · ${selected.severity}` : ''}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: 1.3,
                      }}
                    >
                      {selected.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      color: '#94A3B8',
                      padding: '0 2px',
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </button>
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: '#475569',
                    lineHeight: 1.6,
                    margin: '0 0 10px',
                    borderLeft: `2px solid ${nodeColor(selected)}40`,
                    paddingLeft: 10,
                  }}
                >
                  {selected.excerpt}
                </p>
                <div
                  style={{
                    fontSize: 12,
                    color: '#0F172A',
                    lineHeight: 1.55,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    padding: '8px 10px',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      color: '#16A34A',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      marginBottom: 4,
                    }}
                  >
                    Platform Analysis
                  </span>
                  {selected.insight}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
        }}
      />
      <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
    </div>
  );
}
