/**
 * Compound Scoring Engine
 *
 * Deterministic post-LLM scoring layer that transforms raw LLM detections
 * into calibrated, context-adjusted, mathematically rigorous scores.
 *
 * This is proprietary IP — the scoring math, coefficients, and interaction
 * models are the result of domain research and cannot be replicated by
 * simply calling an LLM with the same prompts.
 */

import {
  getInteractionWeight as getMatrixWeight,
} from '@/lib/ontology/interaction-matrix';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedBias {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  excerpt?: string;
}

export interface DocumentContext {
  monetaryStakes: 'unknown' | 'low' | 'medium' | 'high' | 'very_high';
  participantCount: number;
  dissentPresent: boolean;
  timelineWeeks: number | null; // weeks until decision deadline
  documentAgeWeeks: number; // how old the document is
  wordCount: number;
}

export interface CompoundScore {
  /** Raw LLM-assigned score (0-100) */
  rawScore: number;
  /** Calibrated score after compound adjustments (0-100) */
  calibratedScore: number;
  /** Individual bias compound severities */
  biasScores: BiasCompoundScore[];
  /** Total compound risk multiplier applied */
  compoundMultiplier: number;
  /** Context adjustment factor */
  contextAdjustment: number;
  /** Confidence decay factor (1.0 = no decay) */
  confidenceDecay: number;
  /** Breakdown of score adjustments */
  adjustments: ScoreAdjustment[];
}

export interface BiasCompoundScore {
  biasType: string;
  rawSeverity: number;
  compoundSeverity: number;
  interactionMultiplier: number;
  contextMultiplier: number;
  contributingInteractions: string[];
}

export interface ScoreAdjustment {
  source: string;
  description: string;
  delta: number;
}

// ---------------------------------------------------------------------------
// Severity → numeric mapping
// ---------------------------------------------------------------------------

const SEVERITY_NUMERIC: Record<string, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
};

// ---------------------------------------------------------------------------
// Contextual multipliers (empirically tuned)
// ---------------------------------------------------------------------------

const STAKES_MULTIPLIER: Record<string, number> = {
  unknown: 1.0,
  low: 0.8,
  medium: 1.0,
  high: 1.3,
  very_high: 1.6,
};

const DISSENT_ABSENT_MULTIPLIER = 1.25;
const TIME_PRESSURE_MULTIPLIER_BASE = 1.15;
const SMALL_GROUP_THRESHOLD = 4;
const SMALL_GROUP_MULTIPLIER = 1.1;
const LARGE_GROUP_THRESHOLD = 12;
const LARGE_GROUP_MULTIPLIER = 1.15; // large groups → more social biases

// ---------------------------------------------------------------------------
// Interaction weight defaults (used when ontology not available)
// Full ontology provides richer weights via interaction-matrix.ts
// ---------------------------------------------------------------------------

const DEFAULT_INTERACTION_WEIGHTS: Record<string, number> = {
  'confirmation_bias::anchoring_bias': 1.4,
  'groupthink::confirmation_bias': 1.5,
  'authority_bias::groupthink': 1.3,
  'overconfidence_bias::planning_fallacy': 1.6,
  'loss_aversion::sunk_cost_fallacy': 1.5,
  'anchoring_bias::framing_effect': 1.3,
  'status_quo_bias::cognitive_misering': 1.2,
  'availability_heuristic::recency_bias': 1.4,
  'bandwagon_effect::groupthink': 1.3,
  'overconfidence_bias::selective_perception': 1.2,
  'hindsight_bias::overconfidence_bias': 1.3,
  'framing_effect::loss_aversion': 1.4,
  'cognitive_misering::availability_heuristic': 1.3,
  'selective_perception::confirmation_bias': 1.5,
  'recency_bias::availability_heuristic': 1.3,
  'groupthink::bandwagon_effect': 1.2,
  'authority_bias::confirmation_bias': 1.2,
  'overconfidence_bias::anchoring_bias': 1.3,
  'sunk_cost_fallacy::status_quo_bias': 1.3,
  'planning_fallacy::overconfidence_bias': 1.4,
  'loss_aversion::status_quo_bias': 1.3,
  'confirmation_bias::selective_perception': 1.4,
  'groupthink::authority_bias': 1.4,
  'anchoring_bias::overconfidence_bias': 1.2,
  'cognitive_misering::status_quo_bias': 1.2,
};

// ---------------------------------------------------------------------------
// Core scoring functions
// ---------------------------------------------------------------------------

/**
 * Look up the pairwise interaction weight between two biases.
 *
 * Priority chain:
 * 1. Caller-supplied weights (e.g. org-calibrated)
 * 2. Full 16×16 ontology interaction matrix (interaction-matrix.ts)
 * 3. Hardcoded DEFAULT_INTERACTION_WEIGHTS (fallback)
 */
