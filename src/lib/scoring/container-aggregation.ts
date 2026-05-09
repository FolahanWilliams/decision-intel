/**
 * DecisionContainer aggregation helper (Phase 2 — replaces deleted
 * src/lib/scoring/deal-aggregation.ts + package-aggregation.ts with a
 * unified mode-agnostic implementation).
 *
 * Computes composite DQI + bias signature + named-pattern aggregation
 * + cross-reference summary across the latest analysis on every doc
 * in a container. Same canonical shape regardless of container.kind —
 * the kanban / detail / DPR consumers read identical metrics whether
 * the container is investment / acquisition / strategic.
 *
 * Forward-looking rule (drift class): every consumer that reads
 * container metrics imports from THIS file. Recomputation is triggered
 * whenever (a) a doc is added/removed from a container, (b) a new
 * analysis lands on a member doc, (c) a cross-reference run completes,
 * (d) the container's stageId or kind changes. The cached columns on
 * DecisionContainer (compositeDqi, compositeGrade, documentCount,
 * analyzedDocCount, recurringBiasCount, conflictCount,
 * highSeverityConflictCount) are kept in sync via `recomputeContainerMetrics`.
 */

import { prisma } from '@/lib/prisma';
import { gradeFromScore } from '@/lib/utils/grade';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ContainerAggregation');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalyzedDocument {
  documentId: string;
  filename: string;
  documentType: string | null;
  latestAnalysis: {
    id: string;
    overallScore: number;
    biases: Array<{ biasType: string; severity: string }>;
  } | null;
  /// Server-side toxic-combination rows persisted post-audit (per CLAUDE.md
  /// M&A cascade Proposal 2). Populated by the API route's findMany().
  toxicCombinations?: Array<{ patternLabel: string; severity: string; toxicScore: number | null }>;
}

export interface ContainerAggregation {
  compositeDqi: number | null;
  compositeGrade: string | null;
  documentCount: number;
  analyzedDocCount: number;
  recurringBiases: Array<{
    biasType: string;
    count: number;
    avgSeverity: 'critical' | 'high' | 'medium' | 'low';
    documentIds: string[];
  }>;
  recurringBiasCount: number;
  /// Per CLAUDE.md M&A cascade Proposal 2: server-side aggregation of
  /// named patterns (rather than client-side detection in IcReadinessGate).
  namedPatterns: Array<{
    patternLabel: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    documentCount: number;
    maxToxicScore: number | null;
  }>;
  criticalPatternCount: number;
  highPatternCount: number;
  /** Flat bias list with per-doc occurrences (for the ContainerDqiBreakdownPanel). */
  allBiases: Array<{ biasType: string; severity: string; count: number; documentIds: string[] }>;
}

// ─── Severity normalisation ─────────────────────────────────────────────────

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function normaliseSeverity(s: string | null | undefined): 'critical' | 'high' | 'medium' | 'low' {
  const lower = (s ?? '').toLowerCase();
  if (lower === 'critical' || lower === 'high' || lower === 'medium' || lower === 'low')
    return lower;
  return 'medium';
}

