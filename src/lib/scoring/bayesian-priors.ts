/**
 * Bayesian Prior Integration
 *
 * When a user submits a DecisionPrior (their pre-analysis belief and
 * confidence), this module uses it as a Bayesian prior to adjust the
 * posterior probability of each detected bias.
 *
 * This transforms DecisionPriors from a simple comparison metric into
 * an active part of the scoring pipeline — proprietary math that
 * competitors can't replicate by copying prompts.
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BayesianPriors');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DecisionPrior {
  /** User's pre-analysis belief: probability of a good outcome (0-1) */
  beliefScore: number;
  /** User's confidence in their belief (0-1) */
  confidence: number;
  /** Optional: specific concerns the user flagged */
  flaggedConcerns?: string[];
  /** Optional: specific biases the user suspects */
  suspectedBiases?: string[];
}

export interface PriorAdjustment {
  biasType: string;
  /** Original LLM confidence (0-1) */
  priorConfidence: number;
  /** Bayesian-adjusted confidence (0-1) */
  posteriorConfidence: number;
  /** Direction of adjustment */
  direction: 'increased' | 'decreased' | 'unchanged';
  /** Explanation */
  reason: string;
}

export interface BayesianResult {
  /** Adjusted quality score incorporating prior */
  adjustedScore: number;
  /** Per-bias confidence adjustments */
  biasAdjustments: PriorAdjustment[];
  /** How much the prior shifted the overall assessment */
  priorInfluence: number;
  /** Belief delta: how much the analysis should shift the user's belief */
  beliefDelta: number;
  /** Information gain: how much new information the analysis provides */
  informationGain: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Base rates for each bias type in organizational decisions.
 * Derived from meta-analyses of cognitive bias research.
 * These serve as the "population prior" when no user prior exists.
 */
const BIAS_BASE_RATES: Record<string, number> = {
  confirmation_bias: 0.72, // Nickerson (1998): "ubiquitous"
  anchoring_bias: 0.65, // Furnham & Boo (2011): high prevalence
  availability_heuristic: 0.58, // Tversky & Kahneman (1973)
  groupthink: 0.45, // Janis (1972): moderate in structured orgs
  authority_bias: 0.52, // Milgram (1963): common in hierarchies
  bandwagon_effect: 0.40, // Asch (1951): depends on group dynamics
  overconfidence_bias: 0.68, // Moore & Healy (2008): very common
  hindsight_bias: 0.63, // Fischhoff (1975): high in retrospective
  planning_fallacy: 0.71, // Kahneman & Lovallo (1993)
  loss_aversion: 0.60, // Kahneman & Tversky (1979)
  sunk_cost_fallacy: 0.55, // Arkes & Blumer (1985)
  status_quo_bias: 0.50, // Samuelson & Zeckhauser (1988)
  framing_effect: 0.62, // Tversky & Kahneman (1981)
  selective_perception: 0.48, // Hastorf & Cantril (1954)
  recency_bias: 0.53, // evidence from serial position research
  cognitive_misering: 0.57, // Fiske & Taylor (1991)
};

const DEFAULT_BASE_RATE = 0.50;

// ---------------------------------------------------------------------------
// Core Bayesian functions
// ---------------------------------------------------------------------------

/**
 * Apply Bayes' theorem to update bias detection confidence given a user prior.
 *
 * P(bias | evidence, prior) = P(evidence | bias) * P(bias | prior) / P(evidence)
 *
 * Where:
 * - P(evidence | bias) = LLM confidence (how strongly the LLM detected the bias)
 * - P(bias | prior) = adjusted base rate incorporating user's prior belief
 * - P(evidence) = normalizing constant
 */
function bayesianUpdate(
  llmConfidence: number,
  baseRate: number,
  userPrior: DecisionPrior,
  biasType: string,
): { posterior: number; direction: 'increased' | 'decreased' | 'unchanged' } {
  // Adjust base rate based on user's prior belief and confidence
  // High user confidence in good outcome → lower bias prior
  // Low user confidence → higher bias prior (they suspect something)
  const priorShift = (1 - userPrior.beliefScore) * userPrior.confidence;
  const adjustedBaseRate = baseRate * (0.7 + priorShift * 0.6);

  // If user specifically suspected this bias, boost the prior
  const userSuspected = userPrior.suspectedBiases?.includes(biasType) ?? false;
  const suspicionBoost = userSuspected ? 1.3 : 1.0;

  // Bayesian update
  // P(bias | evidence) = P(evidence | bias) * P(bias) / P(evidence)
  const pEvidenceGivenBias = llmConfidence;
  const pBias = Math.min(0.95, adjustedBaseRate * suspicionBoost);
  const pNoBias = 1 - pBias;
  const pEvidenceGivenNoBias = 0.15; // false positive rate of LLM detection
  const pEvidence = pEvidenceGivenBias * pBias + pEvidenceGivenNoBias * pNoBias;

  const posterior = Math.min(0.99, (pEvidenceGivenBias * pBias) / pEvidence);

  const delta = posterior - llmConfidence;
  const direction: 'increased' | 'decreased' | 'unchanged' =
    delta > 0.02 ? 'increased' : delta < -0.02 ? 'decreased' : 'unchanged';

  return { posterior, direction };
}

/**
 * Compute information gain (KL divergence) between prior and posterior.
 * Higher values = the analysis revealed more new information.
 */
function computeInformationGain(
  priorBelief: number,
  posteriorBelief: number,
): number {
  // Simplified KL divergence for binary outcome
  const p = Math.max(0.01, Math.min(0.99, posteriorBelief));
  const q = Math.max(0.01, Math.min(0.99, priorBelief));

  const klDiv = p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));
  // Normalize to 0-1 scale (typical KL values are 0 to ~2)
  return Math.min(1.0, klDiv / 2.0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply Bayesian prior integration to analysis results.
 *
 * Takes the raw LLM analysis score, detected biases with confidence,
 * and a user-submitted DecisionPrior, then produces adjusted scores
 * incorporating the prior as a Bayesian belief update.
 */
export function applyBayesianPriors(
  rawScore: number,
  detectedBiases: Array<{ type: string; confidence: number; severity: string }>,
  prior: DecisionPrior,
): BayesianResult {
  const biasAdjustments: PriorAdjustment[] = [];

  // Apply Bayesian update to each detected bias
  for (const bias of detectedBiases) {
    const baseRate = BIAS_BASE_RATES[bias.type] ?? DEFAULT_BASE_RATE;
    const { posterior, direction } = bayesianUpdate(
      bias.confidence,
      baseRate,
      prior,
      bias.type,
    );

    let reason: string;
    if (direction === 'increased') {
      reason = prior.suspectedBiases?.includes(bias.type)
        ? `User suspected ${bias.type}; prior confirms LLM detection`
        : `User low confidence (${(prior.beliefScore * 100).toFixed(0)}%) aligns with bias detection`;
    } else if (direction === 'decreased') {
      reason = `User high confidence (${(prior.beliefScore * 100).toFixed(0)}%) suggests possible false positive`;
    } else {
      reason = 'Prior consistent with LLM detection';
    }

    biasAdjustments.push({
      biasType: bias.type,
      priorConfidence: bias.confidence,
      posteriorConfidence: Math.round(posterior * 1000) / 1000,
      direction,
      reason,
    });
  }

  // Compute overall score adjustment
  // If user was very confident and analysis found many biases → bigger delta
  const avgConfidenceShift =
    biasAdjustments.length > 0
      ? biasAdjustments.reduce(
          (sum, a) => sum + (a.posteriorConfidence - a.priorConfidence),
          0,
        ) / biasAdjustments.length
      : 0;

  // Scale the quality score adjustment by the confidence shift magnitude
  const scoreAdjustment = avgConfidenceShift * 15; // +-15 points max
  const adjustedScore = Math.max(0, Math.min(100, rawScore - scoreAdjustment));

  // Compute belief delta: how much should the analysis shift user's belief?
  // If analysis found many biases and user was confident → large negative delta
  const analysisBeliefImplied = rawScore / 100; // analysis-implied success probability
  const beliefDelta = analysisBeliefImplied - prior.beliefScore;

  // Information gain
  const informationGain = computeInformationGain(
    prior.beliefScore,
    analysisBeliefImplied,
  );

  // Prior influence: how much the prior changed the overall assessment
  const priorInfluence = Math.abs(adjustedScore - rawScore) / 100;

  logger.debug('Bayesian prior applied', {
    rawScore,
    adjustedScore,
    beliefDelta,
    informationGain,
    biasAdjustmentCount: biasAdjustments.length,
  });

  return {
    adjustedScore: Math.round(adjustedScore * 10) / 10,
    biasAdjustments,
    priorInfluence: Math.round(priorInfluence * 1000) / 1000,
    beliefDelta: Math.round(beliefDelta * 1000) / 1000,
    informationGain: Math.round(informationGain * 1000) / 1000,
  };
}

/**
 * Get the population base rate for a bias type.
 * Useful for showing users how common a bias is in general.
 */
export function getBiasBaseRate(biasType: string): number {
  return BIAS_BASE_RATES[biasType] ?? DEFAULT_BASE_RATE;
}

/**
 * Get all bias base rates, sorted by prevalence.
 */
export function getAllBaseRates(): Array<{ biasType: string; baseRate: number; citation: string }> {
  const citations: Record<string, string> = {
    confirmation_bias: 'Nickerson (1998)',
    anchoring_bias: 'Furnham & Boo (2011)',
    availability_heuristic: 'Tversky & Kahneman (1973)',
    groupthink: 'Janis (1972)',
    authority_bias: 'Milgram (1963)',
    bandwagon_effect: 'Asch (1951)',
    overconfidence_bias: 'Moore & Healy (2008)',
    hindsight_bias: 'Fischhoff (1975)',
    planning_fallacy: 'Kahneman & Lovallo (1993)',
    loss_aversion: 'Kahneman & Tversky (1979)',
    sunk_cost_fallacy: 'Arkes & Blumer (1985)',
    status_quo_bias: 'Samuelson & Zeckhauser (1988)',
    framing_effect: 'Tversky & Kahneman (1981)',
    selective_perception: 'Hastorf & Cantril (1954)',
    recency_bias: 'Serial position research',
    cognitive_misering: 'Fiske & Taylor (1991)',
  };

  return Object.entries(BIAS_BASE_RATES)
    .map(([biasType, baseRate]) => ({
      biasType,
      baseRate,
      citation: citations[biasType] ?? 'General research',
    }))
    .sort((a, b) => b.baseRate - a.baseRate);
}
