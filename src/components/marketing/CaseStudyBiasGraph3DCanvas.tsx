'use client';

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import {
  SlowOrbit,
  ResetViewButton,
  useEdgeNarrativeReveal,
  withNarrativeTheme,
  NodeHoverTooltip,
  SelectedGlow,
} from '@/components/visualizations/reagraph-helpers';
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
import { formatBiasName } from '@/lib/utils/labels';

// ─── Severity mapping ───────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
};

function guessSeverity(bias: string, isPrimary: boolean): string {
  if (isPrimary) return 'critical';
  if (['overconfidence_bias', 'groupthink', 'confirmation_bias'].includes(bias)) return 'high';
  if (['sunk_cost_fallacy', 'anchoring_bias', 'authority_bias'].includes(bias)) return 'high';
  if (['framing_effect', 'loss_aversion', 'bandwagon_effect'].includes(bias)) return 'medium';
  return 'medium';
}

// ─── Toxic pair mapping ─────────────────────────────────────────────────────

const TOXIC_PAIRS: Record<string, string[][]> = {
  'Echo Chamber': [
    ['confirmation_bias', 'groupthink'],
    ['confirmation_bias', 'authority_bias'],
  ],
  'Sunk Ship': [
    ['sunk_cost_fallacy', 'confirmation_bias'],
    ['sunk_cost_fallacy', 'overconfidence_bias'],
  ],
  'Blind Sprint': [
    ['overconfidence_bias', 'planning_fallacy'],
    ['overconfidence_bias', 'anchoring_bias'],
  ],
  'Yes Committee': [
    ['groupthink', 'authority_bias'],
    ['groupthink', 'bandwagon_effect'],
  ],
  'Optimism Trap': [
    ['anchoring_bias', 'overconfidence_bias'],
    ['overconfidence_bias', 'planning_fallacy'],
  ],
  'Status Quo Lock': [
    ['status_quo_bias', 'loss_aversion'],
    ['status_quo_bias', 'anchoring_bias'],
  ],
  'Doubling Down': [
    ['sunk_cost_fallacy', 'overconfidence_bias'],
    ['sunk_cost_fallacy', 'loss_aversion'],
  ],
};

// ─── Graph data builder ─────────────────────────────────────────────────────

export interface CaseStudyNodeData {
  type: 'decision' | 'bias';
  biasKey?: string;
  severity?: string;
  isPrimary?: boolean;
  toxicCombos?: string[];
}

