'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';

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
  'Confirmation Bias': 'Tendency to search for, interpret, and recall information that confirms existing beliefs.',
  'Anchoring Bias': 'Over-reliance on the first piece of information encountered when making decisions.',
  'Sunk Cost Fallacy': 'Continuing an endeavor due to previously invested resources rather than future value.',
  'Overconfidence Bias': 'Excessive confidence in own answers or judgments, often underestimating uncertainty.',
  Groupthink: 'Desire for conformity in a group overrides realistic appraisal of alternatives.',
  'Authority Bias': 'Tendency to attribute greater accuracy to the opinion of an authority figure.',
  'Bandwagon Effect': 'Tendency to do or believe things because many other people do or believe the same.',
  'Loss Aversion': 'The pain of losing is psychologically about twice as powerful as the pleasure of gaining.',
  'Availability Heuristic': 'Overestimating the importance of information that is most readily available.',
  'Hindsight Bias': 'Tendency to see past events as having been predictable when they were not.',
  'Planning Fallacy': 'Tendency to underestimate the time, costs, and risks of future actions.',
  'Status Quo Bias': 'Preference for the current state of affairs, resisting change even when beneficial.',
  'Framing Effect': 'Drawing different conclusions from the same information depending on how it is presented.',
  'Selective Perception': 'Tendency to perceive what we expect to perceive rather than what actually exists.',
  'Recency Bias': 'Giving disproportionate weight to recent events over historical ones.',
  'Cognitive Misering': 'Taking mental shortcuts to avoid effortful thinking, defaulting to simple heuristics.',
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
  cognitive: '#6366f1',
  emotional: '#ec4899',
  social: '#8b5cf6',
};

type ViewMode = 'network' | 'cluster';
type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

// ─── Force-directed layout simulation ───────────────────────────────────────

function runForceSimulation(
  nodes: BiasNode[],
  connections: BiasConnection[],
  width: number,
  height: number,
  iterations: number = 80
): BiasNode[] {
  const simNodes = nodes.map(n => ({
    ...n,
    x: width / 2 + (Math.random() - 0.5) * width * 0.6,
    y: height / 2 + (Math.random() - 0.5) * height * 0.6,
    vx: 0,
    vy: 0,
  }));

  const centerX = width / 2;
  const centerY = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const repulsion = 3000 * alpha;
    const attraction = 0.02 * alpha;
    const centerGravity = 0.01;

    // Repulsion between all nodes
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const dx = simNodes[j].x - simNodes[i].x;
        const dy = simNodes[j].y - simNodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        simNodes[i].vx -= fx;
        simNodes[i].vy -= fy;
        simNodes[j].vx += fx;
        simNodes[j].vy += fy;
      }
    }

    // Attraction along connections
    for (const conn of connections) {
      const source = simNodes.find(n => n.id === conn.from);
      const target = simNodes.find(n => n.id === conn.to);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = attraction * dist * conn.strength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Center gravity
    for (const node of simNodes) {
      node.vx += (centerX - node.x) * centerGravity;
      node.vy += (centerY - node.y) * centerGravity;
    }

    // Apply velocities with damping
    const damping = 0.85;
    for (const node of simNodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      // Keep within bounds
      const pad = node.radius + 30;
      node.x = Math.max(pad, Math.min(width - pad, node.x));
      node.y = Math.max(pad, Math.min(height - pad, node.y));
    }
  }

  return simNodes;
}

// ─── Severity Donut Chart ───────────────────────────────────────────────────

