/**
 * Noise Decomposition (Kahneman Framework)
 *
 * Decomposes decision noise into its constituent components as defined
 * in Kahneman, Sibony & Sunstein's "Noise" (2021):
 *
 * Total Noise = Level Noise + Pattern Noise + Occasion Noise
 *
 * - Level Noise: Different judges give systematically different average scores
 * - Pattern Noise: Different judges rank items differently (interaction effects)
 * - Occasion Noise: Same judge gives different scores at different times
 *
 * When using multi-model jury (Gemini, Claude, GPT-4), we can also
 * measure cross-model disagreement which is far more meaningful than
 * within-model temperature variance.
 */

// Deterministic decomposition — no runtime logging needed

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JudgeAssessment {
  /** Judge identifier (model name or "judge_1", "judge_2", etc.) */
  judgeId: string;
  /** Model provider if multi-model */
  provider?: 'gemini' | 'claude' | 'openai' | 'same';
  /** Overall quality score (0-100) */
  qualityScore: number;
  /** Detected biases with severity and confidence */
  detectedBiases: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>;
  /** Optional: any additional dimension scores */
  dimensionScores?: Record<string, number>;
}

export interface DisagreementDetail {
  type: 'factual' | 'severity' | 'classification' | 'detection';
  description: string;
  judges: string[];
  magnitude: number; // 0-1
}

export interface NoiseDecomposition {
  /** Total noise (MSE-based, 0-100 scale) */
  totalNoise: number;
  /** Level noise: systematic differences in judge severity */
  levelNoise: number;
  /** Pattern noise: different ranking/classification of biases */
  patternNoise: number;
  /** Occasion noise: within-judge variance (only measurable with repeated runs) */
  occasionNoise: number | null;
  /** Noise classification */
  classification: 'low' | 'moderate' | 'high' | 'critical';
  /** Whether this used multi-model jury (more meaningful) */
  isMultiModel: boolean;
  /** Specific disagreements between judges */
  disagreements: DisagreementDetail[];
  /** Per-judge statistics */
  judgeStats: Array<{
    judgeId: string;
    meanScore: number;
    biasCount: number;
    deviationFromConsensus: number;
  }>;
  /** Reliability coefficient (0-1, higher = more agreement) */
  reliability: number;
  /** Human-readable summary */
  summary: string;
}

// ---------------------------------------------------------------------------
// Noise severity thresholds
// ---------------------------------------------------------------------------

const NOISE_THRESHOLDS = {
  low: 8,       // stdDev < 8
  moderate: 15, // stdDev < 15
  high: 25,     // stdDev < 25
  // >= 25 is critical
};

// ---------------------------------------------------------------------------
// Core decomposition
// ---------------------------------------------------------------------------

/**
 * Decompose total noise into level noise and pattern noise.
 *
 * Uses the ANOVA decomposition from Kahneman et al. (2021):
 *
 * MSE_total = MSE_level + MSE_pattern
 *
 * Where:
 * - MSE_level = variance of judge means (systematic severity differences)
 * - MSE_pattern = residual variance after removing level noise
 */
function decomposeNoise(
  assessments: JudgeAssessment[],
): { levelNoise: number; patternNoise: number; totalNoise: number } {
  if (assessments.length < 2) {
    return { levelNoise: 0, patternNoise: 0, totalNoise: 0 };
  }

  const scores = assessments.map((a) => a.qualityScore);
  const grandMean = scores.reduce((s, v) => s + v, 0) / scores.length;

  // Level noise: variance of judge means from grand mean
  // (In a single-document case, each judge's "mean" is just their score)
  const levelVariance =
    scores.reduce((sum, s) => sum + Math.pow(s - grandMean, 2), 0) / scores.length;

  // Total variance
  // For single document, total = level + pattern (level captures most variance)

  // Pattern noise: disagreement in WHICH biases were detected
  // Compute Jaccard distance between bias sets
  const biasSets = assessments.map(
    (a) => new Set(a.detectedBiases.map((b) => b.type)),
  );
  let patternDisagreement = 0;
  let pairCount = 0;
  for (let i = 0; i < biasSets.length; i++) {
    for (let j = i + 1; j < biasSets.length; j++) {
      const union = new Set([...biasSets[i], ...biasSets[j]]);
      const intersection = new Set(
        [...biasSets[i]].filter((b) => biasSets[j].has(b)),
      );
      const jaccard = union.size > 0 ? 1 - intersection.size / union.size : 0;
      patternDisagreement += jaccard;
      pairCount++;
    }
  }
  const avgPatternDisagreement = pairCount > 0 ? patternDisagreement / pairCount : 0;

  // Scale pattern noise to same 0-100 range as level noise
  const patternNoise = avgPatternDisagreement * 30; // Jaccard 0-1 → 0-30 range

  // Total noise combines level (score disagreement) and pattern (classification disagreement)
  const totalNoise = Math.sqrt(levelVariance) + patternNoise * 0.5;

  return {
    levelNoise: Math.round(Math.sqrt(levelVariance) * 100) / 100,
    patternNoise: Math.round(patternNoise * 100) / 100,
    totalNoise: Math.round(totalNoise * 100) / 100,
  };
}

