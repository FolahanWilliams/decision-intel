/**
 * ToxicCombinationsRadial — small SVG showing reinforcing biases as a
 * connected node graph.
 *
 * When two-or-more reinforcing biases fire, render them as
 * positioned nodes on a circle with severity-coloured connecting edges.
 * The thicker the edge, the higher the multiplier. Hovering a node shows
 * the bias name; the matrix label sits below.
 */

import { useState } from 'react';
import type { Severity } from './SeverityEdgeCard';
import { severityToken } from './SeverityEdgeCard';

export interface ToxicCombinationNode {
  /** Bias display name — e.g. "Confirmation Bias" */
  label: string;
  /** Optional taxonomy id for tooltip — e.g. "DI-B-001" */
  taxonomyId?: string;
}

export interface ToxicCombinationEdge {
  /** Index of node A in the nodes array. */
  a: number;
  /** Index of node B. */
  b: number;
  /** Multiplier — drives stroke thickness. 1.0 = baseline; 2.0 = strong. */
  multiplier: number;
}

export interface ToxicCombinationsRadialProps {
  nodes: ToxicCombinationNode[];
  edges: ToxicCombinationEdge[];
  /** Combination name — e.g. "Coherent Confidence" */
  combinationLabel: string;
  /** One-line description of the toxic pattern. */
  description?: string;
  severity: Severity;
  /** Render compact (180px) instead of default (260px). */
  compact?: boolean;
}

export function ToxicCombinationsRadial({
  nodes,
  edges,
  combinationLabel,
  description,
  severity,
  compact = false,
}: ToxicCombinationsRadialProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const size = compact ? 180 : 260;
  const radius = size * 0.32;
  const cx = size / 2;
  const cy = size / 2;
  const color = severityToken(severity);

  // Position nodes around a circle, starting from top.
  const positions = nodes.map((_, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${color}`,
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px 18px',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            padding: '2px 8px',
            borderRadius: 3,
          }}
        >
          Toxic combination
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {combinationLabel}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
          {/* Edges first so nodes paint on top */}
          {edges.map((edge, i) => {
            const a = positions[edge.a];
            const b = positions[edge.b];
            if (!a || !b) return null;
            const stroke = 0.8 + Math.min(edge.multiplier - 1, 1.5) * 1.6;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={stroke}
                strokeOpacity={0.55}
                strokeLinecap="round"
              />
            );
          })}
          {positions.map((p, i) => {
            const isHovered = hoveredNode === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'default' }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 9 : 7}
                  fill={color}
                  stroke="var(--bg-card)"
                  strokeWidth={3}
                  style={{ transition: 'r 0.15s ease' }}
                />
              </g>
            );
          })}
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          {description && (
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              {description}
            </p>
          )}
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {nodes.map((node, i) => {
              const isHovered = hoveredNode === i;
              return (
                <li
                  key={i}
                  onMouseEnter={() => setHoveredNode(i)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    fontSize: 12,
                    color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'color 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: color,
                      flexShrink: 0,
                      transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{node.label}</span>
                  {node.taxonomyId && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontFamily: 'ui-monospace, monospace',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {node.taxonomyId}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
