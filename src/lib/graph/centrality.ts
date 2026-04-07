/**
 * Graph centrality algorithms for Decision Knowledge Graph.
 * Identifies the most influential decision nodes.
 */

interface CentralityNode {
  id: string;
}

interface CentralityEdge {
  source: string;
  target: string;
  strength: number;
}

/**
 * PageRank — iterative power method.
 * Identifies nodes that are connected to by other well-connected nodes.
 */
export function computePageRank(
  nodes: CentralityNode[],
  edges: CentralityEdge[],
  options?: { damping?: number; iterations?: number }
): Map<string, number> {
  const damping = options?.damping ?? 0.85;
  const iterations = options?.iterations ?? 20;
  const n = nodes.length;
  if (n === 0) return new Map();

  // Build adjacency: inbound edges for each node
  const inbound = new Map<string, string[]>();
  const outDegree = new Map<string, number>();
  for (const node of nodes) {
    inbound.set(node.id, []);
    outDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    inbound.get(edge.target)?.push(edge.source);
    outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
    // Treat undirected edges as bidirectional
    inbound.get(edge.source)?.push(edge.target);
    outDegree.set(edge.target, (outDegree.get(edge.target) || 0) + 1);
  }

  // Initialize uniform PageRank
  let ranks = new Map<string, number>();
  for (const node of nodes) {
    ranks.set(node.id, 1 / n);
  }

  // Iterate with convergence check
  for (let i = 0; i < iterations; i++) {
    const newRanks = new Map<string, number>();
    for (const node of nodes) {
      let sum = 0;
      for (const src of inbound.get(node.id) || []) {
        const srcOutDeg = outDegree.get(src) || 1;
        sum += (ranks.get(src) || 0) / srcOutDeg;
      }
      newRanks.set(node.id, (1 - damping) / n + damping * sum);
    }
    // Early exit if ranks have converged
    let maxDelta = 0;
    for (const node of nodes) {
      const delta = Math.abs((newRanks.get(node.id) || 0) - (ranks.get(node.id) || 0));
      if (delta > maxDelta) maxDelta = delta;
    }
    ranks = newRanks;
    if (maxDelta < 1e-6) break;
  }

  // Normalize to 0-1 range
  const maxRank = Math.max(...ranks.values(), 0.001);
  for (const [id, rank] of ranks) {
    ranks.set(id, rank / maxRank);
  }

  return ranks;
}

/**
 * Degree centrality — count of connections per node.
 */
export function computeDegreeCentrality(
  nodes: CentralityNode[],
  edges: CentralityEdge[]
): Map<string, { in: number; out: number; total: number }> {
  const result = new Map<string, { in: number; out: number; total: number }>();
  for (const node of nodes) {
    result.set(node.id, { in: 0, out: 0, total: 0 });
  }

  for (const edge of edges) {
    const src = result.get(edge.source);
    const tgt = result.get(edge.target);
    if (src) {
      src.out++;
      src.total++;
    }
    if (tgt) {
      tgt.in++;
      tgt.total++;
    }
  }

  return result;
}

/**
 * Betweenness centrality — how often a node lies on shortest paths between other nodes.
 * Uses Brandes' algorithm (O(V*E) for unweighted graphs).
 * Capped at 200 nodes for performance.
 */
export function computeBetweennessCentrality(
  nodes: CentralityNode[],
  edges: CentralityEdge[]
): Map<string, number> {
  const betweenness = new Map<string, number>();
  for (const node of nodes) betweenness.set(node.id, 0);

  if (nodes.length > 200) {
    // Too large — return degree-based approximation
    const degree = computeDegreeCentrality(nodes, edges);
    const maxDeg = Math.max(...[...degree.values()].map(d => d.total), 1);
    for (const [id, d] of degree) {
      betweenness.set(id, d.total / maxDeg);
    }
    return betweenness;
  }

  // Build adjacency
  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node.id, []);
  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    adj.get(edge.target)?.push(edge.source);
  }

  // Brandes' algorithm
  for (const s of nodes) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();
    const delta = new Map<string, number>();

    for (const v of nodes) {
      pred.set(v.id, []);
      sigma.set(v.id, 0);
      dist.set(v.id, -1);
      delta.set(v.id, 0);
    }

    sigma.set(s.id, 1);
    dist.set(s.id, 0);
    const queue: string[] = [s.id];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj.get(v) || []) {
        if (dist.get(w)! < 0) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w) || []) {
        const sigmaW = sigma.get(w) || 1;
        const d = delta.get(v)! + (sigma.get(v)! / sigmaW) * (1 + delta.get(w)!);
        delta.set(v, d);
      }
      if (w !== s.id) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  }

  // Normalize
  const maxB = Math.max(...betweenness.values(), 0.001);
  for (const [id, b] of betweenness) {
    betweenness.set(id, b / maxB);
  }

  return betweenness;
}
