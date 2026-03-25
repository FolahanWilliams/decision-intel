/**
 * Graph path-finding algorithms for Decision Knowledge Graph.
 * Runs client-side on filtered graph data.
 */

interface PathNode {
  id: string;
}

interface PathEdge {
  id: string;
  source: string | { id: string };
  target: string | { id: string };
  strength: number;
  edgeType: string;
}

function getEdgeSourceId(e: PathEdge): string {
  return typeof e.source === 'string' ? e.source : e.source.id;
}

function getEdgeTargetId(e: PathEdge): string {
  return typeof e.target === 'string' ? e.target : e.target.id;
}

/**
 * BFS shortest path (unweighted — fewest hops).
 */
export function bfsShortestPath(
  nodes: PathNode[],
  edges: PathEdge[],
  startId: string,
  endId: string
): { path: string[]; edges: PathEdge[] } | null {
  if (startId === endId) return { path: [startId], edges: [] };

  const nodeIds = new Set(nodes.map(n => n.id));
  if (!nodeIds.has(startId) || !nodeIds.has(endId)) return null;

  // Build adjacency list
  const adj = new Map<string, Array<{ neighbor: string; edge: PathEdge }>>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    const src = getEdgeSourceId(e);
    const tgt = getEdgeTargetId(e);
    adj.get(src)?.push({ neighbor: tgt, edge: e });
    adj.get(tgt)?.push({ neighbor: src, edge: e });
  }

  const visited = new Set<string>([startId]);
  const parent = new Map<string, { nodeId: string; edge: PathEdge }>();
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const { neighbor, edge } of adj.get(current) || []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parent.set(neighbor, { nodeId: current, edge });
      if (neighbor === endId) {
        // Reconstruct path
        const path: string[] = [endId];
        const pathEdges: PathEdge[] = [];
        let node = endId;
        while (parent.has(node)) {
          const p = parent.get(node)!;
          path.unshift(p.nodeId);
          pathEdges.unshift(p.edge);
          node = p.nodeId;
        }
        return { path, edges: pathEdges };
      }
      queue.push(neighbor);
    }
  }

  return null;
}

/**
 * Dijkstra shortest path (weighted — uses inverse strength as cost).
 */
export function dijkstraPath(
  nodes: PathNode[],
  edges: PathEdge[],
  startId: string,
  endId: string
): { path: string[]; edges: PathEdge[]; totalWeight: number } | null {
  if (startId === endId) return { path: [startId], edges: [], totalWeight: 0 };

  const nodeIds = new Set(nodes.map(n => n.id));
  if (!nodeIds.has(startId) || !nodeIds.has(endId)) return null;

  const adj = new Map<string, Array<{ neighbor: string; edge: PathEdge; cost: number }>>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    const src = getEdgeSourceId(e);
    const tgt = getEdgeTargetId(e);
    const cost = 1 / Math.max(0.01, e.strength);
    adj.get(src)?.push({ neighbor: tgt, edge: e, cost });
    adj.get(tgt)?.push({ neighbor: src, edge: e, cost });
  }

  const dist = new Map<string, number>();
  const parent = new Map<string, { nodeId: string; edge: PathEdge }>();
  const visited = new Set<string>();

  for (const id of nodeIds) dist.set(id, Infinity);
  dist.set(startId, 0);

  // Simple priority queue via sorted array (adequate for graph sizes ≤ 500)
  const pq: Array<{ id: string; dist: number }> = [{ id: startId, dist: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: current } = pq.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endId) {
      const path: string[] = [endId];
      const pathEdges: PathEdge[] = [];
      let node = endId;
      while (parent.has(node)) {
        const p = parent.get(node)!;
        path.unshift(p.nodeId);
        pathEdges.unshift(p.edge);
        node = p.nodeId;
      }
      return { path, edges: pathEdges, totalWeight: dist.get(endId)! };
    }

    for (const { neighbor, edge, cost } of adj.get(current) || []) {
      if (visited.has(neighbor)) continue;
      const newDist = dist.get(current)! + cost;
      if (newDist < (dist.get(neighbor) ?? Infinity)) {
        dist.set(neighbor, newDist);
        parent.set(neighbor, { nodeId: current, edge });
        pq.push({ id: neighbor, dist: newDist });
      }
    }
  }

  return null;
}
