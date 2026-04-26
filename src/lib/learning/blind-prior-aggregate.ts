/**
 * Anonymised aggregation of pre-IC blind-prior submissions (4.1 deep).
 *
 * Every consumer that needs to render the reveal — the per-room detail
 * page, the DPR generator, and any future Slack/email summaries — calls
 * `aggregateBlindPriors(priors)` so the math + privacy semantics are
 * identical across surfaces.
 *
 * Privacy contract:
 *   - Confidence histogram + variance are always anonymised.
 *   - Top-risks frequency is always anonymised; identities are only
 *     attached when `shareIdentity = true` on the prior row.
 *   - Private rationales are surfaced only when `shareRationale = true`
 *     on the prior row, and only inside the bucket-list view (never
 *     paired with the participant's name unless `shareIdentity` is also
 *     true on the same row).
 */

export interface BlindPriorRow {
  id: string;
  respondentUserId: string | null;
  respondentEmail: string | null;
  respondentName: string | null;
  confidencePercent: number;
  topRisks: string[];
  privateRationale: string | null;
  shareRationale: boolean;
  shareIdentity: boolean;
  brierScore: number | null;
  brierCategory: string | null;
  brierCalculatedAt: Date | null;
  submittedAt: Date;
}

export interface ConfidenceHistogramBucket {
  /** Inclusive lower bound of the bucket. */
  from: number;
  /** Exclusive upper bound (or 100 inclusive on the top bucket). */
  to: number;
  /** Number of priors falling in this bucket. */
  count: number;
}

export interface RiskFrequency {
  risk: string;
  count: number;
  /** Names of participants who flagged this risk and opted in to share their identity. */
  attributedTo: string[];
}

export interface SharedRationale {
  /** Display name when shareIdentity is also true; null otherwise. */
  name: string | null;
  rationale: string;
  confidencePercent: number;
}

export interface BlindPriorAggregate {
  /** Total submitted priors. */
  count: number;
  /** Mean confidence across all priors. */
  meanConfidence: number;
  /** Median confidence across all priors. */
  medianConfidence: number;
  /** Sample std-dev of confidence (population variance / n, not n-1). */
  stdDevConfidence: number;
  /** Convex-hull style bucketed histogram, 0–100 in 20-pt buckets. */
  confidenceHistogram: ConfidenceHistogramBucket[];
  /** Top-risk frequency table sorted descending. */
  topRisks: RiskFrequency[];
  /** Pairwise Jaccard similarity averaged across all participant pairs. */
  topRisksAgreement: number;
  /** Rationales whose owners opted in to share. */
  sharedRationales: SharedRationale[];
  /** Mean Brier across stamped priors (null when none stamped yet). */
  meanBrier: number | null;
  /** Best-calibrated participant — the prior with the lowest Brier. */
  bestCalibrated: {
    name: string | null;
    confidencePercent: number;
    brierScore: number;
    brierCategory: string | null;
  } | null;
}

const HISTOGRAM_BUCKETS: ConfidenceHistogramBucket[] = [
  { from: 0, to: 20, count: 0 },
  { from: 20, to: 40, count: 0 },
  { from: 40, to: 60, count: 0 },
  { from: 60, to: 80, count: 0 },
  { from: 80, to: 100, count: 0 },
];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a.map(r => r.toLowerCase().trim()));
  const setB = new Set(b.map(r => r.toLowerCase().trim()));
  let intersection = 0;
  for (const r of setA) if (setB.has(r)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

export function aggregateBlindPriors(priors: BlindPriorRow[]): BlindPriorAggregate {
  if (priors.length === 0) {
    return {
      count: 0,
      meanConfidence: 0,
      medianConfidence: 0,
      stdDevConfidence: 0,
      confidenceHistogram: HISTOGRAM_BUCKETS.map(b => ({ ...b })),
      topRisks: [],
      topRisksAgreement: 0,
      sharedRationales: [],
      meanBrier: null,
      bestCalibrated: null,
    };
  }

  const confidences = priors.map(p => p.confidencePercent);
  const meanConfidence = confidences.reduce((sum, v) => sum + v, 0) / confidences.length;
  const variance =
    confidences.reduce((sum, v) => sum + (v - meanConfidence) ** 2, 0) / confidences.length;
  const stdDevConfidence = Math.sqrt(variance);

  const histogram = HISTOGRAM_BUCKETS.map(b => ({ ...b }));
  for (const c of confidences) {
    if (c >= 100) {
      histogram[histogram.length - 1].count += 1;
      continue;
    }
    for (const bucket of histogram) {
      if (c >= bucket.from && c < bucket.to) {
        bucket.count += 1;
        break;
      }
    }
  }

  const riskMap = new Map<string, { count: number; attributedTo: Set<string> }>();
  for (const prior of priors) {
    for (const raw of prior.topRisks) {
      const normalized = raw.trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!riskMap.has(key)) {
        riskMap.set(key, { count: 0, attributedTo: new Set<string>() });
      }
      const entry = riskMap.get(key)!;
      entry.count += 1;
      if (prior.shareIdentity && prior.respondentName) {
        entry.attributedTo.add(prior.respondentName);
      }
    }
  }
  const topRisks: RiskFrequency[] = Array.from(riskMap.entries())
    .map(([risk, { count, attributedTo }]) => ({
      risk,
      count,
      attributedTo: Array.from(attributedTo),
    }))
    .sort((a, b) => b.count - a.count);

  let pairCount = 0;
  let totalJaccard = 0;
  for (let i = 0; i < priors.length; i += 1) {
    for (let j = i + 1; j < priors.length; j += 1) {
      totalJaccard += jaccard(priors[i].topRisks, priors[j].topRisks);
      pairCount += 1;
    }
  }
  const topRisksAgreement = pairCount === 0 ? 0 : totalJaccard / pairCount;

  const sharedRationales: SharedRationale[] = priors
    .filter(p => p.shareRationale && p.privateRationale && p.privateRationale.trim().length > 0)
    .map(p => ({
      name: p.shareIdentity ? (p.respondentName ?? null) : null,
      rationale: p.privateRationale!.trim(),
      confidencePercent: p.confidencePercent,
    }));

  const stamped = priors.filter(p => typeof p.brierScore === 'number');
  const meanBrier =
    stamped.length === 0
      ? null
      : Math.round(
          (stamped.reduce((sum, p) => sum + (p.brierScore ?? 0), 0) / stamped.length) * 10_000
        ) / 10_000;

  let bestCalibrated: BlindPriorAggregate['bestCalibrated'] = null;
  if (stamped.length > 0) {
    const sortedByBrier = [...stamped].sort((a, b) => (a.brierScore ?? 1) - (b.brierScore ?? 1));
    const top = sortedByBrier[0];
    bestCalibrated = {
      name: top.shareIdentity ? (top.respondentName ?? null) : null,
      confidencePercent: top.confidencePercent,
      brierScore: top.brierScore ?? 0,
      brierCategory: top.brierCategory ?? null,
    };
  }

  return {
    count: priors.length,
    meanConfidence: Math.round(meanConfidence * 10) / 10,
    medianConfidence: Math.round(median(confidences) * 10) / 10,
    stdDevConfidence: Math.round(stdDevConfidence * 10) / 10,
    confidenceHistogram: histogram,
    topRisks,
    topRisksAgreement: Math.round(topRisksAgreement * 1000) / 1000,
    sharedRationales,
    meanBrier,
    bestCalibrated,
  };
}
