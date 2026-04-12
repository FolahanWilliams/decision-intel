'use client';

import { useRef, useCallback, useEffect } from 'react';
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
      fill: '#1E3A5F',
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
        fill: '#475569',
        dashed: true,
        arrowPlacement: 'none',
      });
    }
  }

  return { nodes, edges };
}

// ─── Theme ──────────────────────────────────────────────────────────────────

const GRAPH_THEME: Theme = {
  canvas: { background: '#060d1a', fog: null },
  node: {
    fill: '#334155',
    activeFill: '#64748B',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.25,
    label: { color: '#94A3B8', activeColor: '#FFFFFF', stroke: '#060d1a', strokeWidth: 4 },
  },
  ring: { fill: '#16A34A', activeFill: '#22C55E' },
  edge: {
    fill: '#1E293B',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.12,
    label: { color: '#64748B', activeColor: '#E2E8F0' },
  },
  arrow: { fill: '#334155', activeFill: '#64748B' },
  lasso: { background: 'rgba(22,163,74,0.08)', border: '#16A34A' },
};

// ─── Node renderer ──────────────────────────────────────────────────────────

function renderNode({ node, size, opacity, active, selected }: NodeRendererProps) {
  const data = node.data as CaseStudyNodeData | undefined;
  const col = (node.fill as string) ?? '#60A5FA';
  const o = opacity ?? 1;
  const emissive = selected ? 0.8 : active ? 0.5 : 0.35;
  const glow = selected || active;

  if (data?.type === 'decision') {
    return (
      <group>
        <mesh>
          <dodecahedronGeometry args={[size, 0]} />
          <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} side={DoubleSide} transparent opacity={o} />
        </mesh>
        {glow && (
          <mesh scale={[1.55, 1.55, 1.55]}>
            <dodecahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.08} />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group>
      <mesh>
        <octahedronGeometry args={[size, 0]} />
        <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} side={DoubleSide} transparent opacity={o} />
      </mesh>
      {glow && (
        <mesh scale={[1.6, 1.6, 1.6]}>
          <octahedronGeometry args={[size, 0]} />
          <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} />
        </mesh>
      )}
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
  const { nodes, edges } = buildGraphData(biases, primaryBias, toxicCombinations);

  useEffect(() => {
    const timer = setTimeout(() => {
      graphRef.current?.centerGraph();
    }, 300);
    return () => clearTimeout(timer);
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

  const memoRenderNode = useCallback(renderNode, []);

  return (
    <GraphCanvas
      ref={graphRef}
      nodes={nodes}
      edges={edges}
      layoutType="forceDirected3d"
      cameraMode="rotate"
      animated={false}
      theme={GRAPH_THEME}
      renderNode={memoRenderNode}
      selections={selections}
      actives={actives}
      onNodeClick={onNodeClick}
      onCanvasClick={onCanvasClick}
      onNodePointerOver={onNodePointerOver}
      onNodePointerOut={onNodePointerOut}
      labelType="all"
      draggable
      defaultNodeSize={6}
      minDistance={200}
      maxDistance={4000}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 15, 10]} intensity={1.8} />
      <directionalLight position={[-10, -8, -5]} intensity={0.5} color="#4F46E5" />
      <pointLight position={[0, 20, 5]} intensity={1.2} color="#60A5FA" />
      <pointLight position={[0, -15, -5]} intensity={0.4} color="#A78BFA" />
    </GraphCanvas>
  );
}
