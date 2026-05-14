/**
 * Decision Quality Index (DQI) — v2.0.0
 *
 * A brandable, public-facing score — the "Lighthouse Score" for decisions.
 * Like FICO for credit or Lighthouse for web performance, the DQI provides
 * a single 0-100 number with a clear, published methodology.
 *
 * Scoring Components (6 dimensions):
 * ─────────────────────────────────────────────
 *  Bias Load              28%   Weighted count of detected biases
 *  Noise Level            18%   Kahneman noise measurement
 *  Evidence Quality       18%   Fact-check verification rate
 *  Process Maturity       13%   Dissent, priors, outcome tracking, System 1 ratio
 *  Compliance Risk        13%   Regulatory alignment score
 *  Historical Alignment   10%   Correlation with the curated case-study database (HISTORICAL_CASE_COUNT in src/lib/data/case-studies)
 * ─────────────────────────────────────────────
 *
 * Grades: A (85-100), B (70-84), C (55-69), D (40-54), F (0-39)
 */

import { createHash } from 'crypto';
import { createLogger } from '@/lib/utils/logger';
import { ALL_CASES, isFailureOutcome, isSuccessOutcome } from '@/lib/data/case-studies';
import type { CaseStudy } from '@/lib/data/case-studies';
import { computeCorrelationMultiplier } from '@/lib/data/case-correlations';
import { getValidityWeightShift } from '@/lib/learning/validity-classifier';

const logger = createLogger('DQI');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DQIInput {
  /** Detected biases with severity, confidence, and (optionally) the
   *  verbatim memo excerpt that triggered the detection. The excerpt
   *  feeds the buyer-facing breakdown UI on the DQI explainability
   *  panel — when a buyer asks "where in my document did this fire?"
   *  the answer is the verbatim text from their own memo, not a
   *  paraphrase. Optional for backwards-compat with legacy callers. */
  biases: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    excerpt?: string;
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
  /** Optional: validity class of the decision environment per Kahneman
   *  & Klein 2009 (high / medium / low / zero). When supplied, the DQI
   *  engine applies a structural weight shift that increases historical-
   *  alignment + bias-load weight and decreases evidence-quality weight
   *  in low- and zero-validity environments. Methodology version bumps
   *  to '2.1.0' when the shift is applied; legacy 2.0.0 behaviour
   *  preserved when this field is undefined.
   *  See src/lib/learning/validity-classifier.ts for the full
   *  rationale + the band definitions. */
  validityClass?: 'high' | 'medium' | 'low' | 'zero';
  /**
   * Optional: named toxic combinations detected on this audit (locked
   * 2026-05-09, M&A hard-layer ship · Proposal 3). Feeds the new
   * compoundRisk DQI component. When supplied (even as an empty array),
   * methodology version bumps to '2.2.0'. Legacy audits without this
   * field report under the prior methodology version (2.1.0 if validity
   * supplied, 2.0.0-no-validity otherwise) and the compoundRisk
   * component renders with a perfect 100 (no penalty) for backwards-
   * compat — but the methodology stamp tells the procurement reader the
   * audit didn't go through the compound-risk surface.
   */
  compoundPatterns?: Array<{
    patternLabel: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    toxicScore: number;
  }>;
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
    /**
     * 7th component (locked 2026-05-09, M&A hard-layer ship · Proposal 3).
     * Direct penalty for compound named patterns — Synergy Mirage,
     * Conglomerate Fallacy, Winner's Curse, Echo Chamber, etc. Renders
     * a perfect 100 for legacy audits / audits without compoundPatterns
     * supplied (no penalty when no patterns supplied).
     */
    compoundRisk: DQIComponent;
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
  /** Effective weights actually used to compute this score (locked 2026-
   *  05-10 per Tier 2.1). May differ from canonical when user-adjustable
   *  weights or org auto-calibration applied. Per-component `weight`
   *  fields on `components` are also re-stamped to this value so the
   *  weighted breakdown adds up to `score`. */
  effectiveWeights: typeof WEIGHTS;
  /** Source of the effective weights (drives DPR cover label):
   *   - 'canonical' — WEIGHTS_CANONICAL baseline
   *   - 'validity_shifted' — canonical + Kahneman/Klein validity-class shift
   *   - 'org_calibrated' — outcome-count-blended org override (legacy auto-cal)
   *   - 'user_adjustable' — explicit user/org-set weights (T2.1) */
  weightsSource: 'canonical' | 'validity_shifted' | 'org_calibrated' | 'user_adjustable';
  /** Hash of effectiveWeights — stamped on every DPR cover for tamper-
   *  evident provenance. */
  weightsHash: string;
}

