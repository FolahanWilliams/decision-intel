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
import { ALL_CASES, isFailureOutcome, isSuccessOutcome } from '@/lib/data/case-studies';
import type { CaseStudy } from '@/lib/data/case-studies';

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
    /** Ratio of System 1 biases to total detected biases (0-1). Optional. */
    system1Ratio?: number;
  };
  /** Compliance results */
  compliance: {
    riskScore: number; // 0-100 (0 = no risk, 100 = extreme risk)
    frameworksChecked: number;
    violationsFound: number;
  };
  /** Optional: compound score from scoring engine */
  compoundScore?: number;
  /** Optional: historical correlation data for the 6th DQI component */
  historicalAlignment?: {
    /** Number of matched failure patterns */
    matchedFailurePatterns: number;
    /** Number of matched success patterns */
    matchedSuccessPatterns: number;
    /** Correlation multiplier from case-correlations engine */
    correlationMultiplier: number;
    /** Beneficial damping factor (1.0 = no damping) */
    beneficialDamping: number;
  };
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
    historicalAlignment: DQIComponent;
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
  /** System 1 vs System 2 bias ratio (0-1, where 1.0 = all System 1) */
  system1Ratio: number | null;
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
  biasLoad: 0.28,
  noiseLevel: 0.18,
  evidenceQuality: 0.18,
  processMaturity: 0.13,
  complianceRisk: 0.13,
  historicalAlignment: 0.10,
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

const METHODOLOGY_VERSION = '2.0.0';

// ---------------------------------------------------------------------------
// Component scoring functions
// ---------------------------------------------------------------------------

