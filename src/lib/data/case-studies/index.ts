/**
 * Unified Case Studies Index
 *
 * Combines legacy failure cases with new real-world failure and success cases.
 * Legacy FailureCase data is wrapped with default values for new fields.
 */

import { CaseStudy, CaseOutcome, isFailureOutcome, isSuccessOutcome } from './types';
import { FAILURE_CASES as LEGACY_FAILURE_CASES } from '../failure-cases';
import type { FailureCase as LegacyFailureCase } from '../failure-cases';
import { TECHNOLOGY_FAILURE_CASES } from './failures/technology-failures';
import { FINANCIAL_FAILURE_CASES } from './failures/financial-failures';
import { INDUSTRY_FAILURE_CASES } from './failures/industry-failures';
import { GOVERNMENT_FAILURE_CASES } from './failures/government-failures';
import { TECHNOLOGY_SUCCESS_CASES } from './successes/technology-successes';
import { INDUSTRY_SUCCESS_CASES } from './successes/industry-successes';
import { GOVERNMENT_SUCCESS_CASES } from './successes/government-successes';

export type { CaseStudy, CaseOutcome, Industry, SourceType } from './types';
export { isFailureOutcome, isSuccessOutcome } from './types';
export {
  slugify,
  getCaseBySlug,
  getCaseById,
  getSlugForCase,
  getAllCaseSlugs,
  getDeepCases,
} from './slugs';

// ---------------------------------------------------------------------------
// Legacy adapter: wrap FailureCase with defaults for new CaseStudy fields
// ---------------------------------------------------------------------------

function adaptLegacyCase(legacy: LegacyFailureCase): CaseStudy {
  return {
    ...legacy,
    yearRealized: legacy.yearDiscovered,
    estimatedImpact: legacy.estimatedLoss,
    impactDirection: 'negative' as const,
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low' as const,
    contextFactors: {
      ...legacy.contextFactors,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: false,
    },
    ...(legacy.preDecisionEvidence ? { preDecisionEvidence: legacy.preDecisionEvidence } : {}),
  };
}

const ADAPTED_LEGACY_CASES: CaseStudy[] = LEGACY_FAILURE_CASES.map(adaptLegacyCase);

// ---------------------------------------------------------------------------
// New real-world cases
// ---------------------------------------------------------------------------

const NEW_FAILURE_CASES: CaseStudy[] = [
  ...TECHNOLOGY_FAILURE_CASES,
  ...FINANCIAL_FAILURE_CASES,
  ...INDUSTRY_FAILURE_CASES,
  ...GOVERNMENT_FAILURE_CASES,
];

const NEW_SUCCESS_CASES: CaseStudy[] = [
  ...TECHNOLOGY_SUCCESS_CASES,
  ...INDUSTRY_SUCCESS_CASES,
  ...GOVERNMENT_SUCCESS_CASES,
];

// ---------------------------------------------------------------------------
// Combined exports
// ---------------------------------------------------------------------------

/** All failure cases (legacy + new) */
export const FAILURE_CASES: CaseStudy[] = [...ADAPTED_LEGACY_CASES, ...NEW_FAILURE_CASES];

/** All success cases */
export const SUCCESS_CASES: CaseStudy[] = [...NEW_SUCCESS_CASES];

/** Every case study in the database */
export const ALL_CASES: CaseStudy[] = [...FAILURE_CASES, ...SUCCESS_CASES];

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export function getCasesByIndustry(industry: string): CaseStudy[] {
  return ALL_CASES.filter(c => c.industry === industry);
}

export function getCasesByBias(biasType: string): CaseStudy[] {
  return ALL_CASES.filter(c => c.biasesPresent.includes(biasType));
}

export function getCasesByOutcome(outcome: CaseOutcome): CaseStudy[] {
  return ALL_CASES.filter(c => c.outcome === outcome);
}

export function getFailureCases(): CaseStudy[] {
  return ALL_CASES.filter(c => isFailureOutcome(c.outcome));
}

export function getSuccessCases(): CaseStudy[] {
  return ALL_CASES.filter(c => isSuccessOutcome(c.outcome));
}

export function getCasesByToxicPattern(patternLabel: string): CaseStudy[] {
  const normalized = patternLabel.replace(/^The\s+/i, '').toLowerCase();
  return ALL_CASES.filter(c =>
    c.toxicCombinations.some(p => p.replace(/^The\s+/i, '').toLowerCase() === normalized)
  );
}

export function getCasesByBeneficialPattern(patternLabel: string): CaseStudy[] {
  const normalized = patternLabel.replace(/^The\s+/i, '').toLowerCase();
  return ALL_CASES.filter(c =>
    c.beneficialPatterns.some(p => p.replace(/^The\s+/i, '').toLowerCase() === normalized)
  );
}

export function searchCases(query: string): CaseStudy[] {
  const q = query.toLowerCase();
  return ALL_CASES.filter(
    c =>
      c.title.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.decisionContext.toLowerCase().includes(q)
  );
}

export function getCaseStatistics() {
  const byIndustry: Record<string, number> = {};
  const byBias: Record<string, number> = {};
  const byPattern: Record<string, number> = {};
  const byBeneficialPattern: Record<string, number> = {};
  let failureCount = 0;
  let successCount = 0;

  for (const c of ALL_CASES) {
    byIndustry[c.industry] = (byIndustry[c.industry] ?? 0) + 1;

    if (isFailureOutcome(c.outcome)) failureCount++;
    if (isSuccessOutcome(c.outcome)) successCount++;

    for (const b of c.biasesPresent) {
      byBias[b] = (byBias[b] ?? 0) + 1;
    }
    for (const p of c.toxicCombinations) {
      byPattern[p] = (byPattern[p] ?? 0) + 1;
    }
    for (const p of c.beneficialPatterns) {
      byBeneficialPattern[p] = (byBeneficialPattern[p] ?? 0) + 1;
    }
  }

  return {
    totalCases: ALL_CASES.length,
    failureCount,
    successCount,
    byIndustry,
    byBias: Object.entries(byBias).sort(([, a], [, b]) => b - a),
    byPattern: Object.entries(byPattern).sort(([, a], [, b]) => b - a),
    byBeneficialPattern: Object.entries(byBeneficialPattern).sort(([, a], [, b]) => b - a),
  };
}