/**
 * Classify specific disagreements between judges.
 */
function classifyDisagreements(
  assessments: JudgeAssessment[],
): DisagreementDetail[] {
  const disagreements: DisagreementDetail[] = [];

  // Detection disagreements: bias found by some judges but not others
  const allBiasTypes = new Set<string>();
  for (const a of assessments) {
    for (const b of a.detectedBiases) allBiasTypes.add(b.type);
  }

  for (const biasType of allBiasTypes) {
    const detectingJudges: string[] = [];
    const missingJudges: string[] = [];
    for (const a of assessments) {
      if (a.detectedBiases.some((b) => b.type === biasType)) {
        detectingJudges.push(a.judgeId);
      } else {
        missingJudges.push(a.judgeId);
      }
    }
    if (missingJudges.length > 0 && detectingJudges.length > 0) {
      disagreements.push({
        type: 'detection',
        description: `${biasType}: detected by ${detectingJudges.join(', ')} but not by ${missingJudges.join(', ')}`,
        judges: [...detectingJudges, ...missingJudges],
        magnitude: missingJudges.length / assessments.length,
      });
    }
  }

  // Severity disagreements: same bias, different severity
  for (const biasType of allBiasTypes) {
    const severities: Array<{ judge: string; severity: string }> = [];
    for (const a of assessments) {
      const bias = a.detectedBiases.find((b) => b.type === biasType);
      if (bias) {
        severities.push({ judge: a.judgeId, severity: bias.severity });
      }
    }
    if (severities.length >= 2) {
      const uniqueSeverities = new Set(severities.map((s) => s.severity));
      if (uniqueSeverities.size > 1) {
        const sevOrder = ['low', 'medium', 'high', 'critical'];
        const indices = severities.map((s) => sevOrder.indexOf(s.severity));
        const maxGap = Math.max(...indices) - Math.min(...indices);
        disagreements.push({
          type: 'severity',
          description: `${biasType}: severity disagreement (${severities.map((s) => `${s.judge}=${s.severity}`).join(', ')})`,
          judges: severities.map((s) => s.judge),
          magnitude: maxGap / 3, // 0-1 based on severity gap
        });
      }
    }
  }

  // Factual disagreement: large score differences (>20 points)
  for (let i = 0; i < assessments.length; i++) {
    for (let j = i + 1; j < assessments.length; j++) {
      const scoreDiff = Math.abs(
        assessments[i].qualityScore - assessments[j].qualityScore,
      );
      if (scoreDiff > 20) {
        disagreements.push({
          type: 'factual',
          description: `Score gap of ${scoreDiff} points between ${assessments[i].judgeId} (${assessments[i].qualityScore}) and ${assessments[j].judgeId} (${assessments[j].qualityScore})`,
          judges: [assessments[i].judgeId, assessments[j].judgeId],
          magnitude: Math.min(1, scoreDiff / 50),
        });
      }
    }
  }

  return disagreements.sort((a, b) => b.magnitude - a.magnitude);
}

/**
 * Compute inter-rater reliability (Krippendorff's alpha approximation).
 */
