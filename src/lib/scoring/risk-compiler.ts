/**
 * Risk Compiler — modular helpers extracted from riskScorerNode
 * (2026-05-20 refactor, founder-approved).
 *
 * The historical riskScorerNode lived as ~537 lines of inline orchestration
 * in src/lib/agents/nodes.ts doing six separate jobs (compound scoring +
 * Bayesian priors + outcome feedback + penalty math + calibration + report
 * assembly). The CLAUDE.md "Technical Debt" section flagged this as a
 * documented refactor target.
 *
 * This module hosts the helpers so the node becomes a thin orchestration
 * shell. **No behavior change** — the math, the fallback paths, the
 * default values, the clamp/round ordering are byte-identical to the
 * pre-refactor riskScorerNode. The dqi-distribution-check.ts regression
 * suite is the parity gate (same scores before + after).
 *
 * Discipline rules baked in:
 *
 *  - Every helper accepts EXPLICIT inputs (no hidden state reads).
 *  - Pure-math helpers have no I/O. Prisma-dependent helpers are async +
 *    wrap their Prisma calls in the same try/catch defaults the pre-
 *    refactor inline code had (silent on schema drift, log.debug on
 *    transient failure).
 *  - The dynamic `import('…')` calls that were inlined in the node stay
 *    inline here — they're the lazy-load pattern that lets Prisma /
 *    compound-engine / bayesian-priors modules tree-shake out of cold
 *    paths.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { normalizeBiasType } from '@/lib/utils/bias-normalize';
import { isInvestmentDocument } from '@/lib/prompts/investment-vertical';
import type { AuditState } from '@/lib/agents/types';

const log = createLogger('RiskCompiler');

// ─── Severity weights + causal multipliers ────────────────────────────────

const DEFAULT_SEVERITY_WEIGHTS: Record<string, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 50,
};

/**
 * Load calibrated bias severity weights from the feedback-loop module.
 * Falls back to static defaults (low=5, medium=15, high=30, critical=50)
 * when the module / CalibrationProfile table is unavailable. Mirrors the
 * pre-refactor inline behavior exactly.
 */
export async function loadSeverityWeights(
  orgId: string | null,
  userId: string | null
): Promise<Record<string, number>> {
  try {
    const { loadBiasSeverityWeights } = await import('@/lib/learning/feedback-loop');
    const weights = await loadBiasSeverityWeights(orgId, userId);
    log.debug('Using calibrated bias severity weights');
    return weights;
  } catch {
    log.debug('Using default bias severity weights (calibration unavailable)');
    return { ...DEFAULT_SEVERITY_WEIGHTS };
  }
}

export interface CausalWeightEntry {
  biasType: string;
  dangerMultiplier: number;
  failureCount: number;
  successCount: number;
  sampleSize: number;
}

export interface CausalMultipliersResult {
  multipliers: Map<string, number>;
  weightsForReport: CausalWeightEntry[];
}

/**
 * Load org-specific causal danger multipliers (Moat 1: Causal AI Layer).
 * If a bias is causally linked to poor outcomes, amplify its deduction;
 * if mostly benign, reduce it. Returns an empty map on failure so the
 * caller can short-circuit cleanly.
 */
export async function loadCausalMultipliers(scopeId: string): Promise<CausalMultipliersResult> {
  try {
    const { computeOrgCausalWeights } = await import('@/lib/learning/causal-learning');
    const causalWeights = await computeOrgCausalWeights(scopeId);
    if (causalWeights.length === 0) {
      return { multipliers: new Map(), weightsForReport: [] };
    }
    const multipliers = new Map(
      causalWeights.map(w => [w.biasType.toLowerCase().replace(/\s+/g, '_'), w.dangerMultiplier])
    );
    log.debug(
      `Causal AI active: ${causalWeights.length} bias-outcome edges loaded (scope: ${scopeId || 'user-level'})`
    );
    return { multipliers, weightsForReport: causalWeights };
  } catch {
    log.debug('Causal weights unavailable — using static severity only');
    return { multipliers: new Map(), weightsForReport: [] };
  }
}

