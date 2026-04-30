/**
 * Platform Calibration Baseline — synthetic Brier score derived from the
 * full case-study library so DI can answer "show me your outcome
 * calibration" before any customer org has logged enough outcomes for a
 * per-org number.
 *
 * Why this exists
 * ───────────────
 * The Cloverpop external-attack-vector (CLAUDE.md) hinges on Cloverpop
 * having years of historical decision data we don't. The honest answer is
 * the case library: 143 audited corporate decisions where we know both
 * the biases that were present (pre-decision-knowable) and the actual
 * outcome (ground truth). Running our published DQI scoring methodology
 * over the bias load + context factors yields a predicted DQI per case;
 * comparing each prediction to the actual outcome via the Brier proper-
 * scoring rule yields a defensible calibration number.
 *
 * Methodology
 * ───────────
 * Per-case predicted DQI is computed by `computeBrierFairPredictedDqi`,
 * which mirrors `computeSyntheticDQI` from `src/lib/scoring/dqi.ts` but
 * neutralises the one dimension that peeks at the outcome (evidence
 * quality is set to a neutral 50 instead of being inferred from
 * success/failure). Every other dimension — bias load, process maturity,
 * noise, compliance — uses the same formula and the same canonical
 * WEIGHTS as live customer scoring. The prediction is therefore
 * reproducible from the public case-study fields without hindsight.
 *
 * Outcome mapping collapses the six-value CaseOutcome ladder onto the
 * five-value OutcomeCode used by `computeBrier`:
 *   catastrophic_failure  → failure          (actual = 0.0)
 *   failure               → failure          (actual = 0.0)
 *   partial_failure       → partial_failure  (actual = 0.25)
 *   partial_success       → partial_success  (actual = 0.75)
 *   success               → success          (actual = 1.0)
 *   exceptional_success   → success          (actual = 1.0)
 *
 * The output is cached at module init because the case library is
 * compile-time-static; callers can invoke `computePlatformCalibrationBaseline()`
 * at zero runtime cost.
 *
 * What this is NOT
 * ────────────────
 * This is a *seed* baseline, not a forecast track-record. We are not
 * claiming DI predicted these outcomes ahead of time — the cases were
 * audited retrospectively. The Brier number reads as: "if the platform's
 * scoring methodology had been applied at decision time using only the
 * pre-decision-knowable signal, this is how its predictions would have
 * calibrated against the ground truth." When real customer outcomes
 * accumulate (Outcome Gate Phase 1+2+3 are shipped), per-org Brier
 * supersedes the seed baseline; until then, the seed is the contractual
 * answer to "show me your outcome calibration."
 */

import {
  ALL_CASES,
  type CaseOutcome,
  type CaseStudy,
} from '@/lib/data/case-studies';
import { WEIGHTS } from '@/lib/scoring/dqi';
import {
  computeBrier,
  brierCategory,
  type BrierCategory,
  type OutcomeCode,
} from '@/lib/learning/brier-scoring';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PlatformCalibrationBaseline {
  /** Total cases scored. Derived from ALL_CASES.length. */
  n: number;
  /** Mean Brier score across the corpus, rounded to 4 decimals. */
  meanBrier: number;
  /** Median Brier across the corpus, rounded to 4 decimals. */
  medianBrier: number;
  /** Bucket counts by Tetlock-anchored category. */
  distribution: Record<BrierCategory, number>;
  /** Aggregate label for the corpus mean. */
  meanCategory: BrierCategory;
  /** Per-outcome breakdown for transparency in DPR + procurement responses. */
  byOutcome: Array<{
    outcomeCode: OutcomeCode;
    n: number;
    meanBrier: number;
  }>;
  /** Classification accuracy at the C/D grade boundary (DQI 55):
   *  fraction of cases where (predictedDqi < 55 AND outcome ≤ 0.25) OR
   *  (predictedDqi ≥ 55 AND outcome ≥ 0.75). Cases with inconclusive
   *  outcome (0.5) are excluded from the denominator since there is no
   *  ground-truth label to score against. The boundary 55 mirrors the
   *  published C grade threshold (GRADE_THRESHOLDS in dqi.ts), so this
   *  reads as "accuracy when classifying at the 'investigate further'
   *  cutoff." */
  classificationAccuracy: number;
  /** Numerator and denominator behind classificationAccuracy so a
   *  procurement reader can verify the math. */
  classificationCounts: { correct: number; scored: number };
  /** 95% confidence interval on the mean Brier from a 10,000-iteration
   *  bootstrap with replacement, seeded for reproducibility. The CI
   *  answers Margaret's procurement question "is your Brier number
   *  precise enough to be a meaningful claim?" — `halfWidth` is the
   *  ±value that surfaces in marketing copy. Seeded mulberry32 means
   *  every process / test / build computes the same CI. */
  brierCi95: { lower: number; upper: number; halfWidth: number };
  /** Number of bootstrap iterations used to derive `brierCi95`. */
  bootstrapIterations: number;
  /** Bootstrap PRNG seed — pinned for reproducibility. Document on the
   *  /bias-genome methodology footnote so a procurement auditor can
   *  re-run the computation and match. */
  bootstrapSeed: number;
  /** ISO timestamp the baseline was computed (module-init time). Stable across the process. */
  computedAt: string;
  /** Source label for citation. Always "seed-case-studies" until customer outcomes supersede. */
  dataSource: 'seed-case-studies';
  /** Methodology version anchor — bump alongside any change to the per-case DQI formula. */
  methodologyVersion: '2.0.0-seed';
}

