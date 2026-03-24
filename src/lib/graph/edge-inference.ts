/**
 * Decision Graph — Edge Inference Engine
 *
 * Auto-detects relationships between decisions by analyzing:
 * - Semantic similarity (via RAG embeddings)
 * - Shared bias patterns
 * - Overlapping participants/stakeholders
 * - Temporal proximity + outcome cascades
 *
 * Each new analysis triggers edge inference, building an ever-richer
 * decision knowledge graph that becomes harder to replace over time.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('EdgeInference');

// ─── Types ──────────────────────────────────────────────────────────────────

export type EdgeType =
  | 'similar_to'
  | 'shared_bias'
  | 'same_participants'
  | 'influenced_by'
  | 'escalated_from'
  | 'reversed'
  | 'depends_on';

interface EdgeCandidate {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  edgeType: EdgeType;
  strength: number;
  confidence: number;
  description: string;
  metadata?: Record<string, unknown>;
}

// ─── Post-Analysis Edge Inference ───────────────────────────────────────────

/**
 * Infer edges for a newly completed analysis.
 * Runs as a non-blocking post-analysis hook.
 */
export async function inferEdgesForAnalysis(
  analysisId: string,
  orgId: string | null
): Promise<number> {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        biases: { select: { biasType: true, severity: true } },
        document: {
          select: {
            id: true,
            userId: true,
            content: true,
            filename: true,
            orgId: true,
            decisionFrame: {
              select: { stakeholders: true },
            },
          },
        },
        outcome: { select: { outcome: true } },
      },
    });

    if (!analysis) return 0;

    const candidates: EdgeCandidate[] = [];

    // 1. Shared bias edges
    const sharedBiasEdges = await findSharedBiasEdges(analysis, orgId);
    candidates.push(...sharedBiasEdges);

    // 2. Semantic similarity edges (via RAG)
    const similarityEdges = await findSimilarityEdges(analysis, orgId);
    candidates.push(...similarityEdges);

    // 3. Same participants edges
    const participantEdges = await findParticipantEdges(analysis, orgId);
    candidates.push(...participantEdges);

    // 4. Outcome cascade edges (escalation/reversal)
    const cascadeEdges = await findOutcomeCascadeEdges(analysis, orgId);
    candidates.push(...cascadeEdges);

    // Persist edges (upsert to avoid duplicates)
    let created = 0;
    for (const edge of candidates) {
      try {
        await prisma.decisionEdge.upsert({
          where: {
            sourceType_sourceId_targetType_targetId_edgeType: {
              sourceType: edge.sourceType,
              sourceId: edge.sourceId,
              targetType: edge.targetType,
              targetId: edge.targetId,
              edgeType: edge.edgeType,
            },
          },
          create: {
            orgId,
            ...edge,
            metadata: edge.metadata
              ? (JSON.parse(JSON.stringify(edge.metadata)) as Prisma.InputJsonValue)
              : undefined,
          },
          update: {
            strength: edge.strength,
            confidence: edge.confidence,
            description: edge.description,
          },
        });
        created++;
      } catch {
        // Unique constraint or other error — skip
      }
    }

    if (created > 0) {
      log.info(`Inferred ${created} edge(s) for analysis ${analysisId}`);
    }
    return created;
  } catch (error) {
    log.error('Edge inference failed:', error);
    return 0;
  }
}

// ─── Shared Bias Detection ──────────────────────────────────────────────────

interface AnalysisWithBiases {
  id: string;
  biases: Array<{ biasType: string; severity: string }>;
  document: {
    id: string;
    userId: string;
    content: string;
    filename: string;
    orgId: string | null;
    decisionFrame: { stakeholders: string[] } | null;
  };
  outcome: { outcome: string } | null;
}

