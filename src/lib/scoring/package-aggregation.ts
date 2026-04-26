/**
 * Decision Package metric recomputation (4.4 deep).
 *
 * Wraps `aggregateAnalyses` for the Package shape. Computes composite
 * DQI + bias signature + cross-reference counts and persists them to
 * the cached columns on DecisionPackage so list views don't have to
 * recompute on every render. Mirror of the Deal-level metric recompute
 * the deal-detail surface already uses.
 *
 * Called whenever:
 *   - A document is added to or removed from the package.
 *   - A new analysis lands on a member document (auto-trigger via
 *     /api/analyze/stream).
 *   - A cross-reference run completes.
 *
 * Schema-drift tolerant — if the table doesn't exist yet, the call is
 * a silent no-op so older deployments don't error during migration
 * windows.
 */

import { prisma } from '@/lib/prisma';
import { aggregateAnalyses, type AnalyzedDocument } from '@/lib/scoring/deal-aggregation';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PackageAggregation');

export interface RecomputePackageResult {
  status: 'ok' | 'no_documents' | 'failed';
  compositeDqi: number | null;
  compositeGrade: string | null;
  documentCount: number;
  analyzedDocCount: number;
  recurringBiasCount: number;
  conflictCount: number;
  highSeverityConflictCount: number;
}

export async function recomputePackageMetrics(packageId: string): Promise<RecomputePackageResult> {
  try {
    const docs = await prisma.decisionPackageDocument.findMany({
      where: { packageId },
      select: {
        documentId: true,
        document: {
          select: {
            id: true,
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                biases: {
                  select: { biasType: true, severity: true },
                },
              },
            },
          },
        },
      },
    });

    const latestPerDoc: AnalyzedDocument[] = [];
    for (const row of docs) {
      const a = row.document?.analyses?.[0];
      if (!a) continue;
      latestPerDoc.push({
        documentId: row.documentId,
        analysisId: a.id,
        overallScore: a.overallScore,
        biases: a.biases.map(b => ({
          biasType: b.biasType,
          severity: b.severity ?? undefined,
        })),
      });
    }

    const aggregation = aggregateAnalyses(latestPerDoc);

    // Cross-reference counts come from the most recent run, if any.
    const latestRun = await prisma.decisionPackageCrossReference
      .findFirst({
        where: { packageId, status: 'complete' },
        orderBy: { runAt: 'desc' },
        select: { conflictCount: true, highSeverityCount: true },
      })
      .catch(() => null);

    await prisma.decisionPackage.update({
      where: { id: packageId },
      data: {
        compositeDqi: aggregation.compositeDqi,
        compositeGrade: aggregation.compositeGrade,
        documentCount: docs.length,
        analyzedDocCount: aggregation.analyzedDocCount,
        recurringBiasCount: aggregation.recurringBiases.length,
        conflictCount: latestRun?.conflictCount ?? 0,
        highSeverityConflictCount: latestRun?.highSeverityCount ?? 0,
      },
    });

    return {
      status: latestPerDoc.length === 0 ? 'no_documents' : 'ok',
      compositeDqi: aggregation.compositeDqi,
      compositeGrade: aggregation.compositeGrade,
      documentCount: docs.length,
      analyzedDocCount: aggregation.analyzedDocCount,
      recurringBiasCount: aggregation.recurringBiases.length,
      conflictCount: latestRun?.conflictCount ?? 0,
      highSeverityConflictCount: latestRun?.highSeverityCount ?? 0,
    };
  } catch (err) {
    log.warn(
      `recomputePackageMetrics failed for ${packageId}:`,
      err instanceof Error ? err.message : String(err)
    );
    return {
      status: 'failed',
      compositeDqi: null,
      compositeGrade: null,
      documentCount: 0,
      analyzedDocCount: 0,
      recurringBiasCount: 0,
      conflictCount: 0,
      highSeverityConflictCount: 0,
    };
  }
}
