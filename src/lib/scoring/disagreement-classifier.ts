/**
 * Disagreement Classifier
 *
 * When multiple models (or multiple runs) produce different results,
 * this module classifies the type of disagreement to provide actionable
 * insight rather than just raw variance numbers.
 *
 * Disagreement types:
 * - Factual: Models found different evidence in the same text
 * - Severity: Models agree on what's present but weight it differently
 * - Classification: Models interpret the same signal as different bias types
 * - Detection: Some models found a bias that others missed entirely
 * - Structural: Models disagree on document structure/interpretation
 */

// Deterministic classification — no runtime logging needed

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModelOutput {
  modelId: string;
  provider: string;
  qualityScore: number;
  biases: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    excerpt?: string;
  }>;
  factChecks?: Array<{
    claim: string;
    verdict: 'verified' | 'contradicted' | 'unverifiable';
  }>;
  sentimentScore?: number;
}

export interface ClassifiedDisagreement {
  id: string;
  type: 'factual' | 'severity' | 'classification' | 'detection' | 'structural';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  modelsInvolved: string[];
  /** Which model is more likely correct (heuristic) */
  likelyCorrect: string | null;
  /** Confidence in the classification (0-1) */
  confidence: number;
  /** Actionable recommendation */
  recommendation: string;
}