function SeverityDonut({
  counts,
}: {
  counts: Record<string, number>;
}) {
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
          fill="white"
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
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
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
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter biases by severity
  const filteredBiases = useMemo(() => {
    if (severityFilter === 'all') return biases;
    return biases.filter(b => b.severity === severityFilter);
  }, [biases, severityFilter]);

  const svgWidth = compact ? 360 : 500;
  const svgHeight = compact ? 360 : 500;

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

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, [severityFilter, viewMode]);

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

  const selectedNode = selectedNodeId ? positionedNodes.find(n => n.id === selectedNodeId) : null;
  const activeHover = hoveredNodeId ? positionedNodes.find(n => n.id === hoveredNodeId) : null;
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
                      ? 'rgba(99,102,241,0.2)'
                      : SEVERITY_BG[sev]
                    : 'transparent',
                  border: `1px solid ${
                    isActive
                      ? sev === 'all'
                        ? 'rgba(99,102,241,0.4)'
                        : SEVERITY_COLORS[sev] + '60'
                      : 'rgba(255,255,255,0.08)'
                  }`,
                  borderRadius: '20px',
                  color: isActive
                    ? sev === 'all'
                      ? '#a5b4fc'
                      : SEVERITY_COLORS[sev]
                    : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
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
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
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
                background: viewMode === mode ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: viewMode === mode ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
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
            style={{
              width: '100%',
              maxHeight: compact ? '380px' : '460px',
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.03) 0%, transparent 70%)',
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
                <stop offset="0%" stopColor="rgba(99,102,241,0.6)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0.2)" />
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
                  fill="rgba(255,255,255,0.04)"
                />
              ))
            )}

            {/* Connections */}
            {connections.map((conn, idx) => {
              const fromNode = positionedNodes.find(n => n.id === conn.from);
              const toNode = positionedNodes.find(n => n.id === conn.to);
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
                  stroke={isHighlighted ? SEVERITY_COLORS[fromNode.severity] : 'rgba(255,255,255,0.12)'}
                  strokeOpacity={isDimmed ? 0.05 : isHighlighted ? 0.7 : 0.2}
                  strokeWidth={isHighlighted ? Math.max(conn.strength * 5, 2) : 1}
                  strokeLinecap="round"
                  style={{ transition: 'all 0.3s ease' }}
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
                    ((c.from === (selectedNodeId || hoveredNodeId)) && c.to === node.id) ||
                    (c.from === node.id && (c.to === (selectedNodeId || hoveredNodeId)))
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
                    transition: 'opacity 0.3s ease',
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
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${node.x} ${node.y}`}
                        to={`360 ${node.x} ${node.y}`}
                        dur="8s"
                        repeatCount="indefinite"
                      />
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
                    fill="rgba(255,255,255,0.95)"
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
                    fill={isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: SEVERITY_COLORS[activeHover.severity],
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
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
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                {BIAS_DEFINITIONS[activeHover.name] || 'A cognitive bias detected in the decision path.'}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>
                {connections.filter(c => c.from === activeHover.id || c.to === activeHover.id).length} connections
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
                color: 'rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.5)',
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
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[selectedNode.severity],
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
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
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '11px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
            {BIAS_DEFINITIONS[selectedNode.name] || 'A cognitive bias detected in the decision path.'}
          </p>

          {/* Excerpt if available */}
          {biasDataMap[selectedNode.name]?.excerpt && (
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
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
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Connected biases
                </span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {relatedConns.map(c => {
                    const otherId = c.from === selectedNode.id ? c.to : c.from;
                    const otherNode = positionedNodes.find(n => n.id === otherId);
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
                          transition: 'all 0.15s',
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
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
          }}
        >
          <SeverityDonut counts={severityCounts} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Connections
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#a5b4fc' }}>
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
            borderTop: '1px solid rgba(255,255,255,0.06)',
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
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
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
  severityCounts,
  onBiasClick,
}: {
  biases: BiasNetworkProps['biases'];
  severityCounts: Record<string, number>;
  onBiasClick?: (biasType: string) => void;
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
    critical: { label: 'Critical', description: 'Immediate attention required — major decision risk' },
    high: { label: 'High', description: 'Significant bias with material impact on decision quality' },
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color }}>
                  {meta.label}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
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
                    color: 'rgba(255,255,255,0.8)',
                    cursor: onBiasClick ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                >
                  {bias.biasType}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Legacy export for backward compatibility ───────────────────────────────

export function BiasClusterChart({ biases }: BiasNetworkProps) {
  return <ClusterView biases={biases} severityCounts={{}} />;
}