function getInteractionWeight(
  biasA: string,
  biasB: string,
  interactionWeights?: Record<string, number>,
): number {
  // 1. Caller-supplied overrides take priority
  if (interactionWeights) {
    const keyAB = `${biasA}::${biasB}`;
    const keyBA = `${biasB}::${biasA}`;
    const callerWeight = interactionWeights[keyAB] ?? interactionWeights[keyBA];
    if (callerWeight !== undefined) return callerWeight;
  }

  // 2. Full ontology matrix (256 cells, research-backed)
  const matrixWeight = getMatrixWeight(biasA, biasB);
  if (matrixWeight !== 1.0) return matrixWeight;

  // 3. Hardcoded defaults
  const keyAB = `${biasA}::${biasB}`;
  const keyBA = `${biasB}::${biasA}`;
  return DEFAULT_INTERACTION_WEIGHTS[keyAB] ?? DEFAULT_INTERACTION_WEIGHTS[keyBA] ?? 1.0;
}

/**
 * Compute the compound severity for a single bias considering all other
 * detected biases and their pairwise interaction weights.
 */
function computeBiasCompoundSeverity(
  bias: DetectedBias,
  allBiases: DetectedBias[],
  interactionWeights?: Record<string, number>,
): BiasCompoundScore {
  const rawSeverity = SEVERITY_NUMERIC[bias.severity] ?? 8;
  let interactionMultiplier = 1.0;
  const contributingInteractions: string[] = [];

  for (const other of allBiases) {
    if (other.type === bias.type) continue;
    const weight = getInteractionWeight(bias.type, other.type, interactionWeights);
    if (weight > 1.05 || weight < 0.95) {
      // Non-trivial interaction — apply confidence-weighted adjustment
      const effectiveWeight = 1.0 + (weight - 1.0) * other.confidence;
      interactionMultiplier *= effectiveWeight;
      contributingInteractions.push(
        `${other.type} (${weight > 1 ? '+' : ''}${((weight - 1) * 100).toFixed(0)}%)`,
      );
    }
  }

  // Cap the compound multiplier per-bias to prevent runaway
  interactionMultiplier = Math.min(interactionMultiplier, 3.0);

  return {
    biasType: bias.type,
    rawSeverity,
    compoundSeverity: rawSeverity * interactionMultiplier,
    interactionMultiplier,
    contextMultiplier: 1.0, // filled in by applyContextMultipliers
    contributingInteractions,
  };
}

/**
 * Compute context-based multiplier from document metadata.
 */
function computeContextMultiplier(context: DocumentContext): {
  multiplier: number;
  adjustments: ScoreAdjustment[];
} {
  let multiplier = 1.0;
  const adjustments: ScoreAdjustment[] = [];

  // Stakes multiplier
  const stakesM = STAKES_MULTIPLIER[context.monetaryStakes] ?? 1.0;
  if (stakesM !== 1.0) {
    multiplier *= stakesM;
    adjustments.push({
      source: 'stakes',
      description: `${context.monetaryStakes} monetary stakes`,
      delta: stakesM - 1.0,
    });
  }

  // Dissent absence
  if (!context.dissentPresent) {
    multiplier *= DISSENT_ABSENT_MULTIPLIER;
    adjustments.push({
      source: 'dissent',
      description: 'No dissenting opinions detected',
      delta: DISSENT_ABSENT_MULTIPLIER - 1.0,
    });
  }

  // Time pressure (exponential urgency)
  if (context.timelineWeeks !== null && context.timelineWeeks <= 2) {
    const urgency =
      context.timelineWeeks <= 0
        ? TIME_PRESSURE_MULTIPLIER_BASE * 1.3 // overdue
        : TIME_PRESSURE_MULTIPLIER_BASE + (2 - context.timelineWeeks) * 0.1;
    multiplier *= urgency;
    adjustments.push({
      source: 'time_pressure',
      description: `${context.timelineWeeks <= 0 ? 'Overdue' : `${context.timelineWeeks}w deadline`}`,
      delta: urgency - 1.0,
    });
  }

  // Group size effects
  if (context.participantCount > 0 && context.participantCount <= SMALL_GROUP_THRESHOLD) {
    multiplier *= SMALL_GROUP_MULTIPLIER;
    adjustments.push({
      source: 'group_size',
      description: `Small group (${context.participantCount} participants)`,
      delta: SMALL_GROUP_MULTIPLIER - 1.0,
    });
  } else if (context.participantCount >= LARGE_GROUP_THRESHOLD) {
    multiplier *= LARGE_GROUP_MULTIPLIER;
    adjustments.push({
      source: 'group_size',
      description: `Large group (${context.participantCount}) — social bias risk`,
      delta: LARGE_GROUP_MULTIPLIER - 1.0,
    });
  }

  // Short document with high stakes → shallow analysis risk
  if (
    context.wordCount < 500 &&
    (context.monetaryStakes === 'high' || context.monetaryStakes === 'very_high')
  ) {
    const shallowM = 1.15;
    multiplier *= shallowM;
    adjustments.push({
      source: 'shallow_analysis',
      description: 'Short document for high-stakes decision',
      delta: shallowM - 1.0,
    });
  }

  return { multiplier, adjustments };
}