function deriveSeverityFromScore(
  score: number | null | undefined
): 'critical' | 'high' | 'medium' | 'low' {
  if (score == null) return 'medium';
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ─── Pure aggregator ─────────────────────────────────────────────────────────

/**
 * Pure function — given the analyses on every doc in the container,
 * compute composite DQI + bias signature + named-pattern aggregation.
 * No DB writes; the caller is responsible for persisting the cached
 * columns on the parent container row via `recomputeContainerMetrics`.
 */
export function aggregateAnalyses(documents: AnalyzedDocument[]): ContainerAggregation {
  const documentCount = documents.length;
  const analyzed = documents.filter(d => d.latestAnalysis != null);
  const analyzedDocCount = analyzed.length;

  // Composite DQI: simple average of latest-analysis overallScore on each
  // analyzed doc. Documents without a latest analysis don't contribute
  // (they don't drag the average down) — this is the same shape the
  // deleted deal-aggregation used.
  const compositeDqi =
    analyzedDocCount === 0
      ? null
      : Math.round(
          (analyzed.reduce((sum, d) => sum + (d.latestAnalysis?.overallScore ?? 0), 0) /
            analyzedDocCount) *
            10
        ) / 10;
  const compositeGrade = compositeDqi != null ? gradeFromScore(compositeDqi) : null;

  // Recurring biases: bucket every bias-instance by biasType, count
  // occurrences across docs, surface the biases that appear in ≥2 docs.
  const biasBuckets = new Map<
    string,
    { count: number; severitySum: number; documentIds: Set<string> }
  >();

  for (const doc of analyzed) {
    if (!doc.latestAnalysis) continue;
    for (const bias of doc.latestAnalysis.biases) {
      const key = bias.biasType;
      if (!biasBuckets.has(key)) {
        biasBuckets.set(key, { count: 0, severitySum: 0, documentIds: new Set() });
      }
      const bucket = biasBuckets.get(key)!;
      bucket.count++;
      bucket.severitySum += SEVERITY_RANK[normaliseSeverity(bias.severity)] ?? 2;
      bucket.documentIds.add(doc.documentId);
    }
  }

  const allBiases = Array.from(biasBuckets.entries())
    .map(([biasType, bucket]) => {
      const avg = bucket.severitySum / Math.max(bucket.count, 1);
      const severityLabel: 'critical' | 'high' | 'medium' | 'low' =
        avg >= 3.5 ? 'critical' : avg >= 2.5 ? 'high' : avg >= 1.5 ? 'medium' : 'low';
      return {
        biasType,
        severity: severityLabel,
        count: bucket.count,
        documentIds: Array.from(bucket.documentIds),
      };
    })
    .sort((a, b) => b.count - a.count || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const recurringBiases = allBiases
    .filter(b => b.documentIds.length >= 2)
    .map(b => ({
      biasType: b.biasType,
      count: b.count,
      avgSeverity: b.severity,
      documentIds: b.documentIds,
    }));

  // Named patterns: aggregate the persisted ToxicCombination rows
  // across docs (per CLAUDE.md M&A cascade Proposal 2). Group by
  // patternLabel, top severity = max across docs, documentCount =
  // distinct doc count carrying the pattern.
  const patternBuckets = new Map<
    string,
    {
      severityRank: number;
      severity: 'critical' | 'high' | 'medium' | 'low';
      documentIds: Set<string>;
      maxToxicScore: number | null;
    }
  >();

  for (const doc of documents) {
    if (!doc.toxicCombinations) continue;
    for (const combo of doc.toxicCombinations) {
      const label = combo.patternLabel;
      const sev = combo.severity
        ? normaliseSeverity(combo.severity)
        : deriveSeverityFromScore(combo.toxicScore);
      const rank = SEVERITY_RANK[sev] ?? 2;
      if (!patternBuckets.has(label)) {
        patternBuckets.set(label, {
          severityRank: rank,
          severity: sev,
          documentIds: new Set(),
          maxToxicScore: combo.toxicScore,
        });
      }
      const bucket = patternBuckets.get(label)!;
      bucket.documentIds.add(doc.documentId);
      if (rank > bucket.severityRank) {
        bucket.severityRank = rank;
        bucket.severity = sev;
      }
      if (
        combo.toxicScore != null &&
        (bucket.maxToxicScore == null || combo.toxicScore > bucket.maxToxicScore)
      ) {
        bucket.maxToxicScore = combo.toxicScore;
      }
    }
  }

  const namedPatterns = Array.from(patternBuckets.entries())
    .map(([patternLabel, bucket]) => ({
      patternLabel,
      severity: bucket.severity,
      documentCount: bucket.documentIds.size,
      maxToxicScore: bucket.maxToxicScore,
    }))
    .sort(
      (a, b) =>
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.documentCount - a.documentCount
    );

  const criticalPatternCount = namedPatterns.filter(p => p.severity === 'critical').length;
  const highPatternCount = namedPatterns.filter(p => p.severity === 'high').length;

  return {
    compositeDqi,
    compositeGrade,
    documentCount,
    analyzedDocCount,
    recurringBiases,
    recurringBiasCount: recurringBiases.length,
    namedPatterns,
    criticalPatternCount,
    highPatternCount,
    allBiases,
  };
}

// ─── Persistence: recompute cached columns ──────────────────────────────────

export interface RecomputeContainerResult {
  ok: boolean;
  containerId: string;
  aggregation: ContainerAggregation | null;
  error?: string;
}

/**
 * Recompute and persist the cached metric columns on a DecisionContainer
 * row. Called whenever the container's content changes — new doc added,
 * new analysis lands on a member doc, cross-reference run completes.
 *
 * Idempotent — safe to call many times; the latest analysis is the only
 * one consulted, and the cached counts are full overwrites, not deltas.
 */
export async function recomputeContainerMetrics(
  containerId: string
): Promise<RecomputeContainerResult> {
  try {
    const members = await prisma.decisionContainerDocument.findMany({
      where: { containerId },
      select: {
        document: {
          select: {
            id: true,
            filename: true,
            documentType: true,
            deletedAt: true,
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                biases: {
                  select: { biasType: true, severity: true },
                },
                toxicCombinations: {
                  select: { patternLabel: true, severity: true, toxicScore: true },
                },
              },
            },
          },
        },
      },
    });

    const docs: AnalyzedDocument[] = members
      .filter(m => m.document.deletedAt == null)
      .map(m => {
        const analysis = m.document.analyses[0] ?? null;
        return {
          documentId: m.document.id,
          filename: m.document.filename,
          documentType: m.document.documentType,
          latestAnalysis: analysis
            ? {
                id: analysis.id,
                overallScore: analysis.overallScore,
                biases: analysis.biases.map(b => ({
                  biasType: b.biasType,
                  severity: b.severity ?? 'medium',
                })),
              }
            : null,
          toxicCombinations:
            analysis?.toxicCombinations.map(c => ({
              patternLabel: c.patternLabel ?? 'unknown',
              severity: c.severity ?? 'medium',
              toxicScore: c.toxicScore,
            })) ?? [],
        };
      });

    const agg = aggregateAnalyses(docs);

    // Pull latest cross-reference run (if any) for the conflict counts.
    let conflictCount = 0;
    let highSeverityConflictCount = 0;
    try {
      const latestRun = await prisma.decisionContainerCrossReference.findFirst({
        where: { containerId },
        orderBy: { runAt: 'desc' },
        select: { conflictCount: true, highSeverityCount: true },
      });
      if (latestRun) {
        conflictCount = latestRun.conflictCount;
        highSeverityConflictCount = latestRun.highSeverityCount;
      }
    } catch (err) {
      log.warn(`Cross-reference lookup for ${containerId} failed (non-fatal): ${String(err)}`);
    }

    await prisma.decisionContainer.update({
      where: { id: containerId },
      data: {
        compositeDqi: agg.compositeDqi,
        compositeGrade: agg.compositeGrade,
        documentCount: agg.documentCount,
        analyzedDocCount: agg.analyzedDocCount,
        recurringBiasCount: agg.recurringBiasCount,
        conflictCount,
        highSeverityConflictCount,
      },
    });

    return { ok: true, containerId, aggregation: agg };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Failed to recompute container metrics for ${containerId}: ${message}`);
    return { ok: false, containerId, aggregation: null, error: message };
  }
}
