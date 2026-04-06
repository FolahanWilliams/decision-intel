'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * HeroDecisionGraph — Simulated interactive force-directed bias/decision graph.
 *
 * Shows a realistic preview of what the product's decision analysis output
 * looks like: decisions as central nodes, biases as surrounding threat nodes,
 * toxic combination edges pulsing between them, and severity-coded coloring.
 *
 * Uses a simple spring-physics simulation (no D3 dependency) to create
 * organic, slightly-moving node positions that feel alive.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: 'decision' | 'bias' | 'outcome';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number; // fixed x (for pinned nodes)
  fy?: number;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'detected' | 'toxic' | 'influence';
  label?: string;
}

// ─── Colors ─────────────────────────────────────────────────────────────────

const COLORS = {
  decision: '#0F172A',
  decisionStroke: '#334155',
  bias: {
    critical: '#DC2626',
    high: '#F97316',
    medium: '#EAB308',
    low: '#84CC16',
  },
  outcome: '#7C3AED',
  edge: {
    detected: '#94A3B8',
    toxic: '#DC2626',
    influence: '#64748B',
  },
  text: '#0F172A',
  textMuted: '#64748B',
  bg: '#FFFFFF',
  tooltipBg: '#0F172A',
  tooltipText: '#FFFFFF',
  hoverGlow: 'rgba(220, 38, 38, 0.15)',
};

// ─── Simulated Data ─────────────────────────────────────────────────────────
// Realistic output from analyzing a PE acquisition memo

const NODES: Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy' | 'radius'>[] = [
  // Central decisions
  { id: 'acq_decision', label: 'Acquisition Thesis', type: 'decision' },
  { id: 'valuation', label: 'Valuation Model', type: 'decision' },
  { id: 'due_diligence', label: 'Due Diligence', type: 'decision' },
  // Biases detected
  { id: 'anchoring', label: 'Anchoring Bias', type: 'bias', severity: 'critical' },
  { id: 'confirmation', label: 'Confirmation Bias', type: 'bias', severity: 'high' },
  { id: 'overconfidence', label: 'Overconfidence', type: 'bias', severity: 'critical' },
  { id: 'groupthink', label: 'Groupthink', type: 'bias', severity: 'high' },
  { id: 'sunk_cost', label: 'Sunk Cost', type: 'bias', severity: 'medium' },
  { id: 'authority', label: 'Authority Bias', type: 'bias', severity: 'medium' },
  { id: 'framing', label: 'Framing Effect', type: 'bias', severity: 'low' },
  // Outcome nodes
  { id: 'risk_high', label: 'High Risk', type: 'outcome' },
  { id: 'toxic_echo', label: 'Echo Chamber', type: 'outcome' },
];

const EDGES: GraphEdge[] = [
  // Decision → Bias connections
  { source: 'acq_decision', target: 'anchoring', type: 'detected' },
  { source: 'acq_decision', target: 'overconfidence', type: 'detected' },
  { source: 'acq_decision', target: 'confirmation', type: 'detected' },
  { source: 'valuation', target: 'anchoring', type: 'detected' },
  { source: 'valuation', target: 'framing', type: 'detected' },
  { source: 'due_diligence', target: 'groupthink', type: 'detected' },
  { source: 'due_diligence', target: 'authority', type: 'detected' },
  { source: 'due_diligence', target: 'sunk_cost', type: 'detected' },
  // Toxic combinations
  { source: 'confirmation', target: 'groupthink', type: 'toxic', label: 'Echo Chamber' },
  { source: 'anchoring', target: 'overconfidence', type: 'toxic', label: 'Blind Sprint' },
  { source: 'sunk_cost', target: 'overconfidence', type: 'toxic', label: 'Doubling Down' },
  // Influence to outcomes
  { source: 'anchoring', target: 'risk_high', type: 'influence' },
  { source: 'overconfidence', target: 'risk_high', type: 'influence' },
  { source: 'confirmation', target: 'toxic_echo', type: 'influence' },
  { source: 'groupthink', target: 'toxic_echo', type: 'influence' },
];

