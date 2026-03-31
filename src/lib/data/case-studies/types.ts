/**
 * Unified Case Study Type System
 *
 * Supports both failure and success case studies with a single type.
 * Backward-compatible with the existing FailureCase type — legacy data
 * files work via default spreading in the index.
 */

export type Industry =
  | 'financial_services'
  | 'technology'
  | 'healthcare'
  | 'energy'
  | 'automotive'
  | 'retail'
  | 'aerospace'
  | 'government'
  | 'entertainment'
  | 'media'
  | 'real_estate'
  | 'telecommunications'
  | 'manufacturing';

export type CaseOutcome =
  | 'catastrophic_failure'
  | 'failure'
  | 'partial_failure'
  | 'partial_success'
  | 'success'
  | 'exceptional_success';

export type SourceType =
  | 'sec_filing'
  | 'ntsb_report'
  | 'fda_action'
  | 'fca_enforcement'
  | 'case_study'
  | 'post_mortem'
  | 'academic_paper'
  | 'news_investigation'
  | 'earnings_call'
  | 'annual_report'
  | 'biography';

export interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: Industry;
  year: number;
  yearRealized: number;
  summary: string;
  decisionContext: string;
  outcome: CaseOutcome;
  impactScore: number;
  estimatedImpact: string;
  impactDirection: 'positive' | 'negative';

  // Bias analysis
  biasesPresent: string[];
  primaryBias: string;
  toxicCombinations: string[];
  beneficialPatterns: string[];

  // Success-specific: biases that were present but actively mitigated
  biasesManaged: string[];
  mitigationFactors: string[];
  survivorshipBiasRisk: 'low' | 'medium' | 'high';

  contextFactors: {
    monetaryStakes: 'low' | 'medium' | 'high' | 'very_high';
    dissentAbsent: boolean;
    timePressure: boolean;
    unanimousConsensus: boolean;
    participantCount: number;
    dissentEncouraged: boolean;
    externalAdvisors: boolean;
    iterativeProcess: boolean;
  };

  lessonsLearned: string[];
  source: string;
  sourceType: SourceType;

  /** Key quotes from primary sources (optional) */
  keyQuotes?: Array<{ text: string; source: string; date?: string }>;
}

/** Failure-only subset for backward compatibility with legacy data files */
export type FailureCaseOutcome = 'catastrophic_failure' | 'failure' | 'partial_failure';

export function isFailureOutcome(outcome: CaseOutcome): outcome is FailureCaseOutcome {
  return outcome === 'catastrophic_failure' || outcome === 'failure' || outcome === 'partial_failure';
}

export function isSuccessOutcome(outcome: CaseOutcome): boolean {
  return outcome === 'success' || outcome === 'exceptional_success' || outcome === 'partial_success';
}
