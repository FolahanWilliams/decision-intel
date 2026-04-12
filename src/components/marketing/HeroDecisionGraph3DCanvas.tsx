'use client';

import { useRef, useCallback } from 'react';
import {
  GraphCanvas,
  type GraphCanvasRef,
  type GraphNode,
  type GraphEdge,
  type NodeRendererProps,
  type Theme,
  useSelection,
} from 'reagraph';

// ─── Shared types (exported so parent can access .data) ──────────────────────

export interface NodeDetail {
  title: string;
  severity?: string;
  excerpt: string;
  insight: string;
}

export interface NodeData {
  type: 'decision' | 'bias' | 'outcome';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  detail: NodeDetail;
}

// ─── Color palette ───────────────────────────────────────────────────────────

const BIAS_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
} as const;

function getNodeColor(data: NodeData): string {
  if (data.type === 'decision') return '#60A5FA';
  if (data.type === 'outcome') return '#A78BFA';
  return BIAS_COLORS[data.severity ?? 'medium'];
}

// ─── Static graph data (WeWork S-1 case study) ───────────────────────────────

const NODES: GraphNode[] = [
  {
    id: 'ipo_decision',
    label: 'IPO Decision',
    size: 8,
    data: {
      type: 'decision',
      detail: {
        title: 'IPO at $47B Valuation',
        excerpt:
          'WeWork filed its S-1 in August 2019 seeking a $47B public market valuation — despite losing $1.9B on $1.8B in revenue.',
        insight:
          'Decision Intel flags: Revenue-to-loss ratio of 0.95x with no path to profitability documented in the filing. Valuation anchored entirely to SoftBank\u2019s private round, not public market comparables.',
      },
    } satisfies NodeData,
  },
  {
    id: 'governance',
    label: 'Governance',
    size: 8,
    data: {
      type: 'decision',
      detail: {
        title: 'Governance Structure',
        excerpt:
          'CEO Adam Neumann held supervoting shares, personally leased buildings back to WeWork, and trademarked "We" — then charged the company $5.9M for the rights.',
        insight:
          'Decision Intel flags: 3 simultaneous self-dealing conflicts. Zero independent board oversight on related-party transactions. Governance risk score: Critical.',
      },
    } satisfies NodeData,
  },
  {
    id: 'unit_economics',
    label: 'Unit Economics',
    size: 8,
    data: {
      type: 'decision',
      detail: {
        title: 'Unit Economics Model',
        excerpt:
          'WeWork\'s S-1 introduced "Community Adjusted EBITDA" — which excluded nearly all real costs. Actual losses: $1.9B in 2018, accelerating.',
        insight:
          'Decision Intel flags: Non-standard financial metric designed to obscure losses. When a company invents its own profitability measure, the framing bias is structural.',
      },
    } satisfies NodeData,
  },
  {
    id: 'overconfidence',
    label: 'Overconfidence',
    size: 7,
    data: {
      type: 'bias',
      severity: 'critical',
      detail: {
        title: 'Overconfidence Bias',
        severity: 'Critical',
        excerpt:
          '"We are a community company... We dedicate this to the energy of we — greater than any one of us, but inside each of us." — WeWork S-1 preamble.',
        insight:
          'Spiritual language in an SEC filing signals detachment from financial reality. The S-1 mentioned "community" 150+ times but contained no credible path to profitability.',
      },
    } satisfies NodeData,
  },
  {
    id: 'authority',
    label: 'Authority Bias',
    size: 7,
    data: {
      type: 'bias',
      severity: 'critical',
      detail: {
        title: 'Authority Bias',
        severity: 'Critical',
        excerpt:
          'SoftBank\'s $18.5B backing created an aura of inevitability. Board members and investors deferred to Neumann\'s vision without challenging unit economics.',
        insight:
          'SoftBank\'s outsized investment anchored the entire market on a single investor\'s thesis. No independent valuation challenged the $47B figure until the S-1 went public.',
      },
    } satisfies NodeData,
  },
  {
    id: 'halo_effect',
    label: 'Halo Effect',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Halo Effect',
        severity: 'High',
        excerpt:
          'Neumann\'s charisma, celebrity endorsements, and "tech disruptor" narrative masked a traditional real estate subletting business with negative unit economics.',
        insight:
          'The company was classified as a tech company (high multiple) rather than real estate (low multiple). This framing inflated valuation by 5–10x versus comparable REITs.',
      },
    } satisfies NodeData,
  },
  {
    id: 'anchoring',
    label: 'Anchoring',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Anchoring Bias',
        severity: 'High',
        excerpt:
          'The $47B valuation was anchored to SoftBank\'s January 2019 funding round. No DCF model or comparable analysis supported the figure in the S-1.',
        insight:
          'Private market valuations set by a single dominant investor are not market prices. Public market investors rejected the anchor immediately — valuation fell 83% before IPO was pulled.',
      },
    } satisfies NodeData,
  },
  {
    id: 'groupthink',
    label: 'Groupthink',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Groupthink',
        severity: 'High',
        excerpt:
          'The board included Neumann\'s allies and SoftBank representatives. No independent director raised concerns about self-dealing or losses until after the S-1 backlash.',
        insight:
          'Zero documented dissent in board minutes prior to filing. When 100% of a board agrees on a $47B valuation for a money-losing company, that\'s a groupthink signal, not consensus.',
      },
    } satisfies NodeData,
  },
  {
    id: 'valuation_collapse',
    label: '$39B Destroyed',
    size: 7.5,
    data: {
      type: 'outcome',
      detail: {
        title: '$39B Valuation Destruction',
        excerpt:
          'Within 6 weeks of the S-1 filing, WeWork\'s valuation dropped from $47B to $8B. The IPO was pulled, Neumann was ousted, and SoftBank wrote off billions.',
        insight:
          'This is what unaudited decision-making costs. Every bias flagged here was detectable from the S-1 document alone — before a single public share was sold.',
      },
    } satisfies NodeData,
  },
  {
    id: 'echo_chamber',
    label: 'Echo Chamber',
    size: 6,
    data: {
      type: 'outcome',
      detail: {
        title: 'Echo Chamber Pattern',
        excerpt:
          'Groupthink + Authority Bias created a closed feedback loop. SoftBank\'s conviction reinforced the board\'s confidence, which reinforced Neumann\'s vision, which reinforced SoftBank.',
        insight:
          'Toxic combination: When the largest investor, the board, and the CEO all validate each other without external challenge, the probability of catastrophic failure increases 4.2x.',
      },
    } satisfies NodeData,
  },
];

