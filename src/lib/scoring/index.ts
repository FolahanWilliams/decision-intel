/**
 * Scoring Module — Proprietary deterministic scoring engine
 *
 * All scoring logic that runs AFTER the LLM analysis to produce
 * calibrated, context-adjusted, mathematically rigorous scores.
 */

export {
  computeCompoundScore,
  computeConfidenceDecay,
  detectWinnerEffect,
  detectStressSignals,
  type CompoundScore,
  type DetectedBias,
  type DocumentContext,
  type BiasCompoundScore,
  type ScoreAdjustment,
} from './compound-engine';

export {
  applyBayesianPriors,
  getBiasBaseRate,
  getAllBaseRates,
  type DecisionPrior,
  type PriorAdjustment,
  type BayesianResult,
} from './bayesian-priors';

export {
  decomposeDecisionNoise,
  compareNoiseRegimes,
  type JudgeAssessment,
  type NoiseDecomposition,
} from './noise-decomposition';

export {
  classifyDisagreements,
  type ModelOutput,
  type ClassifiedDisagreement,
  type DisagreementReport,
} from './disagreement-classifier';

export {
  computeDQI,
  generateDQIBadge,
  type DQIInput,
  type DQIResult,
  type DQIComponent,
} from './dqi';
