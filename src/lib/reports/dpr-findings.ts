/**
 * DPR Finding derivation — joins citations + regulatory mapping + counterfactual
 * impact + hardening questions into the per-bias finding objects the
 * Phase 3 finding-card pages render.
 *
 * Locked 2026-05-05. The canonical ProvenanceRecordData has the
 * per-bias academic + regulatory + counterfactual data, but no
 * VERBATIM EVIDENCE QUOTE or MITIGATION suggestion (those live in
 * Analysis.biases — pulled per-audit). This deriver:
 *
 *   1. Joins existing data (citations + regulatoryMapping + counterfactual)
 *   2. Looks up the canonical hardening question per bias type
 *   3. Accepts an optional `findingsAugment` map from the caller (used by
 *      the SPECIMEN to provide hand-curated evidence quotes + mitigations)
 *   4. Computes severity from counterfactual impact %, regulatory aggregate
 *      risk, and bias-detective severe-flag count
 *
 * For real audits in Phase 4: the data assembler will populate
 * findingsAugment from analysis.biases (excerpt + suggestion). This
 * deriver stays unchanged — it doesn't care whether the augmentation
 * is hand-curated or live.
 */

import type {
  ProvenanceRecordData,
  CitationEntry,
  RegulatoryEntry,
  CounterfactualScenarioRow,
} from './provenance-record-data';
import { getHardeningQuestion } from './dpr-hardening-questions';

export type DprFindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DprFinding {
  biasType: string;
  biasLabel: string;
  taxonomyId: string | null;
  severity: DprFindingSeverity;
  /** 0-1 confidence the bias is genuinely present, derived from counterfactual + regulatory signals. */
  confidence: number;
  /** Verbatim excerpt from the source memo. Null when not yet captured. */
  evidenceQuote: string | null;
  /** Audit-committee-ready hardening question — from the template library. */
  hardenWithQuestion: string;
  /** Why this hardening question matters — academic / regulatory anchor. */
  hardenWithRationale: string;
  /** Recommended mitigation. Null when no suggestion was generated. */
  mitigation: string | null;
  /** Academic citation (e.g. "Nickerson (1998)"). */
  academicAnchor: string | null;
  /** DOI for the academic anchor. */
  doi: string | null;
  /** Frameworks this bias triggers. */
  frameworks: { id: string; name: string; provisions: string[] }[];
  /** Counterfactual ROI — expected % improvement if this bias were addressed. Null when not computed. */
  expectedImprovementPct: number | null;
  /** Counterfactual sample size — supports the % estimate. */
  counterfactualSampleSize: number | null;
}

/** Per-bias augmentation map — keyed by biasType. */
export interface DprFindingAugmentation {
  evidenceQuote?: string | null;
  mitigation?: string | null;
  /** Severity override — when the caller has authoritative severity data. */
  severityOverride?: DprFindingSeverity;
  /** Confidence override (0-1). */
  confidenceOverride?: number;
}

export type DprFindingsAugmentMap = Record<string, DprFindingAugmentation>;

/**
 * Derive the per-bias findings array from the canonical ProvenanceRecordData.
 *
 * `augment` is a per-bias map supplied by the data source — for specimens
 * this is hand-curated; for real audits the data assembler populates it
 * from analysis.biases.excerpt + analysis.biases.suggestion (Phase 4).
 */
export function deriveDprFindings(
  data: ProvenanceRecordData,
  augment: DprFindingsAugmentMap = {}
): DprFinding[] {
  const citationsByType = indexBy(data.citations, (c: CitationEntry) => c.biasType);
  const regulatoryByType = indexBy(data.regulatoryMapping, (r: RegulatoryEntry) => r.biasType);
  const counterfactualByType = indexBy(
    data.counterfactualImpact?.scenarios ?? [],
    (s: CounterfactualScenarioRow) => s.biasType
  );

  // Bias types come from the union of citations + regulatoryMapping.
  // Anything in one but not the other still gets a finding (we surface
  // what we have).
  const biasTypes = new Set<string>([
    ...data.citations.map(c => c.biasType),
    ...data.regulatoryMapping.map(r => r.biasType),
  ]);

  const findings: DprFinding[] = [];
  for (const biasType of biasTypes) {
    const citation = citationsByType[biasType];
    const regulatory = regulatoryByType[biasType];
    const counterfactual = counterfactualByType[biasType];
    const augmentRow = augment[biasType] ?? {};
    const hardening = getHardeningQuestion(biasType);

    const severity = augmentRow.severityOverride ?? computeSeverity(counterfactual, regulatory);
    const confidence =
      augmentRow.confidenceOverride ?? computeConfidence(counterfactual, regulatory);

    findings.push({
      biasType,
      biasLabel: citation?.biasLabel ?? prettyBiasLabel(biasType),
      taxonomyId: citation?.taxonomyId ?? null,
      severity,
      confidence,
      evidenceQuote: augmentRow.evidenceQuote ?? null,
      hardenWithQuestion: hardening.question,
      hardenWithRationale: hardening.rationale,
      mitigation: augmentRow.mitigation ?? null,
      academicAnchor: citation?.citation ?? null,
      doi: citation?.doi ?? null,
      frameworks: regulatory?.frameworks ?? [],
      expectedImprovementPct: counterfactual?.expectedImprovementPct ?? null,
      counterfactualSampleSize: counterfactual?.historicalSampleSize ?? null,
    });
  }

  // Sort by severity descending, then confidence descending. Critical
  // findings render first.
  const SEV_ORDER: Record<DprFindingSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  findings.sort((a, b) => {
    const sev = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    if (sev !== 0) return sev;
    return b.confidence - a.confidence;
  });

  return findings;
}

function computeSeverity(
  counterfactual: CounterfactualScenarioRow | undefined,
  regulatory: RegulatoryEntry | undefined
): DprFindingSeverity {
  // Counterfactual impact >= 12% OR regulatory aggregate risk >= 7.5 = critical
  // 6-12% / 5.5-7.5 = high
  // 3-6% / 4-5.5 = medium
  // < 3% / < 4 = low
  const cfPct = counterfactual?.expectedImprovementPct ?? 0;
  const regRisk = regulatory?.aggregateRiskScore ?? 0;

  if (cfPct >= 12 || regRisk >= 7.5) return 'critical';
  if (cfPct >= 6 || regRisk >= 5.5) return 'high';
  if (cfPct >= 3 || regRisk >= 4) return 'medium';
  return 'low';
}

function computeConfidence(
  counterfactual: CounterfactualScenarioRow | undefined,
  regulatory: RegulatoryEntry | undefined
): number {
  // Confidence rises with counterfactual sample size (more historical
  // analogs = more confident in the % estimate) and regulatory frameworks
  // (more frameworks naming this bias = stronger external corroboration).
  const sample = counterfactual?.historicalSampleSize ?? 0;
  const frameworkCount = regulatory?.frameworks.length ?? 0;
  const sampleScore = Math.min(sample / 30, 1) * 0.6;
  const frameworkScore = Math.min(frameworkCount / 4, 1) * 0.4;
  return Math.max(0.3, sampleScore + frameworkScore);
}

function prettyBiasLabel(biasType: string): string {
  return biasType
    .split('_')
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function indexBy<T, K extends string | number>(items: T[], key: (item: T) => K): Record<K, T> {
  const out = {} as Record<K, T>;
  for (const item of items) {
    out[key(item)] = item;
  }
  return out;
}
