'use client';

import { useRef, useCallback, useEffect } from 'react';
import { DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import {
  GraphCanvas,
  type GraphCanvasRef,
  type GraphNode,
  type GraphEdge,
  type NodeRendererProps,
  type InternalGraphNode,
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
  { id: 'e1', source: 'ipo_decision', target: 'overconfidence', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e2', source: 'ipo_decision', target: 'anchoring', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e3', source: 'ipo_decision', target: 'authority', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e4', source: 'governance', target: 'authority', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e5', source: 'governance', target: 'groupthink', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e6', source: 'unit_economics', target: 'overconfidence', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e7', source: 'unit_economics', target: 'halo_effect', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
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
    background: '#FFFFFF',
    fog: null,
  },
  node: {
    fill: '#94A3B8',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.35,
    label: {
      color: '#475569',
      activeColor: '#0F172A',
      stroke: '#FFFFFF',
      strokeWidth: 4,
    },
  },
  ring: {
    fill: '#16A34A',
    activeFill: '#22C55E',
  },
  edge: {
    fill: '#CBD5E1',
    activeFill: '#64748B',
    opacity: 0.9,
    selectedOpacity: 1,
    inactiveOpacity: 0.18,
    label: {
      color: '#64748B',
      activeColor: '#0F172A',
    },
  },
  arrow: {
    fill: '#94A3B8',
    activeFill: '#475569',
  },
  lasso: {
    background: 'rgba(22,163,74,0.08)',
    border: '#16A34A',
  },
};

// ─── Pulsing halo (applied to primary/critical node) ─────────────────────────

function PulsingHalo({
  size,
  color,
  shape,
}: {
  size: number;
  color: string;
  shape: 'octahedron' | 'dodecahedron';
}) {
  const ref = useRef<Mesh | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const s = 1.45 + Math.sin(t * 2.2) * 0.18;
    ref.current.scale.setScalar(s);
    const mat = ref.current.material as MeshBasicMaterial | undefined;
    if (mat) mat.opacity = 0.14 + Math.sin(t * 2.2) * 0.08;
  });
  return (
    <mesh ref={ref}>
      {shape === 'octahedron' ? (
        <octahedronGeometry args={[size, 0]} />
      ) : (
        <dodecahedronGeometry args={[size, 0]} />
      )}
      <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

// ─── Custom node renderer (inlined — no React component wrapper) ─────────────

// ─── Canvas component (loaded via dynamic — no SSR) ──────────────────────────

export interface HeroDecisionGraph3DCanvasProps {
  onNodeSelect: (node: GraphNode | null) => void;
}

export default function HeroDecisionGraph3DCanvas({
  onNodeSelect,
}: HeroDecisionGraph3DCanvasProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);

  // Force-directed 3D layout needs several ticks before node positions stabilize.
  // A single centerGraph() call at 300ms can fire before the layout has produced
  // visible coords — the result is a black canvas with nodes clumped at origin.
  // Retry fitNodesInView() at 200/600/1200/2000ms so whichever call lands after
  // layout stabilizes successfully frames the camera on all nodes.
  useEffect(() => {
    const delays = [200, 600, 1200, 2000];
    const timers = delays.map(ms =>
      setTimeout(() => {
        graphRef.current?.fitNodesInView(undefined, { animated: false });
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const {
    selections,
    actives,
    toggleSelection,
    onCanvasClick,
    onNodePointerOver,
    onNodePointerOut,
  } = useSelection({
    ref: graphRef,
    nodes: NODES,
    edges: EDGES,
    type: 'single',
    pathHoverType: 'all',
    focusOnSelect: false,
    onSelection: ids => {
      const found = ids.length > 0 ? (NODES.find(n => n.id === ids[0]) ?? null) : null;
      onNodeSelect(found);
    },
  });

  const onNodeClick = useCallback(
    (node: InternalGraphNode) => {
      const wasSelected = selections.includes(node.id);
      toggleSelection(node.id);
      if (!wasSelected) {
        graphRef.current?.centerGraph([node.id]);
      }
    },
    [selections, toggleSelection],
  );

  const renderNode = useCallback(({ node, size, opacity, active, selected }: NodeRendererProps) => {
    const data = node.data as NodeData | undefined;
    const o = opacity ?? 1;
    const emissiveFallback = selected ? 0.4 : active ? 0.25 : 0.12;
    if (!data?.type) {
      return (
        <mesh>
          <sphereGeometry args={[size, 10, 8]} />
          <meshPhongMaterial color="#60A5FA" emissive="#60A5FA" emissiveIntensity={emissiveFallback} shininess={80} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
        </mesh>
      );
    }

    const col = getNodeColor(data);
    const emissive = emissiveFallback;
    const isPrimary = data.type === 'bias' && data.severity === 'critical';

    // Decision → dodecahedron (12-face crystal)
    if (data.type === 'decision') {
      return (
        <group>
          <mesh>
            <dodecahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
          </mesh>
          {selected && (
            <mesh>
              <dodecahedronGeometry args={[size * 1.55, 0]} />
              <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.1} />
            </mesh>
          )}
        </group>
      );
    }

    // Bias → octahedron (8-face spike)
    if (data.type === 'bias') {
      return (
        <group>
          <mesh>
            <octahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
          </mesh>
          {(active || selected) && (
            <mesh>
              <octahedronGeometry args={[size * 1.65, 0]} />
              <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} />
            </mesh>
          )}
          {isPrimary && !selected && <PulsingHalo size={size} color={col} shape="octahedron" />}
        </group>
      );
    }

    // Outcome → cylinder
    return (
      <group>
        <mesh>
          <cylinderGeometry args={[size * 0.82, size * 0.82, size * 2.2, 8]} />
          <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
        </mesh>
        {selected && (
          <mesh>
            <cylinderGeometry args={[size * 1.3, size * 1.3, size * 2.6, 8]} />
            <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.1} />
          </mesh>
        )}
      </group>
    );
  }, []);

  return (
    <GraphCanvas
      ref={graphRef}
      nodes={NODES}
      edges={EDGES}
      layoutType="forceDirected3d"
      cameraMode="rotate"
      animated={false}
      theme={GRAPH_THEME}
      renderNode={renderNode}
      selections={selections}
      actives={actives}
      onNodeClick={onNodeClick}
      onCanvasClick={onCanvasClick}
      onNodePointerOver={onNodePointerOver}
      onNodePointerOut={onNodePointerOut}
      labelType="nodes"
      edgeLabelPosition="natural"
      draggable
      defaultNodeSize={7}
      minDistance={300}
      maxDistance={4000}
    >
      {/* Lighting rig — tuned for white background: neutral key + soft fill */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[15, 15, 10]} intensity={1.2} />
      <directionalLight position={[-10, -8, -5]} intensity={0.4} color="#FFFFFF" />
      <pointLight position={[0, 20, 5]} intensity={0.6} color="#FFFFFF" />
    </GraphCanvas>
  );
}