async function findSharedBiasEdges(
  analysis: AnalysisWithBiases,
  orgId: string | null
): Promise<EdgeCandidate[]> {
  if (analysis.biases.length === 0) return [];

  const biasTypes = analysis.biases.map(b => b.biasType);

  // Find other analyses in the org with overlapping biases
  const otherAnalyses = await prisma.analysis.findMany({
    where: {
      id: { not: analysis.id },
      document: { orgId: orgId ?? undefined },
      biases: {
        some: { biasType: { in: biasTypes } },
      },
    },
    include: {
      biases: { select: { biasType: true } },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  const edges: EdgeCandidate[] = [];

  for (const other of otherAnalyses) {
    const otherBiasTypes = other.biases.map(b => b.biasType);
    const shared = biasTypes.filter(bt => otherBiasTypes.includes(bt));

    if (shared.length < 2) continue; // Need at least 2 shared biases

    const maxBiases = Math.max(biasTypes.length, otherBiasTypes.length);
    const strength = shared.length / maxBiases;

    edges.push({
      sourceType: 'analysis',
      sourceId: analysis.id,
      targetType: 'analysis',
      targetId: other.id,
      edgeType: 'shared_bias',
      strength: Number(strength.toFixed(3)),
      confidence: Math.min(1, shared.length / 3), // 3+ shared = full confidence
      description: `${shared.length} shared biases: ${shared.join(', ')}`,
      metadata: { sharedBiases: shared, sharedCount: shared.length },
    });
  }

  return edges;
}

// ─── Semantic Similarity ────────────────────────────────────────────────────

async function findSimilarityEdges(
  analysis: AnalysisWithBiases,
  _orgId: string | null
): Promise<EdgeCandidate[]> {
  try {
    const { searchSimilarWithOutcomes } = await import('@/lib/rag/embeddings');
    const similar = await searchSimilarWithOutcomes(
      analysis.document.content.slice(0, 2000), // First 2000 chars for query
      analysis.document.userId,
      10
    );

    const edges: EdgeCandidate[] = [];

    for (const match of similar) {
      // Skip self-match
      if (match.documentId === analysis.document.id) continue;

      // Only create edge for strong similarity
      if (match.similarity < 0.7) continue;

      // Find the analysis for this document
      const matchAnalysis = await prisma.analysis.findFirst({
        where: { documentId: match.documentId },
        select: { id: true },
      });

      if (!matchAnalysis) continue;

      edges.push({
        sourceType: 'analysis',
        sourceId: analysis.id,
        targetType: 'analysis',
        targetId: matchAnalysis.id,
        edgeType: 'similar_to',
        strength: Number(match.similarity.toFixed(3)),
        confidence: 0.8, // RAG similarity is fairly reliable
        description: `Semantically similar (${(match.similarity * 100).toFixed(0)}% match) to "${match.filename}"`,
        metadata: {
          similarity: match.similarity,
          filename: match.filename,
          sharedBiases: match.biases,
        },
      });
    }

    return edges;
  } catch {
    // RAG not available — skip similarity edges
    return [];
  }
}

// ─── Same Participants ──────────────────────────────────────────────────────

async function findParticipantEdges(
  analysis: AnalysisWithBiases,
  orgId: string | null
): Promise<EdgeCandidate[]> {
  const stakeholders = analysis.document.decisionFrame?.stakeholders ?? [];
  if (stakeholders.length === 0) return [];

  // Normalize participants for comparison
  const normalizedStakeholders = new Set(
    stakeholders.map(s => s.toLowerCase().trim())
  );

  // Find other analyses with overlapping stakeholders within 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const otherFrames = await prisma.decisionFrame.findMany({
    where: {
      orgId: orgId ?? undefined,
      documentId: { not: analysis.document.id },
      createdAt: { gte: thirtyDaysAgo },
      stakeholders: { isEmpty: false },
    },
    include: {
      document: {
        select: {
          analyses: { select: { id: true }, take: 1 },
        },
      },
    },
    take: 50,
  });

  const edges: EdgeCandidate[] = [];

  for (const frame of otherFrames) {
    const otherStakeholders = new Set(
      frame.stakeholders.map(s => s.toLowerCase().trim())
    );

    const overlap = [...normalizedStakeholders].filter(s => otherStakeholders.has(s));
    const overlapRatio = overlap.length / Math.max(normalizedStakeholders.size, otherStakeholders.size);

    if (overlapRatio < 0.5 || overlap.length < 2) continue;

    const targetAnalysisId = frame.document?.analyses?.[0]?.id;
    if (!targetAnalysisId) continue;
    if (targetAnalysisId === analysis.id) continue;

    edges.push({
      sourceType: 'analysis',
      sourceId: analysis.id,
      targetType: 'analysis',
      targetId: targetAnalysisId,
      edgeType: 'same_participants',
      strength: Number(overlapRatio.toFixed(3)),
      confidence: 0.9,
      description: `${overlap.length} shared stakeholders: ${overlap.join(', ')}`,
      metadata: { sharedParticipants: overlap, overlapRatio },
    });
  }

  return edges;
}

// ─── Outcome Cascade Detection ──────────────────────────────────────────────

async function findOutcomeCascadeEdges(
  analysis: AnalysisWithBiases,
  orgId: string | null
): Promise<EdgeCandidate[]> {
  // Find recent failed decisions in the org
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const recentFailures = await prisma.decisionOutcome.findMany({
    where: {
      orgId: orgId ?? undefined,
      outcome: 'failure',
      reportedAt: { gte: fourteenDaysAgo },
      analysisId: { not: analysis.id },
    },
    include: {
      analysis: {
        select: {
          id: true,
          summary: true,
          biases: { select: { biasType: true } },
        },
      },
    },
    take: 20,
  });

  if (recentFailures.length === 0) return [];

  const edges: EdgeCandidate[] = [];
  const currentBiases = new Set(analysis.biases.map(b => b.biasType));

  for (const failure of recentFailures) {
    if (!failure.analysis) continue;

    // Check if the new analysis shares biases with the failed one
    const failedBiases = failure.analysis.biases.map(b => b.biasType);
    const sharedBiases = failedBiases.filter(bt => currentBiases.has(bt));

    if (sharedBiases.length < 1) continue;

    // This could be an escalation or follow-up to the failed decision
    edges.push({
      sourceType: 'analysis',
      sourceId: analysis.id,
      targetType: 'analysis',
      targetId: failure.analysisId,
      edgeType: 'escalated_from',
      strength: Math.min(1, sharedBiases.length / 3),
      confidence: 0.5, // Low confidence — needs user confirmation
      description: `May be follow-up to failed decision. ${sharedBiases.length} shared bias(es) with recent failure.`,
      metadata: { sharedBiases, failedOutcome: failure.outcome },
    });
  }

  return edges;
}

// ─── Batch Temporal Inference ───────────────────────────────────────────────

/**
 * Batch infer temporal edges for an org.
 * Runs as a cron job to discover relationships missed by real-time inference.
 */
export async function inferTemporalEdges(orgId: string): Promise<number> {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Find all analyses in the org from last 90 days
    const analyses = await prisma.analysis.findMany({
      where: {
        document: { orgId },
        createdAt: { gte: ninetyDaysAgo },
      },
      include: {
        biases: { select: { biasType: true } },
        document: {
          select: {
            id: true,
            userId: true,
            filename: true,
            decisionFrame: { select: { stakeholders: true } },
          },
        },
        outcome: { select: { outcome: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    let edgesCreated = 0;

    // Check sequential pairs by same user within 14 days
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < Math.min(i + 10, analyses.length); j++) {
        const a = analyses[i];
        const b = analyses[j];

        // Same user, within 14 days
        if (a.document.userId !== b.document.userId) continue;
        const daysBetween =
          (b.createdAt.getTime() - a.createdAt.getTime()) / (24 * 60 * 60 * 1000);
        if (daysBetween > 14) continue;

        // Check for shared biases
        const aBiases = new Set(a.biases.map(b2 => b2.biasType));
        const bBiases = b.biases.map(b2 => b2.biasType);
        const shared = bBiases.filter(bt => aBiases.has(bt));

        if (shared.length >= 2) {
          try {
            await prisma.decisionEdge.upsert({
              where: {
                sourceType_sourceId_targetType_targetId_edgeType: {
                  sourceType: 'analysis',
                  sourceId: b.id,
                  targetType: 'analysis',
                  targetId: a.id,
                  edgeType: 'influenced_by',
                },
              },
              create: {
                orgId,
                sourceType: 'analysis',
                sourceId: b.id,
                targetType: 'analysis',
                targetId: a.id,
                edgeType: 'influenced_by',
                strength: Math.min(1, shared.length / 4),
                confidence: 0.5,
                description: `Same decision-maker, ${daysBetween.toFixed(0)} days apart, ${shared.length} shared biases`,
              },
              update: {},
            });
            edgesCreated++;
          } catch {
            // Skip duplicate
          }
        }
      }
    }

    log.info(`Inferred ${edgesCreated} temporal edge(s) for org ${orgId}`);
    return edgesCreated;
  } catch (error) {
    log.error('Temporal edge inference failed:', error);
    return 0;
  }
}

// ─── Manual Edge Management ─────────────────────────────────────────────────

export async function addManualEdge(params: {
  orgId: string | null;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  edgeType: EdgeType;
  description?: string;
  userId: string;
}): Promise<{ id: string }> {
  const edge = await prisma.decisionEdge.create({
    data: {
      orgId: params.orgId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      targetType: params.targetType,
      targetId: params.targetId,
      edgeType: params.edgeType,
      strength: 1.0,
      confidence: 1.0,
      description: params.description ?? `Manually linked by user`,
      createdBy: params.userId,
      isManual: true,
    },
    select: { id: true },
  });
  return edge;
}