export interface DisagreementReport {
  totalDisagreements: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  disagreements: ClassifiedDisagreement[];
  consensusBiases: string[];
  contestedBiases: string[];
  overallAgreementScore: number; // 0-100
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Bias similarity map (for classification disagreements)
// ---------------------------------------------------------------------------

/** Biases that are conceptually close and often confused */
const SIMILAR_BIAS_GROUPS: string[][] = [
  ['confirmation_bias', 'selective_perception'],
  ['anchoring_bias', 'framing_effect'],
  ['groupthink', 'bandwagon_effect'],
  ['loss_aversion', 'sunk_cost_fallacy', 'status_quo_bias'],
  ['availability_heuristic', 'recency_bias'],
  ['overconfidence_bias', 'planning_fallacy'],
  ['authority_bias', 'bandwagon_effect'],
];

function areSimilarBiases(a: string, b: string): boolean {
  return SIMILAR_BIAS_GROUPS.some(group => group.includes(a) && group.includes(b));
}

// ---------------------------------------------------------------------------
// Severity numeric mapping
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// ---------------------------------------------------------------------------
// Core classification
// ---------------------------------------------------------------------------

function classifyBiasDisagreements(outputs: ModelOutput[]): ClassifiedDisagreement[] {
  const disagreements: ClassifiedDisagreement[] = [];
  let idCounter = 0;

  // Collect all biases across all models
  const allBiasTypes = new Set<string>();
  for (const output of outputs) {
    for (const bias of output.biases) {
      allBiasTypes.add(bias.type);
    }
  }

  // For each bias type, check detection agreement
  for (const biasType of allBiasTypes) {
    const detectingModels: string[] = [];
    const missingModels: string[] = [];
    const severities: Map<string, string> = new Map();

    for (const output of outputs) {
      const found = output.biases.find(b => b.type === biasType);
      if (found) {
        detectingModels.push(output.modelId);
        severities.set(output.modelId, found.severity);
      } else {
        missingModels.push(output.modelId);
      }
    }

    // Detection disagreement
    if (missingModels.length > 0 && detectingModels.length > 0) {
      const severity = detectingModels.length > missingModels.length ? 'minor' : 'moderate';

      disagreements.push({
        id: `disagree_${++idCounter}`,
        type: 'detection',
        severity,
        description: `${biasType} detected by ${detectingModels.join(', ')} but not by ${missingModels.join(', ')}.`,
        modelsInvolved: [...detectingModels, ...missingModels],
        likelyCorrect: detectingModels.length > missingModels.length ? detectingModels[0] : null,
        confidence: detectingModels.length / outputs.length,
        recommendation:
          detectingModels.length >= 2
            ? `Likely a real ${biasType} — majority of models detected it.`
            : `Possible false positive for ${biasType} — only one model detected it. Manual review recommended.`,
      });
    }

    // Severity disagreement (among models that detected the bias)
    if (detectingModels.length >= 2) {
      const uniqueSeverities = new Set(severities.values());
      if (uniqueSeverities.size > 1) {
        const sevValues = [...severities.entries()].map(([model, sev]) => ({
          model,
          severity: sev,
          numeric: SEVERITY_ORDER[sev] ?? 2,
        }));
        const maxGap =
          Math.max(...sevValues.map(s => s.numeric)) - Math.min(...sevValues.map(s => s.numeric));

        disagreements.push({
          id: `disagree_${++idCounter}`,
          type: 'severity',
          severity: maxGap >= 2 ? 'major' : 'minor',
          description: `${biasType} severity disagreement: ${sevValues.map(s => `${s.model}=${s.severity}`).join(', ')}.`,
          modelsInvolved: detectingModels,
          likelyCorrect: null, // Use median
          confidence: 0.7,
          recommendation:
            maxGap >= 2
              ? `Large severity gap for ${biasType}. Use the median severity as the best estimate.`
              : `Minor severity difference for ${biasType}. Models largely agree on importance.`,
        });
      }
    }
  }

  // Classification disagreements: did models label the same signal differently?
  // Check for cases where one model found bias A and another found similar bias B
  // but not A (and vice versa)
  for (const output1 of outputs) {
    for (const output2 of outputs) {
      if (output1.modelId >= output2.modelId) continue;

      const biases1 = new Set(output1.biases.map(b => b.type));
      const biases2 = new Set(output2.biases.map(b => b.type));

      // Biases in output1 but not output2
      for (const b1 of biases1) {
        if (biases2.has(b1)) continue;
        // Check if output2 has a similar bias instead
        for (const b2 of biases2) {
          if (biases1.has(b2)) continue;
          if (areSimilarBiases(b1, b2)) {
            disagreements.push({
              id: `disagree_${++idCounter}`,
              type: 'classification',
              severity: 'minor',
              description: `${output1.modelId} classified as ${b1}, ${output2.modelId} classified as ${b2}. These are conceptually similar biases.`,
              modelsInvolved: [output1.modelId, output2.modelId],
              likelyCorrect: null,
              confidence: 0.6,
              recommendation: `Both ${b1} and ${b2} may be present. Consider them as related signals of the same underlying cognitive pattern.`,
            });
          }
        }
      }
    }
  }

  return disagreements;
}

function classifyScoreDisagreements(outputs: ModelOutput[]): ClassifiedDisagreement[] {
  const disagreements: ClassifiedDisagreement[] = [];
  let idCounter = 100;

  for (let i = 0; i < outputs.length; i++) {
    for (let j = i + 1; j < outputs.length; j++) {
      const scoreDiff = Math.abs(outputs[i].qualityScore - outputs[j].qualityScore);

      if (scoreDiff > 15) {
        const severity: 'minor' | 'moderate' | 'major' =
          scoreDiff > 30 ? 'major' : scoreDiff > 20 ? 'moderate' : 'minor';

        // Try to identify WHY the scores differ
        const biasCount1 = outputs[i].biases.length;
        const biasCount2 = outputs[j].biases.length;
        const biasCountDiff = Math.abs(biasCount1 - biasCount2);

        let reason: string;
        if (biasCountDiff >= 3) {
          reason = `Different number of biases detected (${biasCount1} vs ${biasCount2}) likely explains the score gap.`;
        } else {
          reason = `Similar bias counts but different weighting. Models may interpret document context differently.`;
        }

        disagreements.push({
          id: `disagree_${++idCounter}`,
          type: 'factual',
          severity,
          description: `Quality score gap of ${scoreDiff} points: ${outputs[i].modelId}=${outputs[i].qualityScore} vs ${outputs[j].modelId}=${outputs[j].qualityScore}. ${reason}`,
          modelsInvolved: [outputs[i].modelId, outputs[j].modelId],
          likelyCorrect: null,
          confidence: 0.5,
          recommendation:
            severity === 'major'
              ? 'Large disagreement suggests document ambiguity. Use the median score and flag for human review.'
              : 'Moderate disagreement. The mean score is a reasonable estimate.',
        });
      }
    }
  }

  return disagreements;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify all disagreements between model outputs into actionable categories.
 */
export function classifyDisagreements(outputs: ModelOutput[]): DisagreementReport {
  if (outputs.length < 2) {
    return {
      totalDisagreements: 0,
      byType: {},
      bySeverity: {},
      disagreements: [],
      consensusBiases: outputs[0]?.biases.map(b => b.type) ?? [],
      contestedBiases: [],
      overallAgreementScore: 100,
      recommendation: 'Single model output — no disagreements to analyze.',
    };
  }

  // Collect all disagreements
  const biasDisagreements = classifyBiasDisagreements(outputs);
  const scoreDisagreements = classifyScoreDisagreements(outputs);
  const allDisagreements = [...biasDisagreements, ...scoreDisagreements];

  // Count by type and severity
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  for (const d of allDisagreements) {
    byType[d.type] = (byType[d.type] ?? 0) + 1;
    bySeverity[d.severity] = (bySeverity[d.severity] ?? 0) + 1;
  }

  // Find consensus vs contested biases
  const allBiasTypes = new Set<string>();
  for (const output of outputs) {
    for (const bias of output.biases) allBiasTypes.add(bias.type);
  }

  const consensusBiases: string[] = [];
  const contestedBiases: string[] = [];
  for (const biasType of allBiasTypes) {
    const detectCount = outputs.filter(o => o.biases.some(b => b.type === biasType)).length;
    if (detectCount === outputs.length) {
      consensusBiases.push(biasType);
    } else {
      contestedBiases.push(biasType);
    }
  }

  // Overall agreement score
  const majorCount = bySeverity['major'] ?? 0;
  const moderateCount = bySeverity['moderate'] ?? 0;
  const minorCount = bySeverity['minor'] ?? 0;
  const agreementScore = Math.max(0, 100 - majorCount * 20 - moderateCount * 10 - minorCount * 3);

  // Overall recommendation
  let recommendation: string;
  if (agreementScore >= 80) {
    recommendation = 'High model agreement. Analysis results are reliable.';
  } else if (agreementScore >= 60) {
    recommendation = 'Moderate agreement. Focus on contested biases for manual review.';
  } else {
    recommendation =
      'Low agreement — document contains significant ambiguity. Recommend human expert review of contested findings.';
  }

  return {
    totalDisagreements: allDisagreements.length,
    byType,
    bySeverity,
    disagreements: allDisagreements.sort(
      (a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0)
    ),
    consensusBiases,
    contestedBiases,
    overallAgreementScore: Math.round(agreementScore),
    recommendation,
  };
}
