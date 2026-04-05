/**
 * Seed a fresh org with synthetic analyses so the Team Cognitive Profile,
 * Decision Knowledge Graph, and Bias Library render meaningful topology
 * from day one (M4 — Cold-Start Fix).
 *
 * All seeded rows carry `isSample: true` and can be removed in one click
 * via `POST /api/demo/clear-samples`.
 *
 * Idempotent: if any sample documents already exist for the scope, the
 * function is a no-op. Call freely from onboarding, a debug UI, or a
 * cron backfill — it will not duplicate.
 *
 * Scope resolution:
 *   - If `orgId` is provided, seeds at the org level (visible to all team members)
 *   - Otherwise seeds at the user level (orgId = null on the seeded rows)
 *
 * Does NOT run the real analysis pipeline — uses stored fixtures from
 * `src/lib/demo/corpus.ts`. Seeding 3 analyses takes ~100ms, not 5 minutes.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { createHash } from 'crypto';
import { getSeedCorpus, type CorpusEntry } from './corpus';

const log = createLogger('DemoSeeder');

export interface SeedResult {
  seeded: number;
  skipped: boolean;
  reason?: string;
  documentIds?: string[];
  analysisIds?: string[];
}

/**
 * Populate a fresh org (or personal workspace) with synthetic seed data.
 *
 * @param orgId  - Target org. If null, seeds to the user's personal scope.
 * @param userId - The authenticated user that "owns" the seeded rows.
 */
export async function seedDemoAnalyses(
  orgId: string | null,
  userId: string
): Promise<SeedResult> {
  // Idempotency check: any existing sample documents in scope → skip
  const existing = await prisma.document.findFirst({
    where: {
      isSample: true,
      ...(orgId ? { orgId } : { userId, orgId: null }),
    },
    select: { id: true },
  });

  if (existing) {
    return { seeded: 0, skipped: true, reason: 'already-seeded' };
  }

  const corpus = getSeedCorpus();
  const documentIds: string[] = [];
  const analysisIds: string[] = [];
  const analysisByDemoId = new Map<string, string>();

  // Use a transaction so either all rows land or none do — no half-seeded orgs
  try {
    await prisma.$transaction(async tx => {
      for (const entry of corpus) {
        const { documentId, analysisId } = await seedOneEntry(tx, entry, orgId, userId);
        documentIds.push(documentId);
        analysisIds.push(analysisId);
        analysisByDemoId.set(entry.demoId, analysisId);
      }

      // Cross-link the seeded analyses with decision graph edges so the
      // graph UI renders meaningful topology on first load. Each pair that
      // shares a dominant bias gets a `shared_bias` edge.
      await seedDecisionEdges(tx, corpus, analysisByDemoId, orgId, userId);
    });
  } catch (err) {
    log.error('Seed transaction failed', err);
    throw err;
  }

  log.info(
    `Seeded ${documentIds.length} sample analyses for ${orgId ? `org ${orgId}` : `user ${userId}`}`
  );

  return {
    seeded: documentIds.length,
    skipped: false,
    documentIds,
    analysisIds,
  };
}

// ─── Internals ──────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function seedOneEntry(
  tx: Tx,
  entry: CorpusEntry,
  orgId: string | null,
  userId: string
): Promise<{ documentId: string; analysisId: string }> {
  const contentHash = createHash('sha256')
    .update(`SAMPLE:${entry.demoId}:${userId}:${orgId ?? ''}`)
    .digest('hex');

  // Document — the "uploaded" memo
  const doc = await tx.document.create({
    data: {
      userId,
      orgId,
      filename: entry.filename,
      fileType: 'text/plain',
      fileSize: Buffer.byteLength(entry.documentContent, 'utf-8'),
      content: entry.documentContent,
      contentHash,
      status: 'analyzed',
      documentType: entry.documentType,
      source: 'demo_seed',
      isSample: true,
    },
  });

  // Analysis — the pre-computed results, mapped from the DemoAnalysis shape
  const a = entry.analysis;
  const analysis = await tx.analysis.create({
    data: {
      documentId: doc.id,
      overallScore: a.overallScore,
      noiseScore: a.noiseScore,
      summary: a.summary,
      metaVerdict: a.metaVerdict,
      speakers: entry.participants,
      noiseStats: a.noiseStats as unknown as object,
      noiseBenchmarks: a.noiseBenchmarks as unknown as object,
      compliance: a.compliance as unknown as object,
      simulation: a.simulation as unknown as object,
      preMortem: a.preMortem as unknown as object,
      swotAnalysis: a.swot as unknown as object,
      outcomeStatus: entry.seedOutcome ? 'outcome_logged' : 'pending_outcome',
      isSample: true,
    },
  });

  // Bias instances — one row per detected bias
  if (a.biases.length > 0) {
    await tx.biasInstance.createMany({
      data: a.biases.map(b => ({
        analysisId: analysis.id,
        biasType: b.biasType,
        severity: b.severity,
        excerpt: b.excerpt,
        explanation: b.explanation,
        suggestion: b.suggestion,
        confidence: b.confidence,
      })),
    });
  }

  // Optional outcome (2 of 3 entries have one) — seeds the calibration flywheel
  if (entry.seedOutcome) {
    await tx.decisionOutcome.create({
      data: {
        analysisId: analysis.id,
        userId,
        orgId,
        outcome: entry.seedOutcome.outcome,
        timeframe: entry.seedOutcome.timeframe,
        impactScore: entry.seedOutcome.impactScore,
        notes: entry.seedOutcome.notes,
        confirmedBiases: entry.seedOutcome.confirmedBiases,
        falsPositiveBiases: [],
      },
    });
  }

  return { documentId: doc.id, analysisId: analysis.id };
}

