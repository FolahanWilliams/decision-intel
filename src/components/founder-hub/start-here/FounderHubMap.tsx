'use client';

/**
 * FounderHubMap — interactive SVG visualization of every Founder Hub tab,
 * its group, its prerequisite relationships, and the journey overlay.
 *
 * Behaviour:
 *  • Each tab is a node sized by group; nodes within a group share an
 *    accent color so the founder can scan-locate "Go-to-Market stuff" or
 *    "Tools" instantly.
 *  • Edges are Bezier curves between nodes. Primary edges render solid;
 *    secondary edges render dashed. The edge tooltip names WHY the
 *    connection exists.
 *  • Visited nodes glow green (matches the legacy 2-day-plan progress
 *    persistence; keys re-used).
 *  • A journey overlay highlights the current journey path with a step
 *    number on each node and animates the connecting line. Picking a
 *    different journey instantly retraces the highlight.
 *  • Click a node → calls onNavigate(tabId). Hover → shows a tooltip
 *    with whatItsFor + payoff + minutes + prerequisites.
 *  • Mobile: below 760px the map renders in scroll-x mode (the SVG
 *    keeps its 1000-unit viewport but the container scrolls
 *    horizontally) so dense edges don't crush each other.
 */

import { useMemo, useState } from 'react';
import {
  Target,
  Compass,
  Rocket,
  Brain,
  BookOpen,
  Radar,
  Shield,
  MessageSquare,
  Zap,
  Handshake,
  Plug,
  Library,
  CheckSquare,
  Calendar,
  Map as MapIcon,
  Lightbulb,
  GraduationCap,
  Terminal,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  NODES,
  EDGES,
  JOURNEYS,
  type MapNode,
  type Journey,
  type TabId,
  type TabGroup,
} from './founder-hub-map-data';

const VIEW_W = 1000;
const VIEW_H = 600;
const NODE_R = 22;
const NODE_HOVER_R = 26;

// Group → accent color. Mirrors the legacy session colors so the map
// reads consistently with any older screenshots / pitch decks.
const GROUP_COLOR: Record<TabGroup, { primary: string; bg: string; soft: string }> = {
  Start: { primary: '#16A34A', bg: 'rgba(22, 163, 74, 0.10)', soft: 'rgba(22, 163, 74, 0.20)' },
  Product: { primary: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.10)', soft: 'rgba(14, 165, 233, 0.20)' },
  'Go-to-Market': {
    primary: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.10)',
    soft: 'rgba(245, 158, 11, 0.20)',
  },
  Intelligence: {
    primary: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.10)',
    soft: 'rgba(139, 92, 246, 0.20)',
  },
  Tools: { primary: '#475569', bg: 'rgba(71, 85, 105, 0.08)', soft: 'rgba(71, 85, 105, 0.18)' },
};

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Target,
  Compass,
  Rocket,
  Brain,
  BookOpen,
  Radar,
  Shield,
  MessageSquare,
  Zap,
  Handshake,
  Plug,
  Library,
  CheckSquare,
  Calendar,
  Map: MapIcon,
  Lightbulb,
  GraduationCap,
  Terminal,
};

interface Props {
  /** Active journey, or null for "all paths visible at low opacity". */
  activeJourney: Journey | null;
  /** Visited tabs (from the 2-day-plan localStorage; persistence preserved). */
  visited: Set<TabId>;
  /** Click handler — wires to the founder-hub page tab switcher. */
  onNavigate: (tabId: TabId) => void;
  /** Toggle handler for the visited checkbox in the hover panel. */
  onToggleVisited: (tabId: TabId) => void;
}

interface HoverState {
  tabId: TabId;
  // Pixel-space cursor position for tooltip placement
  cx: number;
  cy: number;
}

function pxX(node: MapNode): number {
  return node.x * VIEW_W;
}
function pxY(node: MapNode): number {
  return node.y * VIEW_H;
}

/** Bezier path between two nodes. Slight horizontal sweep so the edges
 *  don't all stack. */
