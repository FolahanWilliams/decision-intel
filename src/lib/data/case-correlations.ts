/**
 * Cross-Case Correlation Engine
 *
 * Computes deep statistical patterns across the failure case database:
 * - Bias co-occurrence matrices (which biases appear together)
 * - Industry risk profiles (which industries show which patterns)
 * - Temporal analysis (how failure patterns evolve over time)
 * - Outcome severity predictors (which factors predict catastrophic vs. moderate failure)
 * - Context factor correlations (what conditions amplify failure)
 *
 * This is proprietary domain intelligence — the raw cases are public,
 * but these computed correlations and their weighting in the scoring
 * engine are the defensible IP layer.
 */

import { FAILURE_CASES as LEGACY_FAILURE_CASES, type FailureCase } from './failure-cases';
import {
  ALL_CASES,
  FAILURE_CASES as UNIFIED_FAILURE_CASES,
  SUCCESS_CASES,
  type CaseStudy,
  isFailureOutcome,
  isSuccessOutcome,
} from './case-studies';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BiasCooccurrenceEntry {
  biasA: string;
  biasB: string;
  count: number;
  /** Fraction of all cases where both appear */
  prevalence: number;
  /** Average impact score when both present */
  avgImpactWhenCombined: number;
  /** Average impact when only one is present */
  avgImpactBaseline: number;
  /** Amplification ratio: combined / baseline. >1 means the pair is worse together */
  amplificationRatio: number;
}

export interface IndustryRiskProfile {
  industry: string;
  caseCount: number;
  avgImpactScore: number;
  catastrophicRate: number;
  /** Top 5 biases by frequency in this industry */
  topBiases: Array<{ bias: string; frequency: number; avgImpact: number }>;
  /** Top 3 toxic patterns in this industry */
  topPatterns: Array<{ pattern: string; frequency: number; avgImpact: number }>;
  /** Most common context factors */
  contextProfile: {
    highStakesRate: number;
    dissentAbsentRate: number;
    timePressureRate: number;
    unanimousRate: number;
    avgParticipantCount: number;
  };
}

export interface TemporalPattern {
  decade: string;
  caseCount: number;
  avgImpactScore: number;
  catastrophicRate: number;
  /** Detection lag: avg years between failure and discovery */
  avgDetectionLag: number;
  dominantBiases: Array<{ bias: string; frequency: number }>;
  dominantPatterns: Array<{ pattern: string; frequency: number }>;
}

export interface SeverityPredictor {
  factor: string;
  category: 'bias' | 'context' | 'pattern' | 'structural';
  /** Correlation with catastrophic outcome (0-1, where 1 = perfect predictor) */
  catastrophicCorrelation: number;
  /** Average impact score when this factor is present */
  avgImpactPresent: number;
  /** Average impact score when absent */
  avgImpactAbsent: number;
  /** Lift: how much this factor increases expected severity */
  lift: number;
  samplePresent: number;
  sampleAbsent: number;
}

export interface ContextAmplifier {
  contextFactor: string;
  /** Average impact when this factor is true */
  avgImpactWithFactor: number;
  /** Average impact when this factor is false */
  avgImpactWithoutFactor: number;
  /** Cases with this factor */
  countWith: number;
  countWithout: number;
  /** Statistical lift */
  lift: number;
  /** Top biases that co-occur with this context factor */
  amplifiedBiases: Array<{ bias: string; frequency: number; avgImpact: number }>;
}

export interface BiasOutcomeDivergence {
  bias: string;
  /** Fraction of cases with this bias that had failure outcomes */
  failureRate: number;
  /** Fraction of cases with this bias that had success outcomes */
  successRate: number;
  /** How often this bias was actively managed in success cases */
  mitigationFrequency: number;
  /** Context conditions that separated success from failure */
  criticalMitigators: string[];
  failureSample: number;
  successSample: number;
}