function buildGraphData(
  biases: string[],
  primaryBias: string,
  toxicCombinations: string[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const biasSet = new Set(biases);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let edgeId = 0;

  nodes.push({
    id: '_decision',
    label: 'Decision',
    fill: '#60A5FA',
    size: 9,
    data: { type: 'decision' } satisfies CaseStudyNodeData,
  });

  const biasToToxic = new Map<string, string[]>();
  for (const bias of biases) biasToToxic.set(bias, []);

  for (const combo of toxicCombinations) {
    const pairs = TOXIC_PAIRS[combo];
    if (!pairs) continue;
    for (const [a, b] of pairs) {
      if (biasSet.has(a) && biasSet.has(b)) {
        biasToToxic.get(a)?.push(combo);
        biasToToxic.get(b)?.push(combo);
        edges.push({
          id: `e${edgeId++}`,
          source: a,
          target: b,
          fill: '#DC2626',
          size: 2.5,
          label: combo,
          arrowPlacement: 'none',
        });
      }
    }
  }

  for (const bias of biases) {
    const sev = guessSeverity(bias, bias === primaryBias);
    nodes.push({
      id: bias,
      label: formatBiasName(bias),
      fill: SEVERITY_COLORS[sev] ?? '#EAB308',
      size: bias === primaryBias ? 8 : 6,
      data: {
        type: 'bias',
        biasKey: bias,
        severity: sev,
        isPrimary: bias === primaryBias,
        toxicCombos: [...new Set(biasToToxic.get(bias) ?? [])],
      } satisfies CaseStudyNodeData,
    });

    edges.push({
      id: `e${edgeId++}`,
      source: '_decision',
      target: bias,
      fill: '#CBD5E1',
      dashed: true,
      arrowPlacement: 'end',
    });
  }

  if (edges.filter(e => !e.dashed).length === 0 && biases.length >= 2) {
    for (let i = 0; i < biases.length; i++) {
      const next = (i + 1) % biases.length;
      edges.push({
        id: `e${edgeId++}`,
        source: biases[i],
        target: biases[next],
        fill: '#94A3B8',
        dashed: true,
        arrowPlacement: 'none',
      });
    }
  }

  return { nodes, edges };
}

// ─── Theme ──────────────────────────────────────────────────────────────────

const GRAPH_THEME: Theme = {
  canvas: { background: '#FFFFFF', fog: null },
  node: {
    fill: '#94A3B8',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 1,
    label: { color: '#475569', activeColor: '#0F172A', stroke: '#FFFFFF', strokeWidth: 4 },
  },
  ring: { fill: '#16A34A', activeFill: '#22C55E' },
  edge: {
    fill: '#CBD5E1',
    activeFill: '#64748B',
    opacity: 0.9,
    selectedOpacity: 1,
    inactiveOpacity: 1,
    label: { color: '#64748B', activeColor: '#0F172A' },
  },
  arrow: { fill: '#94A3B8', activeFill: '#475569' },
  lasso: { background: 'rgba(22,163,74,0.08)', border: '#16A34A' },
};

// ─── Pulsing halo (applied to primary bias) ─────────────────────────────────

function PulsingHalo({ size, color }: { size: number; color: string }) {
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
      <octahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

// ─── Node renderer ──────────────────────────────────────────────────────────

function renderNode({ node, size, opacity, active, selected }: NodeRendererProps) {
  const data = node.data as CaseStudyNodeData | undefined;
  const col = (node.fill as string) ?? '#60A5FA';
  const o = opacity ?? 1;
  const emissive = selected ? 0.4 : active ? 0.25 : 0.12;
  const glow = selected || active;

  if (data?.type === 'decision') {
    return (
      <group>
        <mesh>
          <dodecahedronGeometry args={[size, 0]} />
          <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
        </mesh>
        {selected && <SelectedGlow size={size} color={col} shape="dodecahedron" />}
        {!selected && glow && (
          <mesh scale={[1.55, 1.55, 1.55]}>
            <dodecahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.08} />
          </mesh>
        )}
      </group>
    );
  }

  const isPrimary = data?.type === 'bias' && data.isPrimary;

  return (
    <group>
      <mesh>
        <octahedronGeometry args={[size, 0]} />
        <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
      </mesh>
      {selected && <SelectedGlow size={size} color={col} shape="octahedron" />}
      {!selected && glow && (
        <mesh scale={[1.6, 1.6, 1.6]}>
          <octahedronGeometry args={[size, 0]} />
          <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} />
        </mesh>
      )}
      {isPrimary && !selected && <PulsingHalo size={size} color={col} />}
    </group>
  );
}

// ─── Canvas component ───────────────────────────────────────────────────────

export interface CaseStudyBiasGraph3DCanvasProps {
  biases: string[];
  primaryBias: string;
  toxicCombinations: string[];
  onNodeSelect?: (data: CaseStudyNodeData | null) => void;
}