/**
 * Create `shared_bias` edges between every pair of seed analyses that share
 * at least one dominant bias type. Gives the decision graph meaningful
 * topology on first render (3 nodes + 2-3 edges minimum).
 */
async function seedDecisionEdges(
  tx: Tx,
  corpus: CorpusEntry[],
  analysisByDemoId: Map<string, string>,
  orgId: string | null,
  userId: string
): Promise<void> {
  const dominantBiases = corpus.map(entry => ({
    demoId: entry.demoId,
    biasTypes: new Set(
      entry.analysis.biases
        .filter(b => b.severity === 'critical' || b.severity === 'high')
        .map(b => b.biasType)
    ),
  }));

  for (let i = 0; i < dominantBiases.length; i++) {
    for (let j = i + 1; j < dominantBiases.length; j++) {
      const a = dominantBiases[i];
      const b = dominantBiases[j];
      const shared = [...a.biasTypes].filter(t => b.biasTypes.has(t));
      if (shared.length === 0) continue;

      const sourceId = analysisByDemoId.get(a.demoId);
      const targetId = analysisByDemoId.get(b.demoId);
      if (!sourceId || !targetId) continue;

      // `strength` scales with the number of shared biases, capped at 1.0
      const strength = Math.min(1, 0.4 + 0.2 * shared.length);

      await tx.decisionEdge.create({
        data: {
          orgId,
          sourceType: 'analysis',
          sourceId,
          targetType: 'analysis',
          targetId,
          edgeType: 'shared_bias',
          strength,
          confidence: 0.9,
          description: `Shares ${shared.length} high-severity bias${shared.length > 1 ? 'es' : ''}: ${shared.join(', ')}`,
          metadata: { sharedBiases: shared, seedEntry: true },
          // BUG-4 fix: user-scope seed edges must be attributable to their
          // creator so clearSampleData can scope its delete correctly.
          // Org-scope edges use 'system' (they belong to the whole org).
          createdBy: orgId ? 'system' : userId,
          isSample: true,
        },
      });
    }
  }
}

/**
 * Delete every sample row for the given scope. Cascades through the
 * Document → Analysis → BiasInstance / DecisionOutcome relationship via
 * `onDelete: Cascade` on the foreign keys.
 *
 * Returns a count of top-level rows removed (documents + human decisions
 * + edges). Biases and outcomes are counted implicitly via their parents.
 */
export async function clearSampleData(
  orgId: string | null,
  userId: string
): Promise<{ documentsDeleted: number; humanDecisionsDeleted: number; edgesDeleted: number }> {
  const scopeFilter = orgId ? { orgId } : { userId, orgId: null };

  // Delete edges first (no FK cascades into them from documents).
  // BUG-4 fix: in user-scope mode (orgId=null), DecisionEdge has no
  // userId column — so we scope by createdBy instead. seedDecisionEdges
  // now sets createdBy=userId for user-scope edges (instead of 'system')
  // so this filter correctly targets only the caller's seed edges.
  const edges = await prisma.decisionEdge.deleteMany({
    where: orgId
      ? { isSample: true, orgId }
      : { isSample: true, orgId: null, createdBy: userId },
  });

  // Delete human decisions (cascades CognitiveAudit, Nudges, etc.)
  const humanDecisions = await prisma.humanDecision.deleteMany({
    where: { isSample: true, ...scopeFilter },
  });

  // Delete documents (cascades Analysis → BiasInstance, DecisionOutcome, DecisionEmbedding)
  const documents = await prisma.document.deleteMany({
    where: { isSample: true, ...scopeFilter },
  });

  log.info(
    `Cleared sample data for ${orgId ? `org ${orgId}` : `user ${userId}`}: ` +
      `${documents.count} documents, ${humanDecisions.count} human decisions, ${edges.count} edges`
  );

  return {
    documentsDeleted: documents.count,
    humanDecisionsDeleted: humanDecisions.count,
    edgesDeleted: edges.count,
  };
}
