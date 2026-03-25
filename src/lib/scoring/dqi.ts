/**
 * Decision Quality Index (DQI)
 *
 * A brandable, public-facing score — the "Lighthouse Score" for decisions.
 * Like FICO for credit or Lighthouse for web performance, the DQI provides
 * a single 0-100 number with a clear, published methodology.
 *
 * Scoring Components (5 dimensions):
 * ─────────────────────────────────────────────
 *  Bias Load         30%   Weighted count of detected biases
 *  Noise Level       20%   Kahneman noise measurement
 *  Evidence Quality  20%   Fact-check verification rate
 *  Process Maturity  15%   Dissent, priors, outcome tracking
 *  Compliance Risk   15%   Regulatory alignment score
 * ─────────────────────────────────────────────
 *
 * Grades: A (85-100), B (70-84), C (55-69), D (40-54), F (0-39)
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('DQI');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DQIInput {
  /** Detected biases with severity and confidence */
  biases: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>;
  /** Noise statistics from judge panel */
  noiseStats: {
    mean: number;
    stdDev: number;
    judgeCount: number;
  };
  /** Fact-check results */
  factCheck: {
    totalClaims: number;
    verifiedClaims: number;
    contradictedClaims: number;
    score: number; // 0-100
  };
  /** Process indicators */
  process: {
    dissentPresent: boolean;
    priorSubmitted: boolean;
    outcomeTracked: boolean;
    participantCount: number;
    documentLength: number; // word count
  };
  /** Compliance results */
  compliance: {
    riskScore: number; // 0-100 (0 = no risk, 100 = extreme risk)
    frameworksChecked: number;
    violationsFound: number;
  };
  /** Optional: compound score from scoring engine */
  compoundScore?: number;
}

export interface DQIResult {
  /** Overall DQI score (0-100) */
  score: number;
  /** Letter grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Grade label */
  gradeLabel: string;
  /** Color for visual representation */
  color: string;
  /** Component breakdown */
  components: {
    biasLoad: DQIComponent;
    noiseLevel: DQIComponent;
    evidenceQuality: DQIComponent;
    processMaturity: DQIComponent;
    complianceRisk: DQIComponent;
  };
  /** Percentile ranking (if benchmark data available) */
  percentile: number | null;
  /** Top improvement opportunity */
  topImprovement: {
    component: string;
    currentScore: number;
    potentialGain: number;
    suggestion: string;
  };
  /** Methodology version for reproducibility */
  methodologyVersion: string;
}

