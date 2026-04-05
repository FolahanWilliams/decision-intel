export interface BiasInstance {
  id: string;
  biasType: string;
  severity: string;
  excerpt: string;
  explanation: string;
  suggestion: string;
  confidence: number | null;
  userRating?: number | null;
}

export interface BiasDetectionResult {
  biasType: string;
  found: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  excerpt: string;
  explanation: string;
  suggestion: string;
  confidence?: number;
  researchInsight?: ResearchInsight;
}

export interface AnalysisResult {
  overallScore: number;
  noiseScore: number;
  summary: string;
  structuredContent?: string;
  biases: BiasDetectionResult[];
  // New Fields for Multi-Agent Output
  noiseStats?: {
    mean: number;
    stdDev: number;
    variance: number;
  };
  noiseBenchmarks?: NoiseBenchmark[];
  factCheck?: {
    score: number;
    flags: string[];
    verifications?: Array<{
      claim: string;
      verdict: 'VERIFIED' | 'CONTRADICTED' | 'UNVERIFIABLE';
      explanation: string;
      sourceUrl?: string;
    }>;
    searchSources?: string[];
  };
  compliance?: ComplianceResult;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
    /** Munger inversion: concrete conditions/actions that would guarantee failure. */
    inversion?: string[];
    /** RAND 10th Man structured dissent: hostile objections with cited claims. */
    redTeam?: Array<{
      objection: string;
      targetClaim: string;
      reasoning: string;
    }>;
  };
  sentiment?: {
    score: number;
    label: string;
  };
  speakers?: string[];
  // Phase 4: Deep Logic Extensions
  logicalAnalysis?: LogicalAnalysisResult;
  swotAnalysis?: SwotAnalysisResult;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  simulation?: SimulationResult;
  institutionalMemory?: InstitutionalMemoryResult;
  intelligenceContext?: IntelligenceContextSummary;
  biasWebImageUrl?: string | null;
  preMortemImageUrl?: string | null;
  compoundScoring?: CompoundScoringResult;
  bayesianPriors?: BayesianPriorsResult;
  /**
   * Calibration delta (M10) — shows how much the org's historical outcomes
   * have shifted the risk score away from the industry baseline. Becomes
   * visible in the UI once `sampleSize >= 5` so users see the flywheel
   * working without being shown an uninformative delta from a cold start.
   */
  calibration?: CalibrationInsight;
  causalIntelligence?: CausalIntelligenceResult;
  metaVerdict?: string;
  recognitionCues?: RecognitionCuesResult;
  narrativePreMortem?: NarrativePreMortem;
  /** Howard & Matheson Decision Quality Chain — process-quality companion to DQI. */
  dqChain?: DQChainSummary;
  /** Questions the memo never asks but historical analogs had to answer. */
  forgottenQuestions?: ForgottenQuestionsResult;
}

/**
 * "Forgotten Questions" — the unknown-unknowns surface. Drawn from the gap
 * between what the memo addresses and what its closest historical analogs
 * were forced to answer. Each question is grounded in a specific analog
 * and the bias it guards against.
 */
export interface ForgottenQuestionsResult {
  questions: ForgottenQuestion[];
  /** Optional executive summary — "these 3 things the memo never asks" */
  headline?: string;
  /** Case IDs / titles that seeded the questions */
  analogsUsed?: string[];
  /** Generation timestamp (ISO) */
  generatedAt?: string;
}