// ─── Compound scoring (with M10 dual-track) ───────────────────────────────

export interface CompoundDeductionsInput {
  state: AuditState;
  severityWeights: Record<string, number>;
  causalMultipliers: Map<string, number>;
}

export interface CompoundDeductionsResult {
  biasDeductions: number;
  staticBiasDeductions: number;
  compoundScoreResult: Awaited<
    ReturnType<typeof import('@/lib/scoring/compound-engine').computeCompoundScore>
  > | null;
  staticCompoundResult: Awaited<
    ReturnType<typeof import('@/lib/scoring/compound-engine').computeCompoundScore>
  > | null;
}

/**
 * Compound scoring + M10 baseline track + in-pipeline NAMED_PATTERNS
 * matching. Returns BOTH the calibrated bias deduction (the headline)
 * AND the static baseline deduction (industry default, no org calibration)
 * so the calibration delta can be surfaced as the visible flywheel signal.
 *
 * Falls back to simple additive scoring (basePenalty * clampedMultiplier)
 * when the compound engine is unavailable. The fallback path computes both
 * tracks consistently — static uses base severity weights without causal
 * multipliers, calibrated uses base × clamped multiplier.
 */
export async function computeBiasDeductions(
  input: CompoundDeductionsInput
): Promise<CompoundDeductionsResult> {
  const { state, severityWeights, causalMultipliers } = input;

  try {
    const { computeCompoundScore } = await import('@/lib/scoring/compound-engine');
    const detectedBiases = (state.biasAnalysis || []).map(
      (b: { biasType?: string; severity?: string; confidence?: number; excerpt?: string }) => ({
        type: (b.biasType || '').toLowerCase().replace(/\s+/g, '_'),
        severity: (b.severity || 'low').toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
        confidence: b.confidence || 0.5,
        excerpt: b.excerpt,
      })
    );

    // Build org calibration from causal multipliers
    const orgCalibration: Record<string, number> = {};
    for (const [key, val] of causalMultipliers.entries()) {
      orgCalibration[key] =
        Math.max(0.3, Math.min(2.5, val)) *
        (severityWeights[detectedBiases.find(b => b.type === key)?.severity || 'medium'] || 15);
    }

    // Estimate document context from state
    const wordCount = (state.structuredContent || '').split(/\s+/).length;
    const hasDissent =
      state.cognitiveAnalysis?.blindSpotGap != null && state.cognitiveAnalysis.blindSpotGap > 50;
    const speakers = state.speakers || [];

    // Corporate Strategy / M&A Vertical: deal-linked documents → very_high stakes
    const monetaryStakes: 'unknown' | 'low' | 'medium' | 'high' | 'very_high' =
      state.dealType || isInvestmentDocument(state.documentType) ? 'very_high' : 'unknown';
    if (monetaryStakes === 'very_high') {
      log.info(
        'Strategy/M&A context: auto-setting monetary stakes to very_high for compound scoring'
      );
    }

    const compoundContext = {
      monetaryStakes,
      participantCount: speakers.length,
      dissentPresent: hasDissent,
      timelineWeeks: null,
      documentAgeWeeks: 0,
      wordCount,
      rawContent: state.structuredContent || undefined,
    };

    // Pipeline activation of firedPatternLabels (locked 2026-05-09 evening,
    // M&A cascade follow-through). Pure-function pattern matcher runs the
    // NAMED_PATTERNS catalogue against in-flight detected biases + context
    // BEFORE compound-engine fires, so PATTERN_PAIR_OVERRIDES amplifications
    // actually fire on live audits.
    const { matchNamedPatterns } = await import('@/lib/learning/named-patterns');
    const firedPatternLabels = matchNamedPatterns({
      biasTypes: detectedBiases.map(b => b.type),
      context: {
        monetaryStakes,
        dissentAbsent: !hasDissent,
        // Other ContextFactors fields stay undefined — the matcher reads
        // conservatively. timePressure / unanimousConsensus aren't derivable
        // from pipeline state; persisted detector in toxic-combinations.ts
        // has the full Prisma context for those.
      },
    });
    if (firedPatternLabels.length > 0) {
      log.info(
        `Named patterns fired in-pipeline: ${firedPatternLabels.join(', ')} — passing to compound-engine for amplification.`
      );
    }

    const compoundScoreResult = computeCompoundScore(100, detectedBiases, compoundContext, {
      orgCalibration: Object.keys(orgCalibration).length > 0 ? orgCalibration : undefined,
      firedPatternLabels: firedPatternLabels.length > 0 ? firedPatternLabels : undefined,
    });

    // M10 baseline track. Only actually differs when orgCalibration is
    // present — otherwise the two results are identical (delta=0).
    // Pattern amplification stays in BOTH tracks (it's methodology, not
    // org calibration).
    const staticCompoundResult: CompoundDeductionsResult['staticCompoundResult'] =
      Object.keys(orgCalibration).length > 0
        ? computeCompoundScore(100, detectedBiases, compoundContext, {
            firedPatternLabels: firedPatternLabels.length > 0 ? firedPatternLabels : undefined,
          })
        : compoundScoreResult;

    const biasDeductions = Math.round(100 - compoundScoreResult.calibratedScore);
    const staticBiasDeductions = Math.round(100 - staticCompoundResult.calibratedScore);
    log.info(
      `Compound scoring: raw_penalty=${compoundScoreResult.rawScore - compoundScoreResult.calibratedScore}, ` +
        `multiplier=${compoundScoreResult.compoundMultiplier}, ` +
        `context=${compoundScoreResult.contextAdjustment}, ` +
        `interactions=${compoundScoreResult.biasScores.filter(b => b.interactionMultiplier > 1.05).length}, ` +
        `calibration_delta=${biasDeductions - staticBiasDeductions}`
    );

    return { biasDeductions, staticBiasDeductions, compoundScoreResult, staticCompoundResult };
  } catch {
    log.warn('Compound scoring unavailable — using simple additive penalties');

    const biasDeductions = (state.biasAnalysis || []).reduce(
      (acc: number, b: { severity?: string; biasType?: string }) => {
        const severity = (b.severity || 'low').toLowerCase();
        const basePenalty = severityWeights[severity] || 5;
        const biasKey = (b.biasType || '').toLowerCase().replace(/\s+/g, '_');
        const multiplier = causalMultipliers.get(biasKey) ?? 1.0;
        const clampedMultiplier = Math.max(0.3, Math.min(2.5, multiplier));
        return acc + Math.round(basePenalty * clampedMultiplier);
      },
      0
    );

    const staticBiasDeductions = (state.biasAnalysis || []).reduce(
      (acc: number, b: { severity?: string }) => {
        const severity = (b.severity || 'low').toLowerCase();
        const basePenalty = severityWeights[severity] || 5;
        return acc + basePenalty;
      },
      0
    );

    return {
      biasDeductions,
      staticBiasDeductions,
      compoundScoreResult: null,
      staticCompoundResult: null,
    };
  }
}

