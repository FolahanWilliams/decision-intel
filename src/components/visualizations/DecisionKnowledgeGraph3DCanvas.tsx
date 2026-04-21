'use client';

/**
 * DecisionKnowledgeGraph3DCanvas
 * WebGL canvas rendered by reagraph (react-three-fiber under the hood).
 * Loaded via dynamic() in the shell — no SSR.
 *
 * Node shape encoding (matches the marketing hero graph):
 *   analysis       → dodecahedron (12-face crystal — audited memos)
 *   human_decision → dodecahedron (same — both are "decisions")
 *   person         → smooth sphere
 *   bias_pattern   → octahedron   (8-face spike — the risk)
 *   outcome        → cylinder     (pillar — realised result)
 *
 * Node colour is supplied by the parent (already encodes score / path / search highlight).
 * Node size is supplied by the parent (encodes sizeMetric).
 */

import {
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import {
  SlowOrbit,
  ResetViewButton,
  useEdgeNarrativeReveal,
  withNarrativeTheme,
  NodeHoverTooltip,
  SelectedGlow,
  useCanvasFitOnVisible,
} from './reagraph-helpers';
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

// ─── Theme ───────────────────────────────────────────────────────────────────

const DARK_THEME: Theme = {
  canvas: {
    background: '#FFFFFF',
    fog: null,
  },
  node: {
    fill: '#94A3B8',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 1,
    label: {
      color: '#475569',
      activeColor: '#0F172A',
      stroke: '#FFFFFF',
      strokeWidth: 5,
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
    inactiveOpacity: 1,
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

// ─── Node renderer (inlined — no React component wrapper) ────────────────────

type DKGNodeType = 'analysis' | 'human_decision' | 'person' | 'bias_pattern' | 'outcome';

// Pulsing halo used around critical bias nodes — matches the hero graph's
// attention-drawing effect. Animates scale + opacity in a gentle sine wave.
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

// ─── Canvas ref (exposed to shell for camera control) ────────────────────────

export interface DKGCanvasHandle {
  fitGraph: () => void;
  exportCanvas: () => string;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DecisionKnowledgeGraph3DCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect: (node: InternalGraphNode | null) => void;
}

// ─── Canvas component ────────────────────────────────────────────────────────

const DecisionKnowledgeGraph3DCanvas = forwardRef<
  DKGCanvasHandle,
  DecisionKnowledgeGraph3DCanvasProps
>(function DecisionKnowledgeGraph3DCanvas({ nodes, edges, onNodeSelect }, ref) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const hasGraph = nodes.length > 0;

  // Expose camera helpers to shell
  useImperativeHandle(ref, () => ({
    fitGraph: () => graphRef.current?.fitNodesInView(undefined, { animated: true }),
    exportCanvas: () => graphRef.current?.exportCanvas() ?? '',
  }));

  const nodeIds = useMemo(() => nodes.map(n => n.id), [nodes]);
  const edgeIds = useMemo(() => edges.map(e => e.id), [edges]);
  const { narrativeActives, isRevealing } = useEdgeNarrativeReveal({
    nodeIds,
    edgeIds,
    storageKey: 'di-graph-narrative:decision-knowledge',
  });
  const narrativeTheme = useMemo(() => withNarrativeTheme(DARK_THEME), []);

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
        onNodeSelect(null);
        return;
      }
      const internalNode = graphRef.current?.getGraph()?.getNodeAttribute(ids[0], 'data') as
        | InternalGraphNode
        | undefined;
      if (internalNode) {
        onNodeSelect(internalNode);
      } else {
        onNodeSelect({ id: ids[0] } as InternalGraphNode);
      }
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
    [selections, toggleSelection]
  );

  // Hover tooltip state — preview complementary to click-to-select.
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useCanvasFitOnVisible({ graphRef, containerRef: wrapperRef, enabled: hasGraph });
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string>('');
  const [hoverType, setHoverType] = useState<string>('');
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleNodePointerOver = useCallback(
    (node: InternalGraphNode) => {
      onNodePointerOver?.(node);
      setHoverNodeId(node.id);
      setHoverLabel((node.label as string) ?? node.id);
      const t = (node.data as { type?: string } | undefined)?.type ?? '';
      setHoverType(t);
    },
    [onNodePointerOver]
  );
  const handleNodePointerOut = useCallback(
    (node: InternalGraphNode) => {
      onNodePointerOut?.(node);
      setHoverNodeId(null);
    },
    [onNodePointerOut]
  );
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const renderNode = useCallback(({ node, size, opacity, active, selected }: NodeRendererProps) => {
    const type: DKGNodeType = (node.data?.type as DKGNodeType) ?? 'analysis';
    const col = (node.fill as string | undefined) ?? '#60A5FA';
    const o = opacity ?? 1;
    const emissive = selected ? 0.4 : active ? 0.25 : 0.12;
    // Severity is optional on the node payload — only bias_pattern nodes
    // carry one. Promote critical biases with a pulsing halo, matching the
    // hero graph's attention-drawing treatment.
    const severity = (node.data as { severity?: string } | undefined)?.severity;
    const isCriticalBias = type === 'bias_pattern' && severity === 'critical';

    // Both analysis and human_decision are "decisions" → dodecahedron.
    if (type === 'analysis' || type === 'human_decision') {
      return (
        <group>
          <mesh>
            <dodecahedronGeometry args={[size, 0]} />
            <meshPhongMaterial
              color={col}
              emissive={col}
              emissiveIntensity={emissive}
              shininess={90}
              specular="#FFFFFF"
              side={DoubleSide}
              transparent
              opacity={o}
            />
          </mesh>
          {selected && <SelectedGlow size={size} color={col} shape="dodecahedron" />}
        </group>
      );
    }

    // Bias → octahedron. Critical biases get the pulsing halo.
    if (type === 'bias_pattern') {
      return (
        <group>
          <mesh>
            <octahedronGeometry args={[size, 0]} />
            <meshPhongMaterial
              color={col}
              emissive={col}
              emissiveIntensity={emissive}
              shininess={90}
              specular="#FFFFFF"
              side={DoubleSide}
              transparent
              opacity={o}
            />
          </mesh>
          {selected && <SelectedGlow size={size} color={col} shape="octahedron" />}
          {isCriticalBias && !selected && (
            <PulsingHalo size={size} color={col} shape="octahedron" />
          )}
        </group>
      );
    }

    // Outcome → cylinder (pillar).
    if (type === 'outcome') {
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[size * 0.82, size * 0.82, size * 2.2, 8]} />
            <meshPhongMaterial
              color={col}
              emissive={col}
              emissiveIntensity={emissive}
              shininess={90}
              specular="#FFFFFF"
              side={DoubleSide}
              transparent
              opacity={o}
            />
          </mesh>
          {selected && (
            <SelectedGlow
              size={size}
              color={col}
              shape="cylinder"
              cylinder={{ radiusFactor: 0.82, heightFactor: 2.2, segments: 8 }}
            />
          )}
        </group>
      );
    }

    // Person (and fallback) → smooth sphere.
    return (
      <group>
        <mesh>
          <sphereGeometry args={[size * 0.85, 16, 12]} />
          <meshPhongMaterial
            color={col}
            emissive={col}
            emissiveIntensity={emissive}
            shininess={90}
            specular="#FFFFFF"
            side={DoubleSide}
            transparent
            opacity={o}
          />
        </mesh>
        {selected && <SelectedGlow size={size * 0.85} color={col} shape="sphere" />}
      </group>
    );
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
        theme={isRevealing ? narrativeTheme : DARK_THEME}
        renderNode={renderNode}
        selections={selections}
        actives={isRevealing && narrativeActives ? narrativeActives : actives}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
        onNodePointerOver={handleNodePointerOver}
        onNodePointerOut={handleNodePointerOut}
        labelType="nodes"
        draggable
        defaultNodeSize={7}
        minDistance={400}
        maxDistance={8000}
      >
        {/* Three-point lighting rig */}
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
          subtitle={hoverType ? hoverType.replace(/_/g, ' ').toUpperCase() : undefined}
          x={pointerPos.x}
          y={pointerPos.y}
        />
      )}
    </div>
  );
});

export default DecisionKnowledgeGraph3DCanvas;
