'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';
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
import { SlowOrbit, ResetViewButton, useEdgeNarrativeReveal } from './reagraph-helpers';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
};

interface BiasInput {
  biasType: string;
  severity: string;
  category?: string;
  excerpt?: string;
  explanation?: string;
  id?: string;
}

function formatBiasLabel(type: string): string {
  return type
    .replace(/_bias$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function buildKeywords(type: string): string[] {
  return type.replace(/_bias$/, '').split('_');
}

function buildGraphFromBiases(biases: BiasInput[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = biases.map(b => ({
    id: b.biasType,
    label: formatBiasLabel(b.biasType),
    fill: SEVERITY_COLORS[b.severity] ?? '#EAB308',
    size: b.severity === 'critical' ? 8 : b.severity === 'high' ? 7 : 5.5,
    data: { type: 'bias', severity: b.severity, excerpt: b.excerpt, explanation: b.explanation },
  }));

  const edges: GraphEdge[] = [];
  let edgeId = 0;

  for (let i = 0; i < biases.length; i++) {
    const kwA = buildKeywords(biases[i].biasType);
    for (let j = i + 1; j < biases.length; j++) {
      const kwB = buildKeywords(biases[j].biasType);
      const overlap = kwA.filter(k => kwB.includes(k)).length;
      if (overlap > 0 || biases[i].category === biases[j].category) {
        edges.push({
          id: `e${edgeId++}`,
          source: biases[i].biasType,
          target: biases[j].biasType,
          fill: '#475569',
          size: overlap > 0 ? 1.5 : 0.8,
          dashed: overlap === 0,
          arrowPlacement: 'none',
        });
      }
    }
  }

  if (edges.length === 0 && biases.length >= 2) {
    for (let i = 0; i < biases.length; i++) {
      const next = (i + 1) % biases.length;
      edges.push({
        id: `e${edgeId++}`,
        source: biases[i].biasType,
        target: biases[next].biasType,
        fill: '#334155',
        dashed: true,
        arrowPlacement: 'none',
      });
    }
  }

  return { nodes, edges };
}

const DARK_THEME: Theme = {
  canvas: { background: '#FFFFFF', fog: null },
  node: {
    fill: '#94A3B8',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.35,
    label: { color: '#475569', activeColor: '#0F172A', stroke: '#FFFFFF', strokeWidth: 5 },
  },
  ring: { fill: '#16A34A', activeFill: '#22C55E' },
  edge: {
    fill: '#CBD5E1',
    activeFill: '#64748B',
    opacity: 0.9,
    selectedOpacity: 1,
    inactiveOpacity: 0.18,
    label: { color: '#64748B', activeColor: '#0F172A' },
  },
  arrow: { fill: '#94A3B8', activeFill: '#475569' },
  lasso: { background: 'rgba(22,163,74,0.08)', border: '#16A34A' },
};

export interface BiasNetwork3DCanvasProps {
  biases: BiasInput[];
  onBiasSelect?: (biasType: string | null) => void;
}

export default function BiasNetwork3DCanvas({ biases, onBiasSelect }: BiasNetwork3DCanvasProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const { nodes, edges } = buildGraphFromBiases(biases);

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
    storageKey: 'di-graph-narrative:bias-network',
  });

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
      onBiasSelect?.(ids.length > 0 ? ids[0] : null);
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
    const col = (node.fill as string) ?? '#EAB308';
    const o = opacity ?? 1;
    const emissive = selected ? 0.4 : active ? 0.25 : 0.12;
    const glow = selected || active;

    return (
      <group>
        <mesh>
          <octahedronGeometry args={[size, 0]} />
          <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
        </mesh>
        {glow && (
          <mesh scale={[1.6, 1.6, 1.6]}>
            <octahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} />
          </mesh>
        )}
      </group>
    );
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GraphCanvas
        ref={graphRef}
        nodes={nodes}
        edges={edges}
        layoutType="forceDirected3d"
        cameraMode="rotate"
        animated={false}
        theme={DARK_THEME}
        renderNode={renderNode}
        selections={selections}
        actives={isRevealing && narrativeActives ? narrativeActives : actives}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
        onNodePointerOver={onNodePointerOver}
        onNodePointerOut={onNodePointerOut}
        labelType="auto"
        draggable
        defaultNodeSize={5}
        minDistance={200}
        maxDistance={6000}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[20, 20, 10]} intensity={1.2} />
        <directionalLight position={[-15, -10, -8]} intensity={0.4} color="#FFFFFF" />
        <pointLight position={[0, 30, 10]} intensity={0.6} color="#FFFFFF" />
        <SlowOrbit graphRef={graphRef} startDelayMs={isRevealing ? 4500 : 1500} />
      </GraphCanvas>
      <ResetViewButton graphRef={graphRef} />
    </div>
  );
}