function edgePath(from: MapNode, to: MapNode): string {
  const x1 = pxX(from);
  const y1 = pxY(from);
  const x2 = pxX(to);
  const y2 = pxY(to);
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

function pathStepIndex(journey: Journey | null, tabId: TabId): number | null {
  if (!journey) return null;
  const idx = journey.path.indexOf(tabId);
  return idx === -1 ? null : idx;
}

function renderIcon(name: string, color: string): React.ReactNode {
  const Cmp = ICON_MAP[name] ?? Compass;
  return <Cmp size={14} color={color} />;
}

export function FounderHubMap({ activeJourney, visited, onNavigate, onToggleVisited }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null);

  // Build a lookup for fast access during render.
  const nodesById = useMemo(() => {
    const map = new Map<TabId, MapNode>();
    for (const n of NODES) map.set(n.id, n);
    return map;
  }, []);

  // Build the active journey edge sequence so we can highlight just
  // those edges over the underlying graph.
  const journeyEdges = useMemo(() => {
    if (!activeJourney) return new Set<string>();
    const set = new Set<string>();
    for (let i = 0; i < activeJourney.path.length - 1; i++) {
      set.add(`${activeJourney.path[i]}->${activeJourney.path[i + 1]}`);
    }
    return set;
  }, [activeJourney]);

  const hoveredNode = hover ? nodesById.get(hover.tabId) : null;

  return (
    <div className="founder-hub-map-wrap" style={wrapStyle}>
      <div className="founder-hub-map-canvas" style={{ position: 'relative', width: '100%' }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', maxWidth: '100%' }}
          role="img"
          aria-label="Founder Hub map — every tab and its connections"
        >
          {/* Background — group lanes (very faint). Provides the
              5-column visual scaffold without dominating the canvas. */}
          {(['Start', 'Product', 'Go-to-Market', 'Intelligence', 'Tools'] as TabGroup[]).map(
            (g, i) => {
              const x = [0.07, 0.27, 0.5, 0.73, 0.92][i] * VIEW_W;
              return (
                <g key={g} aria-hidden>
                  <rect
                    x={x - 60}
                    y={20}
                    width={120}
                    height={VIEW_H - 40}
                    rx={14}
                    fill={GROUP_COLOR[g].bg}
                    opacity={0.35}
                  />
                  <text
                    x={x}
                    y={40}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={800}
                    fill={GROUP_COLOR[g].primary}
                    style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
                  >
                    {g}
                  </text>
                </g>
              );
            }
          )}

          {/* Edges — drawn first so nodes sit on top. */}
          {EDGES.map(edge => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);
            if (!from || !to) return null;
            const key = `${edge.from}->${edge.to}`;
            const isJourneyEdge = journeyEdges.has(key);
            const baseOpacity = activeJourney ? (isJourneyEdge ? 1 : 0.18) : 0.55;
            const stroke = isJourneyEdge && activeJourney ? activeJourney.color : '#94A3B8';
            const dash = edge.strength === 'secondary' ? '6 5' : undefined;
            return (
              <g key={key}>
                <path
                  d={edgePath(from, to)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isJourneyEdge ? 2.6 : 1.4}
                  strokeDasharray={dash}
                  opacity={baseOpacity}
                  style={{ transition: 'opacity 0.3s, stroke 0.3s, stroke-width 0.3s' }}
                />
                <title>{edge.rationale}</title>
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const color = GROUP_COLOR[node.group].primary;
            const stepIdx = pathStepIndex(activeJourney, node.id);
            const onJourney = stepIdx !== null;
            const isHovered = hover?.tabId === node.id;
            const isVisited = visited.has(node.id);
            const dim = activeJourney && !onJourney;

            return (
              <g
                key={node.id}
                style={{
                  cursor: 'pointer',
                  opacity: dim ? 0.4 : 1,
                  transition: 'opacity 0.3s',
                }}
                onMouseEnter={() => setHover({ tabId: node.id, cx: pxX(node), cy: pxY(node) })}
                onMouseLeave={() => setHover(null)}
                onClick={() => onNavigate(node.id)}
                tabIndex={0}
                role="button"
                aria-label={`Open ${node.label} tab`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(node.id);
                  }
                }}
              >
                {/* Outer halo when hovered or on active journey */}
                {(isHovered || onJourney) && (
                  <circle
                    cx={pxX(node)}
                    cy={pxY(node)}
                    r={NODE_HOVER_R + 8}
                    fill="none"
                    stroke={onJourney && activeJourney ? activeJourney.color : color}
                    strokeWidth={1.5}
                    opacity={0.4}
                  />
                )}
                {/* Main disk */}
                <circle
                  cx={pxX(node)}
                  cy={pxY(node)}
                  r={isHovered ? NODE_HOVER_R : NODE_R}
                  fill={isVisited ? color : '#FFFFFF'}
                  stroke={color}
                  strokeWidth={isVisited ? 0 : 2}
                  style={{ transition: 'r 0.2s, fill 0.2s' }}
                />
                {/* Step number for journey nodes (small badge top-right) */}
                {onJourney && stepIdx !== null && activeJourney && (
                  <g transform={`translate(${pxX(node) + NODE_R - 2}, ${pxY(node) - NODE_R + 4})`}>
                    <circle r={9} fill={activeJourney.color} stroke="#FFFFFF" strokeWidth={1.5} />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={800}
                      fill="#FFFFFF"
                    >
                      {stepIdx + 1}
                    </text>
                  </g>
                )}
                {/* Visited check mark */}
                {isVisited && (
                  <g transform={`translate(${pxX(node)}, ${pxY(node)})`}>
                    <CheckCircle2Svg size={14} color="#FFFFFF" />
                  </g>
                )}
                {/* Icon — only when not visited (visited shows the check) */}
                {!isVisited && (
                  <g
                    transform={`translate(${pxX(node) - 7}, ${pxY(node) - 7})`}
                    pointerEvents="none"
                  >
                    {renderIcon(node.iconName, color)}
                  </g>
                )}
                {/* Label */}
                <text
                  x={pxX(node)}
                  y={pxY(node) + NODE_R + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--text-primary)"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip — positioned absolute over the SVG so it can
            overflow the canvas without clipping. */}
        {hoveredNode && hover && (
          <div
            role="tooltip"
            style={{
              position: 'absolute',
              left: `${(hover.cx / VIEW_W) * 100}%`,
              top: `calc(${(hover.cy / VIEW_H) * 100}% + 50px)`,
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
              zIndex: 5,
              maxWidth: 280,
              padding: 14,
              background: 'var(--bg-card)',
              border: `1px solid ${GROUP_COLOR[hoveredNode.group].soft}`,
              borderLeft: `3px solid ${GROUP_COLOR[hoveredNode.group].primary}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
            onMouseEnter={() => setHover({ tabId: hoveredNode.id, cx: hover.cx, cy: hover.cy })}
            onMouseLeave={() => setHover(null)}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ color: GROUP_COLOR[hoveredNode.group].primary }}>
                {renderIcon(hoveredNode.iconName, GROUP_COLOR[hoveredNode.group].primary)}
              </span>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                {hoveredNode.label}
              </strong>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={10} />
                {hoveredNode.minutes}m
              </span>
            </div>
            <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
              {hoveredNode.whatItsFor}
            </div>
            <div
              style={{
                marginBottom: 8,
                padding: 8,
                background: GROUP_COLOR[hoveredNode.group].bg,
                border: `1px solid ${GROUP_COLOR[hoveredNode.group].soft}`,
                borderRadius: 6,
                fontSize: 11.5,
                color: 'var(--text-primary)',
              }}
            >
              <strong style={{ color: GROUP_COLOR[hoveredNode.group].primary }}>Payoff: </strong>
              {hoveredNode.payoff}
            </div>
            {hoveredNode.prerequisites.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                Easier after:{' '}
                {hoveredNode.prerequisites.map(p => nodesById.get(p)?.label ?? p).join(' · ')}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onNavigate(hoveredNode.id);
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: GROUP_COLOR[hoveredNode.group].primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Open this tab
              </button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onToggleVisited(hoveredNode.id);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {visited.has(hoveredNode.id) ? 'Mark unvisited' : 'Mark visited'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend — group accent → label key. Helps the founder
          parse the map at a glance. */}
      <div style={legendStyle}>
        {(Object.keys(GROUP_COLOR) as TabGroup[]).map(g => (
          <div key={g} style={legendItemStyle}>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: GROUP_COLOR[g].primary,
              }}
            />
            <span>{g}</span>
          </div>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
          {visited.size} of {NODES.length} explored
        </div>
      </div>

      {/* Mobile scroll hint — visible only on narrow viewports.
          Mounted via a media query in the parent style so we don't
          duplicate breakpoint logic here. */}
      <div className="founder-hub-map-mobile-hint">
        Pinch to zoom or scroll horizontally to see the full map.
      </div>

      <style jsx>{`
        .founder-hub-map-mobile-hint {
          display: none;
          margin-top: 8px;
          padding: 8px 12px;
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
          font-style: italic;
        }
        @media (max-width: 760px) {
          .founder-hub-map-canvas {
            overflow-x: auto;
          }
          .founder-hub-map-canvas svg {
            min-width: 720px;
          }
          .founder-hub-map-mobile-hint {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  position: 'relative',
};

const legendStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '10px 12px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  fontSize: 11.5,
  color: 'var(--text-secondary)',
};

const legendItemStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

// Inline check-mark for the node interior — Lucide's CheckCircle2 in JSX
// inside an SVG <g> doesn't compose cleanly because Lucide wraps in its
// own SVG. We render a minimal inline check instead.
function CheckCircle2Svg({ size, color }: { size: number; color: string }) {
  const r = size / 2;
  return (
    <g pointerEvents="none">
      <path
        d={`M -${r * 0.6} 0 L -${r * 0.15} ${r * 0.5} L ${r * 0.7} -${r * 0.5}`}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export { JOURNEYS };
