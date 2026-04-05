/**
 * Decision Knowledge Graph — Builder Module
 *
 * Assembles a multi-type graph from the database, including:
 *   - Analysis nodes (from document analyses)
 *   - HumanDecision nodes (from real-time decision capture)
 *   - Person nodes (inferred from recurring participants/stakeholders)
 *   - Bias pattern nodes (inferred from recurring bias types)
 *   - Outcome nodes (from DecisionOutcome records)
 *   - Explicit edges (from DecisionEdge table)
 *   - Implicit edges (person->decision, bias_pattern->analysis)
 *
 * Consumed by the /api/decision-graph route and the RelatedDecisions panel.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { computePageRank } from './centrality';
import { detectGraphAntiPatterns, type GraphAntiPattern } from './graph-patterns';
import { resolveEntities } from './entity-resolution';
import { searchSimilarDocuments } from '@/lib/rag/embeddings';

const log = createLogger('GraphBuilder');

// ─── Internal Types ──────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: 'analysis' | 'human_decision' | 'person' | 'bias_pattern' | 'outcome';
  label: string;
  score: number;
  outcome?: string;
  biasCount: number;
  toxicComboCount: number;
  participants: string[];
  monetaryValue: number | null;
  createdAt: string;
  pageRank?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceType: string;
  targetType: string;
  edgeType: string;
  strength: number;
  confidence: number;
  description: string | null;
  isManual: boolean;
  createdBy: string;
}

export interface GraphCluster {
  id: string;
  nodeIds: string[];
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  inferredEdges: number;
  manualEdges: number;
  clusters: number;
  mostConnectedNode: string | null;
  avgDegree: number;
}

export interface DecisionGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  stats: GraphStats;
  antiPatterns: GraphAntiPattern[];
}

// ─── Union-Find for Cluster Detection ────────────────────────────────────────

class UnionFind {
  private parent = new Map<string, string>();

  add(id: string): void {
    if (!this.parent.has(id)) this.parent.set(id, id);
  }

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let current = x;
    while (current !== root) {
      const next = this.parent.get(current)!;
      this.parent.set(current, root);
      current = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    this.parent.set(this.find(a), this.find(b));
  }

  clusters(): GraphCluster[] {
    const groups = new Map<string, string[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(id);
    }
    return [...groups.entries()].map(([root, nodeIds]) => ({
      id: root,
      nodeIds,
    }));
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PERSON_NODES = 50;
const MAX_BIAS_PATTERN_NODES = 50;
const DEFAULT_TIME_RANGE_DAYS = 90;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

// ─── Main Builder ────────────────────────────────────────────────────────────

export async function buildDecisionGraph(params: {
  orgId: string;
  userId: string;
  timeRangeDays?: number;
  highlightNodeId?: string | null;
  depth?: number;
  limit?: number;
  nodeTypes?: string[] | null;
}): Promise<DecisionGraphResult> {
  const {
    orgId,
    timeRangeDays = DEFAULT_TIME_RANGE_DAYS,
    highlightNodeId,
    depth = 0,
    limit = DEFAULT_LIMIT,
    nodeTypes,
  } = params;

  const includeType = (type: string) => !nodeTypes || nodeTypes.includes(type);

  const safeLimit = Math.min(limit, MAX_LIMIT);
  const since = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

  log.info(
    `Building graph for org=${orgId} timeRange=${timeRangeDays}d limit=${safeLimit}` +
      (highlightNodeId ? ` highlight=${highlightNodeId} depth=${depth}` : '')
  );

  const nodes: GraphNode[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const allEdges: GraphEdge[] = [];

  // Helper to register a node
  const addNode = (node: GraphNode) => {
    if (!nodeMap.has(node.id)) {
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
  };

  // Helper to create an implicit edge
  let implicitEdgeCounter = 0;
  const addImplicitEdge = (
    sourceId: string,
    sourceType: string,
    targetId: string,
    targetType: string,
    edgeType: string,
    strength: number = 0.5
  ) => {
    implicitEdgeCounter++;
    allEdges.push({
      id: `implicit_${implicitEdgeCounter}`,
      source: sourceId,
      target: targetId,
      sourceType,
      targetType,
      edgeType,
      strength,
      confidence: 1.0,
      description: null,
      isManual: false,
      createdBy: 'system',
    });
  };

  // ── Step 1: Analysis nodes ───────────────────────────────────────────────

  const analyses = !includeType('analysis')
    ? []
    : await prisma.analysis.findMany({
        where: {
          document: { orgId },
          createdAt: { gte: since },
        },
        include: {
          biases: { select: { id: true, biasType: true, severity: true } },
          document: {
            select: {
              id: true,
              filename: true,
              decisionFrame: {
                select: {
                  monetaryValue: true,
                  stakeholders: true,
                },
              },
            },
          },
          outcome: { select: { id: true, outcome: true, impactScore: true } },
          toxicCombinations: {
            where: { status: 'active' },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
      });

  for (const a of analyses) {
    addNode({
      id: a.id,
      type: 'analysis',
      label: a.document.filename,
      score: a.overallScore,
      outcome: a.outcome?.outcome,
      biasCount: a.biases.length,
      toxicComboCount: a.toxicCombinations.length,
      participants: a.document.decisionFrame?.stakeholders ?? [],
      monetaryValue: a.document.decisionFrame?.monetaryValue
        ? Number(a.document.decisionFrame.monetaryValue)
        : null,
      createdAt: a.createdAt.toISOString(),
    });
  }

  log.debug(`Fetched ${analyses.length} analysis nodes`);

  // ── Step 2: HumanDecision nodes ──────────────────────────────────────────

  const humanDecisions = !includeType('human_decision')
    ? []
    : await prisma.humanDecision.findMany({
        where: {
          orgId,
          createdAt: { gte: since },
        },
        include: {
          cognitiveAudit: {
            select: { decisionQualityScore: true, dissenterCount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.max(50, safeLimit - nodes.length),
      });

  for (const hd of humanDecisions) {
    addNode({
      id: hd.id,
      type: 'human_decision',
      label: hd.content.slice(0, 80) + (hd.content.length > 80 ? '...' : ''),
      score: hd.cognitiveAudit?.decisionQualityScore ?? 50,
      outcome: undefined,
      biasCount: 0,
      toxicComboCount: 0,
      participants: hd.participants,
      monetaryValue: null,
      createdAt: hd.createdAt.toISOString(),
    });
  }

  log.debug(`Fetched ${humanDecisions.length} human decision nodes`);

  // ── Step 3: Person nodes (inferred) ──────────────────────────────────────
  // Extract unique participant names from DecisionFrame.stakeholders,
  // HumanDecision.participants, and Meeting.participants.
  // Only create person nodes for names appearing in 2+ decisions.

  const personAppearances = new Map<string, string[]>(); // canonical name -> decision node ids

  // Collect all raw names for entity resolution
  const allRawNames: string[] = [];
  for (const node of nodes) {
    if (node.type !== 'analysis' && node.type !== 'human_decision') continue;
    allRawNames.push(...node.participants);
  }
  const entityMap = resolveEntities(allRawNames);

  for (const node of nodes) {
    if (node.type !== 'analysis' && node.type !== 'human_decision') continue;
    for (const raw of node.participants) {
      const entity = entityMap.get(raw.toLowerCase().trim());
      const name = entity?.canonicalName || raw.toLowerCase().trim();
      if (!name) continue;
      if (!personAppearances.has(name)) personAppearances.set(name, []);
      personAppearances.get(name)!.push(node.id);
    }
  }

  // Also extract participants from Meetings (even those without HumanDecisions)
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        orgId: params.orgId,
        createdAt: { gte: since },
        participants: { isEmpty: false },
      },
      select: { id: true, participants: true, humanDecisionId: true },
      take: 100,
    });

    for (const meeting of meetings) {
      // Use the linked HumanDecision ID if available, else the meeting ID
      const nodeId = meeting.humanDecisionId || `meeting_${meeting.id}`;
      for (const raw of meeting.participants) {
        const name = raw.toLowerCase().trim();
        if (!name) continue;
        if (!personAppearances.has(name)) personAppearances.set(name, []);
        const ids = personAppearances.get(name)!;
        if (!ids.includes(nodeId)) ids.push(nodeId);
      }
    }
  } catch (meetingErr) {
    const code = (meetingErr as { code?: string })?.code;
    if (code !== 'P2021' && code !== 'P2022') {
      log.warn('Meeting participant extraction failed (non-critical):', meetingErr);
    }
  }

  // Filter to names with 2+ appearances, cap at MAX_PERSON_NODES
  const qualifiedPersons = [...personAppearances.entries()]
    .filter(([, ids]) => ids.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_PERSON_NODES);

  for (const [name, decisionIds] of qualifiedPersons) {
    const personId = `person_${name}`;
    addNode({
      id: personId,
      type: 'person',
      label: name,
      score: 0,
      biasCount: 0,
      toxicComboCount: 0,
      participants: [],
      monetaryValue: null,
      createdAt: new Date().toISOString(),
    });

    // Create implicit edges from person -> each decision they appear in
    for (const decisionId of decisionIds) {
      const targetNode = nodeMap.get(decisionId);
      if (targetNode) {
        addImplicitEdge(personId, 'person', decisionId, targetNode.type, 'same_participants', 0.6);
      }
    }
  }

  log.debug(`Created ${qualifiedPersons.length} person nodes`);

  // ── Step 4: Bias pattern nodes (inferred) ────────────────────────────────
  // Aggregate BiasInstance records across analyses. Each biasType appearing
  // in 2+ analyses becomes a bias_pattern node with implicit edges.

  const biasAppearances = new Map<string, string[]>(); // biasType -> analysis ids

  for (const a of analyses) {
    const seenBiases = new Set<string>();
    for (const bias of a.biases) {
      const biasType = bias.biasType.toLowerCase().trim();
      if (seenBiases.has(biasType)) continue;
      seenBiases.add(biasType);
      if (!biasAppearances.has(biasType)) biasAppearances.set(biasType, []);
      biasAppearances.get(biasType)!.push(a.id);
    }
  }

  const qualifiedBiases = [...biasAppearances.entries()]
    .filter(([, ids]) => ids.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_BIAS_PATTERN_NODES);

  for (const [biasType, analysisIds] of qualifiedBiases) {
    const biasId = `bias_${biasType}`;
    addNode({
      id: biasId,
      type: 'bias_pattern',
      label: biasType,
      score: 0,
      biasCount: analysisIds.length,
      toxicComboCount: 0,
      participants: [],
      monetaryValue: null,
      createdAt: new Date().toISOString(),
    });

    // Create implicit edges from bias_pattern -> each analysis that has it
    for (const analysisId of analysisIds) {
      addImplicitEdge(biasId, 'bias_pattern', analysisId, 'analysis', 'shared_bias', 0.7);
    }
  }

  log.debug(`Created ${qualifiedBiases.length} bias pattern nodes`);

  // ── Step 5: Outcome nodes ────────────────────────────────────────────────
  // Query DecisionOutcome for analyses in scope. Each becomes an outcome node
  // linked to its parent analysis.

  const analysisIdsInScope = analyses.map(a => a.id);
  const outcomes =
    analysisIdsInScope.length > 0
      ? await prisma.decisionOutcome.findMany({
          where: { analysisId: { in: analysisIdsInScope } },
          select: {
            id: true,
            analysisId: true,
            outcome: true,
            impactScore: true,
            reportedAt: true,
          },
          orderBy: { reportedAt: 'desc' },
          take: safeLimit,
        })
      : [];

  for (const o of outcomes) {
    addNode({
      id: o.id,
      type: 'outcome',
      label: o.outcome,
      score: o.impactScore ?? 0,
      biasCount: 0,
      toxicComboCount: 0,
      participants: [],
      monetaryValue: null,
      createdAt: o.reportedAt.toISOString(),
    });

    // Link outcome -> analysis
    addImplicitEdge(o.id, 'outcome', o.analysisId, 'analysis', 'depends_on', 1.0);
  }

  log.debug(`Created ${outcomes.length} outcome nodes`);

  // ── Step 6: Explicit edges (DecisionEdge table) ──────────────────────────
  // Wrap in try/catch for schema drift protection (P2021/P2022).

  let explicitEdges: Array<{
    id: string;
    sourceId: string;
    sourceType: string;
    targetId: string;
    targetType: string;
    edgeType: string;
    strength: number;
    confidence: number;
    description: string | null;
    isManual: boolean;
    createdBy: string;
  }> = [];

  try {
    const allNodeIds = [...nodeMap.keys()];

    const edgeWhere =
      highlightNodeId && depth === 1
        ? {
            orgId,
            OR: [{ sourceId: highlightNodeId }, { targetId: highlightNodeId }],
          }
        : {
            orgId,
            OR: [{ sourceId: { in: allNodeIds } }, { targetId: { in: allNodeIds } }],
          };

    explicitEdges = await prisma.decisionEdge.findMany({
      where: edgeWhere,
      select: {
        id: true,
        sourceId: true,
        sourceType: true,
        targetId: true,
        targetType: true,
        edgeType: true,
        strength: true,
        confidence: true,
        description: true,
        isManual: true,
        createdBy: true,
      },
      orderBy: { strength: 'desc' },
      take: 1000,
    });
  } catch (err: unknown) {
    // Schema drift protection: DecisionEdge table or columns may not exist yet
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2021' || prismaError.code === 'P2022') {
      log.warn(
        `DecisionEdge query failed with ${prismaError.code} (schema drift) — returning graph without explicit edges`
      );
    } else {
      throw err;
    }
  }

  for (const e of explicitEdges) {
    allEdges.push({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      sourceType: e.sourceType,
      targetType: e.targetType,
      edgeType: e.edgeType,
      strength: e.strength,
      confidence: e.confidence,
      description: e.description,
      isManual: e.isManual,
      createdBy: e.createdBy,
    });
  }

  log.debug(`Fetched ${explicitEdges.length} explicit edges`);

  // ── Depth-limited subgraph (highlight + 1-hop) ──────────────────────────
  // If highlightNodeId + depth=1, prune the graph to only the highlight
  // node and its immediate neighbors.

  if (highlightNodeId && depth === 1) {
    const neighborIds = new Set<string>();
    neighborIds.add(highlightNodeId);

    for (const edge of allEdges) {
      if (edge.source === highlightNodeId) neighborIds.add(edge.target);
      if (edge.target === highlightNodeId) neighborIds.add(edge.source);
    }

    // Remove nodes not in the neighbor set
    const prunedNodes: GraphNode[] = [];
    const prunedNodeMap = new Map<string, GraphNode>();
    for (const node of nodes) {
      if (neighborIds.has(node.id)) {
        prunedNodes.push(node);
        prunedNodeMap.set(node.id, node);
      }
    }

    // Remove edges not connecting neighbor nodes
    const prunedEdges = allEdges.filter(
      e => neighborIds.has(e.source) && neighborIds.has(e.target)
    );

    // Rebuild clusters from pruned set
    const uf = new UnionFind();
    for (const n of prunedNodes) uf.add(n.id);
    for (const e of prunedEdges) uf.union(e.source, e.target);

    const clusters = uf.clusters();
    const stats = computeStats(prunedNodes, prunedEdges, clusters);

    log.info(`Highlight subgraph: ${prunedNodes.length} nodes, ${prunedEdges.length} edges`);

    return {
      nodes: prunedNodes,
      edges: prunedEdges,
      clusters,
      stats,
      antiPatterns: [],
    };
  }

  // ── Step 7: Cluster detection ────────────────────────────────────────────

  const uf = new UnionFind();
  for (const n of nodes) uf.add(n.id);
  // Only use explicit edges for clustering (implicit edges are too noisy)
  for (const e of explicitEdges) uf.union(e.sourceId, e.targetId);

  const clusters = uf.clusters();

  // ── Step 8: Stats ────────────────────────────────────────────────────────

  const stats = computeStats(nodes, allEdges, clusters);

  // ── Step 9: PageRank centrality scoring ─────────────────────────────────

  const pageRanks = computePageRank(nodes, allEdges);
  for (const node of nodes) {
    node.pageRank = pageRanks.get(node.id) ?? 0;
  }

  // ── Step 10: Anti-pattern detection ────────────────────────────────────

  const antiPatterns = detectGraphAntiPatterns(nodes, allEdges, clusters);
  if (antiPatterns.length > 0) {
    log.info(`Detected ${antiPatterns.length} graph anti-pattern(s)`);
  }

  log.info(
    `Graph built: ${stats.totalNodes} nodes, ${stats.totalEdges} edges, ${stats.clusters} clusters`
  );

  return { nodes, edges: allEdges, clusters, stats, antiPatterns };
}

// ─── Stats Computation ──────────────────────────────────────────────────────

function computeStats(
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusters: GraphCluster[]
): GraphStats {
  const degreeMap = new Map<string, number>();
  let inferredEdges = 0;
  let manualEdges = 0;

  for (const e of edges) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);

    if (e.createdBy === 'system') inferredEdges++;
    if (e.isManual) manualEdges++;
  }

  let mostConnectedNode: string | null = null;
  let maxDegree = 0;
  for (const [nodeId, degree] of degreeMap) {
    if (degree > maxDegree) {
      maxDegree = degree;
      mostConnectedNode = nodeId;
    }
  }

  const totalDegree = [...degreeMap.values()].reduce((sum, d) => sum + d, 0);

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    inferredEdges,
    manualEdges,
    clusters: clusters.length,
    mostConnectedNode,
    avgDegree: nodes.length > 0 ? Number((totalDegree / nodes.length).toFixed(1)) : 0,
  };
}

// ─── M9.1 — "Have We Seen This Before?" ──────────────────────────────────────

/**
 * Structurally-similar prior decision as rendered in the banner.
 */
