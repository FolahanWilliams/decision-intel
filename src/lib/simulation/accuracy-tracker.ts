/**
 * Persona Accuracy Tracker
 *
 * Tracks which Decision Twin personas are most accurate over time,
 * both from backtest validation and from live outcome data.
 *
 * Creates a blended accuracy score:
 * - Backtest accuracy: validated against known historical cases
 * - Live accuracy: validated against user-reported outcomes
 *
 * This data feeds back into persona weighting — more accurate personas
 * get higher influence in future simulations.
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AccuracyTracker');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PersonaAccuracyRecord {
  personaName: string;
  /** Accuracy from backtest cases (validated against known outcomes) */
  backtestAccuracy: number;
  backtestSampleSize: number;
  /** Accuracy from live user-reported outcomes */
  liveAccuracy: number;
  liveSampleSize: number;
  /** Blended accuracy (weighted by sample size and recency) */
  blendedAccuracy: number;
  /** Risk flag rate: how often the persona flags risks that materialize */
  riskFlagRate: number;
  /** Industries where this persona is strongest */
  strongIndustries: string[];
  /** Industries where this persona is weakest */
  weakIndustries: string[];
  /** Recommended weight for future simulations (0-2, 1 = baseline) */
  recommendedWeight: number;
}

export interface AccuracyReport {
  personas: PersonaAccuracyRecord[];
  /** Overall simulation accuracy across all personas */
  overallAccuracy: number;
  /** Most reliable persona for each industry */
  industryLeaders: Record<string, string>;
  /** Last update timestamp */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Accuracy computation
// ---------------------------------------------------------------------------

interface RawPersonaData {
  personaName: string;
  backtestCorrect: number;
  backtestTotal: number;
  liveCorrect: number;
  liveTotal: number;
  riskFlagsCorrect: number;
  riskFlagsTotal: number;
  industryCorrect: Record<string, number>;
  industryTotal: Record<string, number>;
}

/**
 * Compute blended accuracy for a persona.
 *
 * Backtest data is weighted less than live data because:
 * - Live data reflects actual user decisions (more relevant)
 * - Backtest data may have selection bias (mostly failure cases)
 *
 * Weighting: 40% backtest + 60% live (adjusted by sample size confidence)
 */
function computeBlendedAccuracy(data: RawPersonaData): number {
  const backtestAcc = data.backtestTotal > 0 ? data.backtestCorrect / data.backtestTotal : 0.5;
  const liveAcc = data.liveTotal > 0 ? data.liveCorrect / data.liveTotal : 0.5;

  // Wilson score interval for confidence weighting
  const backtestConfidence = Math.min(1.0, data.backtestTotal / 50);
  const liveConfidence = Math.min(1.0, data.liveTotal / 20);

  // If no data at all, return neutral
  if (data.backtestTotal === 0 && data.liveTotal === 0) return 0.5;

  // Weighted blend
  const backtestWeight = 0.4 * backtestConfidence;
  const liveWeight = 0.6 * liveConfidence;
  const totalWeight = backtestWeight + liveWeight;

  if (totalWeight === 0) return 0.5;
  return (backtestAcc * backtestWeight + liveAcc * liveWeight) / totalWeight;
}

/**
 * Compute recommended simulation weight based on accuracy.
 *
 * Weight mapping (sigmoid-like):
 * - accuracy < 0.3: weight = 0.5 (downweight significantly)
 * - accuracy = 0.5: weight = 1.0 (neutral baseline)
 * - accuracy = 0.7: weight = 1.3
 * - accuracy > 0.8: weight = 1.6 (upweight significantly)
 * - accuracy > 0.9: weight = 2.0 (maximum)
 */
function computeRecommendedWeight(accuracy: number, sampleSize: number): number {
  // Need minimum sample size to deviate from baseline
  if (sampleSize < 5) return 1.0;

  // Sigmoid mapping centered at 0.5
  const shifted = accuracy - 0.5;
  const weight = 1.0 + shifted * 2.0;

  // Apply confidence damping (smaller samples → closer to 1.0)
  const confidenceFactor = Math.min(1.0, sampleSize / 30);
  const dampedWeight = 1.0 + (weight - 1.0) * confidenceFactor;

  return Math.max(0.5, Math.min(2.0, Math.round(dampedWeight * 100) / 100));
}

/**
 * Find industries where a persona is strongest/weakest.
 */
function findIndustryStrengths(
  industryCorrect: Record<string, number>,
  industryTotal: Record<string, number>
): { strong: string[]; weak: string[] } {
  const accuracies: Array<{ industry: string; accuracy: number; total: number }> = [];

  for (const [industry, total] of Object.entries(industryTotal)) {
    if (total >= 3) {
      const correct = industryCorrect[industry] ?? 0;
      accuracies.push({ industry, accuracy: correct / total, total });
    }
  }

  accuracies.sort((a, b) => b.accuracy - a.accuracy);

  const strong = accuracies.filter(a => a.accuracy >= 0.7).map(a => a.industry);
  const weak = accuracies.filter(a => a.accuracy < 0.5).map(a => a.industry);

  return { strong, weak };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build an accuracy report from raw persona performance data.
 *
 * Called after backtesting runs and/or when live outcome data is available.
 */
export function buildAccuracyReport(rawData: RawPersonaData[]): AccuracyReport {
  const personas: PersonaAccuracyRecord[] = rawData.map(data => {
    const backtestAccuracy =
      data.backtestTotal > 0
        ? Math.round((data.backtestCorrect / data.backtestTotal) * 1000) / 1000
        : 0;
    const liveAccuracy =
      data.liveTotal > 0 ? Math.round((data.liveCorrect / data.liveTotal) * 1000) / 1000 : 0;
    const blendedAccuracy = Math.round(computeBlendedAccuracy(data) * 1000) / 1000;
    const riskFlagRate =
      data.riskFlagsTotal > 0
        ? Math.round((data.riskFlagsCorrect / data.riskFlagsTotal) * 1000) / 1000
        : 0;

    const { strong, weak } = findIndustryStrengths(data.industryCorrect, data.industryTotal);

    const totalSamples = data.backtestTotal + data.liveTotal;
    const recommendedWeight = computeRecommendedWeight(blendedAccuracy, totalSamples);

    return {
      personaName: data.personaName,
      backtestAccuracy,
      backtestSampleSize: data.backtestTotal,
      liveAccuracy,
      liveSampleSize: data.liveTotal,
      blendedAccuracy,
      riskFlagRate,
      strongIndustries: strong,
      weakIndustries: weak,
      recommendedWeight,
    };
  });

  // Sort by blended accuracy
  personas.sort((a, b) => b.blendedAccuracy - a.blendedAccuracy);

  // Overall accuracy: weighted average across all personas
  const totalCorrect = rawData.reduce((s, d) => s + d.backtestCorrect + d.liveCorrect, 0);
  const totalSamples = rawData.reduce((s, d) => s + d.backtestTotal + d.liveTotal, 0);
  const overallAccuracy =
    totalSamples > 0 ? Math.round((totalCorrect / totalSamples) * 1000) / 1000 : 0;

  // Industry leaders
  const industryLeaders: Record<string, string> = {};
  const allIndustries = new Set<string>();
  for (const data of rawData) {
    for (const industry of Object.keys(data.industryTotal)) {
      allIndustries.add(industry);
    }
  }
  for (const industry of allIndustries) {
    let bestPersona = '';
    let bestAccuracy = -1;
    for (const data of rawData) {
      const total = data.industryTotal[industry] ?? 0;
      if (total >= 3) {
        const correct = data.industryCorrect[industry] ?? 0;
        const accuracy = correct / total;
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy;
          bestPersona = data.personaName;
        }
      }
    }
    if (bestPersona) industryLeaders[industry] = bestPersona;
  }

  logger.info('Accuracy report built', {
    personaCount: personas.length,
    overallAccuracy,
    topPersona: personas[0]?.personaName,
  });

  return {
    personas,
    overallAccuracy,
    industryLeaders,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merge backtest results with live outcome data to create unified raw data.
 */
export function mergeBacktestAndLiveData(
  backtestResults: Array<{
    personaName: string;
    wasCorrect: boolean;
    flaggedActualRisk: boolean;
    industry: string;
  }>,
  liveResults: Array<{
    personaName: string;
    wasCorrect: boolean;
    flaggedActualRisk: boolean;
    industry: string;
  }>
): RawPersonaData[] {
  const dataMap = new Map<string, RawPersonaData>();

  const ensureEntry = (name: string): RawPersonaData => {
    if (!dataMap.has(name)) {
      dataMap.set(name, {
        personaName: name,
        backtestCorrect: 0,
        backtestTotal: 0,
        liveCorrect: 0,
        liveTotal: 0,
        riskFlagsCorrect: 0,
        riskFlagsTotal: 0,
        industryCorrect: {},
        industryTotal: {},
      });
    }
    return dataMap.get(name)!;
  };

  // Process backtest results
  for (const result of backtestResults) {
    const entry = ensureEntry(result.personaName);
    entry.backtestTotal++;
    if (result.wasCorrect) entry.backtestCorrect++;
    entry.riskFlagsTotal++;
    if (result.flaggedActualRisk) entry.riskFlagsCorrect++;
    entry.industryTotal[result.industry] = (entry.industryTotal[result.industry] ?? 0) + 1;
    if (result.wasCorrect) {
      entry.industryCorrect[result.industry] = (entry.industryCorrect[result.industry] ?? 0) + 1;
    }
  }

  // Process live results
  for (const result of liveResults) {
    const entry = ensureEntry(result.personaName);
    entry.liveTotal++;
    if (result.wasCorrect) entry.liveCorrect++;
    entry.riskFlagsTotal++;
    if (result.flaggedActualRisk) entry.riskFlagsCorrect++;
    entry.industryTotal[result.industry] = (entry.industryTotal[result.industry] ?? 0) + 1;
    if (result.wasCorrect) {
      entry.industryCorrect[result.industry] = (entry.industryCorrect[result.industry] ?? 0) + 1;
    }
  }

  return [...dataMap.values()];
}
