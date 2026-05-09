'use client';

/**
 * ContainerConstellation — the centerpiece visualization for Phase
 * 3.5. A longitudinal/relational SVG mapping cognitive lineage across
 * every DecisionContainer the user can see.
 *
 * Design rules (anchored on master KB synthesis 2026-05-09 evening):
 *   1. Cognitive lineage, not data lineage. Edges represent thesis-
 *      anchors, structural-assumption dependencies, escalation chains,
 *      strategic-frame parenthood — never file-flow.
 *   2. Position is stable narrative. X = time (created); Y = kind band
 *      (investment / acquisition / strategic).
 *   3. Risk is the ambient signal. Critical / high → vivid color +
 *      pulse. Low / safe → faded into the background. The eye is
 *      drawn to where attention is needed.
 *   4. Specific signals trump genericity. T-N committee countdown
 *      surfaces as a visible chip on near-deadline nodes. Dependency
 *      fan-out flags shared `depends_on` ripples (the Cornerstone-
 *      magnetic edge per the synthesis).
 *
 * Anti-patterns avoided (per synthesis):
 *   - Cathedral of Code Trap → no force-directed physics; structured.
 *   - Quantellia Trap (visual complexity) → quiet nodes fade.
 *   - Palantir Foundry Trap → cognitive lineage, not data flow.
 *   - Cloverpop Trap → not a bureaucratic checklist.
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import { useConstellation } from '@/hooks/useConstellation';
import {
  CONTAINER_LINK_TYPES,
  CONTAINER_LINK_TYPE_META,
  type ContainerLinkType,
} from '@/lib/data/container-link-types';
import { CONTAINER_MODES, type DecisionContainerKind } from '@/lib/data/decision-container-modes';
import {
  KIND_BAND_LABELS,
  KIND_BAND_DESCRIPTIONS,
  KIND_BAND_ORDER,
  layoutConstellation,
  riskBandColor,
  severityTint,
  type PositionedNode,
} from './constellation-layout';
import { ContainerNodeDetailPopup } from './ContainerNodeDetailPopup';

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 540;
const PAD_X = 100;
const PAD_Y = 40;

export function ContainerConstellation() {
  const { nodes, links, linkTypeCounts, isLoading } = useConstellation();
  const [activeKinds, setActiveKinds] = useState<Set<DecisionContainerKind>>(
    new Set(['investment', 'acquisition', 'strategic'])
  );
  const [activeLinkTypes, setActiveLinkTypes] = useState<Set<ContainerLinkType>>(
    new Set(CONTAINER_LINK_TYPES)
  );
  const [showQuiet, setShowQuiet] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(
    () =>
      layoutConstellation(
        nodes,
        links,
        {
          width: VIEWBOX_WIDTH,
          height: VIEWBOX_HEIGHT,
          padX: PAD_X,
          padY: PAD_Y,
        },
        { kinds: activeKinds, showQuiet }
      ),
    [nodes, links, activeKinds, showQuiet]
  );

  const visibleLinks = useMemo(
    () => layout.links.filter(l => activeLinkTypes.has(l.linkType)),
    [layout.links, activeLinkTypes]
  );

  // Outbound + inbound counts per node (for the popup chips)
  const linkCountsByNode = useMemo(() => {
    const out = new Map<string, number>();
    const inb = new Map<string, number>();
    for (const l of visibleLinks) {
      out.set(l.fromId, (out.get(l.fromId) ?? 0) + 1);
      inb.set(l.toId, (inb.get(l.toId) ?? 0) + 1);
    }
    return { out, inb };
  }, [visibleLinks]);

  const selectedNode = useMemo(
    () => layout.nodes.find(n => n.id === selectedNodeId) ?? null,
    [layout.nodes, selectedNodeId]
  );

  // Close popup on Escape
  useEffect(() => {
    if (!selectedNodeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedNodeId]);

  if (isLoading) {
    return (
      <div
        style={{
          padding: 60,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        Loading constellation…
      </div>
    );
  }

  if (nodes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}
    >
      {/* Filter strip */}
      <FilterStrip
        nodes={nodes}
        linkTypeCounts={linkTypeCounts}
        activeKinds={activeKinds}
        setActiveKinds={setActiveKinds}
        activeLinkTypes={activeLinkTypes}
        setActiveLinkTypes={setActiveLinkTypes}
        showQuiet={showQuiet}
        setShowQuiet={setShowQuiet}
      />

      {/* SVG canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          marginTop: 16,
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '70vh',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
          role="img"
          aria-label="Decision Pipeline Constellation"
        >
          {/* Y-band guides */}
          <BandGuides />

          {/* Time-axis tick (now marker) */}
          <line
            x1={VIEWBOX_WIDTH - PAD_X}
            x2={VIEWBOX_WIDTH - PAD_X}
            y1={PAD_Y}
            y2={VIEWBOX_HEIGHT - PAD_Y}
            stroke="var(--border-color)"
            strokeDasharray="2 4"
            strokeWidth={0.5}
          />
          <text
            x={VIEWBOX_WIDTH - PAD_X}
            y={VIEWBOX_HEIGHT - PAD_Y + 16}
            fontSize={9}
            fill="var(--text-muted)"
            textAnchor="middle"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}
          >
            now
          </text>
          <text
            x={PAD_X}
            y={VIEWBOX_HEIGHT - PAD_Y + 16}
            fontSize={9}
            fill="var(--text-muted)"
            textAnchor="middle"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}
          >
            earliest
          </text>

          {/* Edges first (so they render under nodes) */}
          {visibleLinks.map(l => {
            const meta = CONTAINER_LINK_TYPE_META[l.linkType];
            const isHovered = hoveredLinkId === l.id;
            const baseOpacity = l.isHotEdge ? 0.85 : isHovered ? 0.9 : 0.45;
            return (
              <g key={l.id}>
                <path
                  d={curvedPath(l.fromX, l.fromY, l.toX, l.toY)}
                  fill="none"
                  stroke={meta.edgeColor}
                  strokeWidth={l.isHotEdge ? 1.6 : 1}
                  strokeDasharray={
                    meta.edgeStyle === 'dashed'
                      ? '4 3'
                      : meta.edgeStyle === 'dotted'
                        ? '1 3'
                        : undefined
                  }
                  strokeOpacity={baseOpacity}
                  style={{ transition: 'stroke-opacity 200ms, stroke-width 200ms' }}
                  onMouseEnter={() => setHoveredLinkId(l.id)}
                  onMouseLeave={() => setHoveredLinkId(null)}
                />
                {/* Arrowhead */}
                <ArrowHead
                  toX={l.toX}
                  toY={l.toY}
                  fromX={l.fromX}
                  fromY={l.fromY}
                  color={meta.edgeColor}
                  opacity={baseOpacity}
                />
                {isHovered && l.note && (
                  <text
                    x={(l.fromX + l.toX) / 2}
                    y={(l.fromY + l.toY) / 2 - 8}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--text-secondary)"
                    style={{ pointerEvents: 'none' }}
                  >
                    {l.note.slice(0, 60)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {layout.nodes.map(n => (
            <ConstellationNode
              key={n.id}
              node={n}
              selected={n.id === selectedNodeId}
              onClick={() => setSelectedNodeId(n.id === selectedNodeId ? null : n.id)}
            />
          ))}
        </svg>

        {/* Node detail popup */}
        {selectedNode && (
          <ContainerNodeDetailPopup
            node={selectedNode}
            outboundLinkCount={linkCountsByNode.out.get(selectedNode.id) ?? 0}
            inboundLinkCount={linkCountsByNode.inb.get(selectedNode.id) ?? 0}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      <Legend />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ConstellationNode({
  node,
  selected,
  onClick,
}: {
  node: PositionedNode;
  selected: boolean;
  onClick: () => void;
}) {
  const color = riskBandColor(node.riskBand);
  const opacity = node.isQuiet ? 0.18 : selected ? 1 : 0.95;

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`${CONTAINER_MODES[node.kind].label}: ${node.name}`}
    >
      {/* Pulse ring for critical / near-committee */}
      {node.shouldPulse && !node.isQuiet && (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.r + 6}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.3}
        >
          <animate
            attributeName="r"
            values={`${node.r + 4};${node.r + 12};${node.r + 4}`}
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Selection ring */}
      {selected && (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.r + 4}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={1.5}
          opacity={0.8}
        />
      )}

      {/* Node fill */}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.r}
        fill={severityTint(color, node.isQuiet ? 8 : 25)}
        stroke={color}
        strokeWidth={selected ? 2 : 1.2}
        opacity={opacity}
        style={{ transition: 'opacity 200ms' }}
      />

      {/* Kind glyph (mode initial: I / A / S) */}
      <text
        x={node.x}
        y={node.y + 3}
        textAnchor="middle"
        fontSize={node.r * 0.7}
        fill={color}
        fontWeight={700}
        opacity={opacity}
        style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
      >
        {node.kind.charAt(0)}
      </text>

      {/* Hovering label — render only when not quiet, kept short */}
      {!node.isQuiet && !selected && (
        <text
          x={node.x}
          y={node.y - node.r - 6}
          textAnchor="middle"
          fontSize={9}
          fill="var(--text-secondary)"
          opacity={opacity * 0.85}
          style={{ pointerEvents: 'none' }}
        >
          {node.name.length > 22 ? `${node.name.slice(0, 22)}…` : node.name}
        </text>
      )}

      {/* T-N badge for near-committee nodes */}
      {node.daysUntilCommittee != null &&
        node.daysUntilCommittee >= 0 &&
        node.daysUntilCommittee <= 14 &&
        !node.isQuiet && (
          <g transform={`translate(${node.x + node.r + 2}, ${node.y - node.r - 4})`}>
            <rect
              x={-2}
              y={-9}
              width={28}
              height={12}
              rx={3}
              fill={
                node.daysUntilCommittee <= 7 ? 'var(--severity-critical)' : 'var(--severity-high)'
              }
              opacity={0.92}
            />
            <text x={12} y={0} fontSize={8} fill="#fff" textAnchor="middle" fontWeight={700}>
              T-{node.daysUntilCommittee}
            </text>
          </g>
        )}
    </g>
  );
}

function ArrowHead({
  fromX,
  fromY,
  toX,
  toY,
  color,
  opacity,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  opacity: number;
}) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const arrowLength = 7;
  const arrowAngle = Math.PI / 7;
  // Pull arrowhead back from the target node center by ~12 (avg node radius)
  const backOff = 12;
  const tipX = toX - backOff * Math.cos(angle);
  const tipY = toY - backOff * Math.sin(angle);
  const leftX = tipX - arrowLength * Math.cos(angle - arrowAngle);
  const leftY = tipY - arrowLength * Math.sin(angle - arrowAngle);
  const rightX = tipX - arrowLength * Math.cos(angle + arrowAngle);
  const rightY = tipY - arrowLength * Math.sin(angle + arrowAngle);
  return (
    <polygon
      points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
      fill={color}
      opacity={opacity}
    />
  );
}

function BandGuides() {
  const innerHeight = VIEWBOX_HEIGHT - PAD_Y * 2;
  const bandHeight = innerHeight / KIND_BAND_ORDER.length;
  return (
    <g>
      {KIND_BAND_ORDER.map((kind, i) => {
        const yTop = PAD_Y + i * bandHeight;
        const yCenter = yTop + bandHeight / 2;
        return (
          <g key={kind}>
            {i > 0 && (
              <line
                x1={PAD_X / 2}
                x2={VIEWBOX_WIDTH - PAD_X / 2}
                y1={yTop}
                y2={yTop}
                stroke="var(--border-color)"
                strokeWidth={0.5}
                strokeDasharray="1 4"
              />
            )}
            <text
              x={PAD_X / 2 - 4}
              y={yCenter - 4}
              fontSize={11}
              fontWeight={600}
              fill="var(--text-secondary)"
              textAnchor="end"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {KIND_BAND_LABELS[kind]}
            </text>
            <text
              x={PAD_X / 2 - 4}
              y={yCenter + 9}
              fontSize={8}
              fill="var(--text-muted)"
              textAnchor="end"
              style={{ fontStyle: 'italic' }}
            >
              {KIND_BAND_DESCRIPTIONS[kind].slice(0, 32)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function FilterStrip({
  nodes,
  linkTypeCounts,
  activeKinds,
  setActiveKinds,
  activeLinkTypes,
  setActiveLinkTypes,
  showQuiet,
  setShowQuiet,
}: {
  nodes: { kind: string; riskBand?: unknown }[];
  linkTypeCounts: Record<ContainerLinkType, number>;
  activeKinds: Set<DecisionContainerKind>;
  setActiveKinds: (k: Set<DecisionContainerKind>) => void;
  activeLinkTypes: Set<ContainerLinkType>;
  setActiveLinkTypes: (l: Set<ContainerLinkType>) => void;
  showQuiet: boolean;
  setShowQuiet: (b: boolean) => void;
}) {
  const kindCounts = useMemo(() => {
    const m: Record<DecisionContainerKind, number> = {
      investment: 0,
      acquisition: 0,
      strategic: 0,
    };
    for (const n of nodes) {
      if (n.kind in m) m[n.kind as DecisionContainerKind] += 1;
    }
    return m;
  }, [nodes]);

  const toggleKind = (kind: DecisionContainerKind) => {
    const next = new Set(activeKinds);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    setActiveKinds(next);
  };

  const toggleLinkType = (lt: ContainerLinkType) => {
    const next = new Set(activeLinkTypes);
    if (next.has(lt)) next.delete(lt);
    else next.add(lt);
    setActiveLinkTypes(next);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span
          style={{
            fontSize: 'var(--fs-3xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            fontWeight: 600,
            marginRight: 4,
          }}
        >
          modes
        </span>
        {KIND_BAND_ORDER.map(kind => (
          <FilterChip
            key={kind}
            active={activeKinds.has(kind)}
            onClick={() => toggleKind(kind)}
            label={`${CONTAINER_MODES[kind].label} · ${kindCounts[kind]}`}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span
          style={{
            fontSize: 'var(--fs-3xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            fontWeight: 600,
            marginRight: 4,
          }}
        >
          edges
        </span>
        {CONTAINER_LINK_TYPES.map(lt => {
          const meta = CONTAINER_LINK_TYPE_META[lt];
          return (
            <FilterChip
              key={lt}
              active={activeLinkTypes.has(lt)}
              onClick={() => toggleLinkType(lt)}
              label={`${meta.label} · ${linkTypeCounts[lt] ?? 0}`}
              accentColor={meta.edgeColor}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowQuiet(!showQuiet)}
        title="Show decisions with no risk signal + no near-committee deadline"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          borderRadius: 'var(--radius-md)',
          background: showQuiet ? 'var(--bg-elevated)' : 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        {showQuiet ? <Eye size={12} /> : <EyeOff size={12} />}
        {showQuiet ? 'Showing quiet' : 'Quiet hidden'}
      </button>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  accentColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accentColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '3px 8px',
        fontSize: 'var(--fs-3xs)',
        fontWeight: 600,
        borderRadius: 'var(--radius-md)',
        background: active
          ? severityTint(accentColor ?? 'var(--accent-primary)', 12)
          : 'transparent',
        border: `1px solid ${active ? (accentColor ?? 'var(--accent-primary)') : 'var(--border-color)'}`,
        color: active ? (accentColor ?? 'var(--accent-primary)') : 'var(--text-muted)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 150ms, border-color 150ms, color 150ms',
      }}
    >
      {label}
    </button>
  );
}

function Legend() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid var(--border-color)',
        fontSize: 'var(--fs-3xs)',
        color: 'var(--text-muted)',
      }}
    >
      <LegendDot color="var(--severity-critical)" label="Critical risk · pulses" />
      <LegendDot color="var(--severity-high)" label="High risk" />
      <LegendDot color="var(--warning)" label="Medium risk" />
      <LegendDot color="var(--success)" label="Low risk · audited" />
      <LegendDot color="var(--text-muted)" label="Quiet · no flagged signal" />
      <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
        x: time created · y: mode · size: ticket · pulse: T-7d or critical
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <Briefcase size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
      <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 6 }}>
        No decisions in the constellation yet
      </h3>
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-muted)',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        Create your first investment, acquisition, or strategic decision to see it land here. Once
        two decisions exist, link them via thesis-anchor / dependency / strategic-frame edges to
        surface the cognitive lineage across your pipeline.
      </p>
    </div>
  );
}

/**
 * Render a smooth Bezier curve from (fromX, fromY) → (toX, toY). The
 * control point is offset perpendicular to the line so multiple links
 * between similar regions don't perfectly overlap.
 */
function curvedPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  // Curve perpendicular to the line. Distance scaled so short edges
  // bend more (visible curve) and long edges stay nearly straight.
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(40, dist * 0.18);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  const cx = midX + nx * offset;
  const cy = midY + ny * offset;
  return `M ${fromX} ${fromY} Q ${cx} ${cy} ${toX} ${toY}`;
}
