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
import { matchCaseStudiesSync } from '@/lib/research/caseStudyMatcher';

const log = createLogger('EdgeInference');

// ─── Types ──────────────────────────────────────────────────────────────────

export type EdgeType =
  | 'similar_to'
  | 'shared_bias'
  | 'same_participants'
  | 'influenced_by'
  | 'escalated_from'
  | 'reversed'
  | 'depends_on'
  | 'cross_department'
  | 'historical_parallel';

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

    // 5. Reversal edges (contradictory decisions)
    const reversalEdges = await findReversalEdges(analysis, orgId);
    candidates.push(...reversalEdges);

    // 6. Cross-department edges (same org, different user, shared biases + similar topic)
    const crossDeptEdges = await findCrossDepartmentEdges(analysis, orgId);
    candidates.push(...crossDeptEdges);

    // 7. Historical parallel edges (link to case study database)
    const historicalEdges = findHistoricalParallelEdges(analysis);
    candidates.push(...historicalEdges);

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
  const normalizedStakeholders = new Set(stakeholders.map(s => s.toLowerCase().trim()));

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
    const otherStakeholders = new Set(frame.stakeholders.map(s => s.toLowerCase().trim()));

    const overlap = [...normalizedStakeholders].filter(s => otherStakeholders.has(s));
    const overlapRatio =
      overlap.length / Math.max(normalizedStakeholders.size, otherStakeholders.size);

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

// ─── Reversal Edge Detection ────────────────────────────────────────────────

/**
 * Detect contradictory decisions: same topic (high semantic similarity)
 * but opposite outcomes. Creates 'reversed' edge type.
 */
async function findReversalEdges(
  analysis: AnalysisWithBiases,
  _orgId: string | null
): Promise<EdgeCandidate[]> {
  const currentOutcome = analysis.outcome?.outcome;
  if (!currentOutcome || currentOutcome === 'too_early') return [];

  try {
    const { searchSimilarWithOutcomes } = await import('@/lib/rag/embeddings');
    const similar = await searchSimilarWithOutcomes(
      analysis.document.content?.slice(0, 3000) || analysis.document.filename || '',
      analysis.document.userId,
      5
    );

    const edges: EdgeCandidate[] = [];
    for (const match of similar) {
      if (!match.outcome?.result) continue;
      if (match.documentId === analysis.document.id) continue;

      // Check for opposite outcomes (similarity > 0.8)
      if (match.similarity < 0.8) continue;

      const isReversed =
        (currentOutcome === 'success' && match.outcome.result === 'failure') ||
        (currentOutcome === 'failure' && match.outcome.result === 'success');

      if (!isReversed) continue;

      // Find the analysis ID for this document
      const relatedAnalysis = await prisma.analysis.findFirst({
        where: { documentId: match.documentId },
        select: { id: true },
      });

      if (!relatedAnalysis) continue;

      edges.push({
        sourceType: 'analysis',
        sourceId: analysis.id,
        targetType: 'analysis',
        targetId: relatedAnalysis.id,
        edgeType: 'reversed',
        strength: Math.min(1, match.similarity),
        confidence: 0.6,
        description: `Contradictory outcomes on similar topic (${Math.round(match.similarity * 100)}% similarity). Current: ${currentOutcome}, Previous: ${match.outcome.result}.`,
        metadata: {
          similarity: match.similarity,
          currentOutcome,
          previousOutcome: match.outcome.result,
        },
      });
    }

    return edges;
  } catch {
    return [];
  }
}

// ─── Cross-Department Edge Detection ────────────────────────────────────────

/**
 * Detect cross-department/cross-silo edges: decisions from different users
 * in the same org that share biases and have similar topics but may have
 * different outcomes. Surfaces "siloed decisions that should have talked."
 */