export interface SimilarDecision {
  analysisId: string;
  documentId: string;
  filename: string;
  overallScore: number;
  createdAt: string;
  /** RAG semantic similarity (0–1). */
  semanticSimilarity: number;
  /** 0–100 composite rank combining semantic similarity + outcome boost. */
  matchScore: number;
  /** Outcome status if reported; null if still pending. */
  outcome: 'success' | 'partial_success' | 'failure' | 'too_early' | null;
  /** Top 3 detected bias types on the historical analysis. */
  topBiases: string[];
  /** Short excerpt from the historical document for hover preview. */
  excerpt: string;
}

/**
 * "Have we seen this before?" — finds structurally similar past decisions
 * in the same org by running semantic similarity against the new
 * analysis's embedding, then reranking by outcome signal.
 *
 * Formula (simplified from the full moat formula in the plan):
 *   matchScore = 70% semantic + 30% outcome boost
 *
 * The plan's full "60% semantic + 30% graph distance + 10% outcome"
 * formula is what we eventually want, but the graph-distance term
 * requires a 2-hop traversal per candidate which is too expensive for
 * the first ship. Outcome-boost alone is the highest-signal simplification:
 * prior decisions WITH known outcomes are weighted more than pending ones.
 */
export async function findSimilarDecisions(
  analysisId: string,
  limit = 3
): Promise<SimilarDecision[]> {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        document: {
          select: {
            id: true,
            userId: true,
            orgId: true,
            content: true,
            filename: true,
          },
        },
      },
    });

    if (!analysis) {
      log.warn(`findSimilarDecisions: analysis ${analysisId} not found`);
      return [];
    }

    // Query RAG with the source document content (first 2k chars is plenty
    // for a decent embedding match). Fetch 3x the desired limit so we have
    // headroom for reranking.
    const candidateLimit = Math.max(10, limit * 4);
    const similar = await searchSimilarDocuments(
      analysis.document.content.slice(0, 2000),
      analysis.document.userId,
      candidateLimit,
      analysis.document.id // Exclude self
    );

    if (similar.length === 0) return [];

    // Join RAG results back to Analysis rows so we can pull outcome +
    // biases + createdAt. Scope to the same org when the caller has one.
    const candidateDocIds = similar.map(s => s.documentId);
    const candidateAnalyses = await prisma.analysis.findMany({
      where: {
        documentId: { in: candidateDocIds },
        ...(analysis.document.orgId
          ? { document: { orgId: analysis.document.orgId } }
          : {}),
      },
      include: {
        document: { select: { id: true, filename: true, content: true } },
        biases: {
          select: { biasType: true, severity: true },
          orderBy: { confidence: 'desc' },
          take: 3,
        },
        outcome: { select: { outcome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build a lookup map for fast join
    const analysisByDocId = new Map<string, (typeof candidateAnalyses)[number]>();
    for (const a of candidateAnalyses) {
      if (!analysisByDocId.has(a.document.id)) {
        analysisByDocId.set(a.document.id, a);
      }
    }

    // Merge similarity + outcome into the rerank score
    const ranked: SimilarDecision[] = [];
    for (const s of similar) {
      const match = analysisByDocId.get(s.documentId);
      if (!match) continue;

      const outcome = match.outcome?.outcome as SimilarDecision['outcome'] | null;
      // Outcome boost: +30 for known outcomes (stronger signal for the
      // user), +0 for pending. This is the "10% outcome boost" from the
      // plan formula, scaled up because we dropped the graph-distance term.
      const outcomeBoost = outcome && outcome !== 'too_early' ? 30 : 0;
      const matchScore = Math.round(s.similarity * 70 + outcomeBoost);

      ranked.push({
        analysisId: match.id,
        documentId: match.document.id,
        filename: match.document.filename,
        overallScore: match.overallScore,
        createdAt: match.createdAt.toISOString(),
        semanticSimilarity: s.similarity,
        matchScore,
        outcome,
        topBiases: match.biases.map(b => b.biasType),
        excerpt: match.document.content.slice(0, 240),
      });
    }

    ranked.sort((a, b) => b.matchScore - a.matchScore);
    return ranked.slice(0, limit);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift in findSimilarDecisions — returning empty result');
      return [];
    }
    log.error('findSimilarDecisions failed:', err);
    return [];
  }
}

// ─── M9.2 — Person-Centric Profile ──────────────────────────────────────────

/**
 * Aggregate profile for a single person node in the decision graph.
 * Drives the /dashboard/decision-graph/person/[encodedName] page.
 */
export interface PersonProfile {
  canonicalName: string;
  /** Decisions this person appears in as participant/stakeholder. */
  decisionCount: number;
  /** Count by outcome status across the person's decisions. */
  outcomeCounts: {
    success: number;
    partial_success: number;
    failure: number;
    too_early: number;
    pending: number;
  };
  /** Success rate over resolved outcomes (0–1), null if no outcomes. */
  successRate: number | null;
  /** Dominant biases detected across the person's decisions. */
  biasFingerprint: Array<{ biasType: string; count: number }>;
  /** Decision timeline, most recent first, capped at 20 for UI. */
  recentDecisions: Array<{
    analysisId: string;
    filename: string;
    overallScore: number;
    outcome: string | null;
    createdAt: string;
    topBiases: string[];
  }>;
  /** Average decision-quality score across resolved decisions. */
  avgScore: number | null;
}

/**
 * Build a person-centric profile by canonical name (already lowercased
 * and resolved via entity-resolution.ts). Org-scoped; caller must verify
 * the user has access to the org before calling this.
 *
 * Not cheap — fans out to 3 queries (decision frames, human decisions,
 * biases) and joins in-memory. Budget is fine for a one-person profile
 * page; don't call this in a loop.
 */
export async function getPersonProfile(
  canonicalName: string,
  orgId: string
): Promise<PersonProfile | null> {
  const nameLower = canonicalName.toLowerCase().trim();
  if (!nameLower) return null;

  try {
    // 1. Fetch all DecisionFrames for the org where this person is a stakeholder.
    //    DecisionFrame.stakeholders is a String[] column — we filter
    //    client-side after fetching because Prisma's has-any on arrays
    //    is case-sensitive and our canonicalization needs lowercase match.
    const frames = await prisma.decisionFrame.findMany({
      where: {
        document: { orgId },
      },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            analyses: {
              select: {
                id: true,
                overallScore: true,
                createdAt: true,
                biases: {
                  select: { biasType: true },
                  orderBy: { confidence: 'desc' },
                  take: 5,
                },
                outcome: { select: { outcome: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      take: 500, // Cap for safety — a single person in 500+ decisions is absurd
    });

    // 2. Also pull HumanDecisions where this person is in the participants array
    const humanDecisions = await prisma.humanDecision.findMany({
      where: {
        orgId,
      },
      select: {
        id: true,
        participants: true,
        content: true,
        createdAt: true,
        cognitiveAudit: { select: { decisionQualityScore: true } },
      },
      take: 500,
    });

    // 3. Entity-resolve the raw participant strings so we match across
    //    "Jane Smith", "J. Smith", "smith, jane"
    const allRawNames: string[] = [];
    for (const f of frames) allRawNames.push(...(f.stakeholders || []));
    for (const hd of humanDecisions) allRawNames.push(...(hd.participants || []));
    const entityMap = resolveEntities(allRawNames);

    const matchesCanonical = (raw: string): boolean => {
      const lower = raw.toLowerCase().trim();
      const entity = entityMap.get(lower);
      return (entity?.canonicalName || lower) === nameLower;
    };

    // 4. Collect matching analyses
    type Decision = PersonProfile['recentDecisions'][number];
    const decisions: Decision[] = [];

    for (const f of frames) {
      if (!(f.stakeholders || []).some(matchesCanonical)) continue;
      if (!f.document) continue;
      const analysis = f.document.analyses[0];
      if (!analysis) continue;
      decisions.push({
        analysisId: analysis.id,
        filename: f.document.filename,
        overallScore: analysis.overallScore,
        outcome: analysis.outcome?.outcome ?? null,
        createdAt: analysis.createdAt.toISOString(),
        topBiases: analysis.biases.map(b => b.biasType),
      });
    }

    // HumanDecisions count but don't add to the decisions list (they're
    // not analyses) — we just use them in the decisionCount total.
    let humanDecisionCount = 0;
    for (const hd of humanDecisions) {
      if ((hd.participants || []).some(matchesCanonical)) humanDecisionCount++;
    }

    if (decisions.length === 0 && humanDecisionCount === 0) {
      return null;
    }

    // 5. Compute outcome counts
    const outcomeCounts = {
      success: 0,
      partial_success: 0,
      failure: 0,
      too_early: 0,
      pending: 0,
    };
    let scoreSum = 0;
    let scoreCount = 0;
    for (const d of decisions) {
      if (d.outcome === 'success') outcomeCounts.success++;
      else if (d.outcome === 'partial_success') outcomeCounts.partial_success++;
      else if (d.outcome === 'failure') outcomeCounts.failure++;
      else if (d.outcome === 'too_early') outcomeCounts.too_early++;
      else outcomeCounts.pending++;
      scoreSum += d.overallScore;
      scoreCount++;
    }

    const resolved =
      outcomeCounts.success + outcomeCounts.partial_success + outcomeCounts.failure;
    const successRate =
      resolved > 0
        ? (outcomeCounts.success + outcomeCounts.partial_success * 0.5) / resolved
        : null;

    // 6. Bias fingerprint — count distinct bias types across the person's
    //    analyses, return top 5 for a compact UI.
    const biasTally = new Map<string, number>();
    for (const d of decisions) {
      for (const b of d.topBiases) {
        biasTally.set(b, (biasTally.get(b) ?? 0) + 1);
      }
    }
    const biasFingerprint = Array.from(biasTally.entries())
      .map(([biasType, count]) => ({ biasType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Recent decisions — most recent first, capped at 20
    decisions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      canonicalName: nameLower,
      decisionCount: decisions.length + humanDecisionCount,
      outcomeCounts,
      successRate,
      biasFingerprint,
      recentDecisions: decisions.slice(0, 20),
      avgScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : null,
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift in getPersonProfile — returning null');
      return null;
    }
    log.error('getPersonProfile failed:', err);
    return null;
  }
}
