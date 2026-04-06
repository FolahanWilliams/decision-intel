'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatBiasName } from '@/lib/utils/labels';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BiasNode {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'cognitive' | 'emotional' | 'social';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface BiasConnection {
  from: string;
  to: string;
  strength: number;
}

export interface BiasNetworkProps {
  biases: Array<{
    biasType: string;
    severity: string;
    category?: string;
    excerpt?: string;
    explanation?: string;
    suggestion?: string;
  }>;
  /** Compact mode hides the details panel and uses smaller dimensions */
  compact?: boolean;
  /** Called when a bias node is clicked (for external integration like modals) */
  onBiasClick?: (biasType: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const BIAS_DEFINITIONS: Record<string, string> = {
  'Confirmation Bias':
    'Tendency to search for, interpret, and recall information that confirms existing beliefs.',
  'Anchoring Bias':
    'Over-reliance on the first piece of information encountered when making decisions.',
  'Sunk Cost Fallacy':
    'Continuing an endeavor due to previously invested resources rather than future value.',
  'Overconfidence Bias':
    'Excessive confidence in own answers or judgments, often underestimating uncertainty.',
  Groupthink: 'Desire for conformity in a group overrides realistic appraisal of alternatives.',
  'Authority Bias': 'Tendency to attribute greater accuracy to the opinion of an authority figure.',
  'Bandwagon Effect':
    'Tendency to do or believe things because many other people do or believe the same.',
  'Loss Aversion':
    'The pain of losing is psychologically about twice as powerful as the pleasure of gaining.',
  'Availability Heuristic':
    'Overestimating the importance of information that is most readily available.',
  'Hindsight Bias': 'Tendency to see past events as having been predictable when they were not.',
  'Planning Fallacy': 'Tendency to underestimate the time, costs, and risks of future actions.',
  'Status Quo Bias':
    'Preference for the current state of affairs, resisting change even when beneficial.',
  'Framing Effect':
    'Drawing different conclusions from the same information depending on how it is presented.',
  'Selective Perception':
    'Tendency to perceive what we expect to perceive rather than what actually exists.',
  'Recency Bias': 'Giving disproportionate weight to recent events over historical ones.',
  'Cognitive Misering':
    'Taking mental shortcuts to avoid effortful thinking, defaulting to simple heuristics.',
};

const biasRelationships: Record<string, string[]> = {
  'Confirmation Bias': ['Selective Perception', 'Anchoring Bias', 'Availability Heuristic'],
  'Anchoring Bias': ['Confirmation Bias', 'Framing Effect', 'Status Quo Bias'],
  'Sunk Cost Fallacy': ['Loss Aversion', 'Status Quo Bias', 'Overconfidence Bias'],
  'Overconfidence Bias': ['Confirmation Bias', 'Hindsight Bias', 'Planning Fallacy'],
  Groupthink: ['Authority Bias', 'Bandwagon Effect', 'Confirmation Bias'],
  'Authority Bias': ['Groupthink', 'Confirmation Bias'],
  'Bandwagon Effect': ['Groupthink', 'Authority Bias'],
  'Loss Aversion': ['Sunk Cost Fallacy', 'Status Quo Bias', 'Framing Effect'],
  'Availability Heuristic': ['Recency Bias', 'Confirmation Bias'],
  'Hindsight Bias': ['Overconfidence Bias', 'Confirmation Bias'],
  'Planning Fallacy': ['Overconfidence Bias', 'Optimism Bias'],
  'Status Quo Bias': ['Loss Aversion', 'Anchoring Bias', 'Sunk Cost Fallacy'],
  'Framing Effect': ['Anchoring Bias', 'Loss Aversion'],
  'Selective Perception': ['Confirmation Bias', 'Availability Heuristic'],
  'Recency Bias': ['Availability Heuristic'],
  'Cognitive Misering': ['Confirmation Bias', 'Overconfidence Bias', 'Groupthink'],
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const SEVERITY_BG: Record<string, string> = {
  low: 'rgba(34,197,94,0.15)',
  medium: 'rgba(245,158,11,0.15)',
  high: 'rgba(239,68,68,0.15)',
  critical: 'rgba(220,38,38,0.2)',
};

const CATEGORY_COLORS: Record<string, string> = {
  cognitive: '#d4d4d8',
  emotional: '#ec4899',
  social: '#FBBF24',
};

type ViewMode = 'network' | 'cluster';
type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

// ─── Force-directed layout simulation ───────────────────────────────────────

function runForceSimulation(
  nodes: BiasNode[],
  connections: BiasConnection[],
  width: number,
  height: number,
  iterations: number = 150
): BiasNode[] {
  const centerX = width / 2;
  const centerY = height / 2;

  // Spread nodes in a circle initially so they start well-separated
  const initRadius = Math.min(width, height) * 0.35;
  const simNodes = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return {
      ...n,
      x: centerX + Math.cos(angle) * initRadius,
      y: centerY + Math.sin(angle) * initRadius,
      vx: 0,
      vy: 0,
    };
  });

  // Ideal link distance — nodes should settle roughly this far apart
  const idealDist = Math.min(width, height) / (Math.sqrt(nodes.length) + 1);

  // Build index map once for O(1) lookups (avoids O(n) .find() per connection per iteration)
  const nodeIndex = new Map(simNodes.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = Math.max(0.01, 1 - iter / iterations);

    // Repulsion between all node pairs (Coulomb-like, with minimum distance floor)
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const dx = simNodes[j].x - simNodes[i].x;
        const dy = simNodes[j].y - simNodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        // Strong repulsion that keeps nodes at least idealDist apart
        const repulsionStrength = 8000 * alpha;
        const force = repulsionStrength / (dist * dist);
        const nx = dx / dist;
        const ny = dy / dist;
        simNodes[i].vx -= nx * force;
        simNodes[i].vy -= ny * force;
        simNodes[j].vx += nx * force;
        simNodes[j].vy += ny * force;
      }
    }

