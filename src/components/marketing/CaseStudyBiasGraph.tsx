'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatBiasName } from '@/lib/utils/labels';

/**
 * CaseStudyBiasGraph — Compact interactive bias web for case study cards.
 *
 * Renders biases as nodes in a radial layout with edges between biases
 * that form toxic combinations. Hovering a node highlights its connections
 * and shows the bias name. Gives landing page visitors a visual taste of
 * the product's bias detection output.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
  default: '#94A3B8',
};

const EDGE_COLOR = '#DC262640';
const EDGE_HIGHLIGHT = '#DC2626';
const NODE_STROKE = '#FFFFFF';
const LABEL_COLOR = '#0F172A';
const MUTED_COLOR = '#94A3B8';

// ─── Bias to severity mapping (based on primary bias patterns) ───────────────

function guessSeverity(bias: string, isPrimary: boolean): string {
  if (isPrimary) return 'critical';
  // Common high-severity biases
  if (['overconfidence_bias', 'groupthink', 'confirmation_bias'].includes(bias)) return 'high';
  if (['sunk_cost_fallacy', 'anchoring_bias', 'authority_bias'].includes(bias)) return 'high';
  if (['framing_effect', 'loss_aversion', 'bandwagon_effect'].includes(bias)) return 'medium';
  return 'medium';
}

// ─── Toxic combination → bias pairs mapping ──────────────────────────────────
// Map named toxic patterns to the bias pairs they encode

const TOXIC_PAIRS: Record<string, string[][]> = {
  'Echo Chamber': [
    ['confirmation_bias', 'groupthink'],
    ['confirmation_bias', 'authority_bias'],
  ],
  'Sunk Ship': [
    ['sunk_cost_fallacy', 'confirmation_bias'],
    ['sunk_cost_fallacy', 'overconfidence_bias'],
  ],
  'Blind Sprint': [
    ['overconfidence_bias', 'planning_fallacy'],
    ['overconfidence_bias', 'anchoring_bias'],
  ],
  'Yes Committee': [
    ['groupthink', 'authority_bias'],
    ['groupthink', 'bandwagon_effect'],
  ],
  'Optimism Trap': [
    ['anchoring_bias', 'overconfidence_bias'],
    ['overconfidence_bias', 'planning_fallacy'],
  ],
  'Status Quo Lock': [
    ['status_quo_bias', 'loss_aversion'],
    ['status_quo_bias', 'anchoring_bias'],
  ],
  'Doubling Down': [
    ['sunk_cost_fallacy', 'overconfidence_bias'],
    ['sunk_cost_fallacy', 'loss_aversion'],
  ],
};

interface BiasNode {
  id: string;
  label: string;
  x: number;
  y: number;
  severity: string;
  isPrimary: boolean;
}

interface BiasEdge {
  from: string;
  to: string;
  pattern: string;
}

interface Props {
  biases: string[];
  primaryBias: string;
  toxicCombinations: string[];
  size?: number;
}

export function CaseStudyBiasGraph({ biases, primaryBias, toxicCombinations, size = 180 }: Props) {
  const [hoveredBias, setHoveredBias] = useState<string | null>(null);

  // Compute node positions in a radial layout
  const nodes = useMemo((): BiasNode[] => {
    const r = size * 0.34; // radius
    const cx = size / 2;
    const cy = size / 2;
    return biases.map((bias, i) => {
      const angle = (2 * Math.PI * i) / biases.length - Math.PI / 2;
      return {
        id: bias,
        label: formatBiasName(bias),
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        severity: guessSeverity(bias, bias === primaryBias),
        isPrimary: bias === primaryBias,
      };
    });
  }, [biases, primaryBias, size]);

  // Compute edges from toxic combinations
  const edges = useMemo((): BiasEdge[] => {
    const result: BiasEdge[] = [];
    const biasSet = new Set(biases);

    for (const combo of toxicCombinations) {
      const pairs = TOXIC_PAIRS[combo];
      if (!pairs) {
        // Fallback: connect first two biases for unknown patterns
        if (biases.length >= 2) {
          result.push({ from: biases[0], to: biases[1], pattern: combo });
        }
        continue;
      }
      for (const [a, b] of pairs) {
        if (biasSet.has(a) && biasSet.has(b)) {
          result.push({ from: a, to: b, pattern: combo });
        }
      }
    }

    // If no toxic combos but multiple biases, add light connections between adjacent biases
    if (result.length === 0 && biases.length >= 2) {
      for (let i = 0; i < biases.length; i++) {
        const next = (i + 1) % biases.length;
        result.push({ from: biases[i], to: biases[next], pattern: '' });
      }
    }

    return result;
  }, [biases, toxicCombinations]);

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n: BiasNode) => [n.id, n])), [nodes]);

  // Which biases are connected to the hovered one?
  const connectedToHover = useMemo(() => {
    if (!hoveredBias) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredBias);
    for (const e of edges) {
      if (e.from === hoveredBias) connected.add(e.to);
      if (e.to === hoveredBias) connected.add(e.from);
    }
    return connected;
  }, [hoveredBias, edges]);

  const nodeR = size >= 160 ? 7 : 5;

  return (
    <div
      style={{ position: 'relative', width: size, height: size + 28, margin: '0 auto' }}
      onMouseLeave={() => setHoveredBias(null)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        {/* Edges */}
        {edges.map((e: BiasEdge, i: number) => {
          const from = nodeMap[e.from];
          const to = nodeMap[e.to];
          if (!from || !to) return null;
          const isHighlighted = hoveredBias && (e.from === hoveredBias || e.to === hoveredBias);
          const isToxic = e.pattern !== '';
          return (
            <motion.line
              key={`${e.from}-${e.to}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isHighlighted ? EDGE_HIGHLIGHT : isToxic ? EDGE_COLOR : '#E2E8F020'}
              strokeWidth={isHighlighted ? 2 : isToxic ? 1.5 : 0.5}
              strokeDasharray={isToxic ? undefined : '3 3'}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node: BiasNode, i: number) => {
          const isHovered = hoveredBias === node.id;
          const isDimmed = hoveredBias && !connectedToHover.has(node.id);
          const color = SEVERITY_COLORS[node.severity] ?? SEVERITY_COLORS.default;

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredBias(node.id)}
            >
              {/* Outer glow for primary */}
              {node.isPrimary && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeR + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.3}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? nodeR + 2 : nodeR}
                fill={isDimmed ? '#E2E8F0' : color}
                stroke={NODE_STROKE}
                strokeWidth={2}
                style={{ transition: 'r 0.15s, fill 0.15s' }}
              />
            </motion.g>
          );
        })}
      </svg>

      {/* Hover label */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 600,
          color: hoveredBias ? LABEL_COLOR : MUTED_COLOR,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s',
        }}
      >
        {hoveredBias
          ? formatBiasName(hoveredBias)
          : `${biases.length} biases${toxicCombinations.length > 0 ? ` · ${toxicCombinations.length} toxic` : ''}`}
      </div>
    </div>
  );
}