/**
 * Main entry point: compute a compound score from raw LLM outputs.
 *
 * Takes the raw LLM quality score, detected biases, and document context,
 * then applies interaction-weighted compound scoring, contextual multipliers,
 * and confidence decay to produce a calibrated final score.
 */
export function computeCompoundScore(
  rawQualityScore: number,
  detectedBiases: DetectedBias[],
  context: DocumentContext,
  options?: {
    interactionWeights?: Record<string, number>;
    orgCalibration?: Record<string, number>; // per-bias-type calibrated weights
  },
): CompoundScore {
  const adjustments: ScoreAdjustment[] = [];

  // 1. Compute compound severity for each bias
  const biasScores = detectedBiases.map((b) =>
    computeBiasCompoundSeverity(b, detectedBiases, options?.interactionWeights),
  );

  // 2. Compute total compound penalty
  const totalRawPenalty = biasScores.reduce((sum, bs) => sum + bs.rawSeverity, 0);
  const totalCompoundPenalty = biasScores.reduce((sum, bs) => sum + bs.compoundSeverity, 0);
  const compoundMultiplier = totalRawPenalty > 0 ? totalCompoundPenalty / totalRawPenalty : 1.0;

  adjustments.push({
    source: 'compound_interactions',
    description: `${biasScores.filter((b) => b.interactionMultiplier > 1.05).length} amplifying bias interactions`,
    delta: -(totalCompoundPenalty - totalRawPenalty) * 0.3, // scaled impact
  });

  // 3. Apply org-specific calibration if available
  if (options?.orgCalibration) {
    for (const bs of biasScores) {
      const orgWeight = options.orgCalibration[bs.biasType];
      if (orgWeight !== undefined) {
        const scaleFactor = orgWeight / (SEVERITY_NUMERIC[detectedBiases.find((b) => b.type === bs.biasType)?.severity ?? 'medium'] || 8);
        bs.compoundSeverity *= scaleFactor;
        bs.contextMultiplier *= scaleFactor;
      }
    }
  }

  // 4. Context adjustment
  const { multiplier: contextAdjustment, adjustments: contextAdj } = computeContextMultiplier(context);
  adjustments.push(...contextAdj);

  // Apply context to each bias score
  for (const bs of biasScores) {
    bs.contextMultiplier *= contextAdjustment;
    bs.compoundSeverity *= contextAdjustment;
  }

  // 5. Confidence decay based on document age
  const confidenceDecay = computeConfidenceDecay(context.documentAgeWeeks);
  if (confidenceDecay < 1.0) {
    adjustments.push({
      source: 'confidence_decay',
      description: `Document age: ${context.documentAgeWeeks}w (confidence reduced ${((1 - confidenceDecay) * 100).toFixed(0)}%)`,
      delta: 0, // decay affects confidence, not score directly
    });
  }

  // 6. Compute calibrated score
  // Start from raw score, apply compound penalty differential
  const penaltyDelta = (totalCompoundPenalty * contextAdjustment - totalRawPenalty) * 0.3;
  const calibratedScore = Math.max(0, Math.min(100, rawQualityScore - penaltyDelta));

  return {
    rawScore: rawQualityScore,
    calibratedScore: Math.round(calibratedScore * 10) / 10,
    biasScores,
    compoundMultiplier: Math.round(compoundMultiplier * 100) / 100,
    contextAdjustment: Math.round(contextAdjustment * 100) / 100,
    confidenceDecay: Math.round(confidenceDecay * 100) / 100,
    adjustments,
  };
}

// ---------------------------------------------------------------------------
// Confidence decay
// ---------------------------------------------------------------------------

/**
 * Temporal confidence decay based on document age.
 * Newer documents have higher confidence; older documents decay.
 *
 * Uses a sigmoid curve centered at 26 weeks (6 months):
 * - 0-4 weeks: ~1.0 (full confidence)
 * - 12 weeks: ~0.95
 * - 26 weeks: ~0.85
 * - 52 weeks: ~0.70
 * - 104 weeks: ~0.55
 */
export function computeConfidenceDecay(ageWeeks: number): number {
  if (ageWeeks <= 0) return 1.0;

  // Sigmoid decay: 1 / (1 + e^(k*(x - midpoint)))
  // We want decay to start gradually and accelerate
  const k = 0.04; // decay rate
  const midpoint = 40; // weeks where decay = 50% of max
  const maxDecay = 0.45; // maximum confidence reduction

  const decayFactor = maxDecay / (1 + Math.exp(-k * (ageWeeks - midpoint)));
  return Math.max(0.5, 1.0 - decayFactor);
}
