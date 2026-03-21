'use client';

import { useState, useMemo, useRef } from 'react';
import { CognitiveAnalysisResult } from '@/types';
import { EyeOff } from 'lucide-react';

interface BlindSpotNetworkProps {
  blindSpots: CognitiveAnalysisResult['blindSpots'];
  blindSpotGap: number;
}

interface Node {
  id: number;
  name: string;
  description: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: number;
  target: number;
  weight: number;
}

/**
 * Force-directed network showing blind spot relationships.
 * Connected blind spots form "vulnerability clusters."
 */
export function BlindSpotNetwork({ blindSpots, blindSpotGap: _blindSpotGap }: BlindSpotNetworkProps) {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = 500;
  const height = 320;

  // Build nodes and edges based on keyword similarity
  const { nodes, edges, clusters } = useMemo(() => {
    const nodeList: Node[] = blindSpots.map((spot, i) => ({
      id: i,
      name: spot.name,
      description: spot.description,
      x: width / 2 + (Math.cos((i / blindSpots.length) * 2 * Math.PI) * width) / 3,
      y: height / 2 + (Math.sin((i / blindSpots.length) * 2 * Math.PI) * height) / 3,
      vx: 0,
      vy: 0,
    }));

    // Compute keyword overlap for edges
    const edgeList: Edge[] = [];
    for (let i = 0; i < blindSpots.length; i++) {
      const wordsI = new Set(
        `${blindSpots[i].name} ${blindSpots[i].description}`
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 3)
      );
      for (let j = i + 1; j < blindSpots.length; j++) {
        const wordsJ = `${blindSpots[j].name} ${blindSpots[j].description}`
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 3);
        const overlap = wordsJ.filter(w => wordsI.has(w)).length;
        if (overlap > 0) {
          edgeList.push({ source: i, target: j, weight: Math.min(overlap, 5) });
        }
      }
    }

    // Simple union-find for clusters
    const parent = nodeList.map((_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const union = (a: number, b: number) => {
      parent[find(a)] = find(b);
    };
    for (const e of edgeList) union(e.source, e.target);

    const clusterMap = new Map<number, number[]>();
    nodeList.forEach((_, i) => {
      const root = find(i);
      if (!clusterMap.has(root)) clusterMap.set(root, []);
      clusterMap.get(root)!.push(i);
    });

    return {
      nodes: nodeList,
      edges: edgeList,
      clusters: Array.from(clusterMap.values()).filter(c => c.length > 1),
    };
  }, [blindSpots, width, height]);

  // Run simple force simulation (pure computation, no side effects)
  const positions = useMemo(() => {
    if (nodes.length === 0) return [];

    const pos = nodes.map(n => ({ x: n.x, y: n.y }));
    const vel = nodes.map(() => ({ vx: 0, vy: 0 }));

    const iterations = 80;
    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1 - iter / iterations;

      // Repulsion
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = (3000 * alpha) / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          vel[i].vx -= fx;
          vel[i].vy -= fy;
          vel[j].vx += fx;
          vel[j].vy += fy;
        }
      }

      // Attraction (edges)
      for (const e of edges) {
        const dx = pos[e.target].x - pos[e.source].x;
        const dy = pos[e.target].y - pos[e.source].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - 80) * 0.05 * alpha * e.weight;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        vel[e.source].vx += fx;
        vel[e.source].vy += fy;
        vel[e.target].vx -= fx;
        vel[e.target].vy -= fy;
      }

      // Center gravity
      for (let i = 0; i < pos.length; i++) {
        vel[i].vx += (width / 2 - pos[i].x) * 0.01 * alpha;
        vel[i].vy += (height / 2 - pos[i].y) * 0.01 * alpha;
      }

      // Apply velocities with damping
      for (let i = 0; i < pos.length; i++) {
        vel[i].vx *= 0.7;
        vel[i].vy *= 0.7;
        pos[i].x = Math.max(40, Math.min(width - 40, pos[i].x + vel[i].vx));
        pos[i].y = Math.max(40, Math.min(height - 40, pos[i].y + vel[i].vy));
      }
    }

    return pos.map(p => ({ x: p.x, y: p.y }));
  }, [nodes, edges, width, height]);

  if (blindSpots.length === 0) {
    return (
      <div className="text-center p-6 text-muted text-sm">No blind spots identified.</div>
    );
  }

  if (positions.length === 0) return null;

  const activeNode = selectedNode ?? hoveredNode;
  const connectedNodes = new Set<number>();
  if (activeNode !== null) {
    for (const e of edges) {
      if (e.source === activeNode) connectedNodes.add(e.target);
      if (e.target === activeNode) connectedNodes.add(e.source);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <EyeOff size={14} className="text-orange-400" />
          <span className="text-sm font-semibold">Blind Spot Network</span>
        </div>
        {clusters.length > 0 && (
          <span className="text-[10px] text-orange-400">
            {clusters.length} vulnerability cluster{clusters.length !== 1 ? 's' : ''} detected
          </span>
        )}
      </div>

      <div ref={containerRef} className="relative border border-border bg-secondary/30 overflow-hidden">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          role="img"
          aria-label="Blind spot relationship network"
        >
          {/* Cluster backgrounds */}
          {clusters.map((cluster, ci) => {
            const clusterPositions = cluster.map(id => positions[id]);
            const cx = clusterPositions.reduce((s, p) => s + p.x, 0) / cluster.length;
            const cy = clusterPositions.reduce((s, p) => s + p.y, 0) / cluster.length;
            const maxDist = Math.max(
              ...clusterPositions.map(p =>
                Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
              ),
              30
            );
            return (
              <circle
                key={`cluster-${ci}`}
                cx={cx}
                cy={cy}
                r={maxDist + 30}
                fill="rgba(251, 146, 60, 0.05)"
                stroke="rgba(251, 146, 60, 0.15)"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            );
          })}

          {/* Edges */}
          {edges.map((e, i) => {
            const s = positions[e.source];
            const t = positions[e.target];
            const isHighlighted =
              activeNode !== null &&
              (e.source === activeNode || e.target === activeNode);
            return (
              <line
                key={`edge-${i}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={isHighlighted ? 'rgba(251, 146, 60, 0.6)' : 'rgba(251, 146, 60, 0.2)'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={e.weight > 2 ? undefined : '4 2'}
              />
            );
          })}

          {/* Nodes */}
          {positions.map((pos, i) => {
            const isActive = activeNode === i;
            const isConnected = connectedNodes.has(i);
            const nodeRadius = isActive ? 22 : 18;
            const opacity =
              activeNode !== null && !isActive && !isConnected ? 0.3 : 1;

            return (
              <g
                key={`node-${i}`}
                style={{ cursor: 'pointer', opacity, transition: 'opacity 0.2s' }}
                onClick={() => setSelectedNode(selectedNode === i ? null : i)}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
                role="button"
                tabIndex={0}
                aria-label={`${blindSpots[i].name}: ${blindSpots[i].description}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNode(selectedNode === i ? null : i);
                  }
                }}
              >
                {/* Glow */}
                {isActive && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeRadius + 6}
                    fill="none"
                    stroke="rgba(251, 146, 60, 0.3)"
                    strokeWidth={2}
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill={isActive ? 'rgba(251, 146, 60, 0.25)' : 'rgba(251, 146, 60, 0.12)'}
                  stroke={isActive || isConnected ? 'rgba(251, 146, 60, 0.6)' : 'rgba(251, 146, 60, 0.3)'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={600}
                  fill="var(--text-primary)"
                >
                  {blindSpots[i].name.length > 12
                    ? blindSpots[i].name.slice(0, 10) + '…'
                    : blindSpots[i].name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected node detail */}
      {selectedNode !== null && blindSpots[selectedNode] && (
        <div className="p-3 border border-orange-500/30 bg-orange-500/5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-orange-400">
              {blindSpots[selectedNode].name}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted hover:text-foreground"
            >
              ×
            </button>
          </div>
          <p className="text-foreground/70 leading-relaxed">
            {blindSpots[selectedNode].description}
          </p>
          {connectedNodes.size > 0 && (
            <div className="pt-2 border-t border-border/50">
              <span className="text-orange-400 font-semibold">
                Connected blind spots ({connectedNodes.size}):
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(connectedNodes).map(id => (
                  <button
                    key={id}
                    onClick={() => setSelectedNode(id)}
                    className="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 transition-colors"
                  >
                    {blindSpots[id].name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted mt-1">
                Addressing this blind spot may partially resolve connected ones.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-muted text-center">
        Click nodes to explore · Connected blind spots form vulnerability clusters
      </div>
    </div>
  );
}