export interface DQIComponent {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  weighted: number; // score * weight
  grade: string; // A-F
  detail: string; // human-readable explanation
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEIGHTS = {
  biasLoad: 0.3,
  noiseLevel: 0.2,
  evidenceQuality: 0.2,
  processMaturity: 0.15,
  complianceRisk: 0.15,
};

const BIAS_SEVERITY_COST: Record<string, number> = {
  critical: 20,
  high: 12,
  medium: 6,
  low: 2,
};

const GRADE_THRESHOLDS: Array<{
  min: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  color: string;
}> = [
  { min: 85, grade: 'A', label: 'Excellent Decision Quality', color: '#22c55e' },
  { min: 70, grade: 'B', label: 'Good Decision Quality', color: '#84cc16' },
  { min: 55, grade: 'C', label: 'Fair Decision Quality', color: '#eab308' },
  { min: 40, grade: 'D', label: 'Poor Decision Quality', color: '#f97316' },
  { min: 0, grade: 'F', label: 'Critical Decision Risk', color: '#ef4444' },
];

const METHODOLOGY_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Component scoring functions
// ---------------------------------------------------------------------------

function scoreBiasLoad(biases: DQIInput['biases']): DQIComponent {
  // Start at 100, subtract weighted penalties per bias
  let totalPenalty = 0;
  for (const bias of biases) {
    const cost = BIAS_SEVERITY_COST[bias.severity] ?? 6;
    // Weight by confidence: low-confidence detections penalize less
    totalPenalty += cost * bias.confidence;
  }

  // Diminishing returns: first few biases hurt more
  // Use square root scaling so 1 critical bias ≠ 5 low biases
  const scaledPenalty = Math.sqrt(totalPenalty) * 6;
  const score = Math.max(0, Math.min(100, 100 - scaledPenalty));

  let detail: string;
  if (biases.length === 0) {
    detail = 'No cognitive biases detected.';
  } else {
    const criticalCount = biases.filter(b => b.severity === 'critical').length;
    const highCount = biases.filter(b => b.severity === 'high').length;
    detail = `${biases.length} biases detected`;
    if (criticalCount > 0) detail += ` (${criticalCount} critical)`;
    else if (highCount > 0) detail += ` (${highCount} high severity)`;
    detail += '.';
  }

  return {
    name: 'Bias Load',
    score: Math.round(score),
    weight: WEIGHTS.biasLoad,
    weighted: Math.round(score * WEIGHTS.biasLoad * 10) / 10,
    grade: getComponentGrade(score),
    detail,
  };
}

function scoreNoiseLevel(noiseStats: DQIInput['noiseStats']): DQIComponent {
  // Lower noise = higher score
  // stdDev of 0 = 100, stdDev of 30+ = 0
  const noisePenalty = Math.min(100, noiseStats.stdDev * 3.33);
  const score = Math.max(0, 100 - noisePenalty);

  // Bonus for multi-judge (more reliable measurement)
  const judgeBonus = noiseStats.judgeCount >= 3 ? 5 : 0;
  const finalScore = Math.min(100, score + judgeBonus);

  let detail: string;
  if (noiseStats.stdDev < 5) {
    detail = `Very consistent assessment (σ=${noiseStats.stdDev.toFixed(1)}).`;
  } else if (noiseStats.stdDev < 15) {
    detail = `Moderate noise (σ=${noiseStats.stdDev.toFixed(1)}). Some assessment inconsistency.`;
  } else {
    detail = `High noise (σ=${noiseStats.stdDev.toFixed(1)}). Significant disagreement between assessors.`;
  }

  return {
    name: 'Noise Level',
    score: Math.round(finalScore),
    weight: WEIGHTS.noiseLevel,
    weighted: Math.round(finalScore * WEIGHTS.noiseLevel * 10) / 10,
    grade: getComponentGrade(finalScore),
    detail,
  };
}

function scoreEvidenceQuality(factCheck: DQIInput['factCheck']): DQIComponent {
  // Weighted combination of verification rate and fact-check score
  let score: number;

  if (factCheck.totalClaims === 0) {
    // No claims to verify — neutral score
    score = 70;
  } else {
    const verificationRate = factCheck.verifiedClaims / factCheck.totalClaims;
    const contradictionPenalty = (factCheck.contradictedClaims / factCheck.totalClaims) * 40;

    score = Math.max(0, Math.min(100, verificationRate * 80 + 20 - contradictionPenalty));

    // Blend with the raw fact-check score
    score = score * 0.6 + factCheck.score * 0.4;
  }

  let detail: string;
  if (factCheck.totalClaims === 0) {
    detail = 'No verifiable claims found in document.';
  } else {
    detail = `${factCheck.verifiedClaims}/${factCheck.totalClaims} claims verified`;
    if (factCheck.contradictedClaims > 0) {
      detail += `, ${factCheck.contradictedClaims} contradicted`;
    }
    detail += '.';
  }

  return {
    name: 'Evidence Quality',
    score: Math.round(score),
    weight: WEIGHTS.evidenceQuality,
    weighted: Math.round(score * WEIGHTS.evidenceQuality * 10) / 10,
    grade: getComponentGrade(score),
    detail,
  };
}

function scoreProcessMaturity(process: DQIInput['process']): DQIComponent {
  // Score based on decision hygiene indicators
  let score = 40; // baseline

  // Dissent presence (+20)
  if (process.dissentPresent) score += 20;

  // Prior submitted (+15)
  if (process.priorSubmitted) score += 15;

  // Outcome tracked (+15)
  if (process.outcomeTracked) score += 15;

  // Adequate participant count (+10)
  if (process.participantCount >= 3 && process.participantCount <= 12) {
    score += 10;
  } else if (process.participantCount > 0) {
    score += 5;
  }

  // Document thoroughness (+10 if >1000 words for important decisions)
  if (process.documentLength >= 1000) {
    score += 10;
  } else if (process.documentLength >= 500) {
    score += 5;
  }

  // Cap bonus but don't penalize below baseline
  score = Math.min(100, score);

  const indicators: string[] = [];
  if (process.dissentPresent) indicators.push('dissent present');
  if (process.priorSubmitted) indicators.push('prior recorded');
  if (process.outcomeTracked) indicators.push('outcome tracked');

  const detail =
    indicators.length > 0
      ? `Process indicators: ${indicators.join(', ')}.`
      : 'No process maturity indicators detected. Consider recording priors and tracking outcomes.';

  return {
    name: 'Process Maturity',
    score: Math.round(score),
    weight: WEIGHTS.processMaturity,
    weighted: Math.round(score * WEIGHTS.processMaturity * 10) / 10,
    grade: getComponentGrade(score),
    detail,
  };
}

function scoreComplianceRisk(compliance: DQIInput['compliance']): DQIComponent {
  // Invert risk score (high risk = low score)
  const score = Math.max(0, 100 - compliance.riskScore);

  let detail: string;
  if (compliance.frameworksChecked === 0) {
    detail = 'No regulatory frameworks assessed.';
  } else {
    detail = `${compliance.frameworksChecked} frameworks checked`;
    if (compliance.violationsFound > 0) {
      detail += `, ${compliance.violationsFound} potential violations`;
    } else {
      detail += ', no violations found';
    }
    detail += '.';
  }

  return {
    name: 'Compliance Risk',
    score: Math.round(score),
    weight: WEIGHTS.complianceRisk,
    weighted: Math.round(score * WEIGHTS.complianceRisk * 10) / 10,
    grade: getComponentGrade(score),
    detail,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getComponentGrade(score: number): string {
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (score >= min) return grade;
  }
  return 'F';
}

function findTopImprovement(components: DQIResult['components']): DQIResult['topImprovement'] {
  const improvable = [
    {
      component: 'Bias Load',
      score: components.biasLoad.score,
      weight: components.biasLoad.weight,
      suggestion:
        "Apply debiasing techniques: assign a Devil's Advocate, use pre-mortem analysis, and consider the opposite.",
    },
    {
      component: 'Noise Level',
      score: components.noiseLevel.score,
      weight: components.noiseLevel.weight,
      suggestion:
        'Improve assessment consistency with structured evaluation criteria and decision journals.',
    },
    {
      component: 'Evidence Quality',
      score: components.evidenceQuality.score,
      weight: components.evidenceQuality.weight,
      suggestion:
        'Strengthen evidence base: cite specific data, cross-reference claims, and acknowledge uncertainties.',
    },
    {
      component: 'Process Maturity',
      score: components.processMaturity.score,
      weight: components.processMaturity.weight,
      suggestion:
        'Record a decision prior before analysis, ensure dissenting views are captured, and track outcomes.',
    },
    {
      component: 'Compliance Risk',
      score: components.complianceRisk.score,
      weight: components.complianceRisk.weight,
      suggestion:
        'Address regulatory violations and ensure decision documentation meets compliance requirements.',
    },
  ];

  // Find the component with the most potential weighted improvement
  let best = improvable[0];
  let bestGain = 0;
  for (const item of improvable) {
    const potential = (100 - item.score) * item.weight;
    if (potential > bestGain) {
      bestGain = potential;
      best = item;
    }
  }

  return {
    component: best.component,
    currentScore: best.score,
    potentialGain: Math.round(bestGain * 10) / 10,
    suggestion: best.suggestion,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the Decision Quality Index (DQI) from analysis results.
 *
 * Returns a single 0-100 score with component breakdown, letter grade,
 * and actionable improvement recommendations.
 */
export function computeDQI(input: DQIInput): DQIResult {
  // Compute each component
  const biasLoad = scoreBiasLoad(input.biases);
  const noiseLevel = scoreNoiseLevel(input.noiseStats);
  const evidenceQuality = scoreEvidenceQuality(input.factCheck);
  const processMaturity = scoreProcessMaturity(input.process);
  const complianceRisk = scoreComplianceRisk(input.compliance);

  const components = {
    biasLoad,
    noiseLevel,
    evidenceQuality,
    processMaturity,
    complianceRisk,
  };

  // Compute weighted total
  const rawScore =
    biasLoad.weighted +
    noiseLevel.weighted +
    evidenceQuality.weighted +
    processMaturity.weighted +
    complianceRisk.weighted;

  // If compound score is available, blend it in (10% influence)
  let finalScore = rawScore;
  if (input.compoundScore !== undefined) {
    finalScore = rawScore * 0.9 + input.compoundScore * 0.1;
  }

  finalScore = Math.max(0, Math.min(100, finalScore));

  // Determine grade
  const gradeInfo =
    GRADE_THRESHOLDS.find(g => finalScore >= g.min) ??
    GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];

  // Find top improvement
  const topImprovement = findTopImprovement(components);

  const result: DQIResult = {
    score: Math.round(finalScore),
    grade: gradeInfo.grade,
    gradeLabel: gradeInfo.label,
    color: gradeInfo.color,
    components,
    percentile: null, // requires benchmark database
    topImprovement,
    methodologyVersion: METHODOLOGY_VERSION,
  };

  logger.info('DQI computed', {
    score: result.score,
    grade: result.grade,
    components: {
      biasLoad: biasLoad.score,
      noiseLevel: noiseLevel.score,
      evidenceQuality: evidenceQuality.score,
      processMaturity: processMaturity.score,
      complianceRisk: complianceRisk.score,
    },
  });

  return result;
}

/**
 * Generate an embeddable DQI badge data object.
 * Can be rendered as SVG, HTML, or JSON.
 */
export function generateDQIBadge(dqi: DQIResult): {
  score: number;
  grade: string;
  color: string;
  label: string;
  methodology: string;
} {
  return {
    score: dqi.score,
    grade: dqi.grade,
    color: dqi.color,
    label: dqi.gradeLabel,
    methodology: `DQI v${dqi.methodologyVersion}`,
  };
}