    // Spring attraction along connections — pulls toward idealDist, not toward zero
    for (const conn of connections) {
      const sourceIdx = nodeIndex.get(conn.from);
      const targetIdx = nodeIndex.get(conn.to);
      if (sourceIdx === undefined || targetIdx === undefined) continue;
      const source = simNodes[sourceIdx];
      const target = simNodes[targetIdx];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      // Spring force: positive = attract, negative = repel
      const displacement = dist - idealDist * 0.8;
      const springK = 0.04 * alpha * conn.strength;
      const force = springK * displacement;
      const nx = dx / dist;
      const ny = dy / dist;
      source.vx += nx * force;
      source.vy += ny * force;
      target.vx -= nx * force;
      target.vy -= ny * force;
    }

    // Gentle center gravity to keep the graph centered
    for (const node of simNodes) {
      node.vx += (centerX - node.x) * 0.005 * alpha;
      node.vy += (centerY - node.y) * 0.005 * alpha;
    }

    // Apply velocities with damping
    const damping = 0.8;
    for (const node of simNodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      // Keep within bounds with generous padding
      const pad = node.radius + 40;
      node.x = Math.max(pad, Math.min(width - pad, node.x));
      node.y = Math.max(pad, Math.min(height - pad, node.y));
    }
  }

  return simNodes;
}

// ─── Severity Donut Chart ───────────────────────────────────────────────────