function computeReliability(assessments: JudgeAssessment[]): number {
  if (assessments.length < 2) return 1.0;

  const scores = assessments.map((a) => a.qualityScore);
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;

  // Observed disagreement
  let observedDisagreement = 0;
  let pairs = 0;
  for (let i = 0; i < scores.length; i++) {
    for (let j = i + 1; j < scores.length; j++) {
      observedDisagreement += Math.pow(scores[i] - scores[j], 2);
      pairs++;
    }
  }
  const Do = pairs > 0 ? observedDisagreement / pairs : 0;

  // Expected disagreement (if scores were random within the observed range)
  const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
  const De = 2 * variance; // expected variance between random draws

  if (De === 0) return 1.0; // perfect agreement
  const alpha = 1 - Do / De;
  return Math.max(0, Math.min(1, alpha));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Perform full noise decomposition on a set of judge assessments.
 *
 * For most meaningful results, use assessments from different model
 * providers (multi-model jury). Within-model variance mostly captures
 * LLM sampling noise, not genuine analytical disagreement.
 */
export function decomposeDecisionNoise(
  assessments: JudgeAssessment[],
): NoiseDecomposition {
  if (assessments.length < 2) {
    return {
      totalNoise: 0,
      levelNoise: 0,
      patternNoise: 0,
      occasionNoise: null,
      classification: 'low',
      isMultiModel: false,
      disagreements: [],
      judgeStats: assessments.map((a) => ({
        judgeId: a.judgeId,
        meanScore: a.qualityScore,
        biasCount: a.detectedBiases.length,
        deviationFromConsensus: 0,
      })),
      reliability: 1.0,
      summary: 'Insufficient judges for noise analysis (minimum 2 required).',
    };
  }

  // Check if multi-model
  const providers = new Set(assessments.map((a) => a.provider ?? 'same'));
  const isMultiModel = providers.size > 1;

  // Decompose noise
  const { levelNoise, patternNoise, totalNoise } = decomposeNoise(assessments);

  // Classify disagreements
  const disagreements = classifyDisagreements(assessments);

  // Compute reliability
  const reliability = computeReliability(assessments);

  // Per-judge stats
  const grandMean =
    assessments.reduce((s, a) => s + a.qualityScore, 0) / assessments.length;
  const judgeStats = assessments.map((a) => ({
    judgeId: a.judgeId,
    meanScore: a.qualityScore,
    biasCount: a.detectedBiases.length,
    deviationFromConsensus:
      Math.round(Math.abs(a.qualityScore - grandMean) * 10) / 10,
  }));

  // Classification
  let classification: 'low' | 'moderate' | 'high' | 'critical';
  if (totalNoise < NOISE_THRESHOLDS.low) classification = 'low';
  else if (totalNoise < NOISE_THRESHOLDS.moderate) classification = 'moderate';
  else if (totalNoise < NOISE_THRESHOLDS.high) classification = 'high';
  else classification = 'critical';

  // Summary
  const summaryParts: string[] = [];
  summaryParts.push(
    `${classification.charAt(0).toUpperCase() + classification.slice(1)} noise detected (${totalNoise.toFixed(1)} total).`,
  );
  if (isMultiModel) {
    summaryParts.push(
      `Multi-model jury (${[...providers].join(', ')}) provides high-confidence noise measurement.`,
    );
  } else {
    summaryParts.push(
      'Single-model jury — noise reflects sampling variance, not genuine analytical disagreement.',
    );
  }
  if (levelNoise > patternNoise) {
    summaryParts.push(
      `Level noise dominates (${levelNoise.toFixed(1)}): judges disagree on overall severity.`,
    );
  } else if (patternNoise > levelNoise) {
    summaryParts.push(
      `Pattern noise dominates (${patternNoise.toFixed(1)}): judges disagree on which biases are present.`,
    );
  }
  if (disagreements.length > 0) {
    const topDisagreement = disagreements[0];
    summaryParts.push(
      `Key disagreement: ${topDisagreement.description}.`,
    );
  }

  return {
    totalNoise: Math.round(totalNoise * 100) / 100,
    levelNoise: Math.round(levelNoise * 100) / 100,
    patternNoise: Math.round(patternNoise * 100) / 100,
    occasionNoise: null, // requires repeated runs to measure
    classification,
    isMultiModel,
    disagreements,
    judgeStats,
    reliability: Math.round(reliability * 1000) / 1000,
    summary: summaryParts.join(' '),
  };
}

/**
 * Compare noise levels between multi-model and single-model assessments.
 * Returns insight about whether LLM sampling noise is masking real signal.
 */
export function compareNoiseRegimes(
  singleModelNoise: NoiseDecomposition,
  multiModelNoise: NoiseDecomposition,
): {
  samplingNoiseEstimate: number;
  analyticalNoiseEstimate: number;
  recommendation: string;
} {
  // Multi-model noise includes both real analytical disagreement + model-specific priors
  // Single-model noise is mostly sampling noise
  const samplingNoise = singleModelNoise.totalNoise;
  const analyticalNoise = Math.max(
    0,
    multiModelNoise.totalNoise - samplingNoise * 0.5,
  );

  let recommendation: string;
  if (analyticalNoise > samplingNoise * 2) {
    recommendation =
      'High analytical noise: different models disagree fundamentally. This document contains genuine ambiguity that warrants human review.';
  } else if (analyticalNoise > samplingNoise) {
    recommendation =
      'Moderate analytical noise: some genuine disagreement between models. Consider the specific disagreement points for manual review.';
  } else {
    recommendation =
      'Low analytical noise: models largely agree. Observed noise is primarily sampling variance.';
  }

  return {
    samplingNoiseEstimate: Math.round(samplingNoise * 100) / 100,
    analyticalNoiseEstimate: Math.round(analyticalNoise * 100) / 100,
    recommendation,
  };
}