// ─── Force Simulation ───────────────────────────────────────────────────────

const SVG_W = 520;
const SVG_H = 400;
const CENTER_X = SVG_W / 2;
const CENTER_Y = SVG_H / 2;

function initializeNodes(): GraphNode[] {
  // Position decisions in center cluster, biases in ring, outcomes at edges
  const decisions = NODES.filter(n => n.type === 'decision');
  const biases = NODES.filter(n => n.type === 'bias');
  const outcomes = NODES.filter(n => n.type === 'outcome');

  const result: GraphNode[] = [];

  // Decisions — tight center cluster
  decisions.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / decisions.length - Math.PI / 2;
    const r = 55;
    result.push({
      ...n,
      x: CENTER_X + r * Math.cos(angle),
      y: CENTER_Y + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: 24,
      fx: CENTER_X + r * Math.cos(angle),
      fy: CENTER_Y + r * Math.sin(angle),
    });
  });

  // Biases — outer ring
  biases.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / biases.length - Math.PI / 4;
    const r = 150;
    result.push({
      ...n,
      x: CENTER_X + r * Math.cos(angle),
      y: CENTER_Y + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: n.severity === 'critical' ? 18 : n.severity === 'high' ? 15 : 12,
    });
  });

  // Outcomes — far edges
  outcomes.forEach((n, i) => {
    const angle = Math.PI * 0.25 + (Math.PI * 0.5 * i);
    const r = 175;
    result.push({
      ...n,
      x: CENTER_X + r * Math.cos(angle),
      y: CENTER_Y + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: 16,
    });
  });

  return result;
}

// Simple spring force simulation
function simulateStep(nodes: GraphNode[]): GraphNode[] {
  const damping = 0.92;
  const repulsion = 800;
  const centerPull = 0.003;

  return nodes.map((node, i) => {
    if (node.fx !== undefined && node.fy !== undefined) {
      return { ...node, x: node.fx, y: node.fy, vx: 0, vy: 0 };
    }

    let fx = 0;
    let fy = 0;

    // Repulsion from all other nodes
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const other = nodes[j];
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDist = node.radius + other.radius + 20;
      if (dist < minDist * 3) {
        const force = repulsion / (dist * dist);
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }
    }

    // Pull toward center (gentle)
    fx += (CENTER_X - node.x) * centerPull;
    fy += (CENTER_Y - node.y) * centerPull;

    // Keep in bounds
    const margin = node.radius + 8;
    if (node.x < margin) fx += 2;
    if (node.x > SVG_W - margin) fx -= 2;
    if (node.y < margin) fy += 2;
    if (node.y > SVG_H - margin) fy -= 2;

    // Edge attraction (connected nodes attract)
    for (const edge of EDGES) {
      let otherNode: GraphNode | undefined;
      if (edge.source === node.id) otherNode = nodes.find(n => n.id === edge.target);
      if (edge.target === node.id) otherNode = nodes.find(n => n.id === edge.source);
      if (!otherNode) continue;
      const dx = otherNode.x - node.x;
      const dy = otherNode.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealDist = edge.type === 'toxic' ? 100 : 120;
      const strength = 0.005;
      fx += (dx / dist) * (dist - idealDist) * strength;
      fy += (dy / dist) * (dist - idealDist) * strength;
    }

    const newVx = (node.vx + fx) * damping;
    const newVy = (node.vy + fy) * damping;

    return {
      ...node,
      x: Math.max(margin, Math.min(SVG_W - margin, node.x + newVx)),
      y: Math.max(margin, Math.min(SVG_H - margin, node.y + newVy)),
      vx: newVx,
      vy: newVy,
    };
  });
}

// ─── Node Component ─────────────────────────────────────────────────────────

