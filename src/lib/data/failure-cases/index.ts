import { FailureCase } from './types';
import { FINANCIAL_SERVICES_CASES } from './financial-services';
import { TECHNOLOGY_CASES } from './technology';
import { HEALTHCARE_CASES, ENERGY_INDUSTRIAL_CASES } from './healthcare-energy';

export type { FailureCase } from './types';

export const FAILURE_CASES: FailureCase[] = [
  ...FINANCIAL_SERVICES_CASES,
  ...TECHNOLOGY_CASES,
  ...HEALTHCARE_CASES,
  ...ENERGY_INDUSTRIAL_CASES,
];

export function getCasesByIndustry(industry: string): FailureCase[] {
  return FAILURE_CASES.filter((c) => c.industry === industry);
}

export function getCasesByBias(biasType: string): FailureCase[] {
  return FAILURE_CASES.filter((c) => c.biasesPresent.includes(biasType));
}

export function getCasesByToxicPattern(patternLabel: string): FailureCase[] {
  return FAILURE_CASES.filter((c) => c.toxicCombinations.includes(patternLabel));
}

export function searchCases(query: string): FailureCase[] {
  const q = query.toLowerCase();
  return FAILURE_CASES.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.decisionContext.toLowerCase().includes(q),
  );
}

export function getCaseStatistics() {
  const byIndustry: Record<string, number> = {};
  const byBias: Record<string, number> = {};
  const byPattern: Record<string, number> = {};

  for (const c of FAILURE_CASES) {
    byIndustry[c.industry] = (byIndustry[c.industry] ?? 0) + 1;
    for (const b of c.biasesPresent) {
      byBias[b] = (byBias[b] ?? 0) + 1;
    }
    for (const p of c.toxicCombinations) {
      byPattern[p] = (byPattern[p] ?? 0) + 1;
    }
  }

  return {
    totalCases: FAILURE_CASES.length,
    byIndustry,
    byBias: Object.entries(byBias).sort(([,a], [,b]) => b - a),
    byPattern: Object.entries(byPattern).sort(([,a], [,b]) => b - a),
  };
}