export interface DQIComponent {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  weighted: number; // score * weight
  grade: string; // A-F
  detail: string; // human-readable explanation
  /**
   * Optional structured breakdown of WHAT contributed to the component
   * score. Designed for the upcoming clickable DQI explainability panel
   * (founder ask 2026-05-09 — show users how the score is composed and
   * which document elements influenced each weighted component). Each
   * item carries: a label (the contributor — bias name, pattern name,
   * structural assumption, etc.), an impact (positive = score boost,
   * negative = score penalty, signed delta from base 100), and an
   * optional evidence string (verbatim excerpt or rule citation).
   * Components without item-level breakdown leave this undefined.
   */
  breakdownItems?: Array<{
    label: string;
    impact: number;
    evidence?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default DQI component weights — expert priors pending empirical validation.
 * Once 100+ confirmed outcomes are available, run regression of component scores
 * against outcome quality to derive optimal weights. Until then, these are
 * research-informed estimates that can be overridden per-org via computeDQI().
 */
/**
 * DQI component weights — sum to 1.0. Locked 2026-05-09 (M&A hard-layer
 * ship · Proposal 3): added 7th component `compoundRisk` at 0.06 weight,
 * rebalanced from biasLoad: 0.28 → 0.22. The compoundRisk component
 * directly penalises named toxic combinations (Synergy Mirage / Conglomerate
 * Fallacy / Winner's Curse / Echo Chamber / etc.) at the score level
 * rather than only through the constituent biases. METHODOLOGY_VERSION
 * bumped 2.1.0 → 2.2.0 to mark the structural shift; legacy audits keep
 * their original methodology version stamp.
 */
export const WEIGHTS = {
  biasLoad: 0.22,
  noiseLevel: 0.18,
  evidenceQuality: 0.18,
  processMaturity: 0.13,
  complianceRisk: 0.13,
  historicalAlignment: 0.1,
  compoundRisk: 0.06,
};

/**
 * Frozen canonical baseline (locked 2026-05-10 per Tier 2.1 ship). Used
 * to compute the delta from canonical when the user adjusts weights —
 * surfaces on the settings UI ("amber: shifted 0.07 from canonical") and
 * on every DPR cover so procurement readers see which weight set produced
 * the score. Mirror of WEIGHTS as of methodology 2.2.0; never reassign.
 */
export const WEIGHTS_CANONICAL: Readonly<typeof WEIGHTS> = Object.freeze({ ...WEIGHTS });

/** Ordered component-key list — guarantees stable hashing + UI render order. */
export const WEIGHT_COMPONENT_IDS: ReadonlyArray<keyof typeof WEIGHTS> = [
  'biasLoad',
  'noiseLevel',
  'evidenceQuality',
  'processMaturity',
  'complianceRisk',
  'historicalAlignment',
  'compoundRisk',
];

/** Compute effective weights by blending org overrides with defaults.
 *  mixCoeff scales with org outcome count: 0 at 0, 0.5 at 50, 0.8 at 200+.
 *  This is the LEGACY auto-calibration path (used by `orgWeightOverrides`
 *  in `computeDQI`). The new user-adjustable surface (T2.1) takes a
 *  different code path that REPLACES canonical fully rather than blending.
 */
export function computeEffectiveWeights(
  orgOverrides?: Partial<typeof WEIGHTS>,
  orgOutcomeCount?: number
): typeof WEIGHTS {
  if (!orgOverrides || !orgOutcomeCount || orgOutcomeCount === 0) return { ...WEIGHTS };
  // mixCoeff: sigmoid ramp from 0→0.8 based on org outcome count
  const mixCoeff = Math.min(0.8, orgOutcomeCount / (orgOutcomeCount + 50));
  const effective = { ...WEIGHTS };
  for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
    if (orgOverrides[key] !== undefined) {
      effective[key] = WEIGHTS[key] * (1 - mixCoeff) + orgOverrides[key]! * mixCoeff;
    }
  }
  // Re-normalize so weights still sum to 1.0
  const total = Object.values(effective).reduce((s, v) => s + v, 0);
  if (total === 0) return { ...WEIGHTS };
  for (const key of Object.keys(effective) as Array<keyof typeof WEIGHTS>) {
    effective[key] /= total;
  }
  return effective;
}

// ───────────────────────────────────────────────────────────────────────
// T2.1 — User-adjustable DQI weights (locked 2026-05-10)
// ───────────────────────────────────────────────────────────────────────
//
// Per Deep Research paper Ch 4 + Dietvorst 2016 follow-up to the 2015
// Algorithm Aversion finding (Dietvorst, Simmons & Massey, J. Exp.
// Psychol. General, doi:10.1037/xge0000033): people will use imperfect
// algorithms IF allowed to slightly modify the inputs or weights. Users
// who currently reject "false precision" on the DQI scorecard ARE the
// wedge customer per Paper #2 Ch 7. Letting them adjust the weights —
// while keeping a canonical baseline visible — is the literature's
// documented fix.
//
// This is NOT the legacy `orgWeightOverrides` auto-calibration path
// (which blends canonical with outcome-derived weights over time). User-
// adjustable weights REPLACE canonical fully for the org / user who
// set them. Every audit run under user-adjustable weights stamps
// `methodologyVersion: '2.3.0'` + the override hash for tamper-evidence.

/** Methodology version stamp when an audit runs under user-adjustable
 *  weights (Tier 2.1). The version chain is now: 2.0.0-no-validity |
 *  2.1.0 | 2.2.0 | 2.3.0 | 2.4.0. Canonical engine constant resolves
 *  to METHODOLOGY_VERSION = '2.4.0' (matrix-extension epoch); 2.3.0
 *  is stamped on a per-audit basis when the user-adjustable path fires,
 *  not on the engine globally. The canonical METHODOLOGY_VERSION_2_3_0
 *  + METHODOLOGY_VERSION_2_4_0 exports live below alongside the other
 *  version constants — see the chain comment there. */

/** Acceptable absolute tolerance when validating the user weight vector
 *  sums to 1.0. Tight enough to catch real errors, loose enough to
 *  accommodate floating-point drift from UI sliders. */
export const WEIGHT_SUM_TOLERANCE = 0.001;

export interface ValidateWeightsResult {
  valid: boolean;
  error?: string;
  /** Normalised weight vector (snapped to sum to 1.0 exactly when valid).
   *  All 7 components present; ordering matches WEIGHT_COMPONENT_IDS. */
  normalised?: typeof WEIGHTS;
}

/** Validate a user-adjustable weight vector. Rules:
 *  - All 7 component keys present (biasLoad, noiseLevel, evidenceQuality,
 *    processMaturity, complianceRisk, historicalAlignment, compoundRisk).
 *  - Each weight ∈ [0, 1].
 *  - Sum to 1.0 ± WEIGHT_SUM_TOLERANCE.
 *  On success, returns a normalised vector that sums to exactly 1.0
 *  (handles UI floating-point drift). Pure function — no I/O. */
export function validateUserAdjustableWeights(
  raw: Partial<Record<keyof typeof WEIGHTS, number>>
): ValidateWeightsResult {
  const missing = WEIGHT_COMPONENT_IDS.filter(k => typeof raw[k] !== 'number');
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing weight(s): ${missing.join(', ')}`,
    };
  }
  for (const k of WEIGHT_COMPONENT_IDS) {
    const v = raw[k] as number;
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      return {
        valid: false,
        error: `Weight ${k} = ${v} out of [0, 1]`,
      };
    }
  }
  const sum = WEIGHT_COMPONENT_IDS.reduce((acc, k) => acc + (raw[k] as number), 0);
  if (Math.abs(sum - 1.0) > WEIGHT_SUM_TOLERANCE) {
    return {
      valid: false,
      error: `Weights sum to ${sum.toFixed(4)}, must be 1.0 ± ${WEIGHT_SUM_TOLERANCE}`,
    };
  }
  // Snap to exact 1.0 by scaling — corrects UI float drift.
  const normalised = { ...WEIGHTS };
  for (const k of WEIGHT_COMPONENT_IDS) {
    normalised[k] = (raw[k] as number) / sum;
  }
  return { valid: true, normalised };
}

/**
 * Deterministic MD5 hash of a weight vector in canonical key order.
 * Used as the `weightsHash` on DqiWeightOverride and stamped on every
 * DPR cover for tamper-evident provenance. Procurement readers can
 * verify which weight set produced this DQI without recomputing.
 *
 * Output: 12-char hex prefix (`d4a8c2e9b3f1`) — short enough for a DPR
 * cover line, long enough for collision-resistance at any realistic
 * customer-org count.
 */
export function hashWeights(weights: typeof WEIGHTS): string {
  const canonicalString = WEIGHT_COMPONENT_IDS.map(k => `${k}:${weights[k].toFixed(6)}`).join('|');
  return createHash('md5').update(canonicalString).digest('hex').slice(0, 12);
}

/**
 * Compute per-component delta vs canonical baseline. Returns a map of
 * componentId → signed delta (positive = shifted UP from canonical;
 * negative = DOWN). Used by the settings UI to render shift indicators
 * (blue ≤0.05 / amber ≤0.15 / red >0.15) and by the DPR cover surface.
 */
export function computeWeightDeltas(weights: typeof WEIGHTS): Record<keyof typeof WEIGHTS, number> {
  const out = {} as Record<keyof typeof WEIGHTS, number>;
  for (const k of WEIGHT_COMPONENT_IDS) {
    out[k] = weights[k] - WEIGHTS_CANONICAL[k];
  }
  return out;
}

/** Maximum absolute delta from canonical. Drives the warning band
 *  (blue ≤0.05 / amber ≤0.15 / red >0.15 — the soft warning fires per
 *  the handoff doc rule). */
export function maxAbsoluteDelta(weights: typeof WEIGHTS): number {
  const deltas = computeWeightDeltas(weights);
  return Math.max(...WEIGHT_COMPONENT_IDS.map(k => Math.abs(deltas[k])));
}

const BIAS_SEVERITY_COST: Record<string, number> = {
  critical: 20,
  high: 12,
  medium: 6,
  low: 2,
};

export const GRADE_THRESHOLDS: Array<{
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

/** DQI methodology version. Bumped 2.0.0 → 2.1.0 (locked 2026-04-30)
 *  to mark the validity-aware structural weight shift (Kahneman &
 *  Klein 2009 first-condition operationalisation). Legacy behaviour
 *  preserved: when an audit input does not carry `validityClass`, the
 *  engine reports methodology version '2.0.0-no-validity' so the DPR
 *  reader can tell which methodology produced a given DQI. */
/** Methodology version stamp on every DQIResult.
 *  - '2.2.0' — current; emitted when compoundPatterns is supplied to
 *    computeDQI (even as []), indicating the audit went through the
 *    7-component scoring including compoundRisk
 *  - '2.1.0' — emitted when validityClass is supplied but compoundPatterns
 *    is absent (audit ran 2026-04-30 → 2026-05-09 evening, before P3 ship)
 *  - '2.0.0-no-validity' — emitted when neither validityClass nor
 *    compoundPatterns supplied (audits before 2026-04-30)
 *  Version stamps are persisted on the audit and surfaced on the DPR
 *  cover so a procurement reader can tell which methodology produced
 *  any given DQI without recomputing.
 */
// Methodology version chain:
//   '2.0.0-no-validity' — legacy (audits before 2026-04-30)
//   '2.1.0'             — validity-aware weight shift (2026-04-30)
//   '2.2.0'             — compoundRisk 7th component + 20×20 matrix
//   '2.3.0'             — user-adjustable weights (2026-05-10)
//   '2.4.0'             — 22×22 interaction matrix (DI-B-021 +
//                         DI-B-022 coverage; 2026-05-13 M-1 ship)
// METHODOLOGY_VERSION resolves to the latest "compound patterns
// supplied" stamp. METHODOLOGY_VERSION_2_3_0 stays exported for the
// user-adjustable path's preserved stamp.
export const METHODOLOGY_VERSION = '2.4.0';
export const METHODOLOGY_VERSION_2_4_0 = '2.4.0';
export const METHODOLOGY_VERSION_2_3_0 = '2.3.0';
export const METHODOLOGY_VERSION_2_2_0 = '2.2.0';
export const METHODOLOGY_VERSION_2_1_0 = '2.1.0';
export const METHODOLOGY_VERSION_LEGACY = '2.0.0-no-validity';

/** Biases associated with fast, heuristic (System 1) processing */
export const SYSTEM1_BIASES = new Set([
  'anchoring_bias',
  'anchoring',
  'availability_heuristic',
  'availability',
  'recency_bias',
  'recency',
  'framing_effect',
  'framing',
  'loss_aversion',
  'halo_effect',
  'bandwagon_effect',
  'status_quo_bias',
]);

/**
 * Classify detected biases as System 1 (heuristic) vs System 2 (deliberative)
 * and return the ratio of System 1 biases (0-1).
 */
function computeSystem1Ratio(biases: DQIInput['biases']): number | null {
  if (biases.length === 0) return null;
  const s1 = biases.filter(b =>
    SYSTEM1_BIASES.has(b.type.toLowerCase().replace(/[\s-]+/g, '_'))
  ).length;
  return Number((s1 / biases.length).toFixed(2));
}

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

  // breakdownItems for the explainability panel — one item per detected
  // bias. Sorted by impact (worst first) so the buyer sees the
  // highest-leverage findings at the top. Label uses formatBiasName
  // (snake_case → "Anchoring Bias"). Evidence carries the verbatim
  // memo excerpt when present, otherwise a severity tag.
  const breakdownItems: NonNullable<DQIComponent['breakdownItems']> = biases
    .map(b => {
      const cost = BIAS_SEVERITY_COST[b.severity] ?? 6;
      const confidence = Math.max(0, Math.min(1, b.confidence ?? 0.5));
      const impact = -Math.round(cost * confidence * 10) / 10; // signed delta from base 100
      const niceName = formatBiasNameInline(b.type);
      return {
        label: `${niceName} (${b.severity})`,
        impact,
        evidence: b.excerpt
          ? b.excerpt.length > 220
            ? b.excerpt.slice(0, 217) + '…'
            : b.excerpt
          : undefined,
      };
    })
    .sort((a, b) => a.impact - b.impact);

  return {
    name: 'Bias Load',
    score: Math.round(score),
    weight: WEIGHTS.biasLoad,
    weighted: Math.round(score * WEIGHTS.biasLoad * 10) / 10,
    grade: getComponentGrade(score),
    detail,
    breakdownItems,
  };
}

/** Inline buyer-friendly bias-name formatter — local fallback to avoid
 *  a circular dep on labels.ts. snake_case → Title Case. */
function formatBiasNameInline(raw: string): string {
  if (!raw) return 'Unknown bias';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bBias\b/g, 'Bias')
    .replace(/\bFallacy\b/g, 'Fallacy')
    .replace(/\bEffect\b/g, 'Effect');
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

  // breakdownItems for the buyer-facing panel. Translates the stat tuple
  // (mean, stdDev, judgeCount) into human-readable rows the buyer
  // recognises (judge count + average score + disagreement spread).
  const breakdownItems: NonNullable<DQIComponent['breakdownItems']> = [
    {
      label: `${noiseStats.judgeCount} independent judges scored this memo`,
      impact: judgeBonus, // +5 when judgeCount >= 3
      evidence:
        noiseStats.judgeCount >= 3
          ? 'Three or more judges = more reliable measurement.'
          : 'Single-judge assessments are less reliable than multi-judge.',
    },
    {
      label: `Average score: ${Math.round(noiseStats.mean)} / 100`,
      impact: 0, // neutral — just informational
    },
    {
      label: `Disagreement spread: ±${noiseStats.stdDev.toFixed(1)} points`,
      impact: -Math.round(noisePenalty * 10) / 10,
      evidence:
        noiseStats.stdDev < 5
          ? 'Tight agreement signals a clear-cut case.'
          : noiseStats.stdDev < 15
            ? 'Moderate disagreement — the memo is interpretable two ways.'
            : 'Wide disagreement — judges saw fundamentally different stories in the same memo. This is a signal, not noise.',
    },
  ];

  return {
    name: 'Noise Level',
    score: Math.round(finalScore),
    weight: WEIGHTS.noiseLevel,
    weighted: Math.round(finalScore * WEIGHTS.noiseLevel * 10) / 10,
    grade: getComponentGrade(finalScore),
    detail,
    breakdownItems,
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

  // breakdownItems for the buyer panel — show claims-by-status. The
  // contradicted bucket is the load-bearing one to surface (negative
  // impact) because that's where buyers will see "you said X but the
  // public record says NOT X." Verified claims are positive impact;
  // unverifiable claims are neutral but still surfaced so the buyer
  // sees what couldn't be checked.
  const breakdownItems: NonNullable<DQIComponent['breakdownItems']> = [];
  if (factCheck.totalClaims === 0) {
    breakdownItems.push({
      label: 'No factual claims found in this document',
      impact: 0,
      evidence: 'Memo is largely qualitative — no numerical claims to verify.',
    });
  } else {
    if (factCheck.verifiedClaims > 0) {
      const verifiedRate = factCheck.verifiedClaims / factCheck.totalClaims;
      breakdownItems.push({
        label: `${factCheck.verifiedClaims} of ${factCheck.totalClaims} claims verified`,
        impact: Math.round(verifiedRate * 30 * 10) / 10, // up to +30 boost
        evidence: 'These claims hold up against external sources.',
      });
    }
    if (factCheck.contradictedClaims > 0) {
      const contradictionImpact = -(factCheck.contradictedClaims / factCheck.totalClaims) * 40;
      breakdownItems.push({
        label: `${factCheck.contradictedClaims} claim(s) contradicted by external sources`,
        impact: Math.round(contradictionImpact * 10) / 10,
        evidence:
          'These claims directly disagree with publicly available information. Worth re-checking before the committee meeting.',
      });
    }
    const unverifiable =
      factCheck.totalClaims - factCheck.verifiedClaims - factCheck.contradictedClaims;
    if (unverifiable > 0) {
      breakdownItems.push({
        label: `${unverifiable} claim(s) couldn't be verified externally`,
        impact: 0,
        evidence:
          'Either the data is private (proprietary forecasts, internal projections) or the claim was too vague to verify. Not necessarily wrong — just unsupported by external evidence.',
      });
    }
  }

  return {
    name: 'Evidence Quality',
    score: Math.round(score),
    weight: WEIGHTS.evidenceQuality,
    weighted: Math.round(score * WEIGHTS.evidenceQuality * 10) / 10,
    grade: getComponentGrade(score),
    detail,
    breakdownItems,
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

  // breakdownItems for the buyer panel — one row per process check
  // (pass/fail), so the buyer sees exactly which decision-hygiene
  // boxes were ticked vs missed. Each row's impact reflects the
  // bonus or penalty that check applied to the score.
  const breakdownItems: NonNullable<DQIComponent['breakdownItems']> = [
    {
      label: process.dissentPresent
        ? 'Dissent captured during the decision'
        : 'No dissent captured',
      impact: process.dissentPresent ? 20 : 0,
      evidence: process.dissentPresent
        ? 'Someone formally argued against the recommendation. This is the strongest single decision-hygiene signal.'
        : "Either nobody disagreed, or disagreements weren't recorded. Best practice: capture at least one written counter-argument before the IC vote.",
    },
    {
      label: process.priorSubmitted
        ? 'Pre-decision prediction was submitted'
        : 'No pre-decision prediction submitted',
      impact: process.priorSubmitted ? 15 : 0,
      evidence: process.priorSubmitted
        ? 'You wrote down what you expected before the analysis. This protects against hindsight bias when reviewing outcomes.'
        : "Without a prior, there's no honest way to tell later whether the decision was right or whether you reframed the success criteria.",
    },
    {
      label: process.outcomeTracked ? 'Outcome tracking enabled' : 'Outcome not yet tracked',
      impact: process.outcomeTracked ? 15 : 0,
      evidence: process.outcomeTracked
        ? "You're committed to revisiting this decision when the outcome lands. The audit becomes calibration data over time."
        : "Without outcome tracking, this audit doesn't feed the calibration loop. Best practice: log expected outcome + check-in date.",
    },
    {
      label:
        process.participantCount >= 3 && process.participantCount <= 12
          ? `Right-sized team (${process.participantCount} participants)`
          : process.participantCount > 12
            ? `Large team (${process.participantCount} participants — diffuse accountability risk)`
            : process.participantCount > 0
              ? `Small team (${process.participantCount} participants — limited dissent surface)`
              : 'Participant count not recorded',
      impact:
        process.participantCount >= 3 && process.participantCount <= 12
          ? 10
          : process.participantCount > 0
            ? 5
            : 0,
    },
    {
      label:
        process.documentLength >= 1000
          ? `Thorough memo (${process.documentLength.toLocaleString()} words)`
          : process.documentLength >= 500
            ? `Moderate-length memo (${process.documentLength.toLocaleString()} words)`
            : `Short memo (${process.documentLength.toLocaleString()} words)`,
      impact: process.documentLength >= 1000 ? 10 : process.documentLength >= 500 ? 5 : 0,
      evidence:
        process.documentLength < 500
          ? 'Strategic decisions of this magnitude typically warrant 1,000+ words of analysis. Short memos correlate with under-thought decisions.'
          : undefined,
    },
  ];
  // System 1 / System 2 ratio is a special signal — surface it only
  // when it materially affects the score
  if (process.system1Ratio !== undefined) {
    if (process.system1Ratio > 0.7) {
      breakdownItems.push({
        label: 'Heuristic-driven thinking detected (System 1 dominant)',
        impact: -8,
        evidence:
          'More than 70% of the biases the audit flagged are fast-thinking patterns (anchoring, availability, framing). The memo reads as gut-call rather than deliberative.',
      });
    } else if (process.system1Ratio < 0.4) {
      breakdownItems.push({
        label: 'Deliberative reasoning detected (System 2 dominant)',
        impact: 5,
        evidence:
          "The biases flagged are mostly slow-thinking patterns (overconfidence, planning fallacy). The memo reads as deliberative — you're thinking carefully, just optimistically.",
      });
    }
  }

  return {
    name: 'Process Maturity',
    score: Math.round(score),
    weight: WEIGHTS.processMaturity,
    weighted: Math.round(score * WEIGHTS.processMaturity * 10) / 10,
    grade: getComponentGrade(score),
    detail,
    breakdownItems,
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

  // breakdownItems for the buyer panel — surfaces the framework scan
  // result in plain language. The buyer sees how many frameworks were
  // checked and how many flagged a potential issue. The "potential"
  // qualifier is load-bearing — these are AUDIT-detected risks, not
  // legal verdicts; the GC still has to confirm.
  const breakdownItems: NonNullable<DQIComponent['breakdownItems']> = [];
  if (compliance.frameworksChecked === 0) {
    breakdownItems.push({
      label: 'No regulatory frameworks were assessed',
      impact: 0,
      evidence:
        "Either the document type didn't trigger compliance review, or the audit didn't reach the regulatory node. Re-run the audit if you expected framework coverage.",
    });
  } else {
    breakdownItems.push({
      label: `${compliance.frameworksChecked} regulatory framework(s) checked`,
      impact: 0,
      evidence:
        'Each named framework runs against your memo to flag the specific provisions an auditor would invoke if your reasoning leaked through to a real decision.',
    });
    if (compliance.violationsFound > 0) {
      breakdownItems.push({
        label: `${compliance.violationsFound} potential violation(s) flagged`,
        impact: -Math.min(40, compliance.violationsFound * 10),
        evidence:
          'These are audit-detected risk patterns, not legal determinations. Bring them to your GC or compliance officer before relying on the memo. The DPR cross-references each flag to the specific framework provision.',
      });
    } else {
      breakdownItems.push({
        label: 'No regulatory violations flagged',
        impact: 10,
        evidence:
          "The audit didn't find any pattern matching the regulatory provisions in scope. This is a clean signal — but the GC review is still the final word.",
      });
    }
  }

  return {
    name: 'Compliance Risk',
    score: Math.round(score),
    weight: WEIGHTS.complianceRisk,
    weighted: Math.round(score * WEIGHTS.complianceRisk * 10) / 10,
    grade: getComponentGrade(score),
    detail,
    breakdownItems,
  };
}

function scoreHistoricalAlignment(
  alignment: DQIInput['historicalAlignment'],
  biases?: DQIInput['biases']
): DQIComponent {
  // When no alignment data is provided, auto-compute from biases
  if (!alignment) {
    if (biases && biases.length > 0) {
      const biasTypes = biases.map(b => b.type);
      const result = computeCorrelationMultiplier(biasTypes, {});
      alignment = {
        matchedFailurePatterns: result.matchedPairs.length,
        matchedSuccessPatterns: result.matchedSuccessPatterns.length,
        correlationMultiplier: result.multiplier,
        beneficialDamping: result.beneficialDamping,
      };
    } else {
      return {
        name: 'Historical Alignment',
        score: 60,
        weight: WEIGHTS.historicalAlignment,
        weighted: Math.round(60 * WEIGHTS.historicalAlignment * 10) / 10,
        grade: getComponentGrade(60),
        detail: 'No historical correlation data available.',
        breakdownItems: [
          {
            label: 'No biases detected — historical pattern match skipped',
            impact: 0,
            evidence:
              "When no biases are flagged, there's nothing to match against the 143-case library. This usually means the memo was very brief or the audit didn't reach the bias-detection node.",
          },
        ],
      };
    }
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

  // breakdownItems for the buyer panel — translates failure/success
  // pattern counts into "your decision pattern matches X historical
  // failures and Y successes" framing. Buyers immediately recognise the
  // 143-case library reference because /bias-genome and /case-studies
  // already surface it; this component shows them how their specific
  // memo maps onto that library.
  const breakdownItems: NonNullable<DQIComponent['breakdownItems']> = [];
  if (alignment.matchedFailurePatterns === 0 && alignment.matchedSuccessPatterns === 0) {
    breakdownItems.push({
      label: 'No strong matches against the historical case library',
      impact: 0,
      evidence:
        "Your decision pattern doesn't closely resemble any of the 143 documented strategic decisions in our reference library. This is neutral — could mean novel decision OR insufficient pattern data on this specific shape.",
    });
  } else {
    if (alignment.matchedFailurePatterns > 0) {
      breakdownItems.push({
        label: `Matches ${alignment.matchedFailurePatterns} historical failure pattern(s)`,
        impact: -(alignment.matchedFailurePatterns * 8),
        evidence:
          "Your bias profile resembles deals that didn't work out. Cross-reference these in /bias-genome to see which specific cases match — typically the same patterns that sank WeWork, AOL-Time Warner, or HP-Autonomy.",
      });
    }
    if (alignment.matchedSuccessPatterns > 0) {
      breakdownItems.push({
        label: `Matches ${alignment.matchedSuccessPatterns} historical success pattern(s)`,
        impact: alignment.matchedSuccessPatterns * 10,
        evidence:
          "Your bias profile resembles deals that DID work out. The historical match is positive evidence — but doesn't guarantee outcome; pair with the failure-pattern flags above for a balanced read.",
      });
    }
    if (alignment.correlationMultiplier > 1.0) {
      breakdownItems.push({
        label: `Compound risk amplifier active (${alignment.correlationMultiplier.toFixed(2)}×)`,
        impact: -Math.round((alignment.correlationMultiplier - 1.0) * 30 * 10) / 10,
        evidence:
          'Multiple biases firing together raise the failure probability above what each individual bias would suggest. The amplifier reflects how dangerous these specific bias combinations have proven historically.',
      });
    }
    if (alignment.beneficialDamping < 1.0) {
      breakdownItems.push({
        label: 'Beneficial-pattern damping active',
        impact: Math.round((1.0 - alignment.beneficialDamping) * 20 * 10) / 10,
        evidence:
          "The audit detected that some flagged biases are happening in a context where they typically don't cause harm (e.g., overconfidence on a clearly-priced asset). The damping lowers the compound risk accordingly.",
      });
    }
  }

  return {
    name: 'Historical Alignment',
    score: Math.round(score),
    weight: WEIGHTS.historicalAlignment,
    weighted: Math.round(score * WEIGHTS.historicalAlignment * 10) / 10,
    grade: getComponentGrade(score),
    detail,
    breakdownItems,
  };
}

/**
 * Score the compoundRisk component (locked 2026-05-09, M&A hard-layer
 * ship · Proposal 3). Direct penalty for named toxic combinations
 * detected on the audit. Per-pattern severity penalties:
 *   - critical: -25
 *   - high: -12
 *   - medium: -5
 *   - low: -1
 * Base 100, floor at 0. The breakdownItems array carries per-pattern
 * impact so the upcoming clickable DQI explainability panel can render
 * exactly which patterns drove the penalty.
 *
 * Calibration anchor: a memo with one critical pattern (Synergy Mirage
 * critical, e.g.) loses 25 points on this component, contributing
 * -1.5 to the weighted DQI total (25 × 0.06). Two critical patterns
 * = -3 weighted; three critical = -4.5 weighted. The 6% weight is
 * intentional — directly visible in the DQI score but not so
 * dominant that it overrides the bias-load + evidence-quality components.
 */
function scoreCompoundRisk(patterns: DQIInput['compoundPatterns']): DQIComponent {
  // No patterns supplied (legacy audits, audits without toxic-combo
  // detection) → perfect 100, neutral contribution. The methodology
  // version stamp (METHODOLOGY_VERSION_LEGACY) tells the reader.
  if (!patterns || patterns.length === 0) {
    return {
      name: 'Compound Risk',
      score: 100,
      weight: WEIGHTS.compoundRisk,
      weighted: Math.round(100 * WEIGHTS.compoundRisk * 10) / 10,
      grade: getComponentGrade(100),
      detail: 'No compound toxic-combination patterns detected.',
      breakdownItems: [],
    };
  }

  const SEVERITY_PENALTIES: Record<string, number> = {
    critical: 25,
    high: 12,
    medium: 5,
    low: 1,
  };

  const breakdownItems: NonNullable<DQIComponent['breakdownItems']> = [];
  let totalPenalty = 0;
  for (const p of patterns) {
    const penalty = SEVERITY_PENALTIES[p.severity] ?? 0;
    totalPenalty += penalty;
    breakdownItems.push({
      label: p.patternLabel,
      impact: -penalty,
      evidence: `${p.severity} severity (toxicScore ${Math.round(p.toxicScore)})`,
    });
  }
  const score = Math.max(0, 100 - totalPenalty);

  // Sort breakdown items by impact (most-negative first) so the
  // explainability panel shows the worst offenders at the top.
  breakdownItems.sort((a, b) => a.impact - b.impact);

  // Concise per-pattern detail for the DPR component bar caption.
  const criticalCount = patterns.filter(p => p.severity === 'critical').length;
  const highCount = patterns.filter(p => p.severity === 'high').length;
  const detailParts: string[] = [];
  if (criticalCount > 0) detailParts.push(`${criticalCount} critical`);
  if (highCount > 0) detailParts.push(`${highCount} high`);
  if (criticalCount === 0 && highCount === 0) {
    detailParts.push(`${patterns.length} pattern(s) at medium/low severity`);
  }
  const detail = `${patterns.length} compound pattern(s) detected · ${detailParts.join(', ')}.`;

  return {
    name: 'Compound Risk',
    score: Math.round(score),
    weight: WEIGHTS.compoundRisk,
    weighted: Math.round(score * WEIGHTS.compoundRisk * 10) / 10,
    grade: getComponentGrade(score),
    detail,
    breakdownItems,
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
    {
      component: 'Compound Risk',
      score: components.compoundRisk.score,
      weight: components.compoundRisk.weight,
      suggestion:
        'Apply the named-pattern mitigation playbooks (toxic-mitigation.ts) for the patterns flagged on this audit. Critical patterns (Synergy Mirage, Yes Committee, etc.) are deal-blocking signals.',
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
/**
 * Legacy weight values for synthetic DQI computation (locked 2026-05-09).
 * computeSyntheticDQI + computeBrierFairPredictedDqi are pinned to
 * methodology 2.0.0-seed weights so the platform-baseline Brier (0.258)
 * stays stable under WEIGHTS rebalancing. Live audit DQI follows the
 * current WEIGHTS (which include compoundRisk + reduced biasLoad as of
 * methodology 2.2.0); the synthetic + baseline stay at their original
 * calibration state. The methodology-versioning pattern: live audits
 * advance, calibration baselines stay fixed at the version they were
 * computed under.
 */
export const SYNTHETIC_WEIGHTS_LEGACY_2_0_0 = {
  biasLoad: 0.28,
  noiseLevel: 0.18,
  evidenceQuality: 0.18,
  processMaturity: 0.13,
  complianceRisk: 0.13,
  historicalAlignment: 0.1,
} as const;

export function computeSyntheticDQI(c: CaseStudy): number {
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

  // Pinned to SYNTHETIC_WEIGHTS_LEGACY_2_0_0 so the synthetic stays
  // stable when WEIGHTS rebalances for new methodology versions
  // (2026-05-09 — added compoundRisk, dropped biasLoad 0.28 → 0.22 in
  // live methodology 2.2.0). historicalAlignment excluded (can't
  // recurse); five remaining weights renormalised to sum to 1.0.
  const W = SYNTHETIC_WEIGHTS_LEGACY_2_0_0;
  const denom =
    W.biasLoad + W.noiseLevel + W.evidenceQuality + W.processMaturity + W.complianceRisk;
  const syntheticDQI =
    (biasScore * W.biasLoad +
      noiseScore * W.noiseLevel +
      evidenceScore * W.evidenceQuality +
      processScore * W.processMaturity +
      complianceScore * W.complianceRisk) /
    denom;

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
export function computeHistoricalPercentile(dqiScore: number): number {
  const benchmarks = getCaseBenchmarks();
  if (benchmarks.length === 0) return 50;
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

  // Find closest failure case below the user's score
  const failureBelow = benchmarks
    .filter(b => b.dqi < dqiScore && b.outcome.includes('failure'))
    .pop();
  if (failureBelow) {
    comparisons.push({ ...failureBelow, relation: 'below' });
  }

  // Find closest success case above the user's score
  const successAbove = benchmarks.find(b => b.dqi > dqiScore && b.outcome.includes('success'));
  if (successAbove) {
    comparisons.push({ ...successAbove, relation: 'above' });
  }

  // Find comparable case (within 5 points)
  const comparable = benchmarks.find(
    b =>
      Math.abs(b.dqi - dqiScore) <= 5 &&
      b.company !== failureBelow?.company &&
      b.company !== successAbove?.company
  );
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
export function computeDQI(
  input: DQIInput,
  options?: {
    /** Org-specific weight overrides — LEGACY auto-calibration path
     *  (blended with defaults based on outcome count). NOT the same as
     *  userAdjustableWeights, which fully replaces canonical. */
    orgWeightOverrides?: Partial<typeof WEIGHTS>;
    /** Number of confirmed outcomes for this org (controls override mix strength) */
    orgOutcomeCount?: number;
    /** User-adjustable weight vector from DqiWeightOverride (Tier 2.1, locked
     *  2026-05-10 per Dietvorst 2016). When supplied + valid, fully REPLACES
     *  canonical weights (no blending) AND stamps methodologyVersion='2.3.0'
     *  on the result. Validity-class shift is NOT applied on top — the user's
     *  explicit input wins outright. */
    userAdjustableWeights?: typeof WEIGHTS;
    /** Hash of the userAdjustableWeights vector. Persisted on the audit
     *  for tamper-evidence + DPR cover surfacing. Caller computes via
     *  hashWeights() so the hash is stable across resolvers. */
    userAdjustableWeightsHash?: string;
  }
): DQIResult {
  // Auto-compute System 1 ratio if not provided
  if (input.process.system1Ratio === undefined) {
    input.process.system1Ratio = computeSystem1Ratio(input.biases) ?? undefined;
  }

  // Compute each component (using default weights for per-component display)
  const biasLoad = scoreBiasLoad(input.biases);
  const noiseLevel = scoreNoiseLevel(input.noiseStats);
  const evidenceQuality = scoreEvidenceQuality(input.factCheck);
  const processMaturity = scoreProcessMaturity(input.process);
  const complianceRisk = scoreComplianceRisk(input.compliance);
  const historicalAlignment = scoreHistoricalAlignment(input.historicalAlignment, input.biases);
  const compoundRisk = scoreCompoundRisk(input.compoundPatterns);

  const components = {
    biasLoad,
    noiseLevel,
    evidenceQuality,
    processMaturity,
    complianceRisk,
    historicalAlignment,
    compoundRisk,
  };

  // Resolve effective weights. Precedence (highest → lowest):
  //   1. userAdjustableWeights (T2.1) — explicit user input, REPLACES canonical
  //      fully + stamps methodology 2.3.0. Validity-class shift is NOT applied
  //      on top because the user's explicit choice wins.
  //   2. orgWeightOverrides + orgOutcomeCount — legacy auto-calibration
  //      blending path (stamps prior methodology versions per validity /
  //      compoundPatterns logic below).
  //   3. WEIGHTS canonical baseline + optional validity-class shift.
  //
  // Validity shift (Kahneman & Klein 2009 first condition, locked
  // 2026-04-30) — see src/lib/learning/validity-classifier.ts.
  let ew: typeof WEIGHTS;
  let userAdjustableApplied = false;
  if (options?.userAdjustableWeights) {
    // Trust caller — the API endpoint validated via validateUserAdjustableWeights
    // before persisting. Spread to defensive-copy.
    ew = { ...options.userAdjustableWeights };
    userAdjustableApplied = true;
  } else {
    let baseWeights = options?.orgWeightOverrides;
    if (input.validityClass) {
      // validity-classifier only imports `WEIGHTS` as a type from this file
      // (erased at compile time), so a static import is safe — no runtime
      // circular dep. Required for ESM/Vitest path-alias resolution; the
      // prior lazy require() bypassed `@/` alias resolution under Vitest.
      const validityShift = getValidityWeightShift(input.validityClass);
      if (validityShift) {
        baseWeights = { ...validityShift, ...(baseWeights ?? {}) };
      }
    }
    ew = computeEffectiveWeights(baseWeights, options?.orgOutcomeCount);
  }
  const rawScore =
    biasLoad.score * ew.biasLoad +
    noiseLevel.score * ew.noiseLevel +
    evidenceQuality.score * ew.evidenceQuality +
    processMaturity.score * ew.processMaturity +
    complianceRisk.score * ew.complianceRisk +
    historicalAlignment.score * ew.historicalAlignment +
    compoundRisk.score * ew.compoundRisk;

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

  // Methodology version stamp (highest precedence first):
  //   userAdjustableWeights supplied → 2.3.0 (Tier 2.1, locked 2026-05-10).
  //     NB: user-adjustable audits still score against the 22×22 matrix
  //     post-M-1 — the 2.3.0 stamp preserves the "user-weights epoch"
  //     meaning; matrix coverage is reflected in the engine's
  //     INTERACTION_MATRIX export, not in the version string.
  //   compoundPatterns supplied      → 2.4.0 (matrix extension to 22×22;
  //     M-1 ship 2026-05-13). Supersedes the 2.2.0 stamp from the
  //     M&A hard-layer ship 2026-05-09 — the engine epoch shifted when
  //     DI-B-021 + DI-B-022 gained matrix coverage. METHODOLOGY_VERSION_2_2_0
  //     stays exported for back-compat (historical audits re-rendering).
  //   only validityClass supplied    → 2.1.0 (validity shift, 2026-04-30)
  //   none of the above              → 2.0.0-no-validity (legacy)
  const methodologyVersion = userAdjustableApplied
    ? METHODOLOGY_VERSION_2_3_0
    : input.compoundPatterns !== undefined
      ? METHODOLOGY_VERSION
      : input.validityClass
        ? METHODOLOGY_VERSION_2_1_0
        : METHODOLOGY_VERSION_LEGACY;

  // Re-stamp per-component `weight` + `weighted` with the EFFECTIVE
  // weights actually used (Tier 2.1 fix). Pre-T2.1 the component
  // breakdown rendered canonical weights even when ew was different;
  // the buyer-facing breakdown then didn't add up to `score`. Now it
  // does.
  for (const k of WEIGHT_COMPONENT_IDS) {
    const c = components[k];
    c.weight = ew[k];
    c.weighted = Math.round(c.score * ew[k] * 10) / 10;
  }

  // Determine the weights source for the DPR cover label.
  let weightsSource: DQIResult['weightsSource'];
  if (userAdjustableApplied) {
    weightsSource = 'user_adjustable';
  } else if (options?.orgWeightOverrides && (options?.orgOutcomeCount ?? 0) > 0) {
    weightsSource = 'org_calibrated';
  } else if (input.validityClass && getValidityWeightShift(input.validityClass)) {
    weightsSource = 'validity_shifted';
  } else {
    weightsSource = 'canonical';
  }

  // Prefer caller-supplied hash when present (callers persist it on
  // DqiWeightOverride; reusing it keeps the hash stable across reads).
  const weightsHash =
    userAdjustableApplied && options?.userAdjustableWeightsHash
      ? options.userAdjustableWeightsHash
      : hashWeights(ew);

  const result: DQIResult = {
    score: Math.round(finalScore),
    grade: gradeInfo.grade,
    gradeLabel: gradeInfo.label,
    color: gradeInfo.color,
    components,
    percentile: computeHistoricalPercentile(finalScore),
    topImprovement,
    system1Ratio: input.process.system1Ratio ?? null,
    methodologyVersion,
    effectiveWeights: ew,
    weightsSource,
    weightsHash,
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
      compoundRisk: compoundRisk.score,
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