// ─── Bayesian prior integration ───────────────────────────────────────────

export interface BayesianAdjustmentInput {
  state: AuditState;
  biasDeductions: number;
}

export interface BayesianAdjustmentResult {
  adjustedBiasDeductions: number;
  bayesianResult: Awaited<
    ReturnType<typeof import('@/lib/scoring/bayesian-priors').applyBayesianPriors>
  > | null;
}

/**
 * If a DecisionPrior exists for this user+document, apply Bayesian updating
 * to nudge bias confidence using the user's pre-analysis belief. The result
 * is blended 80/20 with the compound-scored deduction so priors influence
 * but never dominate the final score. Returns the original deduction
 * unchanged when no prior exists OR when the bayesian module / prior table
 * isn't available.
 */
export async function applyBayesianAdjustment(
  input: BayesianAdjustmentInput
): Promise<BayesianAdjustmentResult> {
  const { state, biasDeductions } = input;
  try {
    const priorRecord = await prisma.decisionPrior.findFirst({
      where: {
        userId: state.userId,
        analysis: { documentId: state.documentId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!priorRecord) {
      return { adjustedBiasDeductions: biasDeductions, bayesianResult: null };
    }

    const { applyBayesianPriors } = await import('@/lib/scoring/bayesian-priors');
    const detectedBiasesForBayes = (state.biasAnalysis || []).map(
      (b: { biasType?: string; confidence?: number; severity?: string }) => ({
        type: (b.biasType || '').toLowerCase().replace(/\s+/g, '_'),
        confidence: b.confidence || 0.5,
        severity: (b.severity || 'medium').toLowerCase(),
      })
    );

    const bayesianResult = applyBayesianPriors(100 - biasDeductions, detectedBiasesForBayes, {
      beliefScore: (priorRecord.confidence ?? 50) / 100,
      confidence: (priorRecord.confidence ?? 50) / 100,
      flaggedConcerns: priorRecord.evidenceToChange ? [priorRecord.evidenceToChange] : undefined,
    });

    if (!bayesianResult) {
      return { adjustedBiasDeductions: biasDeductions, bayesianResult: null };
    }

    const bayesianDeduction = Math.round(100 - bayesianResult.adjustedScore);
    const adjustedBiasDeductions = Math.round(biasDeductions * 0.8 + bayesianDeduction * 0.2);
    log.info(
      `Bayesian priors applied: belief_delta=${bayesianResult.beliefDelta}, ` +
        `info_gain=${bayesianResult.informationGain}, adjusted=${bayesianResult.adjustedScore}`
    );
    return { adjustedBiasDeductions, bayesianResult };
  } catch (bayesErr) {
    const code = (bayesErr as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.debug('DecisionPrior schema drift — continuing without prior integration');
    } else {
      log.debug(
        'Bayesian priors unavailable — continuing without prior integration:',
        bayesErr instanceof Error ? bayesErr.message : String(bayesErr)
      );
    }
    return { adjustedBiasDeductions: biasDeductions, bayesianResult: null };
  }
}

// ─── Pure-math penalty helpers ─────────────────────────────────────────────

/**
 * RECALIBRATED 2026-06-30 (methodology 2.4.0 → 2.5.0). The noise penalty was
 * `stdDev × 5` UNBOUNDED — a 3-frame jury that disagreed (stdDev 28.5 on the
 * SpaceX S-1) produced a 142-point penalty that floored the DQI to 0 *by
 * itself*, regardless of the actual reasoning. Across all 11 real audits this
 * drove 6/11 to exactly 0 (avg DQI 15.3 — "every audit reads grade F"). Noise
 * is an ~18% DQI component, not a score-killer, so it is now rate 1.5 capped at
 * 22 points (≈ its intended weight). stdDev 28.5 → 22, 9.4 → 14, 2.4 → 3.6.
 */
export const NOISE_PENALTY_RATE = 1.5;
export const NOISE_PENALTY_CAP = 22;

export function calculateNoisePenalty(stdDev: number | undefined | null): number {
  return Math.min(NOISE_PENALTY_CAP, (stdDev || 0) * NOISE_PENALTY_RATE);
}

/**
 * Headline-impact bound on the compound bias deduction (RECALIBRATED 2026-06-30).
 * The compound engine still computes + persists the FULL deduction (the moat
 * data is unchanged); this only bounds how far biases alone can drag the
 * headline overallScore, so a catastrophically-biased memo retains a small
 * floor (~grade F at ~15-25, like the hand-set sample memos) instead of pinning
 * to exactly 0 and losing all resolution at the low end.
 */
export const BIAS_DEDUCTION_CAP = 75;

/**
 * Trust penalty derived from the fact-check verdict. Missing / errored
 * fact-check → moderate 50 trust score (not perfect 100), so unknown
 * trust always carries a penalty. Multiplier 0.3 keeps trust as a
 * moderate component, not dominant.
 */
export function calculateTrustPenalty(
  factCheck:
    | { status?: 'success' | 'error' | string | null; score?: number | null }
    | null
    | undefined
): { trustScore: number; trustPenalty: number } {
  let trustScore: number;
  if (!factCheck || factCheck.status === 'error') {
    trustScore = 50;
  } else {
    trustScore = factCheck.score ?? 50;
  }
  const trustPenalty = (100 - trustScore) * 0.3;
  return { trustScore, trustPenalty };
}

/**
 * Logic penalty — reasoning-quality score from logicalAnalysis. Uses ??
 * so genuine score=0 is respected; missing analysis defaults to 100 (no
 * penalty) so absence of data doesn't artificially lower the overall.
 */
export function calculateLogicPenalty(logicScore: number | undefined | null): number {
  const score = logicScore ?? 100;
  return (100 - score) * 0.4;
}

/**
 * Echo chamber penalty — diversity score from cognitiveAnalysis.blindSpotGap.
 * 0 = tunnel vision (max penalty), 100 = full diversity (no penalty).
 * Missing → 100 (no penalty) by the same absence-of-data rule.
 */
export function calculateEchoChamberPenalty(diversityScore: number | undefined | null): number {
  const score = diversityScore ?? 100;
  return (100 - score) * 0.3;
}

/**
 * Outcome feedback loop — penalise biases historically linked to failed
 * decisions in this org's DecisionEdge graph. Caps at 25 points to keep
 * the feedback loop influential but never dominant. Returns 0 cleanly on
 * any Prisma failure (schema drift / no edges yet / cold start).
 */
export async function calculateOutcomeFeedbackAdjustment(biasTypes: string[]): Promise<number> {
  if (biasTypes.length === 0) return 0;

  try {
    const detectedBiasTypes = biasTypes.map(normalizeBiasType);
    if (detectedBiasTypes.length === 0) return 0;

    const failedEdges = await prisma.decisionEdge.findMany({
      where: {
        edgeType: 'shared_bias',
        strength: { gte: 0.5 },
        confidence: { gte: 0.3 },
      },
      select: { strength: true, confidence: true, metadata: true },
      take: 50,
    });

    let feedbackAdjustment = 0;
    for (const edge of failedEdges) {
      const meta = edge.metadata as Record<string, unknown> | null;
      if (meta?.outcomeResult === 'negative' || meta?.outcomeResult === 'failure') {
        feedbackAdjustment += edge.strength * edge.confidence * 3;
      }
    }
    return Math.min(feedbackAdjustment, 25);
  } catch (feedbackErr) {
    log.debug(
      'Outcome feedback query failed (non-fatal):',
      feedbackErr instanceof Error ? feedbackErr.message : String(feedbackErr)
    );
    return 0;
  }
}

/**
 * Count confirmed decision outcomes for the user/org. Used to gate the
 * calibration UI at sampleSize >= CALIBRATION_UNLOCK. Returns 0 on
 * schema drift / table-missing.
 */
export async function countCalibrationSamples(
  orgId: string | null,
  userId: string | null
): Promise<number> {
  try {
    return await prisma.decisionOutcome.count({
      where: orgId
        ? { orgId, outcome: { in: ['success', 'partial_success', 'failure'] } }
        : { userId: userId ?? '', outcome: { in: ['success', 'partial_success', 'failure'] } },
    });
  } catch (calErr) {
    const code = (calErr as { code?: string })?.code;
    if (code !== 'P2021' && code !== 'P2022') {
      log.debug(
        'Calibration sample count failed (non-fatal):',
        calErr instanceof Error ? calErr.message : String(calErr)
      );
    }
    return 0;
  }
}

// ─── Score composition + calibration ───────────────────────────────────────

export interface ScoreCompositionInput {
  baseScore?: number;
  biasDeductions: number;
  noisePenalty: number;
  trustPenalty: number;
  logicPenalty: number;
  diversityPenalty: number;
  feedbackAdjustment: number;
}

/**
 * Compose the final overall score from the per-component penalties. Clamps
 * to [0, 100] and rounds to integer — same ordering as the pre-refactor
 * inline code (subtract → clamp → round).
 */
export function composeOverallScore(input: ScoreCompositionInput): number {
  const base = input.baseScore ?? 100;
  // Bound the bias deduction's headline impact (see BIAS_DEDUCTION_CAP) so a
  // very-high-bias memo keeps a small floor instead of pinning to exactly 0.
  const boundedBias = Math.min(BIAS_DEDUCTION_CAP, input.biasDeductions);
  const raw =
    base -
    boundedBias -
    input.noisePenalty -
    input.trustPenalty -
    input.logicPenalty -
    input.diversityPenalty -
    input.feedbackAdjustment;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export const CALIBRATION_UNLOCK = 5;

/**
 * Build the calibration headline (M10) — one-line human-readable summary
 * of how the org's calibration has shifted the score from the industry
 * baseline. Cold-start path returns the "unlock at N outcomes" hint.
 *
 * Moved from nodes.ts buildCalibrationHeadline 2026-05-20. Same math.
 */
export function buildCalibrationHeadline(
  delta: number,
  sampleSize: number,
  source: 'causal' | 'default',
  causalWeights: Array<{
    biasType: string;
    dangerMultiplier: number;
    sampleSize: number;
  }>
): string {
  if (sampleSize < CALIBRATION_UNLOCK) {
    const remaining = CALIBRATION_UNLOCK - sampleSize;
    return `Your calibrated score unlocks at 5 confirmed outcomes — ${remaining} more to go.`;
  }

  if (source === 'default' || causalWeights.length === 0) {
    return `Based on ${sampleSize} confirmed outcomes — no bias-outcome patterns detected yet. Baseline severity weights still apply.`;
  }

  // Pick single bias with largest deviation from baseline (1.0)
  const dominant = [...causalWeights].sort(
    (a, b) => Math.abs(b.dangerMultiplier - 1) - Math.abs(a.dangerMultiplier - 1)
  )[0];

  const dominantName = dominant?.biasType.replace(/_/g, ' ') ?? 'bias patterns';
  const dominantMultiplier = dominant?.dangerMultiplier ?? 1;

  if (Math.abs(delta) < 1) {
    return `Based on ${sampleSize} confirmed outcomes — your org's bias profile matches industry baseline closely.`;
  }

  if (delta < 0) {
    return `Based on ${sampleSize} outcomes, your org rates ${dominantName} ${dominantMultiplier.toFixed(1)}x heavier than industry baseline. This decision is ${Math.abs(delta)} points riskier than it looks.`;
  }
  return `Based on ${sampleSize} outcomes, your org has absorbed similar ${dominantName} patterns before. This decision scores ${delta} points better than industry baseline.`;
}

export interface CalibrationInsightInput {
  overallScore: number;
  staticOverallScore: number;
  causalWeightsForReport: CausalWeightEntry[];
  sampleSize: number;
}

export interface CalibrationInsight {
  calibratedOverallScore: number;
  staticOverallScore: number;
  calibrationDelta: number;
  calibrationSource: 'causal' | 'default';
  sampleSize: number;
  unlockThreshold: number;
  headline: string;
}

/**
 * Assemble the CalibrationInsight payload. Pure orchestration over the
 * already-computed score values + the causal weights snapshot.
 */
export function buildCalibrationInsight(input: CalibrationInsightInput): CalibrationInsight {
  const calibrationSource: 'causal' | 'default' =
    input.causalWeightsForReport.length > 0 ? 'causal' : 'default';
  const calibrationDelta = input.overallScore - input.staticOverallScore;
  const headline = buildCalibrationHeadline(
    calibrationDelta,
    input.sampleSize,
    calibrationSource,
    input.causalWeightsForReport
  );
  return {
    calibratedOverallScore: input.overallScore,
    staticOverallScore: input.staticOverallScore,
    calibrationDelta,
    calibrationSource,
    sampleSize: input.sampleSize,
    unlockThreshold: CALIBRATION_UNLOCK,
    headline,
  };
}
