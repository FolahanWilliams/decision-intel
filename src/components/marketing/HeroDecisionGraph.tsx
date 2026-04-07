'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

/**
 * HeroDecisionGraph — Interactive decision knowledge graph based on the
 * WeWork S-1 IPO filing (August 2019). Grounded in a real, universally
 * recognized business failure so enterprise buyers can click nodes and
 * see exactly what Decision Intel would have flagged.
 *
 * Source: WeWork S-1 (SEC, Aug 14 2019), "The Cult of We" (Brown & Farrell, 2021)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface NodeDetail {
  title: string;
  severity?: string;
  excerpt: string;
  insight: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'decision' | 'bias' | 'outcome';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  detail: NodeDetail;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
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

// ─── WeWork S-1 Data ────────────────────────────────────────────────────────

const NODE_DETAILS: Record<string, NodeDetail> = {
  ipo_decision: {
    title: 'IPO at $47B Valuation',
    excerpt:
      'WeWork filed its S-1 in August 2019 seeking a $47B public market valuation — despite losing $1.9B on $1.8B in revenue.',
    insight:
      'Decision Intel flags: Revenue-to-loss ratio of 0.95x with no path to profitability documented in the filing. Valuation anchored entirely to SoftBank\u2019s private round, not public market comparables.',
  },
  governance: {
    title: 'Governance Structure',
    excerpt:
      'CEO Adam Neumann held supervoting shares, personally leased buildings back to WeWork, and trademarked "We" — then charged the company $5.9M for the rights.',
    insight:
      'Decision Intel flags: 3 simultaneous self-dealing conflicts. Zero independent board oversight on related-party transactions. Governance risk score: Critical.',
  },
  unit_economics: {
    title: 'Unit Economics Model',
    excerpt:
      'WeWork\u2019s S-1 introduced "Community Adjusted EBITDA" — which excluded nearly all real costs. Actual losses: $1.9B in 2018, accelerating.',
    insight:
      'Decision Intel flags: Non-standard financial metric designed to obscure losses. When a company invents its own profitability measure, the framing bias is structural.',
  },
  overconfidence: {
    title: 'Overconfidence Bias',
    severity: 'Critical',
    excerpt:
      '"We are a community company... We dedicate this to the energy of we — greater than any one of us, but inside each of us." — WeWork S-1 preamble.',
    insight:
      'Spiritual language in an SEC filing signals detachment from financial reality. The S-1 mentioned "community" 150+ times but contained no credible path to profitability.',
  },
  authority: {
    title: 'Authority Bias',
    severity: 'Critical',
    excerpt:
      'SoftBank\u2019s $18.5B backing created an aura of inevitability. Board members and investors deferred to Neumann\u2019s vision without challenging unit economics.',
    insight:
      'SoftBank\u2019s outsized investment anchored the entire market on a single investor\u2019s thesis. No independent valuation challenged the $47B figure until the S-1 went public.',
  },
  halo_effect: {
    title: 'Halo Effect',
    severity: 'High',
    excerpt:
      'Neumann\u2019s charisma, celebrity endorsements, and "tech disruptor" narrative masked a traditional real estate subletting business with negative unit economics.',
    insight:
      'The company was classified as a tech company (high multiple) rather than real estate (low multiple). This framing inflated valuation by 5\u201310x versus comparable REITs.',
  },
  anchoring: {
    title: 'Anchoring Bias',
    severity: 'High',
    excerpt:
      'The $47B valuation was anchored to SoftBank\u2019s January 2019 funding round. No DCF model or comparable analysis supported the figure in the S-1.',
    insight:
      'Private market valuations set by a single dominant investor are not market prices. Public market investors rejected the anchor immediately — valuation fell 83% before IPO was pulled.',
  },
  groupthink: {
    title: 'Groupthink',
    severity: 'High',
    excerpt:
      'The board included Neumann\u2019s allies and SoftBank representatives. No independent director raised concerns about self-dealing or losses until after the S-1 backlash.',
    insight:
      'Zero documented dissent in board minutes prior to filing. When 100% of a board agrees on a $47B valuation for a money-losing company, that\u2019s a groupthink signal, not consensus.',
  },
  valuation_collapse: {
    title: '$39B Valuation Destruction',
    excerpt:
      'Within 6 weeks of the S-1 filing, WeWork\u2019s valuation dropped from $47B to $8B. The IPO was pulled, Neumann was ousted, and SoftBank wrote off billions.',
    insight:
      'This is what unaudited decision-making costs. Every bias flagged here was detectable from the S-1 document alone — before a single public share was sold.',
  },
  echo_chamber: {
    title: 'Echo Chamber Pattern',
    excerpt:
      'Groupthink + Authority Bias created a closed feedback loop. SoftBank\u2019s conviction reinforced the board\u2019s confidence, which reinforced Neumann\u2019s vision, which reinforced SoftBank.',
    insight:
      'Toxic combination: When the largest investor, the board, and the CEO all validate each other without external challenge, the probability of catastrophic failure increases 4.2x.',
  },
};

type NodeDef = Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy' | 'radius'>;

const NODES: NodeDef[] = [
  {
    id: 'ipo_decision',
    label: 'IPO Decision',
    type: 'decision',
    detail: NODE_DETAILS.ipo_decision,
  },
  { id: 'governance', label: 'Governance', type: 'decision', detail: NODE_DETAILS.governance },
  {
    id: 'unit_economics',
    label: 'Unit Economics',
    type: 'decision',
    detail: NODE_DETAILS.unit_economics,
  },
  {
    id: 'overconfidence',
    label: 'Overconfidence',
    type: 'bias',
    severity: 'critical',
    detail: NODE_DETAILS.overconfidence,
  },
  {
    id: 'authority',
    label: 'Authority Bias',
    type: 'bias',
    severity: 'critical',
    detail: NODE_DETAILS.authority,
  },
  {
    id: 'halo_effect',
    label: 'Halo Effect',
    type: 'bias',
    severity: 'high',
    detail: NODE_DETAILS.halo_effect,
  },
  {
    id: 'anchoring',
    label: 'Anchoring',
    type: 'bias',
    severity: 'high',
    detail: NODE_DETAILS.anchoring,
  },
  {
    id: 'groupthink',
    label: 'Groupthink',
    type: 'bias',
    severity: 'high',
    detail: NODE_DETAILS.groupthink,
  },
  {
    id: 'valuation_collapse',
    label: '$39B Destroyed',
    type: 'outcome',
    detail: NODE_DETAILS.valuation_collapse,
  },
  { id: 'echo_chamber', label: 'Echo Chamber', type: 'outcome', detail: NODE_DETAILS.echo_chamber },
];

const EDGES: GraphEdge[] = [
  { source: 'ipo_decision', target: 'overconfidence', type: 'detected' },
  { source: 'ipo_decision', target: 'anchoring', type: 'detected' },
  { source: 'ipo_decision', target: 'authority', type: 'detected' },
  { source: 'governance', target: 'authority', type: 'detected' },
  { source: 'governance', target: 'groupthink', type: 'detected' },
  { source: 'unit_economics', target: 'overconfidence', type: 'detected' },
  { source: 'unit_economics', target: 'halo_effect', type: 'detected' },
  { source: 'groupthink', target: 'authority', type: 'toxic', label: 'Echo Chamber' },
  { source: 'overconfidence', target: 'halo_effect', type: 'toxic', label: 'Optimism Trap' },
  { source: 'overconfidence', target: 'valuation_collapse', type: 'influence' },
  { source: 'anchoring', target: 'valuation_collapse', type: 'influence' },
  { source: 'authority', target: 'echo_chamber', type: 'influence' },
  { source: 'groupthink', target: 'echo_chamber', type: 'influence' },
];

// ─── Force Simulation ───────────────────────────────────────────────────────

const SVG_W = 580;
const SVG_H = 560;
const CENTER_X = SVG_W / 2;
const CENTER_Y = SVG_H / 2;

function initializeNodes(): GraphNode[] {
  const decisions = NODES.filter(n => n.type === 'decision');
  const biases = NODES.filter(n => n.type === 'bias');
  const outcomes = NODES.filter(n => n.type === 'outcome');
  const result: GraphNode[] = [];

  decisions.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / decisions.length - Math.PI / 2;
    const r = 90;
    result.push({
      ...n,
      x: CENTER_X + r * Math.cos(angle),
      y: CENTER_Y + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: 38,
      fx: CENTER_X + r * Math.cos(angle),
      fy: CENTER_Y + r * Math.sin(angle),
    });
  });

  biases.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / biases.length - Math.PI / 4;
    const r = 210;
    result.push({
      ...n,
      x: CENTER_X + r * Math.cos(angle),
      y: CENTER_Y + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: n.severity === 'critical' ? 30 : n.severity === 'high' ? 25 : 20,
    });
  });

  outcomes.forEach((n, i) => {
    const angle = Math.PI * 0.25 + Math.PI * 0.5 * i;
    const r = 250;
    result.push({
      ...n,
      x: CENTER_X + r * Math.cos(angle),
      y: CENTER_Y + r * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: 28,
    });
  });

  return result;
}

function simulateStep(nodes: GraphNode[]): GraphNode[] {
  const damping = 0.92;
  const repulsion = 2000;
  const centerPull = 0.004;

  return nodes.map((node, i) => {
    if (node.fx !== undefined && node.fy !== undefined) {
      return { ...node, x: node.fx, y: node.fy, vx: 0, vy: 0 };
    }

    let forceX = 0;
    let forceY = 0;

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const other = nodes[j];
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDist = node.radius + other.radius + 40;
      if (dist < minDist * 3) {
        const force = repulsion / (dist * dist);
        forceX += (dx / dist) * force;
        forceY += (dy / dist) * force;
      }
    }

    forceX += (CENTER_X - node.x) * centerPull;
    forceY += (CENTER_Y - node.y) * centerPull;

    const margin = node.radius + 8;
    if (node.x < margin) forceX += 2;
    if (node.x > SVG_W - margin) forceX -= 2;
    if (node.y < margin) forceY += 2;
    if (node.y > SVG_H - margin) forceY -= 2;

    for (const edge of EDGES) {
      let otherNode: GraphNode | undefined;
      if (edge.source === node.id) otherNode = nodes.find(n => n.id === edge.target);
      if (edge.target === node.id) otherNode = nodes.find(n => n.id === edge.source);
      if (!otherNode) continue;
      const dx = otherNode.x - node.x;
      const dy = otherNode.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealDist = edge.type === 'toxic' ? 150 : 170;
      const strength = 0.005;
      forceX += (dx / dist) * (dist - idealDist) * strength;
      forceY += (dy / dist) * (dist - idealDist) * strength;
    }

    const newVx = (node.vx + forceX) * damping;
    const newVy = (node.vy + forceY) * damping;

    return {
      ...node,
      x: Math.max(margin, Math.min(SVG_W - margin, node.x + newVx)),
      y: Math.max(margin, Math.min(SVG_H - margin, node.y + newVy)),
      vx: newVx,
      vy: newVy,
    };
  });
}

// ─── Detail Panel ───────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const severityColor =
    node.type === 'bias'
      ? COLORS.bias[node.severity ?? 'medium']
      : node.type === 'outcome'
        ? COLORS.outcome
        : COLORS.decision;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        borderRadius: '0 0 16px 16px',
        padding: '16px 18px',
        zIndex: 10,
        maxHeight: '60%',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: severityColor,
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, lineHeight: 1.3 }}>
            {node.detail.title}
          </div>
          {node.detail.severity && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: severityColor,
                background: severityColor + '15',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {node.detail.severity}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            color: '#94A3B8',
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          x
        </button>
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: '#475569',
          lineHeight: 1.55,
          marginBottom: 10,
          borderLeft: '2px solid #E2E8F0',
          paddingLeft: 10,
        }}
      >
        {node.detail.excerpt}
      </div>

      <div
        style={{
          fontSize: 12,
          color: '#0F172A',
          lineHeight: 1.5,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          padding: '8px 10px',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: '#16A34A',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}
        >
          Platform Analysis
        </span>
        <div style={{ marginTop: 4 }}>{node.detail.insight}</div>
      </div>
    </motion.div>
  );
}

// ─── Node Component ─────────────────────────────────────────────────────────

function NodeCircle({
  node,
  isHovered,
  isSelected,
  isDimmed,
  onHover,
  onClick,
}: {
  node: GraphNode;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const fill =
    node.type === 'decision'
      ? COLORS.decision
      : node.type === 'outcome'
        ? COLORS.outcome
        : COLORS.bias[node.severity ?? 'medium'];

  const scale = isHovered || isSelected ? 1.15 : isDimmed ? 0.9 : 1;
  const opacity = isDimmed ? 0.35 : 1;

  return (
    <g
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      opacity={opacity}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node.id)}
    >
      {(isHovered || isSelected) && (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.radius + 8}
          fill={node.type === 'bias' ? COLORS.hoverGlow : 'rgba(15, 23, 42, 0.08)'}
        />
      )}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius * scale}
        fill={fill}
        stroke={isSelected ? '#16A34A' : '#FFFFFF'}
        strokeWidth={isSelected ? 3 : 2}
        style={{ transition: 'r 0.2s' }}
      />
      {node.type === 'decision' ? (
        <text
          x={node.x}
          y={node.y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={700}
          fill="#FFFFFF"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.label.split(' ')[0].slice(0, 3).toUpperCase()}
        </text>
      ) : (
        <text
          x={node.x}
          y={node.y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={node.radius > 20 ? 13 : 11}
          fontWeight={700}
          fill="#FFFFFF"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.severity === 'critical' ? '!!' : node.severity === 'high' ? '!' : '\u2022'}
        </text>
      )}
      <text
        x={node.x}
        y={node.y + node.radius + 16}
        textAnchor="middle"
        fontSize={12}
        fontWeight={isHovered || isSelected ? 700 : 500}
        fill={isHovered || isSelected ? COLORS.text : COLORS.textMuted}
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

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const x1 = source.x + (dx / dist) * source.radius;
  const y1 = source.y + (dy / dist) * source.radius;
  const x2 = target.x - (dx / dist) * target.radius;
  const y2 = target.y - (dy / dist) * target.radius;
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
      {isToxic && isHighlighted && edge.label && (
        <g>
          <rect
            x={mx - edge.label.length * 4 - 8}
            y={my - 12}
            width={edge.label.length * 8 + 16}
            height={24}
            rx={5}
            fill={COLORS.tooltipBg}
            opacity={0.9}
          />
          <text
            x={mx}
            y={my + 3}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill={COLORS.tooltipText}
            style={{ pointerEvents: 'none' }}
          >
            {edge.label}
          </text>
        </g>
      )}
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
          <animate attributeName="opacity" values="0;0.3;0" dur="2.5s" repeatCount="indefinite" />
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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const frameRef = useRef<number>(0);
  const iterRef = useRef(0);

  useEffect(() => {
    if (!isInView) return;
    let running = true;
    const maxIter = 80;

    function tick() {
      if (!running) return;
      iterRef.current++;
      setNodes((prev: GraphNode[]) => simulateStep(prev));
      if (iterRef.current < maxIter) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        const drift = () => {
          if (!running) return;
          setNodes((prev: GraphNode[]) =>
            prev.map((n: GraphNode) => {
              if (n.fx !== undefined) return n;
              return {
                ...n,
                vx: n.vx + (Math.random() - 0.5) * 0.3,
                vy: n.vy + (Math.random() - 0.5) * 0.3,
              };
            })
          );
          setNodes((prev: GraphNode[]) => simulateStep(prev));
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

  const activeNodeId = selectedNode ?? hoveredNode;

  const connectedIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const ids = new Set<string>([activeNodeId]);
    for (const e of EDGES) {
      if (e.source === activeNodeId) ids.add(e.target);
      if (e.target === activeNodeId) ids.add(e.source);
    }
    return ids;
  }, [activeNodeId]);

  const selectedNodeData = selectedNode
    ? nodes.find((n: GraphNode) => n.id === selectedNode)
    : null;

  const handleNodeClick = (id: string) => {
    setSelectedNode((prev: string | null) => (prev === id ? null : id));
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          background: COLORS.bg,
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '20px 12px 12px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 10, paddingLeft: 8 }}>
          <div
            style={{
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#7C3AED',
              marginBottom: 4,
            }}
          >
            Decision Knowledge Graph
          </div>
          <div style={{ fontSize: 'clamp(13px, 3vw, 15px)', color: '#64748B', lineHeight: 1.4 }}>
            WeWork S-1 IPO Filing (August 2019) &mdash;{' '}
            <span style={{ fontWeight: 600, color: '#DC2626' }}>$39B valuation destroyed</span>
          </div>
        </div>

        <motion.svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {EDGES.map((edge, i) => {
            const isHighlighted =
              !!activeNodeId && (edge.source === activeNodeId || edge.target === activeNodeId);
            const isDimmed = !!activeNodeId && !isHighlighted;
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

          {nodes.map((node: GraphNode) => (
            <NodeCircle
              key={node.id}
              node={node}
              isHovered={hoveredNode === node.id}
              isSelected={selectedNode === node.id}
              isDimmed={!!activeNodeId && !connectedIds.has(node.id)}
              onHover={setHoveredNode}
              onClick={handleNodeClick}
            />
          ))}
        </motion.svg>

        {/* Bottom bar */}
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
          <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: COLORS.textMuted }}>
            {selectedNode
              ? 'Click another node or click again to close'
              : 'Click any node to explore'}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 'clamp(10px, 2.5vw, 12px)', color: '#94A3B8' }}>
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

        {/* Detail popup */}
        <AnimatePresence>
          {selectedNodeData && (
            <DetailPanel node={selectedNodeData} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