function SeverityDonut({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const severities = ['critical', 'high', 'medium', 'low'] as const;
  const size = 80;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {severities.map(sev => {
          const count = counts[sev] || 0;
          if (count === 0) return null;
          const pct = count / total;
          const dashLength = pct * circumference;
          const dashOffset = -offset;
          offset += dashLength;

          return (
            <circle
              key={sev}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={SEVERITY_COLORS[sev]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-primary)"
          fontSize="18"
          fontWeight="800"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {severities.map(sev => {
          const count = counts[sev] || 0;
          if (count === 0) return null;
          return (
            <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[sev],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  textTransform: 'capitalize',
                }}
              >
                {sev}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: SEVERITY_COLORS[sev] }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main BiasNetwork Component ─────────────────────────────────────────────

export function BiasNetwork({ biases = [], compact = false, onBiasClick }: BiasNetworkProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewMode, setViewModeRaw] = useState<ViewMode>('network');
  const [severityFilter, setSeverityFilterRaw] = useState<SeverityFilter>('all');

  // Wrap setters to reset selection when filter/view changes
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeRaw(mode);
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, []);
  const setSeverityFilter = useCallback((filter: SeverityFilter) => {
    setSeverityFilterRaw(filter);
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, []);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter biases by severity
  const filteredBiases = useMemo(() => {
    if (severityFilter === 'all') return biases;
    return biases.filter(b => b.severity === severityFilter);
  }, [biases, severityFilter]);

  const svgWidth = compact ? 440 : 600;
  const svgHeight = compact ? 440 : 600;

  const { nodes, connections } = useMemo(() => {
    if (!filteredBiases || filteredBiases.length === 0) {
      return { nodes: [], connections: [] };
    }

    const nodeList: BiasNode[] = filteredBiases.map(bias => {
      const sev = (bias.severity || 'medium') as BiasNode['severity'];
      return {
        id: bias.biasType,
        name: bias.biasType,
        severity: sev,
        category: ((bias.category as string)?.toLowerCase() as BiasNode['category']) || 'cognitive',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: sev === 'critical' ? 32 : sev === 'high' ? 28 : sev === 'medium' ? 24 : 20,
      };
    });

    const connectionList: BiasConnection[] = [];
    const connectedNodes = new Set<string>();

    // Phase 1: Known relationships from the hardcoded map
    nodeList.forEach(node => {
      const related = biasRelationships[node.id] || [];
      related.forEach((relatedBias, idx) => {
        const targetNode = nodeList.find(n => n.id === relatedBias || n.name === relatedBias);
        if (
          targetNode &&
          !connectionList.find(
            c =>
              (c.from === node.id && c.to === targetNode.id) ||
              (c.from === targetNode.id && c.to === node.id)
          )
        ) {
          connectionList.push({
            from: node.id,
            to: targetNode.id,
            strength: 0.9 - idx * 0.15,
          });
          connectedNodes.add(node.id);
          connectedNodes.add(targetNode.id);
        }
      });
    });

    // Phase 2: Connect orphan nodes (not in biasRelationships map) to
    // their nearest neighbours so every node has at least one edge.
    const orphans = nodeList.filter(n => !connectedNodes.has(n.id));
    orphans.forEach(orphan => {
      // Connect to closest severity peer first, then any node
      const peers = nodeList.filter(n => n.id !== orphan.id);
      const sameSeverity = peers.filter(n => n.severity === orphan.severity);
      const targets = sameSeverity.length > 0 ? sameSeverity : peers;

      // Connect to up to 2 other nodes
      targets.slice(0, 2).forEach((target, idx) => {
        if (
          !connectionList.find(
            c =>
              (c.from === orphan.id && c.to === target.id) ||
              (c.from === target.id && c.to === orphan.id)
          )
        ) {
          connectionList.push({
            from: orphan.id,
            to: target.id,
            strength: 0.5 - idx * 0.1,
          });
        }
      });
    });

    return { nodes: nodeList, connections: connectionList };
  }, [filteredBiases]);

  // Run force simulation
  const positionedNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    return runForceSimulation(nodes, connections, svgWidth, svgHeight);
  }, [nodes, connections, svgWidth, svgHeight]);

  // O(1) lookup map for positioned nodes (used in connection rendering & details panel)
  const positionedNodeMap = useMemo(
    () => new Map(positionedNodes.map(n => [n.id, n])),
    [positionedNodes]
  );

  const prefersReducedMotion = useReducedMotion();

  // Severity counts for donut
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    biases.forEach(b => {
      const sev = b.severity || 'medium';
      if (counts[sev] !== undefined) counts[sev]++;
    });
    return counts;
  }, [biases]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
      if (onBiasClick) onBiasClick(nodeId);
    },
    [onBiasClick]
  );

  if (biases.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: compact ? '200px' : '300px',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        No bias data available
      </div>
    );
  }

  const selectedNode = selectedNodeId ? (positionedNodeMap.get(selectedNodeId) ?? null) : null;
  const activeHover = hoveredNodeId ? (positionedNodeMap.get(hoveredNodeId) ?? null) : null;
  const biasDataMap = Object.fromEntries(biases.map(b => [b.biasType, b]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: compact ? '8px 0' : '8px 0 12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* Severity filter pills */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => {
            const isActive = severityFilter === sev;
            const count = sev === 'all' ? biases.length : severityCounts[sev] || 0;
            if (sev !== 'all' && count === 0) return null;

            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive
                    ? sev === 'all'
                      ? 'var(--bg-card-hover)'
                      : SEVERITY_BG[sev]
                    : 'transparent',
                  border: `1px solid ${
                    isActive
                      ? sev === 'all'
                        ? 'var(--border-color)'
                        : SEVERITY_COLORS[sev] + '60'
                      : 'var(--bg-elevated)'
                  }`,
                  borderRadius: '20px',
                  color: isActive
                    ? sev === 'all'
                      ? 'var(--text-primary)'
                      : SEVERITY_COLORS[sev]
                    : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: prefersReducedMotion ? 'none' : 'all 0.15s',
                }}
              >
                {sev === 'all' ? `All (${count})` : `${sev} (${count})`}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--bg-elevated)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          {(['network', 'cluster'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '3px 12px',
                fontSize: '11px',
                fontWeight: viewMode === mode ? 700 : 400,
                background: viewMode === mode ? 'var(--bg-card-hover)' : 'transparent',
                color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: prefersReducedMotion ? 'none' : 'all 0.15s',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'network' ? (
        /* ─── Network Graph View ──────────────────────────────────── */
        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              aspectRatio: `${svgWidth} / ${svgHeight}`,
              maxHeight: compact ? '420px' : '520px',
              background: 'radial-gradient(ellipse at center, var(--bg-card) 0%, transparent 70%)',
              borderRadius: '8px',
            }}
          >
            <defs>
              {/* Glow filter */}
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              {/* Connection gradient */}
              <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--text-secondary)" />
                <stop offset="100%" stopColor="var(--border-hover)" />
              </linearGradient>
            </defs>

            {/* Grid dots background */}
            {Array.from({ length: 12 }).map((_, i) =>
              Array.from({ length: 12 }).map((_, j) => (
                <circle
                  key={`dot-${i}-${j}`}
                  cx={(i + 1) * (svgWidth / 13)}
                  cy={(j + 1) * (svgHeight / 13)}
                  r={0.5}
                  fill="var(--border-color)"
                />
              ))
            )}

            {/* Connections */}
            {connections.map((conn, idx) => {
              const fromNode = positionedNodeMap.get(conn.from);
              const toNode = positionedNodeMap.get(conn.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted = selectedNodeId
                ? conn.from === selectedNodeId || conn.to === selectedNodeId
                : hoveredNodeId
                  ? conn.from === hoveredNodeId || conn.to === hoveredNodeId
                  : false;
              const isDimmed = (selectedNodeId || hoveredNodeId) && !isHighlighted;

              return (
                <line
                  key={`conn-${idx}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={
                    isHighlighted ? SEVERITY_COLORS[fromNode.severity] : 'rgba(148,163,184,0.6)'
                  }
                  strokeOpacity={isDimmed ? 0.08 : isHighlighted ? 0.85 : 0.45}
                  strokeWidth={isHighlighted ? Math.max(conn.strength * 5, 2.5) : 1.5}
                  strokeLinecap="round"
                  style={{ transition: prefersReducedMotion ? 'none' : 'all 0.3s ease' }}
                />
              );
            })}

            {/* Nodes */}
            {positionedNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isActive = isSelected || isHovered;
              const isDimmed =
                (selectedNodeId || hoveredNodeId) &&
                !isActive &&
                !connections.some(
                  c =>
                    (c.from === (selectedNodeId || hoveredNodeId) && c.to === node.id) ||
                    (c.from === node.id && c.to === (selectedNodeId || hoveredNodeId))
                );

              const nodeRadius = isActive ? node.radius + 4 : node.radius;
              const sevColor = SEVERITY_COLORS[node.severity];

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.name}, severity: ${node.severity}`}
                  aria-pressed={isSelected}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNodeClick(node.id);
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    opacity: isDimmed ? 0.15 : 1,
                    transition: prefersReducedMotion ? 'none' : 'opacity 0.3s ease',
                    outline: 'none',
                  }}
                >
                  {/* Outer glow ring for active */}
                  {isActive && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius + 8}
                      fill="none"
                      stroke={sevColor}
                      strokeWidth={1.5}
                      strokeOpacity={0.3}
                      strokeDasharray="4,4"
                    >
                      {!prefersReducedMotion && (
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from={`0 ${node.x} ${node.y}`}
                          to={`360 ${node.x} ${node.y}`}
                          dur="8s"
                          repeatCount="indefinite"
                        />
                      )}
                    </circle>
                  )}

                  {/* Background glow */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 2}
                    fill={sevColor}
                    fillOpacity={isActive ? 0.12 : 0.04}
                  />

                  {/* Main node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius}
                    fill={sevColor}
                    fillOpacity={isActive ? 0.3 : 0.15}
                    stroke={sevColor}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeOpacity={isActive ? 1 : 0.6}
                  />

                  {/* Category indicator */}
                  <circle
                    cx={node.x + nodeRadius * 0.65}
                    cy={node.y - nodeRadius * 0.65}
                    r={5}
                    fill={CATEGORY_COLORS[node.category]}
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth={1.5}
                  />

                  {/* Letter */}
                  <text
                    x={node.x}
                    y={node.y}
                    dy="0.35em"
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize={isActive ? '15' : '13'}
                    fontWeight="700"
                    pointerEvents="none"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {node.name.charAt(0).toUpperCase()}
                  </text>

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + nodeRadius + 16}
                    textAnchor="middle"
                    fill={isActive ? 'var(--text-primary)' : 'var(--text-secondary)'}
                    fontSize={isActive ? '11' : '9.5'}
                    fontWeight={isActive ? '700' : '500'}
                    pointerEvents="none"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {node.name.length > 22 && !isActive
                      ? node.name.substring(0, 20) + '...'
                      : node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {activeHover && !selectedNodeId && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                maxWidth: '240px',
                padding: '10px 14px',
                background: 'rgba(15,15,20,0.95)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${SEVERITY_COLORS[activeHover.severity]}40`,
                borderRadius: '10px',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: SEVERITY_COLORS[activeHover.severity],
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeHover.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: SEVERITY_BG[activeHover.severity],
                    color: SEVERITY_COLORS[activeHover.severity],
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {activeHover.severity}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {BIAS_DEFINITIONS[activeHover.name] ||
                  'A cognitive bias detected in the decision path.'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {
                  connections.filter(c => c.from === activeHover.id || c.to === activeHover.id)
                    .length
                }{' '}
                connections
              </div>
            </div>
          )}

          {/* Help text */}
          {!selectedNodeId && !hoveredNodeId && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                background: 'var(--bg-elevated)',
                padding: '3px 12px',
                borderRadius: '10px',
                pointerEvents: 'none',
              }}
            >
              Hover to preview &middot; Click to explore relationships
            </div>
          )}
        </div>
      ) : (
        /* ─── Cluster View ────────────────────────────────────────── */
        <ClusterView
          biases={filteredBiases}
          severityCounts={severityCounts}
          onBiasClick={onBiasClick}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <div
          style={{
            marginTop: '12px',
            padding: '14px 16px',
            background: 'rgba(15,15,20,0.6)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${SEVERITY_COLORS[selectedNode.severity]}30`,
            borderRadius: '10px',
            transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[selectedNode.severity],
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedNode.name}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: SEVERITY_BG[selectedNode.severity],
                  color: SEVERITY_COLORS[selectedNode.severity],
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {selectedNode.severity}
              </span>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              style={{
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--bg-active)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>

          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 8px 0',
            }}
          >
            {BIAS_DEFINITIONS[selectedNode.name] ||
              'A cognitive bias detected in the decision path.'}
          </p>

          {/* Excerpt if available */}
          {biasDataMap[selectedNode.name]?.excerpt && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                borderLeft: `2px solid ${SEVERITY_COLORS[selectedNode.severity]}40`,
                paddingLeft: '10px',
                marginBottom: '8px',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{biasDataMap[selectedNode.name].excerpt}&rdquo;
            </div>
          )}

          {/* Connected biases */}
          {(() => {
            const relatedConns = connections.filter(
              c => c.from === selectedNode.id || c.to === selectedNode.id
            );
            if (relatedConns.length === 0) return null;
            return (
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Connected biases
                </span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {relatedConns.map(c => {
                    const otherId = c.from === selectedNode.id ? c.to : c.from;
                    const otherNode = positionedNodeMap.get(otherId);
                    if (!otherNode) return null;
                    return (
                      <button
                        key={otherId}
                        onClick={() => setSelectedNodeId(otherId)}
                        style={{
                          padding: '3px 10px',
                          fontSize: '11px',
                          background: SEVERITY_BG[otherNode.severity],
                          border: `1px solid ${SEVERITY_COLORS[otherNode.severity]}30`,
                          borderRadius: '14px',
                          color: SEVERITY_COLORS[otherNode.severity],
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: prefersReducedMotion ? 'none' : 'all 0.15s',
                        }}
                      >
                        {otherNode.name}
                        <span style={{ opacity: 0.5, marginLeft: '4px', fontSize: '10px' }}>
                          {Math.round(c.strength * 100)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Severity Donut (shown when no node selected in non-compact mode) */}
      {!compact && !selectedNode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px',
            padding: '10px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-card-hover)',
            borderRadius: '10px',
          }}
        >
          <SeverityDonut counts={severityCounts} />
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Total Connections
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {connections.length}
            </span>
          </div>
        </div>
      )}

      {/* Legend (compact only, when no node selected) */}
      {compact && !selectedNode && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--bg-card-hover)',
          }}
        >
          {(['low', 'medium', 'high', 'critical'] as const).map(sev => (
            <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '2px',
                  background: SEVERITY_BG[sev],
                  border: `1px solid ${SEVERITY_COLORS[sev]}`,
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  textTransform: 'capitalize',
                }}
              >
                {sev}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cluster View ───────────────────────────────────────────────────────────

function ClusterView({
  biases,
  severityCounts: _severityCounts,
  onBiasClick,
  prefersReducedMotion = false,
}: {
  biases: BiasNetworkProps['biases'];
  severityCounts: Record<string, number>;
  onBiasClick?: (biasType: string) => void;
  prefersReducedMotion?: boolean;
}) {
  const clusters = useMemo(() => {
    const groups: Record<string, typeof biases> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    biases.forEach(bias => {
      const sev = bias.severity || 'medium';
      if (groups[sev]) groups[sev].push(bias);
      else groups.medium.push(bias);
    });

    return groups;
  }, [biases]);

  const clusterMeta: Record<string, { label: string; description: string }> = {
    critical: {
      label: 'Critical',
      description: 'Immediate attention required — major decision risk',
    },
    high: {
      label: 'High',
      description: 'Significant bias with material impact on decision quality',
    },
    medium: { label: 'Medium', description: 'Notable bias that warrants monitoring' },
    low: { label: 'Low', description: 'Minor bias with limited decision impact' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
        const items = clusters[severity];
        if (!items || items.length === 0) return null;
        const meta = clusterMeta[severity];
        const color = SEVERITY_COLORS[severity];
        const bg = SEVERITY_BG[severity];

        return (
          <div
            key={severity}
            style={{
              padding: '14px 16px',
              background: bg,
              border: `1px solid ${color}25`,
              borderRadius: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color }}>{meta.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {meta.description}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color,
                  background: `${color}15`,
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}
              >
                {items.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {items.map((bias, idx) => (
                <button
                  key={idx}
                  onClick={() => onBiasClick?.(bias.biasType)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${color}30`,
                    borderRadius: '16px',
                    color: 'var(--text-primary)',
                    cursor: onBiasClick ? 'pointer' : 'default',
                    transition: prefersReducedMotion ? 'none' : 'all 0.15s',
                  }}
                >
                  {formatBiasName(bias.biasType)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
