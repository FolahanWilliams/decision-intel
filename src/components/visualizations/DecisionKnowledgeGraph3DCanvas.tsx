'use client';

/**
 * DecisionKnowledgeGraph3DCanvas
 * WebGL canvas rendered by reagraph (react-three-fiber under the hood).
 * Loaded via dynamic() in the shell — no SSR.
 *
 * Node shape encoding:
 *   analysis       → low-poly sphere    (IcosahedronGeometry detail=1)
 *   human_decision → box/cube           (BoxGeometry)
 *   person         → smooth sphere      (SphereGeometry)
 *   bias_pattern   → tetrahedron        (TetrahedronGeometry) — sharpest, most dangerous
 *   outcome        → cylinder           (CylinderGeometry)
 *
 * Node colour is supplied by the parent (already encodes score / path / search highlight).
 * Node size is supplied by the parent (encodes sizeMetric).
 */

import {
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
} from 'react';
import { DoubleSide } from 'three';
import {
  SlowOrbit,
  ResetViewButton,
  useEdgeNarrativeReveal,
  withNarrativeTheme,
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
    inactiveOpacity: 0.35,
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

// ─── Node renderer (inlined — no React component wrapper) ────────────────────

type DKGNodeType = 'analysis' | 'human_decision' | 'person' | 'bias_pattern' | 'outcome';

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

  // Force-directed 3D layout settles over multiple ticks. Retry fitNodesInView
  // through ~4s so whichever call lands post-stabilization frames the camera.
  useEffect(() => {
    const delays = [250, 700, 1300, 2000, 2800, 3800];
    const timers = delays.map(ms =>
      setTimeout(() => {
        graphRef.current?.fitNodesInView(undefined, { animated: false });
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

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
      const internalNode = graphRef.current
        ?.getGraph()
        ?.getNodeAttribute(ids[0], 'data') as InternalGraphNode | undefined;
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
    [selections, toggleSelection],
  );

  const renderNode = useCallback(({ node, size, opacity, active, selected }: NodeRendererProps) => {
    const type: DKGNodeType = (node.data?.type as DKGNodeType) ?? 'analysis';
    const col = (node.fill as string | undefined) ?? '#60A5FA';
    const o = opacity ?? 1;
    const emissive = selected ? 0.4 : active ? 0.25 : 0.12;
    const glow = selected || active;

    switch (type) {
      case 'analysis':
        return (
          <group>
            <mesh>
              <icosahedronGeometry args={[size, 1]} />
              <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
            </mesh>
            {glow && <mesh scale={[1.55, 1.55, 1.55]}><icosahedronGeometry args={[size, 1]} /><meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} /></mesh>}
          </group>
        );
      case 'human_decision': {
        const s = size * 1.4;
        return (
          <group>
            <mesh>
              <boxGeometry args={[s, s, s]} />
              <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
            </mesh>
            {glow && <mesh scale={[1.55, 1.55, 1.55]}><boxGeometry args={[s, s, s]} /><meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} /></mesh>}
          </group>
        );
      }
      case 'person':
        return (
          <group>
            <mesh>
              <sphereGeometry args={[size * 0.85, 12, 8]} />
              <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
            </mesh>
            {glow && <mesh scale={[1.55, 1.55, 1.55]}><sphereGeometry args={[size * 0.85, 12, 8]} /><meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} /></mesh>}
          </group>
        );
      case 'bias_pattern':
        return (
          <group>
            <mesh>
              <tetrahedronGeometry args={[size, 0]} />
              <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
            </mesh>
            {glow && <mesh scale={[1.55, 1.55, 1.55]}><tetrahedronGeometry args={[size, 0]} /><meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} /></mesh>}
          </group>
        );
      case 'outcome':
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[size * 0.8, size * 0.8, size * 2, 8]} />
              <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
            </mesh>
            {glow && <mesh scale={[1.55, 1.55, 1.55]}><cylinderGeometry args={[size * 0.8, size * 0.8, size * 2, 8]} /><meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} /></mesh>}
          </group>
        );
      default:
        return (
          <mesh>
            <sphereGeometry args={[size, 10, 8]} />
            <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
          </mesh>
        );
    }
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
        theme={isRevealing ? narrativeTheme : DARK_THEME}
        renderNode={renderNode}
        selections={selections}
        actives={isRevealing && narrativeActives ? narrativeActives : actives}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
        onNodePointerOver={onNodePointerOver}
        onNodePointerOut={onNodePointerOut}
        labelType="nodes"
        draggable
        defaultNodeSize={5}
        minDistance={200}
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
    </div>
  );
});

export default DecisionKnowledgeGraph3DCanvas;