function NodeCircle({
  node,
  isHovered,
  isDimmed,
  onHover,
}: {
  node: GraphNode;
  isHovered: boolean;
  isDimmed: boolean;
  onHover: (id: string | null) => void;
}) {
  const fill =
    node.type === 'decision'
      ? COLORS.decision
      : node.type === 'outcome'
        ? COLORS.outcome
        : COLORS.bias[node.severity ?? 'medium'];

  const scale = isHovered ? 1.15 : isDimmed ? 0.9 : 1;
  const opacity = isDimmed ? 0.35 : 1;

  return (
    <g
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      opacity={opacity}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Hover glow */}
      {isHovered && (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.radius + 8}
          fill={node.type === 'bias' ? COLORS.hoverGlow : 'rgba(15, 23, 42, 0.08)'}
        />
      )}
      {/* Node circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius * scale}
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth={2}
        style={{ transition: 'r 0.2s' }}
      />
      {/* Icon/text inside */}
      {node.type === 'decision' ? (
        <text
          x={node.x}
          y={node.y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fontWeight={700}
          fill="#FFFFFF"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.label.split(' ')[0].slice(0, 3).toUpperCase()}
        </text>
      ) : node.type === 'outcome' ? (
        <text
          x={node.x}
          y={node.y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={8}
          fontWeight={700}
          fill="#FFFFFF"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.severity === 'critical' ? '!!' : '!'}
        </text>
      ) : (
        <text
          x={node.x}
          y={node.y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={node.radius > 14 ? 9 : 7}
          fontWeight={700}
          fill="#FFFFFF"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.severity === 'critical' ? '!!' : node.severity === 'high' ? '!' : '·'}
        </text>
      )}
      {/* Label outside */}
      <text
        x={node.x}
        y={node.y + node.radius + 13}
        textAnchor="middle"
        fontSize={9}
        fontWeight={isHovered ? 700 : 500}
        fill={isHovered ? COLORS.text : COLORS.textMuted}
        style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s' }}
      >
        {node.label}
      </text>
    </g>
  );
}

// ─── Edge Component ─────────────────────────────────────────────────────────

