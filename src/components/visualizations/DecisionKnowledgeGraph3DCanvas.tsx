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

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
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
    background: '#080c14',
    fog: null,
  },
  node: {
    fill: '#334155',
    activeFill: '#64748B',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.2,
    label: {
      color: '#94A3B8',
      activeColor: '#FFFFFF',
      stroke: '#080c14',
      strokeWidth: 5,
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
    inactiveOpacity: 0.08,
    label: {
      color: '#475569',
      activeColor: '#CBD5E1',
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

// ─── Node renderer ───────────────────────────────────────────────────────────

type DKGNodeType = 'analysis' | 'human_decision' | 'person' | 'bias_pattern' | 'outcome';

function DKGNodeRenderer({ node, size, opacity, active, selected }: NodeRendererProps) {
  const type: DKGNodeType = (node.data?.type as DKGNodeType) ?? 'analysis';
  // Parent already computed the fill color (score/path/search encoding)
  const col = (node.fill as string | undefined) ?? '#60A5FA';
  const o = opacity ?? 1;
  const emissive = selected ? 0.75 : active ? 0.38 : 0.1;

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

  // Glow ring on select/active (outer ghost mesh)
  const glowRing = (shape: React.ReactNode) =>
    selected || active ? (
      <mesh scale={[1.55, 1.55, 1.55]}>
        {shape}
        <meshStandardMaterial color={col} transparent opacity={0.07} />
      </mesh>
    ) : null;

  switch (type) {
    // analysis → low-poly icosahedron (complex data entity)
    case 'analysis': {
      const geo = <icosahedronGeometry args={[size, 1]} />;
      return (
        <group>
          <mesh>
            {geo}
            {mat(0.5, 0.3)}
          </mesh>
          {glowRing(geo)}
        </group>
      );
    }

    // human_decision → box (structured, deliberate, human-made)
    case 'human_decision': {
      const s = size * 1.4;
      const geo = <boxGeometry args={[s, s, s]} />;
      return (
        <group>
          <mesh>
            {geo}
            {mat(0.55, 0.25)}
          </mesh>
          {glowRing(geo)}
        </group>
      );
    }

    // person → smooth sphere (organic, human)
    case 'person': {
      const geo = <sphereGeometry args={[size * 0.85, 12, 8]} />;
      return (
        <group>
          <mesh>
            {geo}
            {mat(0.2, 0.65)}
          </mesh>
          {glowRing(geo)}
        </group>
      );
    }

    // bias_pattern → tetrahedron (sharpest shape — most dangerous)
    case 'bias_pattern': {
      const geo = <tetrahedronGeometry args={[size, 0]} />;
      return (
        <group>
          <mesh>
            {geo}
            {mat(0.05, 0.85)}
          </mesh>
          {glowRing(geo)}
        </group>
      );
    }

    // outcome → cylinder (grounded, final result)
    case 'outcome': {
      const geo = <cylinderGeometry args={[size * 0.8, size * 0.8, size * 2, 8]} />;
      return (
        <group>
          <mesh>
            {geo}
            {mat(0.4, 0.45)}
          </mesh>
          {glowRing(geo)}
        </group>
      );
    }

    default: {
      return (
        <mesh>
          <sphereGeometry args={[size, 10, 8]} />
          {mat(0.3, 0.5)}
        </mesh>
      );
    }
  }
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

  // Expose camera helpers to shell
  useImperativeHandle(ref, () => ({
    fitGraph: () => graphRef.current?.centerGraph(),
    exportCanvas: () => graphRef.current?.exportCanvas() ?? '',
  }));

  const { selections, actives, onNodeClick, onCanvasClick, onNodePointerOver, onNodePointerOut } =
    useSelection({
      ref: graphRef,
      nodes,
      edges,
      type: 'single',
      pathHoverType: 'all',
      focusOnSelect: true,
      onSelection: ids => {
        if (ids.length === 0) {
          onNodeSelect(null);
          return;
        }
        // Find internal node from reagraph store
        const internalNode = graphRef.current
          ?.getGraph()
          ?.getNodeAttribute(ids[0], 'data') as InternalGraphNode | undefined;
        // Fallback: just pass the id — parent can reconcile
        if (internalNode) {
          onNodeSelect(internalNode);
        } else {
          // Pass a minimal node-like object the parent can handle
          onNodeSelect({ id: ids[0] } as InternalGraphNode);
        }
      },
    });

  const renderNode = useCallback(
    (props: NodeRendererProps) => <DKGNodeRenderer {...props} />,
    []
  );

  return (
    <GraphCanvas
      ref={graphRef}
      nodes={nodes}
      edges={edges}
      layoutType="forceDirected3d"
      cameraMode="orbit"
      theme={DARK_THEME}
      renderNode={renderNode}
      selections={selections}
      actives={actives}
      onNodeClick={onNodeClick}
      onCanvasClick={onCanvasClick}
      onNodePointerOver={onNodePointerOver}
      onNodePointerOut={onNodePointerOut}
      labelType="auto"
      draggable
      defaultNodeSize={5}
      minDistance={200}
      maxDistance={8000}
    >
      {/* Three-point lighting rig */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[20, 20, 10]} intensity={1.6} />
      <directionalLight position={[-15, -10, -8]} intensity={0.45} color="#4F46E5" />
      <pointLight position={[0, 30, 10]} intensity={1.0} color="#60A5FA" />
      <pointLight position={[0, -20, -5]} intensity={0.35} color="#A78BFA" />
    </GraphCanvas>
  );
});

export default DecisionKnowledgeGraph3DCanvas;