// ─── Outcome mapping ───────────────────────────────────────────────────────

/** Collapse the six-value CaseOutcome onto the five-value OutcomeCode used
 *  by `computeBrier`. exceptional_success is treated as plain success
 *  because [0, 1] is the legal range; catastrophic_failure collapses onto
 *  failure for the same reason. */
export function mapCaseOutcomeToCode(outcome: CaseOutcome): OutcomeCode {
  switch (outcome) {
    case 'success':
    case 'exceptional_success':
      return 'success';
    case 'partial_success':
      return 'partial_success';
    case 'partial_failure':
      return 'partial_failure';
    case 'failure':
    case 'catastrophic_failure':
      return 'failure';
  }
}

// ─── Brier-fair predicted DQI ──────────────────────────────────────────────

/**
 * Predicted DQI for a historical case — Brier-fair variant of
 * `computeSyntheticDQI`. Identical formula except the evidence dimension
 * is set to a neutral 50 instead of being inferred from the realised
 * outcome, so the prediction does not peek at ground truth. Compliance
 * is left at the same neutral 60 the production synthetic uses (it is
 * not outcome-derived in either function).
 *
 * Renormalises the remaining five dimensions to sum to 1.0 — same shape
 * as `computeSyntheticDQI` — so the score stays comparable to live
 * customer DQIs scored with the same methodology version.
 */
export function computeBrierFairPredictedDqi(c: CaseStudy): number {
  // Bias Load (28%) — bias count drags the score down with diminishing
  // returns past the first few biases. Same formula as the production
  // synthetic: 100 - sqrt(biasCount * 8) * 6.
  const biasPenalty = c.biasesPresent.length * 8;
  const biasScore = Math.max(0, Math.min(100, 100 - Math.sqrt(biasPenalty) * 6));

  // Process Maturity (13%) — context factors raise the score. Same as production.
  let processScore = 40;
  if (c.contextFactors.dissentEncouraged) processScore += 20;
  if (c.contextFactors.externalAdvisors) processScore += 15;
  if (c.contextFactors.iterativeProcess) processScore += 15;
  if (!c.contextFactors.dissentAbsent) processScore += 10;
  processScore = Math.min(100, processScore);

  // Noise Level (18%) — derived from unanimousConsensus, which is a
  // pre-decision feature (we know whether dissent was suppressed before
  // the outcome lands). Same as production.
  const noiseScore = c.contextFactors.unanimousConsensus ? 30 : 60;

  // Evidence Quality (18%) — Brier-fair neutralisation. Production
  // synthetic peeks at outcome here; the calibration baseline must not.
  const evidenceScore = 50;

  // Compliance Risk (13%) — neutral, same as production.
  const complianceScore = 60;

  // Renormalise weights to sum to 1.0 — historicalAlignment is excluded
  // (cannot recurse on the corpus we're scoring). Mirrors the production
  // synthetic's denominator.
  const denom =
    WEIGHTS.biasLoad +
    WEIGHTS.noiseLevel +
    WEIGHTS.evidenceQuality +
    WEIGHTS.processMaturity +
    WEIGHTS.complianceRisk;

  const predictedDqi =
    (biasScore * WEIGHTS.biasLoad +
      noiseScore * WEIGHTS.noiseLevel +
      evidenceScore * WEIGHTS.evidenceQuality +
      processScore * WEIGHTS.processMaturity +
      complianceScore * WEIGHTS.complianceRisk) /
    denom;

  return Math.round(Math.max(0, Math.min(100, predictedDqi)));
}