function EdgeLine({
  edge,
  nodes,
  isHighlighted,
  isDimmed,
}: {
  edge: GraphEdge;
  nodes: GraphNode[];
  isHighlighted: boolean;
  isDimmed: boolean;
}) {
  const source = nodes.find(n => n.id === edge.source);
  const target = nodes.find(n => n.id === edge.target);
  if (!source || !target) return null;

  const isToxic = edge.type === 'toxic';
  const color = isHighlighted
    ? isToxic
      ? COLORS.edge.toxic
      : '#334155'
    : isToxic
      ? COLORS.edge.toxic + '50'
      : COLORS.edge.detected + (isDimmed ? '20' : '40');

  const strokeWidth = isHighlighted ? (isToxic ? 2.5 : 1.5) : isToxic ? 1.5 : 0.8;

  // Calculate edge endpoints at circle boundary
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const x1 = source.x + (dx / dist) * source.radius;
  const y1 = source.y + (dy / dist) * source.radius;
  const x2 = target.x - (dx / dist) * target.radius;
  const y2 = target.y - (dy / dist) * target.radius;

  // Midpoint for toxic combination labels
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  return (
    <g opacity={isDimmed ? 0.15 : 1} style={{ transition: 'opacity 0.2s' }}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={isToxic ? undefined : '4 3'}
        strokeLinecap="round"
      />
      {/* Toxic combination label */}
      {isToxic && isHighlighted && edge.label && (
        <g>
          <rect
            x={mx - edge.label.length * 3.2 - 6}
            y={my - 9}
            width={edge.label.length * 6.4 + 12}
            height={18}
            rx={4}
            fill={COLORS.tooltipBg}
            opacity={0.9}
          />
          <text
            x={mx}
            y={my + 3}
            textAnchor="middle"
            fontSize={9}
            fontWeight={600}
            fill={COLORS.tooltipText}
            style={{ pointerEvents: 'none' }}
          >
            {edge.label}
          </text>
        </g>
      )}
      {/* Animated pulse on toxic edges */}
      {isToxic && !isDimmed && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={COLORS.edge.toxic}
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          opacity={0}
        >
          <animate
            attributeName="opacity"
            values="0;0.3;0"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </line>
      )}
    </g>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function HeroDecisionGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-30px' });
  const [nodes, setNodes] = useState<GraphNode[]>(initializeNodes);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const frameRef = useRef<number>(0);
  const iterRef = useRef(0);

  // Run simulation for ~60 steps to settle, then gentle drift
  useEffect(() => {
    if (!isInView) return;
    let running = true;
    const maxIter = 80;

    function tick() {
      if (!running) return;
      iterRef.current++;
      setNodes(prev => simulateStep(prev));
      if (iterRef.current < maxIter) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        // Gentle drift every ~2s
        const drift = () => {
          if (!running) return;
          setNodes(prev =>
            prev.map(n => {
              if (n.fx !== undefined) return n;
              return {
                ...n,
                vx: n.vx + (Math.random() - 0.5) * 0.3,
                vy: n.vy + (Math.random() - 0.5) * 0.3,
              };
            })
          );
          setNodes(prev => simulateStep(prev));
          if (running) setTimeout(drift, 2000);
        };
        drift();
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [isInView]);

  // Which nodes are connected to hovered
  const connectedIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const ids = new Set<string>([hoveredNode]);
    for (const e of EDGES) {
      if (e.source === hoveredNode) ids.add(e.target);
      if (e.target === hoveredNode) ids.add(e.source);
    }
    return ids;
  }, [hoveredNode]);

  // Tooltip info
  const hoveredNodeData = hoveredNode ? nodes.find(n => n.id === hoveredNode) : null;
  const hoveredEdgeCount = hoveredNode
    ? EDGES.filter(e => e.source === hoveredNode || e.target === hoveredNode).length
    : 0;
  const hoveredToxicCount = hoveredNode
    ? EDGES.filter(
        e => e.type === 'toxic' && (e.source === hoveredNode || e.target === hoveredNode)
      ).length
    : 0;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          background: COLORS.bg,
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '20px 12px 12px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 8, paddingLeft: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#7C3AED',
              marginBottom: 4,
            }}
          >
            Decision Knowledge Graph
          </div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
            Interactive bias network from a PE acquisition memo
          </div>
        </div>

        <motion.svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Edges first (behind nodes) */}
          {EDGES.map((edge, i) => {
            const isHighlighted =
              !!hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
            const isDimmed = !!hoveredNode && !isHighlighted;
            return (
              <EdgeLine
                key={`${edge.source}-${edge.target}-${i}`}
                edge={edge}
                nodes={nodes}
                isHighlighted={isHighlighted}
                isDimmed={isDimmed}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => (
            <NodeCircle
              key={node.id}
              node={node}
              isHovered={hoveredNode === node.id}
              isDimmed={!!hoveredNode && !connectedIds.has(node.id)}
              onHover={setHoveredNode}
            />
          ))}
        </motion.svg>

        {/* Bottom info bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 8px 4px',
            borderTop: '1px solid #E2E8F0',
            marginTop: 4,
            minHeight: 36,
          }}
        >
          {hoveredNodeData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                {hoveredNodeData.label}
              </span>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                {hoveredEdgeCount} connection{hoveredEdgeCount !== 1 ? 's' : ''}
                {hoveredToxicCount > 0 && (
                  <span style={{ color: COLORS.edge.toxic, fontWeight: 600 }}>
                    {' · '}{hoveredToxicCount} toxic
                  </span>
                )}
              </span>
            </motion.div>
          ) : (
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
              Hover nodes to explore connections
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94A3B8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: COLORS.decision,
                  display: 'inline-block',
                }}
              />
              Decision
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: COLORS.bias.critical,
                  display: 'inline-block',
                }}
              />
              Bias
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 16,
                  height: 2,
                  background: COLORS.edge.toxic,
                  display: 'inline-block',
                }}
              />
              Toxic
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