async function findCrossDepartmentEdges(
  analysis: AnalysisWithBiases,
  orgId: string | null
): Promise<EdgeCandidate[]> {
  if (!orgId || analysis.biases.length === 0) return [];

  const edges: EdgeCandidate[] = [];

  try {
    const biasTypes = analysis.biases.map(b => b.biasType);

    // Find analyses from different users in same org with shared biases
    const crossDeptAnalyses = await prisma.analysis.findMany({
      where: {
        id: { not: analysis.id },
        document: {
          orgId,
          userId: { not: analysis.document.userId }, // Different user/team
        },
        biases: {
          some: { biasType: { in: biasTypes } },
        },
      },
      include: {
        biases: { select: { biasType: true } },
        document: { select: { id: true, userId: true, filename: true } },
        outcome: { select: { outcome: true } },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    for (const other of crossDeptAnalyses) {
      const otherBiases = new Set(other.biases.map(b => b.biasType));
      const shared = biasTypes.filter(bt => otherBiases.has(bt));

      if (shared.length < 1) continue;

      // Compute simple content similarity via shared bias ratio
      const totalUnique = new Set([...biasTypes, ...other.biases.map(b => b.biasType)]).size;
      const biasSimilarity = shared.length / totalUnique;

      // Only create edge if meaningful overlap
      if (biasSimilarity < 0.3) continue;

      // Check for outcome divergence (one failed, one succeeded)
      const thisOutcome = analysis.outcome?.outcome;
      const otherOutcome = other.outcome?.outcome;
      const outcomesDiverge =
        (thisOutcome === 'failure' && otherOutcome === 'success') ||
        (thisOutcome === 'success' && otherOutcome === 'failure');

      const strength = outcomesDiverge
        ? Math.min(1.0, biasSimilarity + 0.2) // Boost divergent outcomes
        : biasSimilarity;

      const description = outcomesDiverge
        ? `Cross-silo: similar biases (${shared.join(', ')}) but different outcomes — potential missing perspective`
        : `Cross-silo: shared biases (${shared.join(', ')}) across different decision-makers`;

      edges.push({
        sourceType: 'analysis',
        sourceId: analysis.id,
        targetType: 'analysis',
        targetId: other.id,
        edgeType: 'cross_department',
        strength: Math.round(strength * 100) / 100,
        confidence: 0.6,
        description,
        metadata: {
          sharedBiases: shared,
          outcomesDiverge,
          sourceUser: analysis.document.userId,
          targetUser: other.document.userId,
        },
      });
    }
  } catch {
    // Schema drift or query failure — non-critical
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

    // Group analyses by user for Granger-causality-style temporal correlation
    const byUser = new Map<string, typeof analyses>();
    for (const a of analyses) {
      const userId = a.document.userId;
      if (!byUser.has(userId)) byUser.set(userId, []);
      byUser.get(userId)!.push(a);
    }

    for (const [, userAnalyses] of byUser) {
      if (userAnalyses.length < 2) continue;

      // For each sequential pair, test whether past score predicts future score
      // (Granger-causality-like: does knowing the past improve prediction?)
      for (let i = 0; i < userAnalyses.length; i++) {
        for (let j = i + 1; j < Math.min(i + 10, userAnalyses.length); j++) {
          const a = userAnalyses[i]; // earlier
          const b = userAnalyses[j]; // later

          const daysBetween =
            (b.createdAt.getTime() - a.createdAt.getTime()) / (24 * 60 * 60 * 1000);
          if (daysBetween > 30) continue; // expanded from 14 to 30 days

          // Check for shared biases (controlling for bias types)
          const aBiases = new Set(a.biases.map(b2 => b2.biasType));
          const bBiases = b.biases.map(b2 => b2.biasType);
          const shared = bBiases.filter(bt => aBiases.has(bt));

          if (shared.length < 1) continue;

          // Granger-style test: score correlation between temporally adjacent decisions
          // If both decisions have similar quality patterns AND shared biases,
          // past decision likely influenced the later one
          const scoreDiff = Math.abs(a.overallScore - b.overallScore);
          const scoreCorrelation = 1 - scoreDiff / 100; // 0-1 (1 = identical scores)

          // Compute causal strength:
          // - High shared biases + similar scores + close in time = strong influence
          // - Threshold: only create edge if causal strength > 0.3
          const timeFactor = 1 - daysBetween / 30; // decays with time
          const biasFactor = Math.min(1, shared.length / 3);
          const causalStrength = scoreCorrelation * 0.4 + biasFactor * 0.4 + timeFactor * 0.2;

          // Statistical significance proxy: require meaningful signal
          if (causalStrength < 0.3) continue;

          // Outcome-based validation: if both have outcomes, check correlation
          let outcomeBoost = 0;
          if (a.outcome?.outcome && b.outcome?.outcome) {
            if (a.outcome.outcome === b.outcome.outcome) {
              outcomeBoost = 0.15; // Same outcomes = stronger causal link
            }
          }

          const finalStrength = Math.min(1, causalStrength + outcomeBoost);

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
                strength: Math.round(finalStrength * 100) / 100,
                confidence: Math.round(Math.min(0.85, causalStrength) * 100) / 100,
                description: `Granger-causal: ${daysBetween.toFixed(0)}d apart, ${shared.length} shared biases, strength=${finalStrength.toFixed(2)}`,
                metadata: {
                  causalStrength: Math.round(causalStrength * 1000) / 1000,
                  sharedBiases: shared,
                  daysBetween: Math.round(daysBetween),
                  scoreCorrelation: Math.round(scoreCorrelation * 100) / 100,
                } as unknown as Prisma.InputJsonValue,
              },
              update: {
                strength: Math.round(finalStrength * 100) / 100,
                confidence: Math.round(Math.min(0.85, causalStrength) * 100) / 100,
              },
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

// ─── Historical Parallel Edge Inference ─────────────────────────────────────

/**
 * Find historical parallel edges by matching detected biases against
 * the real-world case study database.
 */
function findHistoricalParallelEdges(
  analysis: { id: string; biases: Array<{ biasType: string; severity: string }>; document: { id: string } | null }
): EdgeCandidate[] {
  const biasTypes = analysis.biases.map(b => b.biasType);
  if (biasTypes.length === 0) return [];

  const industry = undefined; // Could be enhanced with document industry detection
  const matches = matchCaseStudiesSync(biasTypes, industry, 3);

  return matches.map(match => ({
    sourceType: 'analysis',
    sourceId: analysis.id,
    targetType: 'case_study',
    targetId: `case_${match.company.toLowerCase().replace(/\s+/g, '_')}_${match.year || 0}`,
    edgeType: 'historical_parallel' as EdgeType,
    strength: Math.min(1.0, match.matchScore / 10),
    confidence: Math.min(1.0, match.matchedBiases.length / biasTypes.length),
    description: `Shares ${match.matchedBiases.length} bias pattern(s) with ${match.company}'s ${match.title} (${match.outcomeDirection})`,
    metadata: {
      company: match.company,
      year: match.year,
      outcome: match.outcome,
      outcomeDirection: match.outcomeDirection,
      matchedBiases: match.matchedBiases,
      estimatedImpact: match.estimatedImpact,
    },
  }));
}
