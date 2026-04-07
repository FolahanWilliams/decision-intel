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

import { getInteractionWeight as getMatrixWeight } from '@/lib/ontology/interaction-matrix';
import { BIAS_NODES } from '@/lib/ontology/bias-graph';
import { computeCorrelationMultiplier } from '@/lib/data/case-correlations';

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
  /** Optional raw document content for biological/physiological signal detection */
  rawContent?: string;
  /** Whether dissent was actively encouraged in the process */
  dissentEncouraged?: boolean;
  /** Whether external advisors were involved */
  externalAdvisors?: boolean;
  /** Whether an iterative decision process was used */
  iterativeProcess?: boolean;
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

/** Absence of dissent amplifies groupthink-related biases (Janis 1972, Surowiecki 2005) */
const DISSENT_ABSENT_MULTIPLIER = 1.25;
/** Time pressure impairs System 2 deliberation, shifting to heuristic processing (Kahneman 2011) */
const TIME_PRESSURE_MULTIPLIER_BASE = 1.15;
/** Groups <4 lack cognitive diversity per Hackman's research on team effectiveness */
const SMALL_GROUP_THRESHOLD = 4;
const SMALL_GROUP_MULTIPLIER = 1.1;
/** Groups >12 trigger social loafing and diffusion of responsibility (Latané et al. 1979) */
const LARGE_GROUP_THRESHOLD = 12;
const LARGE_GROUP_MULTIPLIER = 1.15;

// ---------------------------------------------------------------------------
// Biological / physiological signal detection
// ---------------------------------------------------------------------------

// Winner Effect: success-streak language → testosterone/dopamine loop amplifies
// risk appetite and overconfidence-family biases
const WINNER_EFFECT_PATTERNS = [
  /record\s+(profits?|revenue|quarter|year|growth|highs?)/i,
  /outperform(ed|ing|s)?\b/i,
  /consecutive\s+(wins?|successe?s?|quarters?)/i,
  /best\s+(quarter|year|period|results?|performance)\s+(ever|in\s+history|on\s+record)/i,
  /exceed(ed|ing|s)?\s+(all\s+)?(targets?|expectations?|forecasts?|estimates?)/i,
  /\b(momentum|winning\s+streak|unstoppable|on\s+a\s+roll)\b/i,
  /\b(unbeatable|market\s+leader|dominant\s+position|ahead\s+of\s+the\s+pack)\b/i,
  /\b(triple-?digit|double-?digit)\s+growth\b/i,
  /all[- ]time\s+high/i,
];

// Cortisol/Stress: crisis language → impairs prefrontal cortex, amplifies
// System 1 biases (anchoring, availability, framing, loss aversion)
const STRESS_SIGNAL_PATTERNS = [
  /\b(volatile|volatility|turbul(ent|ence)|unstable|chaotic)\s*(market|environment|conditions?)?\b/i,
  /\bunprecedented\b/i,
  /\b(emergency|urgent|crisis|catastroph(e|ic)|meltdown)\b/i,
  /\b(must\s+act\s+now|no\s+time\s+to\s+wait|immediate\s+action|time\s+is\s+running\s+out)\b/i,
  /\brunning\s+out\s+of\s+(time|runway|cash|options)\b/i,
  /\b(severe|extreme|acute)\s+(pressure|stress|risk|downturn|decline)\b/i,
  /\b(existential\s+threat|survival\s+mode|do\s+or\s+die|now\s+or\s+never)\b/i,
  /\b(hemorrhaging|bleeding)\s+(cash|money|revenue|customers)\b/i,
  /\b(free[- ]?fall|death\s+spiral|collapse|implod(e|ing))\b/i,
];

// Biases amplified by Winner Effect (overconfidence family)
const WINNER_EFFECT_BIASES = new Set([
  'overconfidence_bias',
  'planning_fallacy',
  'halo_effect',
  'gamblers_fallacy',
]);

// Biases amplified by Cortisol/Stress (System 1 family)
const STRESS_AMPLIFIED_BIASES = new Set([
  'anchoring_bias',
  'availability_heuristic',
  'framing_effect',
  'loss_aversion',
  'cognitive_misering',
  'recency_bias',
  'selective_perception',
]);

/** Winner Effect: success streaks elevate testosterone/dopamine, amplifying risk-taking (Robertson 2012) */
const WINNER_EFFECT_MULTIPLIER = 1.2;
/** Cortisol stress response impairs prefrontal cortex analytical processing (Arnsten 2009) */
const STRESS_SIGNAL_MULTIPLIER = 1.18;

/**
 * Detect Winner Effect signals in document content.
 * Success-streak language indicates testosterone/dopamine loop that amplifies
 * risk appetite and overconfidence-family biases.
 */