export default function CaseStudyBiasGraph3DCanvas({
  biases,
  primaryBias,
  toxicCombinations,
  onNodeSelect,
}: CaseStudyBiasGraph3DCanvasProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  // Memoize so node/edge identities are stable across re-renders. New
  // refs each render forced reagraph to re-layout from scratch, breaking
  // fitNodesInView ("fitTo() cannot be used with an empty box").
  const { nodes, edges } = useMemo(
    () => buildGraphData(biases, primaryBias, toxicCombinations),
    [biases, primaryBias, toxicCombinations],
  );
  const hasGraph = nodes.length > 0;

  // Force-directed 3D layout needs several ticks before node positions stabilize.
  // Retry through ~4s so whichever call lands after layout has produced
  // visible coords successfully frames the camera on all nodes.
  useEffect(() => {
    if (!hasGraph) return;
    const delays = [250, 700, 1300, 2000, 2800, 3800];
    const timers = delays.map(ms =>
      setTimeout(() => {
        const ref = graphRef.current;
        if (!ref) return;
        try {
          ref.fitNodesInView(undefined, { animated: false });
        } catch {
          // Layout hasn't placed nodes yet — next retry will catch it.
        }
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [hasGraph]);

  const nodeIds = useMemo(() => nodes.map(n => n.id), [nodes]);
  const edgeIds = useMemo(() => edges.map(e => e.id), [edges]);
  const { narrativeActives, isRevealing } = useEdgeNarrativeReveal({
    nodeIds,
    edgeIds,
    storageKey: `di-graph-narrative:case-study:${primaryBias}`,
  });
  const narrativeTheme = useMemo(() => withNarrativeTheme(GRAPH_THEME), []);

  const {
    selections,
    actives,
    toggleSelection,
    onCanvasClick,
    onNodePointerOver,
    onNodePointerOut,
  } = useSelection({
    ref: graphRef,
    nodes,
    edges,
    type: 'single',
    pathHoverType: 'all',
    focusOnSelect: false,
    onSelection: ids => {
      if (ids.length === 0) {
        onNodeSelect?.(null);
        return;
      }
      const found = nodes.find(n => n.id === ids[0]);
      onNodeSelect?.((found?.data as CaseStudyNodeData) ?? null);
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

  // Hover tooltip
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleNodePointerOver = useCallback(
    (node: InternalGraphNode) => {
      onNodePointerOver?.(node);
      setHoverNodeId(node.id);
    },
    [onNodePointerOver],
  );
  const handleNodePointerOut = useCallback(
    (node: InternalGraphNode) => {
      onNodePointerOut?.(node);
      setHoverNodeId(null);
    },
    [onNodePointerOut],
  );
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  const hoveredNode = useMemo(
    () => (hoverNodeId ? (nodes.find(n => n.id === hoverNodeId) ?? null) : null),
    [hoverNodeId, nodes],
  );
  const hoveredData = hoveredNode?.data as CaseStudyNodeData | undefined;

  const memoRenderNode = useCallback(renderNode, []);

  return (
    <div
      ref={wrapperRef}
      onPointerMove={handlePointerMove}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <GraphCanvas
        ref={graphRef}
        nodes={nodes}
        edges={edges}
        layoutType="forceDirected3d"
        cameraMode="rotate"
        animated={false}
        theme={isRevealing ? narrativeTheme : GRAPH_THEME}
        renderNode={memoRenderNode}
        selections={selections}
        actives={isRevealing && narrativeActives ? narrativeActives : actives}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
        onNodePointerOver={handleNodePointerOver}
        onNodePointerOut={handleNodePointerOut}
        labelType="nodes"
        draggable
        defaultNodeSize={6}
        minDistance={200}
        maxDistance={4000}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[15, 15, 10]} intensity={1.2} />
        <directionalLight position={[-10, -8, -5]} intensity={0.4} color="#FFFFFF" />
        <pointLight position={[0, 20, 5]} intensity={0.6} color="#FFFFFF" />
        <SlowOrbit graphRef={graphRef} startDelayMs={isRevealing ? 6500 : 1500} />
      </GraphCanvas>
      <ResetViewButton graphRef={graphRef} />
      {hoveredNode && !isRevealing && (
        <NodeHoverTooltip
          title={(hoveredNode.label as string) ?? hoveredNode.id}
          subtitle={hoveredData?.severity}
          x={pointerPos.x}
          y={pointerPos.y}
        />
      )}
    </div>
  );
}