export interface SuccessPatternCorrelation {
  pattern: string;
  frequency: number;
  avgPositiveImpact: number;
  requiredConditions: string[];
  associatedBiasesManaged: string[];
  sampleSize: number;
}

export interface CrossCaseCorrelations {
  totalCases: number;
  totalFailureCases: number;
  totalSuccessCases: number;
  /** Top bias pairs ranked by amplification ratio */
  biasCooccurrences: BiasCooccurrenceEntry[];
  /** Risk profile per industry */
  industryProfiles: IndustryRiskProfile[];
  /** Patterns across decades */
  temporalPatterns: TemporalPattern[];
  /** Factors most predictive of catastrophic outcomes */
  severityPredictors: SeverityPredictor[];
  /** How context factors amplify failure severity */
  contextAmplifiers: ContextAmplifier[];
  /** Per-bias divergence between failure and success outcomes */
  biasOutcomeDivergence: BiasOutcomeDivergence[];
  /** Beneficial patterns from success cases */
  successPatterns: SuccessPatternCorrelation[];
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

function computeBiasCooccurrences(cases: FailureCase[]): BiasCooccurrenceEntry[] {
  const pairStats = new Map<string, { count: number; totalImpact: number; cases: FailureCase[] }>();
  const biasImpact = new Map<string, { totalImpact: number; count: number }>();

  // Gather per-bias baselines
  for (const c of cases) {
    for (const bias of c.biasesPresent) {
      const entry = biasImpact.get(bias) ?? { totalImpact: 0, count: 0 };
      entry.totalImpact += c.impactScore;
      entry.count++;
      biasImpact.set(bias, entry);
    }
  }

  // Gather pair stats
  for (const c of cases) {
    const biases = [...new Set(c.biasesPresent)].sort();
    for (let i = 0; i < biases.length; i++) {
      for (let j = i + 1; j < biases.length; j++) {
        const key = `${biases[i]}::${biases[j]}`;
        const entry = pairStats.get(key) ?? { count: 0, totalImpact: 0, cases: [] };
        entry.count++;
        entry.totalImpact += c.impactScore;
        entry.cases.push(c);
        pairStats.set(key, entry);
      }
    }
  }

  const results: BiasCooccurrenceEntry[] = [];
  for (const [key, stats] of pairStats) {
    if (stats.count < 2) continue; // Need at least 2 cases to be meaningful
    const [biasA, biasB] = key.split('::');
    const avgCombined = stats.totalImpact / stats.count;

    // Baseline: average impact when either bias appears (without requiring the other)
    const baseA = biasImpact.get(biasA)!;
    const baseB = biasImpact.get(biasB)!;
    const avgBaseline = (baseA.totalImpact / baseA.count + baseB.totalImpact / baseB.count) / 2;

    results.push({
      biasA,
      biasB,
      count: stats.count,
      prevalence: Math.round((stats.count / cases.length) * 1000) / 1000,
      avgImpactWhenCombined: Math.round(avgCombined * 10) / 10,
      avgImpactBaseline: Math.round(avgBaseline * 10) / 10,
      amplificationRatio: Math.round((avgCombined / avgBaseline) * 100) / 100,
    });
  }

  return results.sort((a, b) => b.amplificationRatio - a.amplificationRatio);
}

function computeIndustryProfiles(cases: FailureCase[]): IndustryRiskProfile[] {
  const byIndustry = new Map<string, FailureCase[]>();
  for (const c of cases) {
    const list = byIndustry.get(c.industry) ?? [];
    list.push(c);
    byIndustry.set(c.industry, list);
  }

  return [...byIndustry.entries()]
    .map(([industry, industryCases]) => {
      const avgImpact = industryCases.reduce((s, c) => s + c.impactScore, 0) / industryCases.length;
      const catastrophicCount = industryCases.filter(
        c => c.outcome === 'catastrophic_failure'
      ).length;

      // Top biases
      const biasCounts = new Map<string, { count: number; totalImpact: number }>();
      for (const c of industryCases) {
        for (const bias of c.biasesPresent) {
          const entry = biasCounts.get(bias) ?? { count: 0, totalImpact: 0 };
          entry.count++;
          entry.totalImpact += c.impactScore;
          biasCounts.set(bias, entry);
        }
      }
      const topBiases = [...biasCounts.entries()]
        .map(([bias, s]) => ({
          bias,
          frequency: s.count / industryCases.length,
          avgImpact: Math.round((s.totalImpact / s.count) * 10) / 10,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      // Top patterns
      const patternCounts = new Map<string, { count: number; totalImpact: number }>();
      for (const c of industryCases) {
        for (const p of c.toxicCombinations) {
          const entry = patternCounts.get(p) ?? { count: 0, totalImpact: 0 };
          entry.count++;
          entry.totalImpact += c.impactScore;
          patternCounts.set(p, entry);
        }
      }
      const topPatterns = [...patternCounts.entries()]
        .map(([pattern, s]) => ({
          pattern,
          frequency: s.count / industryCases.length,
          avgImpact: Math.round((s.totalImpact / s.count) * 10) / 10,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3);

      // Context profile
      const highStakes = industryCases.filter(
        c =>
          c.contextFactors.monetaryStakes === 'very_high' ||
          c.contextFactors.monetaryStakes === 'high'
      ).length;
      const dissentAbsent = industryCases.filter(c => c.contextFactors.dissentAbsent).length;
      const timePressure = industryCases.filter(c => c.contextFactors.timePressure).length;
      const unanimous = industryCases.filter(c => c.contextFactors.unanimousConsensus).length;
      const avgParticipants =
        industryCases.reduce((s, c) => s + c.contextFactors.participantCount, 0) /
        industryCases.length;

      return {
        industry,
        caseCount: industryCases.length,
        avgImpactScore: Math.round(avgImpact * 10) / 10,
        catastrophicRate: Math.round((catastrophicCount / industryCases.length) * 100) / 100,
        topBiases,
        topPatterns,
        contextProfile: {
          highStakesRate: Math.round((highStakes / industryCases.length) * 100) / 100,
          dissentAbsentRate: Math.round((dissentAbsent / industryCases.length) * 100) / 100,
          timePressureRate: Math.round((timePressure / industryCases.length) * 100) / 100,
          unanimousRate: Math.round((unanimous / industryCases.length) * 100) / 100,
          avgParticipantCount: Math.round(avgParticipants * 10) / 10,
        },
      };
    })
    .sort((a, b) => b.avgImpactScore - a.avgImpactScore);
}

function computeTemporalPatterns(cases: FailureCase[]): TemporalPattern[] {
  const byDecade = new Map<string, FailureCase[]>();
  for (const c of cases) {
    const decade = `${Math.floor(c.year / 10) * 10}s`;
    const list = byDecade.get(decade) ?? [];
    list.push(c);
    byDecade.set(decade, list);
  }

  return [...byDecade.entries()]
    .map(([decade, decadeCases]) => {
      const avgImpact = decadeCases.reduce((s, c) => s + c.impactScore, 0) / decadeCases.length;
      const catastrophicCount = decadeCases.filter(
        c => c.outcome === 'catastrophic_failure'
      ).length;
      const avgLag =
        decadeCases.reduce((s, c) => s + (c.yearDiscovered - c.year), 0) / decadeCases.length;

      // Dominant biases
      const biasCounts = new Map<string, number>();
      for (const c of decadeCases) {
        for (const b of c.biasesPresent) {
          biasCounts.set(b, (biasCounts.get(b) ?? 0) + 1);
        }
      }
      const dominantBiases = [...biasCounts.entries()]
        .map(([bias, count]) => ({ bias, frequency: count / decadeCases.length }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      // Dominant patterns
      const patternCounts = new Map<string, number>();
      for (const c of decadeCases) {
        for (const p of c.toxicCombinations) {
          patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
        }
      }
      const dominantPatterns = [...patternCounts.entries()]
        .map(([pattern, count]) => ({ pattern, frequency: count / decadeCases.length }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3);

      return {
        decade,
        caseCount: decadeCases.length,
        avgImpactScore: Math.round(avgImpact * 10) / 10,
        catastrophicRate: Math.round((catastrophicCount / decadeCases.length) * 100) / 100,
        avgDetectionLag: Math.round(avgLag * 10) / 10,
        dominantBiases,
        dominantPatterns,
      };
    })
    .sort((a, b) => a.decade.localeCompare(b.decade));
}

function computeSeverityPredictors(cases: FailureCase[]): SeverityPredictor[] {
  const isCatastrophic = (c: FailureCase) => c.outcome === 'catastrophic_failure';
  const baseAvgImpact = cases.reduce((s, c) => s + c.impactScore, 0) / cases.length;
  const predictors: SeverityPredictor[] = [];

  // Bias predictors
  const allBiases = [...new Set(cases.flatMap(c => c.biasesPresent))];
  for (const bias of allBiases) {
    const withBias = cases.filter(c => c.biasesPresent.includes(bias));
    const withoutBias = cases.filter(c => !c.biasesPresent.includes(bias));
    if (withBias.length < 3 || withoutBias.length < 3) continue;

    const catRateWith = withBias.filter(isCatastrophic).length / withBias.length;
    const avgImpactWith = withBias.reduce((s, c) => s + c.impactScore, 0) / withBias.length;
    const avgImpactWithout =
      withoutBias.reduce((s, c) => s + c.impactScore, 0) / withoutBias.length;

    predictors.push({
      factor: bias,
      category: 'bias',
      catastrophicCorrelation: Math.round(catRateWith * 100) / 100,
      avgImpactPresent: Math.round(avgImpactWith * 10) / 10,
      avgImpactAbsent: Math.round(avgImpactWithout * 10) / 10,
      lift: Math.round((avgImpactWith / baseAvgImpact) * 100) / 100,
      samplePresent: withBias.length,
      sampleAbsent: withoutBias.length,
    });
  }

  // Pattern predictors
  const allPatterns = [...new Set(cases.flatMap(c => c.toxicCombinations))];
  for (const pattern of allPatterns) {
    const withPattern = cases.filter(c => c.toxicCombinations.includes(pattern));
    const withoutPattern = cases.filter(c => !c.toxicCombinations.includes(pattern));
    if (withPattern.length < 3) continue;

    const catRateWith = withPattern.filter(isCatastrophic).length / withPattern.length;
    const avgImpactWith = withPattern.reduce((s, c) => s + c.impactScore, 0) / withPattern.length;
    const avgImpactWithout =
      withoutPattern.length > 0
        ? withoutPattern.reduce((s, c) => s + c.impactScore, 0) / withoutPattern.length
        : baseAvgImpact;

    predictors.push({
      factor: pattern,
      category: 'pattern',
      catastrophicCorrelation: Math.round(catRateWith * 100) / 100,
      avgImpactPresent: Math.round(avgImpactWith * 10) / 10,
      avgImpactAbsent: Math.round(avgImpactWithout * 10) / 10,
      lift: Math.round((avgImpactWith / baseAvgImpact) * 100) / 100,
      samplePresent: withPattern.length,
      sampleAbsent: withoutPattern.length,
    });
  }

  // Context predictors
  const contextTests: Array<{ factor: string; test: (c: FailureCase) => boolean }> = [
    { factor: 'very_high_stakes', test: c => c.contextFactors.monetaryStakes === 'very_high' },
    { factor: 'dissent_absent', test: c => c.contextFactors.dissentAbsent },
    { factor: 'time_pressure', test: c => c.contextFactors.timePressure },
    { factor: 'unanimous_consensus', test: c => c.contextFactors.unanimousConsensus },
    { factor: 'small_group_<=8', test: c => c.contextFactors.participantCount <= 8 },
    { factor: 'large_group_>=25', test: c => c.contextFactors.participantCount >= 25 },
  ];

  for (const { factor, test } of contextTests) {
    const withFactor = cases.filter(test);
    const withoutFactor = cases.filter(c => !test(c));
    if (withFactor.length < 3 || withoutFactor.length < 3) continue;

    const catRateWith = withFactor.filter(isCatastrophic).length / withFactor.length;
    const avgImpactWith = withFactor.reduce((s, c) => s + c.impactScore, 0) / withFactor.length;
    const avgImpactWithout =
      withoutFactor.reduce((s, c) => s + c.impactScore, 0) / withoutFactor.length;

    predictors.push({
      factor,
      category: 'context',
      catastrophicCorrelation: Math.round(catRateWith * 100) / 100,
      avgImpactPresent: Math.round(avgImpactWith * 10) / 10,
      avgImpactAbsent: Math.round(avgImpactWithout * 10) / 10,
      lift: Math.round((avgImpactWith / baseAvgImpact) * 100) / 100,
      samplePresent: withFactor.length,
      sampleAbsent: withoutFactor.length,
    });
  }

  // Structural predictors
  const structuralTests: Array<{ factor: string; test: (c: FailureCase) => boolean }> = [
    { factor: 'detection_lag_>2yr', test: c => c.yearDiscovered - c.year > 2 },
    { factor: '5+_biases_present', test: c => c.biasesPresent.length >= 5 },
    { factor: '2+_toxic_patterns', test: c => c.toxicCombinations.length >= 2 },
    {
      factor: 'dissent_absent_AND_unanimous',
      test: c => c.contextFactors.dissentAbsent && c.contextFactors.unanimousConsensus,
    },
  ];

  for (const { factor, test } of structuralTests) {
    const withFactor = cases.filter(test);
    const withoutFactor = cases.filter(c => !test(c));
    if (withFactor.length < 3 || withoutFactor.length < 3) continue;

    const catRateWith = withFactor.filter(isCatastrophic).length / withFactor.length;
    const avgImpactWith = withFactor.reduce((s, c) => s + c.impactScore, 0) / withFactor.length;
    const avgImpactWithout =
      withoutFactor.reduce((s, c) => s + c.impactScore, 0) / withoutFactor.length;

    predictors.push({
      factor,
      category: 'structural',
      catastrophicCorrelation: Math.round(catRateWith * 100) / 100,
      avgImpactPresent: Math.round(avgImpactWith * 10) / 10,
      avgImpactAbsent: Math.round(avgImpactWithout * 10) / 10,
      lift: Math.round((avgImpactWith / baseAvgImpact) * 100) / 100,
      samplePresent: withFactor.length,
      sampleAbsent: withoutFactor.length,
    });
  }

  return predictors.sort((a, b) => b.lift - a.lift);
}

function computeContextAmplifiers(cases: FailureCase[]): ContextAmplifier[] {
  const factors: Array<{ name: string; test: (c: FailureCase) => boolean }> = [
    { name: 'dissent_absent', test: c => c.contextFactors.dissentAbsent },
    { name: 'time_pressure', test: c => c.contextFactors.timePressure },
    { name: 'unanimous_consensus', test: c => c.contextFactors.unanimousConsensus },
    { name: 'very_high_stakes', test: c => c.contextFactors.monetaryStakes === 'very_high' },
    { name: 'small_group', test: c => c.contextFactors.participantCount <= 8 },
  ];

  return factors
    .map(({ name, test }) => {
      const withFactor = cases.filter(test);
      const withoutFactor = cases.filter(c => !test(c));
      const avgWith =
        withFactor.length > 0
          ? withFactor.reduce((s, c) => s + c.impactScore, 0) / withFactor.length
          : 0;
      const avgWithout =
        withoutFactor.length > 0
          ? withoutFactor.reduce((s, c) => s + c.impactScore, 0) / withoutFactor.length
          : 0;

      // Find biases most amplified by this context
      const biasCounts = new Map<string, { count: number; totalImpact: number }>();
      for (const c of withFactor) {
        for (const bias of c.biasesPresent) {
          const entry = biasCounts.get(bias) ?? { count: 0, totalImpact: 0 };
          entry.count++;
          entry.totalImpact += c.impactScore;
          biasCounts.set(bias, entry);
        }
      }
      const amplifiedBiases = [...biasCounts.entries()]
        .map(([bias, s]) => ({
          bias,
          frequency: s.count / Math.max(withFactor.length, 1),
          avgImpact: Math.round((s.totalImpact / s.count) * 10) / 10,
        }))
        .sort((a, b) => b.avgImpact - a.avgImpact)
        .slice(0, 5);

      return {
        contextFactor: name,
        avgImpactWithFactor: Math.round(avgWith * 10) / 10,
        avgImpactWithoutFactor: Math.round(avgWithout * 10) / 10,
        countWith: withFactor.length,
        countWithout: withoutFactor.length,
        lift: avgWithout > 0 ? Math.round((avgWith / avgWithout) * 100) / 100 : 0,
        amplifiedBiases,
      };
    })
    .sort((a, b) => b.lift - a.lift);
}

// ---------------------------------------------------------------------------
// Success/Failure Divergence Analysis
// ---------------------------------------------------------------------------

function computeBiasOutcomeDivergence(allCases: CaseStudy[]): BiasOutcomeDivergence[] {
  const allBiases = [...new Set(allCases.flatMap(c => c.biasesPresent))];
  const results: BiasOutcomeDivergence[] = [];

  for (const bias of allBiases) {
    const casesWithBias = allCases.filter(c => c.biasesPresent.includes(bias));
    if (casesWithBias.length < 2) continue;

    const failures = casesWithBias.filter(c => isFailureOutcome(c.outcome));
    const successes = casesWithBias.filter(c => isSuccessOutcome(c.outcome));

    // How often was this bias managed in success cases?
    const managedInSuccesses = successes.filter(c => c.biasesManaged.includes(bias));
    const mitigationFrequency = successes.length > 0
      ? managedInSuccesses.length / successes.length
      : 0;

    // What mitigation factors appeared most in successes vs failures?
    const successMitigators = new Map<string, number>();
    for (const c of successes) {
      for (const factor of c.mitigationFactors) {
        successMitigators.set(factor, (successMitigators.get(factor) ?? 0) + 1);
      }
    }
    const criticalMitigators = [...successMitigators.entries()]
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([factor]) => factor);

    results.push({
      bias,
      failureRate: Math.round((failures.length / casesWithBias.length) * 100) / 100,
      successRate: Math.round((successes.length / casesWithBias.length) * 100) / 100,
      mitigationFrequency: Math.round(mitigationFrequency * 100) / 100,
      criticalMitigators,
      failureSample: failures.length,
      successSample: successes.length,
    });
  }

  // Sort by divergence (biases with highest failure:success ratio)
  return results.sort((a, b) => b.failureRate - a.failureRate);
}

function computeSuccessPatterns(successCases: CaseStudy[]): SuccessPatternCorrelation[] {
  const patternMap = new Map<string, CaseStudy[]>();

  for (const c of successCases) {
    for (const pattern of c.beneficialPatterns) {
      if (!patternMap.has(pattern)) patternMap.set(pattern, []);
      patternMap.get(pattern)!.push(c);
    }
  }

  return [...patternMap.entries()]
    .map(([pattern, cases]) => {
      const avgImpact = cases.reduce((s, c) => s + c.impactScore, 0) / cases.length;

      // Find required conditions (context factors common across cases)
      const conditions: string[] = [];
      const dissentRate = cases.filter(c => c.contextFactors.dissentEncouraged).length / cases.length;
      const advisorRate = cases.filter(c => c.contextFactors.externalAdvisors).length / cases.length;
      const iterativeRate = cases.filter(c => c.contextFactors.iterativeProcess).length / cases.length;
      if (dissentRate > 0.5) conditions.push('dissent_encouraged');
      if (advisorRate > 0.5) conditions.push('external_advisors');
      if (iterativeRate > 0.5) conditions.push('iterative_process');

      // Find biases managed across these cases
      const managedBiases = [...new Set(cases.flatMap(c => c.biasesManaged))];

      return {
        pattern,
        frequency: cases.length,
        avgPositiveImpact: Math.round(avgImpact * 10) / 10,
        requiredConditions: conditions,
        associatedBiasesManaged: managedBiases,
        sampleSize: cases.length,
      };
    })
    .sort((a, b) => b.avgPositiveImpact - a.avgPositiveImpact);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let _cached: CrossCaseCorrelations | null = null;

/**
 * Compute all cross-case correlations from the failure case database.
 * Results are cached after first computation since the case data is static.
 */
export function computeCrossCaseCorrelations(): CrossCaseCorrelations {
  if (_cached) return _cached;

  // Legacy failure cases for existing correlation functions
  const cases = LEGACY_FAILURE_CASES;

  _cached = {
    totalCases: ALL_CASES.length,
    totalFailureCases: UNIFIED_FAILURE_CASES.length,
    totalSuccessCases: SUCCESS_CASES.length,
    // Existing failure-based correlations (use legacy type for compatibility)
    biasCooccurrences: computeBiasCooccurrences(cases),
    industryProfiles: computeIndustryProfiles(cases),
    temporalPatterns: computeTemporalPatterns(cases),
    severityPredictors: computeSeverityPredictors(cases),
    contextAmplifiers: computeContextAmplifiers(cases),
    // New success/failure divergence analysis (uses unified type)
    biasOutcomeDivergence: computeBiasOutcomeDivergence(ALL_CASES),
    successPatterns: computeSuccessPatterns(SUCCESS_CASES),
  };

  return _cached;
}

/**
 * Get the top N most dangerous bias pairs by amplification ratio.
 */
export function getTopDangerousBiasPairs(n = 10): BiasCooccurrenceEntry[] {
  return computeCrossCaseCorrelations().biasCooccurrences.slice(0, n);
}

/**
 * Get the risk profile for a specific industry.
 */
export function getIndustryProfile(industry: string): IndustryRiskProfile | undefined {
  return computeCrossCaseCorrelations().industryProfiles.find(p => p.industry === industry);
}

/**
 * Get the top severity predictors by lift.
 */
export function getTopSeverityPredictors(n = 15): SeverityPredictor[] {
  return computeCrossCaseCorrelations().severityPredictors.slice(0, n);
}

/**
 * Given a set of detected biases and context factors, compute a
 * correlation-based risk multiplier from the case database.
 *
 * This is the key integration point with the compound scoring engine.
 */
export function computeCorrelationMultiplier(
  detectedBiases: string[],
  context: {
    monetaryStakes?: string;
    dissentAbsent?: boolean;
    timePressure?: boolean;
    unanimousConsensus?: boolean;
    participantCount?: number;
    dissentEncouraged?: boolean;
    externalAdvisors?: boolean;
    iterativeProcess?: boolean;
  }
): {
  multiplier: number;
  matchedPairs: BiasCooccurrenceEntry[];
  matchedPredictors: SeverityPredictor[];
  beneficialDamping: number;
  matchedSuccessPatterns: SuccessPatternCorrelation[];
} {
  const correlations = computeCrossCaseCorrelations();

  // Find all co-occurring bias pairs in the detected set
  const matchedPairs: BiasCooccurrenceEntry[] = [];
  const sortedBiases = [...new Set(detectedBiases)].sort();
  for (let i = 0; i < sortedBiases.length; i++) {
    for (let j = i + 1; j < sortedBiases.length; j++) {
      const match = correlations.biasCooccurrences.find(
        e => e.biasA === sortedBiases[i] && e.biasB === sortedBiases[j]
      );
      if (match) matchedPairs.push(match);
    }
  }

  // Find matching severity predictors
  const matchedPredictors: SeverityPredictor[] = [];
  for (const predictor of correlations.severityPredictors) {
    if (predictor.category === 'bias' && detectedBiases.includes(predictor.factor)) {
      matchedPredictors.push(predictor);
    }
    if (predictor.category === 'context') {
      if (predictor.factor === 'very_high_stakes' && context.monetaryStakes === 'very_high')
        matchedPredictors.push(predictor);
      if (predictor.factor === 'dissent_absent' && context.dissentAbsent)
        matchedPredictors.push(predictor);
      if (predictor.factor === 'time_pressure' && context.timePressure)
        matchedPredictors.push(predictor);
      if (predictor.factor === 'unanimous_consensus' && context.unanimousConsensus)
        matchedPredictors.push(predictor);
    }
    if (predictor.category === 'structural') {
      if (predictor.factor === '5+_biases_present' && detectedBiases.length >= 5)
        matchedPredictors.push(predictor);
    }
  }

  // Compute risk amplification from failure correlations
  let multiplier = 1.0;
  for (const pair of matchedPairs) {
    if (pair.amplificationRatio > 1.0) {
      multiplier += (pair.amplificationRatio - 1.0) * 0.1;
    }
  }
  for (const pred of matchedPredictors) {
    if (pred.category === 'context' && pred.lift > 1.0) {
      multiplier += (pred.lift - 1.0) * 0.05;
    }
  }

  // Compute beneficial damping from success pattern matches
  // When the context includes mitigation factors seen in success cases,
  // reduce the risk multiplier
  let beneficialDamping = 1.0;
  const matchedSuccessPatterns: SuccessPatternCorrelation[] = [];

  for (const sp of correlations.successPatterns) {
    // Check if detected biases overlap with biases managed in this success pattern
    const biasOverlap = sp.associatedBiasesManaged.filter(b =>
      detectedBiases.some(d => d.toLowerCase().replace(/\s+/g, '_') === b || d === b)
    );
    if (biasOverlap.length === 0) continue;

    // Check if context conditions match
    let contextMatch = 0;
    let contextTotal = sp.requiredConditions.length;
    for (const cond of sp.requiredConditions) {
      if (cond === 'dissent_encouraged' && context.dissentEncouraged) contextMatch++;
      if (cond === 'external_advisors' && context.externalAdvisors) contextMatch++;
      if (cond === 'iterative_process' && context.iterativeProcess) contextMatch++;
    }

    // Require at least one context condition match and one bias overlap
    if (contextTotal > 0 && contextMatch > 0) {
      matchedSuccessPatterns.push(sp);
      const matchStrength = (contextMatch / contextTotal) * (biasOverlap.length / sp.associatedBiasesManaged.length);
      beneficialDamping -= matchStrength * 0.15;
    }
  }

  // Also check bias outcome divergence: if a bias appears more in successes
  // with mitigation, reduce its risk contribution
  for (const divergence of correlations.biasOutcomeDivergence) {
    if (!detectedBiases.includes(divergence.bias)) continue;
    if (divergence.mitigationFrequency > 0.5) {
      // This bias is frequently managed in successes — check if mitigation context is present
      const hasMitigationContext =
        context.dissentEncouraged || context.externalAdvisors || context.iterativeProcess;
      if (hasMitigationContext) {
        beneficialDamping -= divergence.mitigationFrequency * 0.05;
      }
    }
  }

  beneficialDamping = Math.max(0.7, beneficialDamping);

  // Apply damping and cap
  multiplier = multiplier * beneficialDamping;
  multiplier = Math.max(0.7, Math.min(2.0, Math.round(multiplier * 100) / 100));

  return { multiplier, matchedPairs, matchedPredictors, beneficialDamping, matchedSuccessPatterns };
}