export interface ForgottenQuestion {
  /** The question the memo should have asked */
  question: string;
  /** Why the analog had to answer this — one sentence */
  whyItMatters: string;
  /** Bias this question guards against (from the 31-bias taxonomy) */
  biasGuarded: string;
  /** Which historical analog raised this question */
  analogCompany?: string;
  /** Severity if left unaddressed */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Compact Decision Quality Chain payload carried on AnalysisResult.
 * The full element list (with rationale and inputs) is computed at
 * `src/lib/scoring/dq-chain.ts`. This summary type is re-exported so
 * UI code can import from `@/types` without reaching into scoring.
 */
export interface DQChainSummary {
  elements: Array<{
    id: 'frame' | 'alternatives' | 'information' | 'values' | 'reasoning' | 'commitment';
    label: string;
    score: number;
    rationale: string;
    inputs: string[];
  }>;
  chainScore: number;
  weakestLink: 'frame' | 'alternatives' | 'information' | 'values' | 'reasoning' | 'commitment';
  summary: string;
}

/** Causal AI Layer output — org-specific learned causal insights */
export interface CausalIntelligenceResult {
  /** Org-specific causal weights for detected biases */
  topDangers: Array<{
    biasType: string;
    dangerMultiplier: number;
    failureCount: number;
    sampleSize: number;
  }>;
  /** Biases that are mostly benign in this org */
  benignBiases: Array<{
    biasType: string;
    dangerMultiplier: number;
    sampleSize: number;
  }>;
  /** do-calculus intervention estimate (if DAG available) */
  interventionEstimate?: {
    removedBiases: string[];
    baselineSuccessRate: number;
    projectedSuccessRate: number;
    improvement: number;
    confidence: number;
    method: 'scm_do_calculus' | 'correlation_estimate';
  };
  /** Total outcomes powering the causal model */
  totalOutcomes: number;
  /** Overall confidence in the causal model */
  modelConfidence: number;
}

/** Compound scoring engine output — persisted for UI surfacing */
export interface CompoundScoringResult {
  calibratedScore: number;
  compoundMultiplier: number;
  contextAdjustment: number;
  confidenceDecay: number;
  amplifyingInteractions: Array<{
    bias: string;
    multiplier: number;
    interactions: string[];
  }>;
  adjustments: Array<{
    source: string;
    delta: number;
    description: string;
  }>;
}

/**
 * Calibration insight (M10) — the visible flywheel surface.
 *
 * Every analysis is scored twice by `riskScorerNode`: once with the org's
 * learned calibration weights applied (`calibratedOverallScore`) and once
 * with the default industry baseline weights (`staticOverallScore`). The
 * delta shows users, in one number, how much their own historical outcomes
 * have shifted the risk assessment away from what a stock model would say.
 *
 * UI rule: only show the calibrated score when `sampleSize >= 5`. Below
 * that threshold the delta is noise and we gamify the unlock instead.
 */
export interface CalibrationInsight {
  /**
   * The headline risk score the user sees — after applying org calibration
   * AND all other adjustments (compound interactions, context, etc.).
   */
  calibratedOverallScore: number;
  /**
   * The baseline risk score with default weights — what a fresh org, or
   * any competitor running the same pipeline without our flywheel, would
   * produce. Apples-to-apples with published industry benchmarks.
   */
  staticOverallScore: number;
  /**
   * `calibratedOverallScore - staticOverallScore`. Positive = calibration
   * made this look riskier than baseline. Negative = calibration made it
   * look safer (this org's history absorbs this specific bias pattern).
   */
  calibrationDelta: number;
  /**
   * Where the calibration weights came from this run.
   *   - 'causal': computed from this org's outcome history (real flywheel)
   *   - 'default': no outcomes yet, static severity weights used
   */
  calibrationSource: 'causal' | 'default';
  /**
   * Total confirmed DecisionOutcomes powering the calibration weights for
   * this org. Used to gate the UI display (< 5 = gamified unlock hint,
   * >= 5 = show the calibrated score).
   */
  sampleSize: number;
  /**
   * Threshold at which the calibrated score becomes visible. Surfaced so
   * the client can render "N more outcomes to go" without hardcoding.
   */
  unlockThreshold: number;
  /**
   * Human-readable one-line summary for the UI to render alongside the
   * delta. Generated server-side so translation / tone changes happen in
   * one place. Example: "Your fund rates anchoring 2.1x heavier than the
   * industry baseline — this decision is riskier than the number looks."
   */
  headline: string;
}

/** Bayesian prior integration output — persisted for UI surfacing */
export interface BayesianPriorsResult {
  adjustedScore: number;
  beliefDelta: number;
  informationGain: number;
  priorInfluence: number;
  biasAdjustments: Array<{
    biasType: string;
    priorConfidence: number;
    posteriorConfidence: number;
    direction: 'increased' | 'decreased' | 'unchanged';
    reason: string;
  }>;
}

/** Lightweight summary of intelligence context stored with analysis results */
export interface IntelligenceContextSummary {
  newsCount: number;
  researchCount: number;
  caseStudyCount: number;
  macroSummary: string;
  industryBenchmarkCount: number;
  assembledAt: string;
  topNews?: Array<{ title: string; source: string; link: string }>;
  topCaseStudies?: Array<{ company: string; outcome: string; biasTypes: string[] }>;
}

export interface SimulationResult {
  overallVerdict: 'APPROVED' | 'REJECTED' | 'MIXED';
  twins: DecisionTwin[];
}

export interface DecisionTwin {
  name: string;
  role: string;
  vote: 'APPROVE' | 'REJECT' | 'REVISE';
  confidence: number;
  rationale: string;
  keyRiskIdentified?: string;
}

export interface InstitutionalMemoryResult {
  recallScore: number; // 0-100 relevance
  similarEvents: Array<{
    documentId: string;
    title: string;
    date: string;
    summary: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'MIXED';
    similarity: number;
    lessonLearned: string;
  }>;
  strategicAdvice: string;
}

export interface LogicalAnalysisResult {
  score: number; // 0-100 (100 = Logical, 0 = Fallacious)
  fallacies: Array<{
    name: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    excerpt: string;
    explanation: string;
  }>;
  // Extended fields for human decision twin simulation
  assumptions?: string[];
  conclusion?: string;
  verdict?: 'APPROVED' | 'REJECTED' | 'MIXED';
  twins?: Array<{
    name: string;
    role: string;
    vote: 'APPROVE' | 'REJECT' | 'REVISE';
    confidence: number;
    rationale: string;
    keyRiskIdentified: string;
  }>;
  institutionalMemory?: {
    recallScore: number;
    similarEvents: Array<{
      documentId?: string;
      title: string;
      summary: string;
      outcome: string;
      similarity: number;
      lessonLearned: string;
    }>;
    strategicAdvice: string;
  };
}

export interface SwotAnalysisResult {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategicAdvice: string;
}

export interface CognitiveAnalysisResult {
  blindSpotGap: number; // 0-100
  blindSpots: Array<{
    name: string;
    description: string;
  }>;
  counterArguments: Array<{
    perspective: string;
    argument: string;
    sourceUrl?: string;
    confidence: number;
  }>;
}

export interface ComplianceResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  riskScore: number;
  summary: string;
  regulations: Array<{
    name: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    description: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  searchQueries: string[];
}

export interface ResearchInsight {
  title: string;
  summary: string;
  sourceUrl: string;
}

export interface NoiseBenchmark {
  metric: string;
  documentValue: string;
  marketValue: string;
  variance: 'Low' | 'Medium' | 'High';
  explanation: string;
  sourceUrl?: string;
}

export type BiasCategory =
  | 'confirmation_bias'
  | 'anchoring_bias'
  | 'availability_heuristic'
  | 'groupthink'
  | 'authority_bias'
  | 'bandwagon_effect'
  | 'overconfidence_bias'
  | 'hindsight_bias'
  | 'planning_fallacy'
  | 'loss_aversion'
  | 'sunk_cost_fallacy'
  | 'status_quo_bias'
  | 'framing_effect'
  | 'selective_perception'
  | 'recency_bias'
  | 'cognitive_misering'
  | 'halo_effect'
  | 'gamblers_fallacy'
  | 'zeigarnik_effect'
  | 'paradox_of_choice';

export const BIAS_CATEGORIES: Record<
  BiasCategory,
  { name: string; description: string; category: string }
> = {
  confirmation_bias: {
    name: 'Confirmation Bias',
    description: 'Favoring information that confirms pre-existing beliefs',
    category: 'Judgment',
  },
  anchoring_bias: {
    name: 'Anchoring Bias',
    description: 'Over-relying on the first piece of information encountered',
    category: 'Judgment',
  },
  availability_heuristic: {
    name: 'Availability Heuristic',
    description: 'Overweighting easily recalled information',
    category: 'Judgment',
  },
  groupthink: {
    name: 'Groupthink',
    description: 'Conforming to group consensus over independent thinking',
    category: 'Group Dynamics',
  },
  authority_bias: {
    name: 'Authority Bias',
    description: 'Attributing greater accuracy to authority figures',
    category: 'Group Dynamics',
  },
  bandwagon_effect: {
    name: 'Bandwagon Effect',
    description: 'Adopting beliefs because others hold them',
    category: 'Group Dynamics',
  },
  overconfidence_bias: {
    name: 'Overconfidence Bias',
    description: "Excessive confidence in one's own answers",
    category: 'Overconfidence',
  },
  hindsight_bias: {
    name: 'Hindsight Bias',
    description: 'Believing past events were predictable',
    category: 'Overconfidence',
  },
  planning_fallacy: {
    name: 'Planning Fallacy',
    description: 'Underestimating time, costs, and risks',
    category: 'Overconfidence',
  },
  loss_aversion: {
    name: 'Loss Aversion',
    description: 'Preferring to avoid losses over acquiring gains',
    category: 'Risk Assessment',
  },
  sunk_cost_fallacy: {
    name: 'Sunk Cost Fallacy',
    description: 'Continuing due to past investment rather than future value',
    category: 'Risk Assessment',
  },
  status_quo_bias: {
    name: 'Status Quo Bias',
    description: 'Preference for the current state of affairs',
    category: 'Risk Assessment',
  },
  framing_effect: {
    name: 'Framing Effect',
    description: 'Drawing conclusions based on how information is presented',
    category: 'Information',
  },
  selective_perception: {
    name: 'Selective Perception',
    description: 'Filtering information based on expectations',
    category: 'Information',
  },
  recency_bias: {
    name: 'Recency Bias',
    description: 'Overweighting recent events over historical data',
    category: 'Information',
  },
  cognitive_misering: {
    name: 'Cognitive Misering',
    description:
      'Defaulting to low-effort, superficial thinking instead of thoroughly analyzing available evidence',
    category: 'Judgment',
  },
  halo_effect: {
    name: 'Halo Effect',
    description:
      'Letting a positive impression in one area influence judgment in unrelated areas',
    category: 'Judgment',
  },
  gamblers_fallacy: {
    name: "Gambler's Fallacy",
    description:
      'Believing that past random events affect the probability of future random events',
    category: 'Risk Assessment',
  },
  zeigarnik_effect: {
    name: 'Zeigarnik Effect',
    description:
      'Giving disproportionate weight to incomplete tasks or unfinished business in decision-making',
    category: 'Information',
  },
  paradox_of_choice: {
    name: 'Paradox of Choice',
    description:
      'Decision paralysis or lower satisfaction caused by having too many options',
    category: 'Judgment',
  },
};

// ─── Klein RPD Framework Types ──────────────────────────────────────────────

export interface RecognitionCuesResult {
  patternMatch: string;
  cues: RecognitionCue[];
  expertHeuristic: string;
  confidenceLevel: number;
}

export interface RecognitionCue {
  title: string;
  description: string;
  historicalDealId?: string;
  historicalDealTitle?: string;
  similarity: number;
  outcome?: 'SUCCESS' | 'FAILURE' | 'MIXED';
  missedCue?: string;
  lessonLearned?: string;
}

export interface RpdSimulationResult {
  chosenAction: string;
  mentalSimulation: {
    likelyOutcome: string;
    confidenceLevel: number;
    timeHorizon: string;
    keyAssumptions: string[];
    criticalFailurePoints: string[];
  };
  expertPerspective: string;
  historicalAnalogs: Array<{
    dealTitle: string;
    action: string;
    outcome: string;
    similarity: number;
  }>;
  recommendation: 'PROCEED' | 'MODIFY' | 'ABANDON';
  modificationSuggestion?: string;
}

export interface NarrativePreMortem {
  failureScenarios: string[];
  preventiveMeasures: string[];
  warStories: Array<{
    title: string;
    narrative: string;
    historicalBasis?: string;
    keyTakeaway: string;
    probability: 'low' | 'medium' | 'high';
  }>;
}

export interface CalibrationProfile {
  userId: string;
  totalDecisions: number;
  outcomeRate: { success: number; failure: number; mixed: number };
  recurringBiases: Array<{
    biasType: string;
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  calibrationScore: number;
  patternBlindSpots: string[];
  strengthPatterns: string[];
}