export function detectWinnerEffect(content: string): {
  detected: boolean;
  matchCount: number;
  matches: string[];
  signalDensity: number;
} {
  if (!content) return { detected: false, matchCount: 0, matches: [], signalDensity: 0 };
  const matches: string[] = [];
  for (const pattern of WINNER_EFFECT_PATTERNS) {
    const match = content.match(pattern);
    if (match) matches.push(match[0]);
  }
  // Signal density: matches relative to document length (sentences approximated by periods)
  const sentenceCount = Math.max((content.match(/[.!?]+/g) || []).length, 1);
  const signalDensity = matches.length / sentenceCount;
  // Require 3+ pattern matches AND density > 0.05 to reduce false positives from
  // factual reporting (e.g., "record profits in Q3" in an earnings summary)
  return {
    detected: matches.length >= 3 && signalDensity > 0.05,
    matchCount: matches.length,
    matches,
    signalDensity,
  };
}

/**
 * Detect cortisol/stress signals in document content.
 * Crisis language indicates impaired prefrontal cortex processing that
 * amplifies System 1 biases.
 */
export function detectStressSignals(content: string): {
  detected: boolean;
  matchCount: number;
  matches: string[];
  signalDensity: number;
} {
  if (!content) return { detected: false, matchCount: 0, matches: [], signalDensity: 0 };
  const matches: string[] = [];
  for (const pattern of STRESS_SIGNAL_PATTERNS) {
    const match = content.match(pattern);
    if (match) matches.push(match[0]);
  }
  // Signal density: matches relative to document length
  const sentenceCount = Math.max((content.match(/[.!?]+/g) || []).length, 1);
  const signalDensity = matches.length / sentenceCount;
  // Require 3+ pattern matches AND density > 0.05 to exclude risk-acknowledging
  // language (e.g., "volatile market conditions require caution" is prudent)
  return {
    detected: matches.length >= 3 && signalDensity > 0.05,
    matchCount: matches.length,
    matches,
    signalDensity,
  };
}

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
  'halo_effect::confirmation_bias': 1.3,
  'halo_effect::authority_bias': 1.2,
  'halo_effect::selective_perception': 1.3,
  'gamblers_fallacy::overconfidence_bias': 1.3,
  'gamblers_fallacy::sunk_cost_fallacy': 1.2,
  'zeigarnik_effect::planning_fallacy': 1.4,
  'zeigarnik_effect::cognitive_misering': 1.2,
  'paradox_of_choice::status_quo_bias': 1.4,
  'paradox_of_choice::cognitive_misering': 1.3,
  'paradox_of_choice::loss_aversion': 1.3,

  // Suppression interactions — genuinely opposing biases dampen each other
  'loss_aversion::overconfidence_bias': 0.8, // Loss Aversion counteracts Overconfidence
  'status_quo_bias::planning_fallacy': 0.85, // Status Quo resists Planning Fallacy optimism
  'anchoring_bias::recency_bias': 0.9, // Anchoring resists Recency
  'loss_aversion::gamblers_fallacy': 0.85, // Loss Aversion dampens Gambler's risk-taking
};

// ---------------------------------------------------------------------------
// Core scoring functions
// ---------------------------------------------------------------------------

/**
 * Look up the pairwise interaction weight between two biases.
 *
 * Priority chain:
 * 1. Caller-supplied weights (e.g. org-calibrated)
 * 2. Full 20×20 ontology interaction matrix (interaction-matrix.ts)
 * 3. Hardcoded DEFAULT_INTERACTION_WEIGHTS (fallback)
 */