const EDGES: GraphEdge[] = [
  { id: 'e1', source: 'ipo_decision', target: 'overconfidence', fill: '#1E3A5F', dashed: true, arrowPlacement: 'end' },
  { id: 'e2', source: 'ipo_decision', target: 'anchoring', fill: '#1E3A5F', dashed: true, arrowPlacement: 'end' },
  { id: 'e3', source: 'ipo_decision', target: 'authority', fill: '#1E3A5F', dashed: true, arrowPlacement: 'end' },
  { id: 'e4', source: 'governance', target: 'authority', fill: '#1E3A5F', dashed: true, arrowPlacement: 'end' },
  { id: 'e5', source: 'governance', target: 'groupthink', fill: '#1E3A5F', dashed: true, arrowPlacement: 'end' },
  { id: 'e6', source: 'unit_economics', target: 'overconfidence', fill: '#1E3A5F', dashed: true, arrowPlacement: 'end' },
  { id: 'e7', source: 'unit_economics', target: 'halo_effect', fill: '#1E3A5F', dashed: true, arrowPlacement: 'end' },
  // Toxic combinations — solid red, labeled
  { id: 'e8', source: 'groupthink', target: 'authority', fill: '#DC2626', size: 2.5, label: 'Echo Chamber', arrowPlacement: 'end' },
  { id: 'e9', source: 'overconfidence', target: 'halo_effect', fill: '#DC2626', size: 2.5, label: 'Optimism Trap', arrowPlacement: 'end' },
  // Influence edges — purple
  { id: 'e10', source: 'overconfidence', target: 'valuation_collapse', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e11', source: 'anchoring', target: 'valuation_collapse', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e12', source: 'authority', target: 'echo_chamber', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e13', source: 'groupthink', target: 'echo_chamber', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
];

// ─── Graph theme (deep-space dark) ──────────────────────────────────────────

const GRAPH_THEME: Theme = {
  canvas: {
    background: '#060d1a',
    fog: null,
  },
  node: {
    fill: '#334155',
    activeFill: '#64748B',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.25,
    label: {
      color: '#94A3B8',
      activeColor: '#FFFFFF',
      stroke: '#060d1a',
      strokeWidth: 4,
    },
  },
  ring: {
    fill: '#16A34A',
    activeFill: '#22C55E',
  },
  edge: {
    fill: '#1E293B',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.12,
    label: {
      color: '#64748B',
      activeColor: '#E2E8F0',
    },
  },
  arrow: {
    fill: '#334155',
    activeFill: '#64748B',
  },
  lasso: {
    background: 'rgba(22,163,74,0.08)',
    border: '#16A34A',
  },
};

// ─── Custom node renderer ────────────────────────────────────────────────────

function HeroNodeRenderer({ node, size, opacity, active, selected }: NodeRendererProps) {
  const data = node.data as NodeData | undefined;
  if (!data) return null;

  const col = getNodeColor(data);
  const emissive = selected ? 0.8 : active ? 0.4 : 0.12;
  const o = opacity ?? 1;

  const mat = (metalness: number, roughness: number) => (
    <meshStandardMaterial
      color={col}
      emissive={col}
      emissiveIntensity={emissive}
      metalness={metalness}
      roughness={roughness}
      transparent
      opacity={o}
    />
  );

  // Decision → dodecahedron (12-face crystal) — metallic, commanding
  if (data.type === 'decision') {
    return (
      <group>
        <mesh>
          <dodecahedronGeometry args={[size, 0]} />
          {mat(0.65, 0.2)}
        </mesh>
        {selected && (
          <mesh>
            <dodecahedronGeometry args={[size * 1.55, 0]} />
            <meshStandardMaterial color={col} transparent opacity={0.1} />
          </mesh>
        )}
      </group>
    );
  }

  // Bias → octahedron (8-face spike) — jagged, dangerous
  if (data.type === 'bias') {
    return (
      <group>
        <mesh>
          <octahedronGeometry args={[size, 0]} />
          {mat(0.1, 0.8)}
        </mesh>
        {(active || selected) && (
          <mesh>
            <octahedronGeometry args={[size * 1.65, 0]} />
            <meshStandardMaterial color={col} transparent opacity={0.07} />
          </mesh>
        )}
      </group>
    );
  }

  // Outcome → cylinder — grounded, final
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[size * 0.82, size * 0.82, size * 2.2, 8]} />
        {mat(0.45, 0.45)}
      </mesh>
      {selected && (
        <mesh>
          <cylinderGeometry args={[size * 1.3, size * 1.3, size * 2.6, 8]} />
          <meshStandardMaterial color={col} transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
}

// ─── Canvas component (loaded via dynamic — no SSR) ──────────────────────────

export interface HeroDecisionGraph3DCanvasProps {
  onNodeSelect: (node: GraphNode | null) => void;
}

export default function HeroDecisionGraph3DCanvas({
  onNodeSelect,
}: HeroDecisionGraph3DCanvasProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);

  const { selections, actives, onNodeClick, onCanvasClick, onNodePointerOver, onNodePointerOut } =
    useSelection({
      ref: graphRef,
      nodes: NODES,
      edges: EDGES,
      type: 'single',
      pathHoverType: 'all',
      focusOnSelect: true,
      onSelection: ids => {
        const found = ids.length > 0 ? (NODES.find(n => n.id === ids[0]) ?? null) : null;
        onNodeSelect(found);
      },
    });

  const renderNode = useCallback(
    (props: NodeRendererProps) => <HeroNodeRenderer {...props} />,
    []
  );

  return (
    <GraphCanvas
      ref={graphRef}
      nodes={NODES}
      edges={EDGES}
      layoutType="forceDirected3d"
      cameraMode="orbit"
      theme={GRAPH_THEME}
      renderNode={renderNode}
      selections={selections}
      actives={actives}
      onNodeClick={onNodeClick}
      onCanvasClick={onCanvasClick}
      onNodePointerOver={onNodePointerOver}
      onNodePointerOut={onNodePointerOut}
      labelType="all"
      draggable
      defaultNodeSize={7}
      minDistance={300}
      maxDistance={4000}
    >
      {/* Lighting rig — three-point setup for the 3D shapes */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 15, 10]} intensity={1.8} />
      <directionalLight position={[-10, -8, -5]} intensity={0.5} color="#4F46E5" />
      <pointLight position={[0, 20, 5]} intensity={1.2} color="#60A5FA" />
      <pointLight position={[0, -15, -5]} intensity={0.4} color="#A78BFA" />
    </GraphCanvas>
  );
}
