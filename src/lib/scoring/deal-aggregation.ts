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
  /**
   * Toxic combinations fired on this analysis (locked 2026-05-09 hard-
   * layer ship — Proposal 2). Optional for backwards-compat with callers
   * that haven't been updated to fetch the relation; aggregator handles
   * missing field as "no patterns detected on this doc". Each entry
   * carries the canonical patternLabel + persisted severity column.
   */
  toxicCombinations?: Array<{
    patternLabel: string | null;
    severity: 'critical' | 'high' | 'medium' | 'low' | null;
    toxicScore: number;
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

/**
 * Server-side aggregation of toxic combinations across the latest
 * analyses on a deal/package (locked 2026-05-09 hard-layer ship,
 * Proposal 2). Replaces the prior client-side detection in
 * IcReadinessGate.tsx — every consumer (deal kanban, deal page header,
 * analytics, future notifications) now reads the same canonical
 * server-aggregated signal.
 */
export interface NamedPatternEntry {
  /** The named pattern label (e.g., "The Synergy Mirage"). Null entries
   *  in source rows are filtered out before aggregation. */
  patternLabel: string;
  /** Number of distinct documents in the bundle where this pattern fired. */
  documentCount: number;
  /** Highest severity at which the pattern fired across the documents. */
  topSeverity: 'critical' | 'high' | 'medium' | 'low';
  /** Maximum toxicScore across the documents (0-100). */
  maxToxicScore: number;
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
  /**
   * Named toxic combinations aggregated across the bundle (locked
   * 2026-05-09 hard-layer ship, Proposal 2). Sorted by severity then
   * documentCount. Empty array when no patterns fired or when callers
   * didn't supply toxicCombinations on AnalyzedDocument (backwards-compat).
   */
  namedPatterns: NamedPatternEntry[];
  /** Count of named patterns at critical severity. Convenience field
   *  for IC Readiness Gate + DealKanban chip rendering. */
  criticalPatternCount: number;
  /** Count at high severity. */
  highPatternCount: number;
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

// Grade-from-score uses the canonical helper in @/lib/utils/grade.
// Re-imported here under the same local name so the rest of this
// module's code reads unchanged.
import { gradeFromScore } from '@/lib/utils/grade';

export function aggregateAnalyses(latestAnalyses: AnalyzedDocument[]): AnalysesAggregation {
  if (latestAnalyses.length === 0) {
    return {
      compositeDqi: null,
      compositeGrade: null,
      analyzedDocCount: 0,
      recurringBiases: [],
      allBiases: [],
      namedPatterns: [],
      criticalPatternCount: 0,
      highPatternCount: 0,
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

  // Named-pattern aggregation across the bundle (locked 2026-05-09
  // hard-layer ship, Proposal 2). Group toxic-combination rows by
  // patternLabel; aggregate documentCount + topSeverity + maxToxicScore
  // per pattern. Requires ToxicCombination.severity column populated
  // (Proposal 5 ship); falls back to score-derived severity when null.
  const patternMap = new Map<
    string,
    { docs: Set<string>; maxSev: number; maxScore: number }
  >();
  for (const analysis of latestAnalyses) {
    if (!analysis.toxicCombinations) continue;
    for (const tc of analysis.toxicCombinations) {
      if (!tc.patternLabel) continue;
      // Severity priority: explicit column → derived from score → low
      const severityKey =
        tc.severity ??
        (tc.toxicScore >= 80
          ? 'critical'
          : tc.toxicScore >= 60
            ? 'high'
            : tc.toxicScore >= 40
              ? 'medium'
              : 'low');
      const sev = SEVERITY_ORDER[severityKey] ?? 1;
      const existing = patternMap.get(tc.patternLabel);
      if (existing) {
        existing.docs.add(analysis.documentId);
        if (sev > existing.maxSev) existing.maxSev = sev;
        if (tc.toxicScore > existing.maxScore) existing.maxScore = tc.toxicScore;
      } else {
        patternMap.set(tc.patternLabel, {
          docs: new Set([analysis.documentId]),
          maxSev: sev,
          maxScore: tc.toxicScore,
        });
      }
    }
  }
  const namedPatterns: NamedPatternEntry[] = Array.from(patternMap.entries())
    .map(([patternLabel, { docs, maxSev, maxScore }]) => ({
      patternLabel,
      documentCount: docs.size,
      topSeverity: SEVERITY_LABELS[Math.max(0, maxSev - 1)],
      maxToxicScore: Math.round(maxScore * 10) / 10,
    }))
    .sort((a, b) => {
      if (SEVERITY_ORDER[a.topSeverity] !== SEVERITY_ORDER[b.topSeverity]) {
        return SEVERITY_ORDER[b.topSeverity] - SEVERITY_ORDER[a.topSeverity];
      }
      return b.documentCount - a.documentCount;
    });
  const criticalPatternCount = namedPatterns.filter(p => p.topSeverity === 'critical').length;
  const highPatternCount = namedPatterns.filter(p => p.topSeverity === 'high').length;

  return {
    compositeDqi,
    compositeGrade: gradeFromScore(compositeDqi),
    analyzedDocCount: latestAnalyses.length,
    recurringBiases,
    allBiases,
    namedPatterns,
    criticalPatternCount,
    highPatternCount,
  };
}

/**
 * Backwards-compat alias for `aggregateAnalyses`. Existing deal call
 * sites import `aggregateDeal`; new package call sites should import
 * `aggregateAnalyses` directly. Identical behaviour.
 */
export const aggregateDeal = aggregateAnalyses;
