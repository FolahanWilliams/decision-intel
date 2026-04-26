/**
 * Multi-document aggregation — composite DQI + bias signature across a
 * set of documents that share a common decision context.
 *
 * Originally written for the Deal model (3.1 deep) where the atomic
 * decision unit is a CIM + model + counsel memo + IC deck. The same
 * math now also drives DecisionPackage (4.4 deep) for non-deal
 * decisions: board recommendations, market-entry recs, RFP responses.
 *
 * The function signature is identical for both — pass the latest analysis
 * per document, get composite DQI + bias signature back. The Deal-flavoured
 * type alias and `aggregateDeal` export are preserved for backwards
 * compatibility; new call sites should use `aggregateAnalyses`.
 *
 * Aggregation rules:
 * - Composite DQI: equal-weighted mean of the latest analysis per
 *   document. Documents without an analysis don't count. Returns null
 *   when no analyzed docs exist.
 * - Bias signature: all biases across all latest analyses, grouped by
 *   normalized type, sorted by (recurrence count desc, max severity).
 *   "Recurring" = appears in ≥ 2 documents. Top 5 surface in the UI.
 * - Equal weights, not severity-weighted. Severity-weighted compositing
 *   was tempting, but a single critical bias on a low-importance KPI
 *   doc would then dominate the deal score. Procurement explainability
 *   beats sophistication here — every CSO can explain "the average."
 */

export interface AnalyzedDocument {
  documentId: string;
  analysisId: string;
  overallScore: number;
  biases: Array<{
    biasType: string;
    severity?: string | null;
  }>;
}

/** @deprecated Use AnalyzedDocument. Kept for backwards-compat. */
export type DealDocAnalysis = AnalyzedDocument;

export interface BiasSignatureEntry {
  biasType: string;
  documentCount: number; // # of distinct docs in this deal where this bias was flagged
  totalOccurrences: number; // raw count across all docs (a doc can have the same bias flagged twice)
  topSeverity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AnalysesAggregation {
  /** Composite DQI score 0-100. null when no docs are analyzed. */
  compositeDqi: number | null;
  /** Composite DQI grade (A/B/C/D/F) — null when compositeDqi is null. */
  compositeGrade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  /** Number of distinct documents that contributed to the composite. */
  analyzedDocCount: number;
  /**
   * Top recurring biases — present in ≥2 docs, sorted by document count
   * then severity. Empty when no biases recur. Bias signature card uses
   * the first 5; longer lists exist for analytics drilldowns.
   */
  recurringBiases: BiasSignatureEntry[];
  /** All biases across all docs, including non-recurring (count===1). */
  allBiases: BiasSignatureEntry[];
}

/** @deprecated Use AnalysesAggregation. Kept for backwards-compat. */
export type DealAggregation = AnalysesAggregation;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const SEVERITY_LABELS: Array<BiasSignatureEntry['topSeverity']> = [
  'low',
  'medium',
  'high',
  'critical',
];

function normalizeBiasKey(input: string | null | undefined): string {
  if (!input) return 'unknown_bias';
  return input.toLowerCase().replace(/\s+/g, '_').trim();
}

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function aggregateAnalyses(latestAnalyses: AnalyzedDocument[]): AnalysesAggregation {
  if (latestAnalyses.length === 0) {
    return {
      compositeDqi: null,
      compositeGrade: null,
      analyzedDocCount: 0,
      recurringBiases: [],
      allBiases: [],
    };
  }

  const totalScore = latestAnalyses.reduce((sum, a) => sum + a.overallScore, 0);
  const compositeDqi = Math.round((totalScore / latestAnalyses.length) * 10) / 10;

  // Bias aggregation: per-bias, count distinct docs that flag it + total
  // occurrences + max severity seen.
  const biasMap = new Map<string, { docs: Set<string>; total: number; maxSev: number }>();

  for (const analysis of latestAnalyses) {
    for (const bias of analysis.biases) {
      const key = normalizeBiasKey(bias.biasType);
      const sev = SEVERITY_ORDER[(bias.severity || '').toLowerCase()] ?? 1;
      const existing = biasMap.get(key);
      if (existing) {
        existing.docs.add(analysis.documentId);
        existing.total += 1;
        if (sev > existing.maxSev) existing.maxSev = sev;
      } else {
        biasMap.set(key, {
          docs: new Set([analysis.documentId]),
          total: 1,
          maxSev: sev,
        });
      }
    }
  }

  const allBiases: BiasSignatureEntry[] = Array.from(biasMap.entries())
    .map(([biasType, { docs, total, maxSev }]) => ({
      biasType,
      documentCount: docs.size,
      totalOccurrences: total,
      topSeverity: SEVERITY_LABELS[Math.max(0, maxSev - 1)],
    }))
    .sort((a, b) => {
      if (b.documentCount !== a.documentCount) return b.documentCount - a.documentCount;
      return SEVERITY_ORDER[b.topSeverity] - SEVERITY_ORDER[a.topSeverity];
    });

  const recurringBiases = allBiases.filter(b => b.documentCount >= 2);

  return {
    compositeDqi,
    compositeGrade: gradeFromScore(compositeDqi),
    analyzedDocCount: latestAnalyses.length,
    recurringBiases,
    allBiases,
  };
}

/**
 * Backwards-compat alias for `aggregateAnalyses`. Existing deal call
 * sites import `aggregateDeal`; new package call sites should import
 * `aggregateAnalyses` directly. Identical behaviour.
 */
export const aggregateDeal = aggregateAnalyses;