function getInteractionWeight(
  biasA: string,
  biasB: string,
  interactionWeights?: Record<string, number>
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
  biologicalSignals?: { winnerEffect: boolean; stressSignals: boolean }
): BiasCompoundScore {
  let rawSeverity = SEVERITY_NUMERIC[bias.severity] ?? 8;

  // Apply detectability boost from ontology — hard-to-detect biases found
  // at high confidence are more meaningful (3-8% severity adjustment)
  const biasNode = BIAS_NODES.find(n => n.id === bias.type);
  if (biasNode) {
    const detectabilityBoost = 1.0 + (1.0 - biasNode.detectability) * 0.15;
    rawSeverity *= detectabilityBoost;
  }

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
        `${other.type} (${weight > 1 ? '+' : ''}${((weight - 1) * 100).toFixed(0)}%)`
      );
    }
  }

  // Biological signal amplification — targeted per bias family
  if (biologicalSignals?.winnerEffect && WINNER_EFFECT_BIASES.has(bias.type)) {
    interactionMultiplier *= WINNER_EFFECT_MULTIPLIER;
    contributingInteractions.push(
      `Winner Effect (+${((WINNER_EFFECT_MULTIPLIER - 1) * 100).toFixed(0)}%)`
    );
  }
  if (biologicalSignals?.stressSignals && STRESS_AMPLIFIED_BIASES.has(bias.type)) {
    interactionMultiplier *= STRESS_SIGNAL_MULTIPLIER;
    contributingInteractions.push(
      `Stress/Cortisol (+${((STRESS_SIGNAL_MULTIPLIER - 1) * 100).toFixed(0)}%)`
    );
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

  // Biological / physiological signal multipliers
  if (context.rawContent) {
    const winnerResult = detectWinnerEffect(context.rawContent);
    if (winnerResult.detected) {
      multiplier *= WINNER_EFFECT_MULTIPLIER;
      adjustments.push({
        source: 'winner_effect',
        description: `Winner Effect detected (${winnerResult.matchCount} signals: ${winnerResult.matches.slice(0, 3).join(', ')}) — success-streak language amplifies overconfidence`,
        delta: WINNER_EFFECT_MULTIPLIER - 1.0,
      });
    }

    const stressResult = detectStressSignals(context.rawContent);
    if (stressResult.detected) {
      multiplier *= STRESS_SIGNAL_MULTIPLIER;
      adjustments.push({
        source: 'stress_cortisol',
        description: `Stress/cortisol signals detected (${stressResult.matchCount} signals: ${stressResult.matches.slice(0, 3).join(', ')}) — crisis language amplifies System 1 biases`,
        delta: STRESS_SIGNAL_MULTIPLIER - 1.0,
      });
    }
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
  }
): CompoundScore {
  const adjustments: ScoreAdjustment[] = [];

  // 1. Detect biological / physiological signals from content
  const biologicalSignals = context.rawContent
    ? {
        winnerEffect: detectWinnerEffect(context.rawContent).detected,
        stressSignals: detectStressSignals(context.rawContent).detected,
      }
    : undefined;

  // 2. Compute compound severity for each bias
  const biasScores = detectedBiases.map(b =>
    computeBiasCompoundSeverity(b, detectedBiases, options?.interactionWeights, biologicalSignals)
  );

  // 3. Compute total compound penalty
  const totalRawPenalty = biasScores.reduce((sum, bs) => sum + bs.rawSeverity, 0);
  const totalCompoundPenalty = biasScores.reduce((sum, bs) => sum + bs.compoundSeverity, 0);
  const compoundMultiplier = totalRawPenalty > 0 ? totalCompoundPenalty / totalRawPenalty : 1.0;

  adjustments.push({
    source: 'compound_interactions',
    description: `${biasScores.filter(b => b.interactionMultiplier > 1.05).length} amplifying bias interactions`,
    delta: -(totalCompoundPenalty - totalRawPenalty) * 0.3, // scaled impact
  });

  // 4. Apply org-specific calibration if available
  if (options?.orgCalibration) {
    for (const bs of biasScores) {
      const orgWeight = options.orgCalibration[bs.biasType];
      if (orgWeight !== undefined) {
        const scaleFactor =
          orgWeight /
          (SEVERITY_NUMERIC[
            detectedBiases.find(b => b.type === bs.biasType)?.severity ?? 'medium'
          ] || 8);
        bs.compoundSeverity *= scaleFactor;
        bs.contextMultiplier *= scaleFactor;
      }
    }
  }

  // 5. Context adjustment
  const { multiplier: contextAdjustment, adjustments: contextAdj } =
    computeContextMultiplier(context);
  adjustments.push(...contextAdj);

  // Apply context to each bias score
  for (const bs of biasScores) {
    bs.contextMultiplier *= contextAdjustment;
    bs.compoundSeverity *= contextAdjustment;
  }

  // 6. Historical correlation adjustment from failure case database
  const correlationResult = computeCorrelationMultiplier(
    detectedBiases.map(b => b.type),
    {
      monetaryStakes: context.monetaryStakes,
      dissentAbsent: !context.dissentPresent,
      timePressure: context.timelineWeeks !== null && context.timelineWeeks < 4,
      participantCount: context.participantCount,
      dissentEncouraged: context.dissentEncouraged,
      externalAdvisors: context.externalAdvisors,
      iterativeProcess: context.iterativeProcess,
    }
  );

  if (correlationResult.multiplier > 1.0) {
    adjustments.push({
      source: 'historical_correlation',
      description: `${correlationResult.matchedPairs.length} bias pair(s) historically amplify severity (×${correlationResult.multiplier.toFixed(2)})`,
      delta: -(correlationResult.multiplier - 1.0) * 5,
    });
  }

  // 6b. Beneficial pattern damping from success case correlations
  if (correlationResult.beneficialDamping < 1.0) {
    adjustments.push({
      source: 'beneficial_pattern',
      description: `${correlationResult.matchedSuccessPatterns.length} success pattern(s) detected — bias risk reduced (×${correlationResult.beneficialDamping.toFixed(2)})`,
      delta: (1.0 - correlationResult.beneficialDamping) * 5,
    });
  }

  // 7. Confidence decay based on document age
  const confidenceDecay = computeConfidenceDecay(context.documentAgeWeeks);
  if (confidenceDecay < 1.0) {
    adjustments.push({
      source: 'confidence_decay',
      description: `Document age: ${context.documentAgeWeeks}w (confidence reduced ${((1 - confidenceDecay) * 100).toFixed(0)}%)`,
      delta: 0, // decay affects confidence, not score directly
    });
  }

  // 8. Compute calibrated score
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