// ─── Aggregation ───────────────────────────────────────────────────────────

function median(sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }
  return sortedValues[mid];
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * mulberry32 — tiny, fast, full-period 32-bit PRNG. Seeded so the
 * bootstrap CI is deterministic across processes / tests / CI / browser
 * + Node. Procurement auditors can re-run the computation and match the
 * published CI to four decimals.
 */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const BOOTSTRAP_SEED = 17_039_507; // pinned; see PlatformCalibrationBaseline.bootstrapSeed
const BOOTSTRAP_ITERATIONS = 10_000;

/**
 * Bootstrap 95% CI on the mean of `values` using `iterations` resamples
 * with replacement, seeded for reproducibility. Returns lower / upper /
 * halfWidth (which is what marketing copy surfaces as ±X).
 */
function bootstrapMeanCi95(
  values: number[],
  iterations: number,
  seed: number
): { lower: number; upper: number; halfWidth: number } {
  if (values.length === 0) return { lower: 0, upper: 0, halfWidth: 0 };
  const rng = mulberry32(seed);
  const n = values.length;
  const means = new Float64Array(iterations);
  for (let i = 0; i < iterations; i += 1) {
    let sum = 0;
    for (let j = 0; j < n; j += 1) {
      const idx = Math.floor(rng() * n);
      sum += values[idx];
    }
    means[i] = sum / n;
  }
  // Sort ascending then read 2.5 / 97.5 percentiles.
  const sorted = Array.from(means).sort((a, b) => a - b);
  const lowerIdx = Math.floor(0.025 * iterations);
  const upperIdx = Math.floor(0.975 * iterations);
  const lower = round4(sorted[lowerIdx]);
  const upper = round4(sorted[upperIdx]);
  // halfWidth uses (upper - lower) / 2 — the symmetric margin around the
  // mean that reads cleanly as ±X in copy. Source data is mildly
  // right-skewed but the asymmetry is below display precision at n=143.
  const halfWidth = round4((upper - lower) / 2);
  return { lower, upper, halfWidth };
}

function computeBaselineUncached(): PlatformCalibrationBaseline {
  const perCase: Array<{ brier: number; outcomeCode: OutcomeCode; predictedDqi: number }> =
    ALL_CASES.map(c => {
      const predictedDqi = computeBrierFairPredictedDqi(c);
      const outcomeCode = mapCaseOutcomeToCode(c.outcome);
      const brier = computeBrier(predictedDqi, outcomeCode);
      return { brier, outcomeCode, predictedDqi };
    });

  const briers = perCase.map(p => p.brier);
  const sortedBriers = [...briers].sort((a, b) => a - b);

  const meanBrier =
    briers.length === 0 ? 0 : briers.reduce((s, b) => s + b, 0) / briers.length;
  const medianBrier = median(sortedBriers);

  const distribution: Record<BrierCategory, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };
  for (const b of briers) {
    distribution[brierCategory(b)] += 1;
  }

  const outcomeCodes: OutcomeCode[] = [
    'success',
    'partial_success',
    'inconclusive',
    'partial_failure',
    'failure',
  ];
  const byOutcome = outcomeCodes
    .map(outcomeCode => {
      const slice = perCase.filter(p => p.outcomeCode === outcomeCode);
      const n = slice.length;
      const m = n === 0 ? 0 : slice.reduce((s, p) => s + p.brier, 0) / n;
      return { outcomeCode, n, meanBrier: round4(m) };
    })
    .filter(entry => entry.n > 0);

  // Classification accuracy at the C/D grade boundary (DQI 55).
  // Inconclusive cases (actual = 0.5) have no ground-truth class label
  // and are excluded from the denominator.
  const labelled = perCase.filter(p => p.outcomeCode !== 'inconclusive');
  const correct = labelled.filter(p => {
    const isPredictedFail = p.predictedDqi < 55;
    const isActualFail = p.outcomeCode === 'failure' || p.outcomeCode === 'partial_failure';
    return isPredictedFail === isActualFail;
  }).length;
  const classificationAccuracy =
    labelled.length === 0 ? 0 : round4(correct / labelled.length);

  const brierCi95 = bootstrapMeanCi95(briers, BOOTSTRAP_ITERATIONS, BOOTSTRAP_SEED);

  return {
    n: ALL_CASES.length,
    meanBrier: round4(meanBrier),
    medianBrier: round4(medianBrier),
    distribution,
    meanCategory: brierCategory(round4(meanBrier)),
    byOutcome,
    classificationAccuracy,
    classificationCounts: { correct, scored: labelled.length },
    brierCi95,
    bootstrapIterations: BOOTSTRAP_ITERATIONS,
    bootstrapSeed: BOOTSTRAP_SEED,
    computedAt: new Date().toISOString(),
    dataSource: 'seed-case-studies',
    methodologyVersion: '2.0.0-seed',
  };
}

