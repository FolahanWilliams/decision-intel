'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  POSITIONING_NODES,
  POSITIONING_EDGES,
  type PositioningNode,
  type GraphNodeKind,
} from '@/lib/data/positioning-copilot';

const WIDTH = 720;
const HEIGHT = 520;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

const KIND_COLOR: Record<GraphNodeKind, string> = {
  core: '#16A34A',
  category: '#0EA5E9',
  buyer: '#8B5CF6',
  problem: '#EF4444',
  capability: '#14B8A6',
  proof: '#F59E0B',
  pitch: '#EC4899',
  channel: '#64748B',
};

const KIND_LABEL: Record<GraphNodeKind, string> = {
  core: 'Core',
  category: 'Category',
  buyer: 'Buyer',
  problem: 'Problem',
  capability: 'Capability',
  proof: 'Proof',
  pitch: 'Pitch',
  channel: 'Channel',
};

// Group nodes into angular sectors, place by kind.
const KIND_ANGLES: Record<GraphNodeKind, { start: number; radius: number }> = {
  core: { start: 0, radius: 0 },
  category: { start: 270, radius: 110 }, // top
  buyer: { start: 200, radius: 150 }, // upper-left
  problem: { start: 235, radius: 205 }, // lower-left
  capability: { start: 25, radius: 155 }, // right
  proof: { start: 340, radius: 215 }, // upper-right arc
  pitch: { start: 310, radius: 105 }, // top-right near core
  channel: { start: 100, radius: 210 }, // lower arc
};

interface PositionedNode extends PositioningNode {
  x: number;
  y: number;
}

function computeLayout(): PositionedNode[] {
  const byKind = new Map<GraphNodeKind, PositioningNode[]>();
  POSITIONING_NODES.forEach(n => {
    if (!byKind.has(n.kind)) byKind.set(n.kind, []);
    byKind.get(n.kind)!.push(n);
  });

  const positioned: PositionedNode[] = [];
  byKind.forEach((nodes, kind) => {
    const { start, radius } = KIND_ANGLES[kind];
    if (kind === 'core') {
      positioned.push({ ...nodes[0], x: CENTER_X, y: CENTER_Y });
      return;
    }
    // Spread siblings in a small fan around the sector anchor.
    const spread = Math.min(36, 12 * nodes.length);
    nodes.forEach((n, i) => {
      const offset =
        nodes.length === 1 ? 0 : (i - (nodes.length - 1) / 2) * (spread / Math.max(1, nodes.length - 1));
      const angle = ((start + offset - 90) * Math.PI) / 180;
      positioned.push({
        ...n,
        x: CENTER_X + Math.cos(angle) * radius,
        y: CENTER_Y + Math.sin(angle) * radius,
      });
    });
  });
  return positioned;
}

export function PositioningGraph() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('core');
  const nodes = useMemo(() => computeLayout(), []);
  const activeId = hoverId ?? selectedId;

  const { connectedNodeIds, connectedEdgeKeys } = useMemo(() => {
    const nodeIds = new Set<string>([activeId]);
    const edgeKeys = new Set<string>();
    POSITIONING_EDGES.forEach(e => {
      if (e.from === activeId || e.to === activeId) {
        nodeIds.add(e.from);
        nodeIds.add(e.to);
        edgeKeys.add(`${e.from}->${e.to}`);
      }
    });
    return { connectedNodeIds: nodeIds, connectedEdgeKeys: edgeKeys };
  }, [activeId]);

  const selectedNode = nodes.find(n => n.id === selectedId) ?? nodes[0];

  return (
    <div>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 12,
        }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label="Positioning knowledge graph"
        >
          <defs>
            <radialGradient id="pg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={CENTER_X} cy={CENTER_Y} r={240} fill="url(#pg-glow)" />

          {/* Edges */}
          {POSITIONING_EDGES.map(e => {
            const from = nodes.find(n => n.id === e.from);
            const to = nodes.find(n => n.id === e.to);
            if (!from || !to) return null;
            const key = `${e.from}->${e.to}`;
            const isActive = connectedEdgeKeys.has(key);
            return (
              <line
                key={key}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isActive ? '#16A34A' : 'var(--border-color)'}
                strokeWidth={isActive ? 1.5 : 0.75}
                strokeOpacity={isActive ? 0.75 : 0.4}
                style={{ transition: 'all 0.2s ease' }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const color = KIND_COLOR[n.kind];
            const isCore = n.kind === 'core';
            const r = isCore ? 40 : 26;
            const isActive = activeId === n.id;
            const isConnected = connectedNodeIds.has(n.id);
            const opacity = isConnected ? 1 : 0.35;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => setSelectedId(n.id)}
                style={{ cursor: 'pointer', opacity, transition: 'opacity 0.2s ease' }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isActive ? r + 4 : r}
                  fill={isActive ? color : 'var(--bg-primary)'}
                  stroke={color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ transition: 'all 0.15s ease' }}
                />
                <text
                  x={n.x}
                  y={n.y + 1}
                  textAnchor="middle"
                  fontSize={isCore ? 12 : 10}
                  fontWeight={isCore ? 800 : 600}
                  fill={isActive ? '#ffffff' : 'var(--text-primary)'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {n.label}
                </text>
                <text
                  x={n.x}
                  y={n.y + (isCore ? 16 : 13)}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="700"
                  fill={isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)'}
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {KIND_LABEL[n.kind]}
                </text>
              </g>
            );
          })}
        </svg>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: '10px 4px 2px',
            borderTop: '1px solid var(--border-color)',
            marginTop: 8,
          }}
        >
          {Object.keys(KIND_COLOR).map(k => {
            const kind = k as GraphNodeKind;
            return (
              <div
                key={kind}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: KIND_COLOR[kind],
                    display: 'inline-block',
                  }}
                />
                {KIND_LABEL[kind]}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            marginTop: 12,
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${KIND_COLOR[selectedNode.kind]}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: KIND_COLOR[selectedNode.kind],
              marginBottom: 2,
            }}
          >
            {KIND_LABEL[selectedNode.kind]}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            {selectedNode.label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {selectedNode.detail}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