function scoreBiasLoad(biases: DQIInput['biases']): DQIComponent {
  // Start at 100, subtract weighted penalties per bias
  let totalPenalty = 0;
  for (const bias of biases) {
    const cost = BIAS_SEVERITY_COST[bias.severity] ?? 6;
    // Clamp confidence to [0, 1] — malformed AI output can exceed bounds
    const confidence = Math.max(0, Math.min(1, bias.confidence ?? 0.5));
    totalPenalty += cost * confidence;
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

  // System 1 vs System 2 ratio adjustment
  // High System 1 ratio (>70%) signals heuristic-dominant decision → penalty
  // Mixed or System 2 dominant signals deliberative process → bonus
  if (process.system1Ratio !== undefined) {
    if (process.system1Ratio > 0.7) {
      score -= 8; // heuristic-dominant penalty
    } else if (process.system1Ratio < 0.4) {
      score += 5; // deliberative bonus
    }
  }

  // Cap bonus but don't penalize below baseline
  score = Math.max(30, Math.min(100, score));

  const indicators: string[] = [];
  if (process.dissentPresent) indicators.push('dissent present');
  if (process.priorSubmitted) indicators.push('prior recorded');
  if (process.outcomeTracked) indicators.push('outcome tracked');
  if (process.system1Ratio !== undefined) {
    if (process.system1Ratio > 0.7) indicators.push('heuristic-dominant (System 1 >70%)');
    else if (process.system1Ratio < 0.4)
      indicators.push('deliberative process (System 2 dominant)');
  }

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

function scoreHistoricalAlignment(
  alignment: DQIInput['historicalAlignment']
): DQIComponent {
  // Default to neutral score when no historical data is available
  if (!alignment) {
    return {
      name: 'Historical Alignment',
      score: 60,
      weight: WEIGHTS.historicalAlignment,
      weighted: Math.round(60 * WEIGHTS.historicalAlignment * 10) / 10,
      grade: getComponentGrade(60),
      detail: 'No historical correlation data available.',
    };
  }

  let score = 70; // Neutral starting point

  // Failure pattern penalty: more matched failure patterns = lower score
  if (alignment.matchedFailurePatterns > 0) {
    score -= alignment.matchedFailurePatterns * 8;
  }

  // Correlation multiplier penalty: higher multiplier = higher compound risk
  if (alignment.correlationMultiplier > 1.0) {
    score -= (alignment.correlationMultiplier - 1.0) * 30;
  }

  // Success pattern bonus: matched beneficial patterns boost score
  if (alignment.matchedSuccessPatterns > 0) {
    score += alignment.matchedSuccessPatterns * 10;
  }

  // Beneficial damping bonus: active mitigation recognized
  if (alignment.beneficialDamping < 1.0) {
    score += (1.0 - alignment.beneficialDamping) * 20;
  }

  score = Math.max(0, Math.min(100, score));

  let detail: string;
  if (alignment.matchedFailurePatterns === 0 && alignment.matchedSuccessPatterns === 0) {
    detail = 'No strong historical pattern matches found.';
  } else {
    const parts: string[] = [];
    if (alignment.matchedFailurePatterns > 0) {
      parts.push(`${alignment.matchedFailurePatterns} failure pattern(s) detected`);
    }
    if (alignment.matchedSuccessPatterns > 0) {
      parts.push(`${alignment.matchedSuccessPatterns} success pattern(s) matched`);
    }
    detail = parts.join(', ') + '.';
  }

  return {
    name: 'Historical Alignment',
    score: Math.round(score),
    weight: WEIGHTS.historicalAlignment,
    weighted: Math.round(score * WEIGHTS.historicalAlignment * 10) / 10,
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
    {
      component: 'Historical Alignment',
      score: components.historicalAlignment.score,
      weight: components.historicalAlignment.weight,
      suggestion:
        'Your decision pattern matches historical failures. Review case study parallels, encourage dissent, bring in external advisors, and iterate before committing.',
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
// Historical Benchmarking — Percentile from Case Study Database
// ---------------------------------------------------------------------------

/**
 * Compute a synthetic DQI score for a historical case study.
 * Maps the case's characteristics to approximate DQI dimensions.
 */
function computeSyntheticDQI(c: CaseStudy): number {
  // Bias Load (30%): more biases and higher impact → lower score
  const biasPenalty = c.biasesPresent.length * 8;
  const biasScore = Math.max(0, Math.min(100, 100 - Math.sqrt(biasPenalty) * 6));

  // Process Maturity (15%): infer from context factors
  let processScore = 40;
  if (c.contextFactors.dissentEncouraged) processScore += 20;
  if (c.contextFactors.externalAdvisors) processScore += 15;
  if (c.contextFactors.iterativeProcess) processScore += 15;
  if (!c.contextFactors.dissentAbsent) processScore += 10;
  processScore = Math.min(100, processScore);

  // Evidence/Noise (20% each): estimate from outcome
  // Success cases imply better evidence/less noise; failures imply worse
  const evidenceScore = isSuccessOutcome(c.outcome) ? 70 : isFailureOutcome(c.outcome) ? 35 : 50;
  const noiseScore = c.contextFactors.unanimousConsensus ? 30 : 60;

  // Compliance (15%): neutral estimate
  const complianceScore = 60;

  // Weighted total (same weights as DQI)
  const syntheticDQI =
    biasScore * 0.3 +
    noiseScore * 0.2 +
    evidenceScore * 0.2 +
    processScore * 0.15 +
    complianceScore * 0.15;

  return Math.round(Math.max(0, Math.min(100, syntheticDQI)));
}

/** Cache synthetic DQI scores (computed once) */
let _cachedBenchmarks: Array<{ company: string; dqi: number; outcome: string }> | null = null;

function getCaseBenchmarks(): Array<{ company: string; dqi: number; outcome: string }> {
  if (_cachedBenchmarks) return _cachedBenchmarks;
  _cachedBenchmarks = ALL_CASES.map(c => ({
    company: c.company,
    dqi: computeSyntheticDQI(c),
    outcome: c.outcome,
  })).sort((a, b) => a.dqi - b.dqi);
  return _cachedBenchmarks;
}

/**
 * Compute the percentile ranking of a DQI score against historical case studies.
 * Returns 0-100 where 100 = better than all historical cases.
 */
function computeHistoricalPercentile(dqiScore: number): number {
  const benchmarks = getCaseBenchmarks();
  const belowCount = benchmarks.filter(b => b.dqi < dqiScore).length;
  return Math.round((belowCount / benchmarks.length) * 100);
}

/**
 * Find the closest historical case study comparisons for narrative context.
 */
export function getHistoricalComparisons(dqiScore: number): Array<{
  company: string;
  dqi: number;
  outcome: string;
  relation: 'below' | 'comparable' | 'above';
}> {
  const benchmarks = getCaseBenchmarks();
  const comparisons: Array<{
    company: string;
    dqi: number;
    outcome: string;
    relation: 'below' | 'comparable' | 'above';
  }> = [];

  // Find closest failure case below
  const failureBelow = benchmarks
    .filter(b => b.dqi < dqiScore && b.outcome.includes('failure'))
    .pop();
  if (failureBelow) {
    comparisons.push({ ...failureBelow, relation: 'above' });
  }

  // Find closest success case above
  const successAbove = benchmarks
    .find(b => b.dqi > dqiScore && (b.outcome.includes('success')));
  if (successAbove) {
    comparisons.push({ ...successAbove, relation: 'below' });
  }

  // Find comparable case (within 5 points)
  const comparable = benchmarks
    .find(b => Math.abs(b.dqi - dqiScore) <= 5 && b.company !== failureBelow?.company && b.company !== successAbove?.company);
  if (comparable) {
    comparisons.push({ ...comparable, relation: 'comparable' });
  }

  return comparisons;
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
  const historicalAlignment = scoreHistoricalAlignment(input.historicalAlignment);

  const components = {
    biasLoad,
    noiseLevel,
    evidenceQuality,
    processMaturity,
    complianceRisk,
    historicalAlignment,
  };

  // Compute weighted total
  const rawScore =
    biasLoad.weighted +
    noiseLevel.weighted +
    evidenceQuality.weighted +
    processMaturity.weighted +
    complianceRisk.weighted +
    historicalAlignment.weighted;

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
    percentile: computeHistoricalPercentile(finalScore),
    topImprovement,
    system1Ratio: input.process.system1Ratio ?? null,
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
      historicalAlignment: historicalAlignment.score,
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
