import { FAILURE_CASES, type FailureCase } from './failure-cases';

export interface SeedWeight {
  patternLabel: string;
  baseFailureRate: number;
  avgImpactScore: number;
  sampleSize: number;
  biasCooccurrence: Record<string, number>;
}

export function computeSeedWeights(): SeedWeight[] {
  const patternMap = new Map<string, FailureCase[]>();

  for (const c of FAILURE_CASES) {
    for (const pattern of c.toxicCombinations) {
      if (!patternMap.has(pattern)) patternMap.set(pattern, []);
      patternMap.get(pattern)!.push(c);
    }
  }

  return [...patternMap.entries()]
    .map(([label, cases]) => {
      const avgImpact = cases.reduce((s, c) => s + c.impactScore, 0) / cases.length;
      const biasCooccurrence: Record<string, number> = {};
      for (const c of cases) {
        for (let i = 0; i < c.biasesPresent.length; i++) {
          for (let j = i + 1; j < c.biasesPresent.length; j++) {
            const key = [c.biasesPresent[i], c.biasesPresent[j]].sort().join('::');
            biasCooccurrence[key] = (biasCooccurrence[key] ?? 0) + 1;
          }
        }
      }
      return {
        patternLabel: label,
        baseFailureRate: 1.0, // all cases in our DB are failures
        avgImpactScore: Math.round(avgImpact * 10) / 10,
        sampleSize: cases.length,
        biasCooccurrence,
      };
    })
    .sort((a, b) => b.avgImpactScore - a.avgImpactScore);
}

export function getSeedBiasCorrelations(): Record<string, { failureCorrelation: number; avgImpact: number; sampleSize: number }> {
  const biasStats: Record<string, { totalImpact: number; count: number }> = {};

  for (const c of FAILURE_CASES) {
    for (const bias of c.biasesPresent) {
      if (!biasStats[bias]) biasStats[bias] = { totalImpact: 0, count: 0 };
      biasStats[bias].totalImpact += c.impactScore;
      biasStats[bias].count++;
    }
  }

  const result: Record<string, { failureCorrelation: number; avgImpact: number; sampleSize: number }> = {};
  for (const [bias, stats] of Object.entries(biasStats)) {
    result[bias] = {
      failureCorrelation: 1.0, // all cases are failures by design
      avgImpact: Math.round((stats.totalImpact / stats.count) * 10) / 10,
      sampleSize: stats.count,
    };
  }
  return result;
}

export function getSeedInteractionWeights(): Record<string, number> {
  const pairCounts: Record<string, number> = {};

  for (const c of FAILURE_CASES) {
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
    result[pair] = Math.round((count / FAILURE_CASES.length) * 1000) / 1000;
  }
  return result;
}
