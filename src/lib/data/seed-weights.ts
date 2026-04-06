import { FAILURE_CASES as LEGACY_FAILURE_CASES } from './failure-cases';
import {
  ALL_CASES,
  FAILURE_CASES as UNIFIED_FAILURE_CASES,
  SUCCESS_CASES,
  type CaseStudy,
  isFailureOutcome,
  isSuccessOutcome,
} from './case-studies';

export interface SeedWeight {
  patternLabel: string;
  baseFailureRate: number;
  baseSuccessRate: number;
  avgImpactScore: number;
  avgPositiveImpactScore: number;
  sampleSize: number;
  biasCooccurrence: Record<string, number>;
}

export function computeSeedWeights(): SeedWeight[] {
  const patternMap = new Map<string, CaseStudy[]>();

  // Gather toxic combination patterns from ALL cases (failures will have them)
  for (const c of UNIFIED_FAILURE_CASES) {
    for (const pattern of c.toxicCombinations) {
      if (!patternMap.has(pattern)) patternMap.set(pattern, []);
      patternMap.get(pattern)!.push(c);
    }
  }

  // Check if any success cases reference these same patterns
  // (they won't have toxicCombinations but might share bias signatures)

  return [...patternMap.entries()]
    .map(([label, failureCases]) => {
      const avgImpact = failureCases.reduce((s, c) => s + c.impactScore, 0) / failureCases.length;

      // Find success cases that share the same bias combination
      const patternBiases = new Set(failureCases.flatMap(c => c.biasesPresent));
      const matchingSuccessCases = SUCCESS_CASES.filter(sc => {
        const overlap = sc.biasesPresent.filter(b => patternBiases.has(b));
        return overlap.length >= 2; // at least 2 shared biases
      });

      const totalCases = failureCases.length + matchingSuccessCases.length;
      const baseFailureRate =
        totalCases > 0 ? Math.round((failureCases.length / totalCases) * 1000) / 1000 : 1.0;
      const baseSuccessRate =
        totalCases > 0 ? Math.round((matchingSuccessCases.length / totalCases) * 1000) / 1000 : 0;
      const avgPositiveImpact =
        matchingSuccessCases.length > 0
          ? matchingSuccessCases.reduce((s, c) => s + c.impactScore, 0) /
            matchingSuccessCases.length
          : 0;

      const biasCooccurrence: Record<string, number> = {};
      for (const c of failureCases) {
        for (let i = 0; i < c.biasesPresent.length; i++) {
          for (let j = i + 1; j < c.biasesPresent.length; j++) {
            const key = [c.biasesPresent[i], c.biasesPresent[j]].sort().join('::');
            biasCooccurrence[key] = (biasCooccurrence[key] ?? 0) + 1;
          }
        }
      }
      return {
        patternLabel: label,
        baseFailureRate,
        baseSuccessRate,
        avgImpactScore: Math.round(avgImpact * 10) / 10,
        avgPositiveImpactScore: Math.round(avgPositiveImpact * 10) / 10,
        sampleSize: totalCases,
        biasCooccurrence,
      };
    })
    .sort((a, b) => b.avgImpactScore - a.avgImpactScore);
}

export function getSeedBiasCorrelations(): Record<
  string,
  { failureCorrelation: number; successCorrelation: number; avgImpact: number; sampleSize: number }
> {
  const biasStats: Record<
    string,
    { failureCount: number; successCount: number; totalImpact: number; totalCount: number }
  > = {};

  for (const c of ALL_CASES) {
    for (const bias of c.biasesPresent) {
      if (!biasStats[bias])
        biasStats[bias] = { failureCount: 0, successCount: 0, totalImpact: 0, totalCount: 0 };
      biasStats[bias].totalImpact += c.impactScore;
      biasStats[bias].totalCount++;
      if (isFailureOutcome(c.outcome)) biasStats[bias].failureCount++;
      if (isSuccessOutcome(c.outcome)) biasStats[bias].successCount++;
    }
  }

  const result: Record<
    string,
    {
      failureCorrelation: number;
      successCorrelation: number;
      avgImpact: number;
      sampleSize: number;
    }
  > = {};
  for (const [bias, stats] of Object.entries(biasStats)) {
    result[bias] = {
      failureCorrelation:
        stats.totalCount > 0
          ? Math.round((stats.failureCount / stats.totalCount) * 1000) / 1000
          : 1.0,
      successCorrelation:
        stats.totalCount > 0
          ? Math.round((stats.successCount / stats.totalCount) * 1000) / 1000
          : 0,
      avgImpact: Math.round((stats.totalImpact / stats.totalCount) * 10) / 10,
      sampleSize: stats.totalCount,
    };
  }
  return result;
}

export function getSeedSuccessCorrelations(): Record<
  string,
  { managedRate: number; avgPositiveImpact: number; sampleSize: number }
> {
  const biasStats: Record<
    string,
    { managedCount: number; totalImpact: number; totalCount: number }
  > = {};

  for (const c of SUCCESS_CASES) {
    for (const bias of c.biasesPresent) {
      if (!biasStats[bias]) biasStats[bias] = { managedCount: 0, totalImpact: 0, totalCount: 0 };
      biasStats[bias].totalImpact += c.impactScore;
      biasStats[bias].totalCount++;
      if (c.biasesManaged.includes(bias)) biasStats[bias].managedCount++;
    }
  }

  const result: Record<
    string,
    { managedRate: number; avgPositiveImpact: number; sampleSize: number }
  > = {};
  for (const [bias, stats] of Object.entries(biasStats)) {
    result[bias] = {
      managedRate:
        stats.totalCount > 0
          ? Math.round((stats.managedCount / stats.totalCount) * 1000) / 1000
          : 0,
      avgPositiveImpact: Math.round((stats.totalImpact / stats.totalCount) * 10) / 10,
      sampleSize: stats.totalCount,
    };
  }
  return result;
}

export function getSeedInteractionWeights(): Record<string, number> {
  const pairCounts: Record<string, number> = {};

  for (const c of LEGACY_FAILURE_CASES) {
    for (let i = 0; i < c.biasesPresent.length; i++) {
      for (let j = i + 1; j < c.biasesPresent.length; j++) {
        const key = [c.biasesPresent[i], c.biasesPresent[j]].sort().join('::');
        pairCounts[key] = (pairCounts[key] ?? 0) + 1;
      }
    }
  }

  // Normalize: weight = occurrences / total_cases
  const result: Record<string, number> = {};
  for (const [pair, count] of Object.entries(pairCounts)) {
    result[pair] = Math.round((count / LEGACY_FAILURE_CASES.length) * 1000) / 1000;
  }
  return result;
}