let _cached: PlatformCalibrationBaseline | null = null;

/**
 * Returns the platform calibration baseline. Cached at module-init: every
 * call after the first returns the same object. Callers MAY treat the
 * returned object as read-only — mutation will leak across consumers.
 */
export function computePlatformCalibrationBaseline(): PlatformCalibrationBaseline {
  if (_cached) return _cached;
  _cached = computeBaselineUncached();
  return _cached;
}

/**
 * Display-grade copy for the corpus mean — used by DPR, CalibrationChip,
 * BiasGenomeContributionCard and the investor-deck row to keep the
 * vocabulary identical across surfaces.
 *
 * Reads as: "Platform calibration baseline · Brier 0.258 (fair) over 143
 * audited corporate decisions" — anchors against Tetlock superforecasters
 * at ~0.13 and CIA analysts at ~0.23.
 */
export function formatBaselineLine(baseline: PlatformCalibrationBaseline): string {
  return `Platform calibration baseline · Brier ${baseline.meanBrier.toFixed(3)} (${
    baseline.meanCategory
  }) over ${baseline.n} audited corporate decisions`;
}

/**
 * Classification-accuracy line — surfaces the more procurement-readable
 * shape of the same calibration evidence. "70% classification accuracy
 * at the investigate-further cutoff (DQI 55)" lands harder than a Brier
 * decimal for non-Tetlock-aware readers.
 */
export function formatClassificationLine(baseline: PlatformCalibrationBaseline): string {
  const pct = Math.round(baseline.classificationAccuracy * 100);
  return `${pct}% classification accuracy at the investigate-further cutoff (${baseline.classificationCounts.correct} of ${baseline.classificationCounts.scored} historical decisions)`;
}

/**
 * Methodology footnote — the procurement-grade transparency strip that
 * Margaret + James asked for: n, mean Brier with ±halfWidth 95% CI,
 * iterations + seed, classification-accuracy denominator, methodology
 * version, computed-at date. Surfaces under the corpus mean on every
 * marketing surface that quotes the calibration number.
 *
 * Pass the snapshot's `computedAt` (ISO date) when calling from a
 * client-bundle surface that uses PLATFORM_BASELINE_SNAPSHOT — that
 * snapshot has a stable date, while the live `baseline.computedAt` is
 * the process-start ISO timestamp which is too noisy for marketing.
 */
export function formatCalibrationFootnote(
  baseline: PlatformCalibrationBaseline,
  computedAtOverride?: string
): string {
  const ci = baseline.brierCi95;
  const date = computedAtOverride ?? baseline.computedAt.slice(0, 10);
  return `n = ${baseline.n} historical corporate decisions · mean Brier ${baseline.meanBrier.toFixed(3)} ± ${ci.halfWidth.toFixed(3)} (95% CI, ${baseline.bootstrapIterations.toLocaleString('en-US')}-iteration bootstrap, seed ${baseline.bootstrapSeed}) · methodology v${baseline.methodologyVersion} · computed ${date}`;
}

