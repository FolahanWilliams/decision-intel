'use client';

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { DoubleSide } from 'three';
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
import type { CausalWeight } from '@/lib/learning/causal-learning';
import {
  SlowOrbit,
  ResetViewButton,
  useEdgeNarrativeReveal,
  withNarrativeTheme,
  NodeHoverTooltip,
  SelectedGlow,
} from './reagraph-helpers';

export interface CausalNodeData {
  nodeType: 'bias' | 'outcome';
  biasType?: string;
  outcomeType?: 'failure' | 'success';
  dangerMultiplier?: number;
  failureCount?: number;
  successCount?: number;
  sampleSize?: number;
  outcomeCorrelation?: number;
}

const DANGER_COLORS = {
  extreme: '#DC2626',
  high: '#EF4444',
  elevated: '#F97316',
  moderate: '#EAB308',
  low: '#84CC16',
};

function dangerColor(multiplier: number): string {
  if (multiplier >= 2.0) return DANGER_COLORS.extreme;
  if (multiplier >= 1.5) return DANGER_COLORS.high;
  if (multiplier >= 1.2) return DANGER_COLORS.elevated;
  if (multiplier >= 0.8) return DANGER_COLORS.moderate;
  return DANGER_COLORS.low;
}

function formatLabel(biasType: string): string {
  return biasType
    .replace(/_bias$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function buildGraph(weights: CausalWeight[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const singleWeights = weights
    .filter(w => !w.biasType.includes('+'))
    .sort((a, b) => b.dangerMultiplier - a.dangerMultiplier)
    .slice(0, 18);

  const pairWeights = weights
    .filter(w => w.biasType.includes('+'))
    .sort((a, b) => b.dangerMultiplier - a.dangerMultiplier)
    .slice(0, 12);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let edgeId = 0;

  nodes.push({
    id: '_failure',
    label: 'Failure',
    fill: '#EF4444',
    size: 10,
    data: { nodeType: 'outcome', outcomeType: 'failure' } satisfies CausalNodeData,
  });

  nodes.push({
    id: '_success',
    label: 'Success',
    fill: '#22C55E',
    size: 10,
    data: { nodeType: 'outcome', outcomeType: 'success' } satisfies CausalNodeData,
  });

  const biasSet = new Set<string>();

  for (const w of singleWeights) {
    biasSet.add(w.biasType);
    const color = dangerColor(w.dangerMultiplier);
    nodes.push({
      id: w.biasType,
      label: formatLabel(w.biasType),
      fill: color,
      size: Math.max(4, Math.min(9, 4 + w.sampleSize * 0.3)),
      data: {
        nodeType: 'bias',
        biasType: w.biasType,
        dangerMultiplier: w.dangerMultiplier,
        failureCount: w.failureCount,
        successCount: w.successCount,
        sampleSize: w.sampleSize,
        outcomeCorrelation: w.outcomeCorrelation,
      } satisfies CausalNodeData,
    });

    if (w.outcomeCorrelation < 0) {
      edges.push({
        id: `e${edgeId++}`,
        source: w.biasType,
        target: '_failure',
        fill: '#EF4444',
        size: Math.max(1, Math.abs(w.outcomeCorrelation) * 4),
        arrowPlacement: 'end',
      });
    } else {
      edges.push({
        id: `e${edgeId++}`,
        source: w.biasType,
        target: '_success',
        fill: '#22C55E',
        size: Math.max(1, w.outcomeCorrelation * 4),
        arrowPlacement: 'end',
      });
    }
  }

  for (const pw of pairWeights) {
    const [a, b] = pw.biasType.split('+');
    if (biasSet.has(a) && biasSet.has(b)) {
      edges.push({
        id: `e${edgeId++}`,
        source: a,
        target: b,
        fill: '#DC2626',
        size: Math.max(2, pw.dangerMultiplier * 1.5),
        label: `${pw.dangerMultiplier.toFixed(1)}×`,
        arrowPlacement: 'none',
      });
    }
  }

  return { nodes, edges };
}

const GRAPH_THEME: Theme = {
  canvas: { background: '#FFFFFF', fog: null },
  node: {
    fill: '#94A3B8',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 1,
    label: { color: '#475569', activeColor: '#0F172A', stroke: '#FFFFFF', strokeWidth: 5 },
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

export interface CausalGraph3DCanvasProps {
  weights: CausalWeight[];
  onNodeSelect?: (data: CausalNodeData | null) => void;
}

export default function CausalGraph3DCanvas({ weights, onNodeSelect }: CausalGraph3DCanvasProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const { nodes, edges } = useMemo(() => buildGraph(weights), [weights]);

  useEffect(() => {
    const delays = [250, 700, 1300, 2000, 2800, 3800];
    const timers = delays.map(ms =>
      setTimeout(() => {
        graphRef.current?.fitNodesInView(undefined, { animated: false });
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const nodeIds = useMemo(() => nodes.map(n => n.id), [nodes]);
  const edgeIds = useMemo(() => edges.map(e => e.id), [edges]);
  const { narrativeActives, isRevealing } = useEdgeNarrativeReveal({
    nodeIds,
    edgeIds,
    storageKey: 'di-graph-narrative:causal',
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
      onNodeSelect?.((found?.data as CausalNodeData) ?? null);
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
    const data = node.data as CausalNodeData | undefined;
    const col = (node.fill as string) ?? '#64748B';
    const o = opacity ?? 1;
    const emissive = selected ? 0.4 : active ? 0.25 : 0.12;

    if (data?.nodeType === 'outcome') {
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[size * 0.9, size * 0.9, size * 1.8, 8]} />
            <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
          </mesh>
          {selected && (
            <SelectedGlow
              size={size}
              color={col}
              shape="cylinder"
              cylinder={{ radiusFactor: 0.9, heightFactor: 1.8, segments: 8 }}
            />
          )}
          {!selected && active && (
            <mesh scale={[1.5, 1.5, 1.5]}>
              <cylinderGeometry args={[size * 0.9, size * 0.9, size * 1.8, 8]} />
              <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.08} />
            </mesh>
          )}
        </group>
      );
    }

    const danger = data?.dangerMultiplier ?? 1;
    if (danger >= 1.5) {
      return (
        <group>
          <mesh>
            <tetrahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
          </mesh>
          {selected && <SelectedGlow size={size} color={col} shape="tetrahedron" />}
          {!selected && active && (
            <mesh scale={[1.6, 1.6, 1.6]}>
              <tetrahedronGeometry args={[size, 0]} />
              <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} />
            </mesh>
          )}
        </group>
      );
    }

    return (
      <group>
        <mesh>
          <octahedronGeometry args={[size, 0]} />
          <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
        </mesh>
        {selected && <SelectedGlow size={size} color={col} shape="octahedron" />}
        {!selected && active && (
          <mesh scale={[1.6, 1.6, 1.6]}>
            <octahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} />
          </mesh>
        )}
      </group>
    );
  }, []);

  // Hover tooltip
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string>('');
  const [hoverSubtitle, setHoverSubtitle] = useState<string>('');
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleNodePointerOver = useCallback(
    (node: InternalGraphNode) => {
      onNodePointerOver?.(node);
      setHoverNodeId(node.id);
      setHoverLabel((node.label as string) ?? node.id);
      const d = node.data as CausalNodeData | undefined;
      setHoverSubtitle(d?.nodeType ?? '');
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
        renderNode={renderNode}
        selections={selections}
        actives={isRevealing && narrativeActives ? narrativeActives : actives}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
        onNodePointerOver={handleNodePointerOver}
        onNodePointerOut={handleNodePointerOut}
        labelType="nodes"
        draggable
        defaultNodeSize={5}
        minDistance={200}
        maxDistance={8000}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[20, 20, 10]} intensity={1.2} />
        <directionalLight position={[-15, -10, -8]} intensity={0.4} color="#FFFFFF" />
        <pointLight position={[0, 30, 10]} intensity={0.6} color="#FFFFFF" />
        <SlowOrbit graphRef={graphRef} startDelayMs={isRevealing ? 6500 : 1500} />
      </GraphCanvas>
      <ResetViewButton graphRef={graphRef} />
      {hoverNodeId && !isRevealing && (
        <NodeHoverTooltip
          title={hoverLabel}
          subtitle={hoverSubtitle ? hoverSubtitle.toUpperCase() : undefined}
          x={pointerPos.x}
          y={pointerPos.y}
        />
      )}
    </div>
  );
}
