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

/** A dated event in the run-up to (or aftermath of) the decision. */
export interface CaseTimelineEvent {
  /** ISO-like (`2007-03`, `2008-09-15`) or descriptive. */
  date: string;
  event: string;
  source?: string;
}

/** A named stakeholder and their role in the decision. */
export interface CaseStakeholder {
  name: string;
  role: string;
  position: 'advocate' | 'dissenter' | 'silent' | 'overruled' | 'unknown';
  notes?: string;
}

/** What a competent audit process would have recommended instead. */
export interface CaseCounterfactual {
  recommendation: string;
  rationale: string;
  estimatedOutcome?: string;
}

/** Hypothetical DQI score the platform would have assigned pre-decision. */
export interface CaseDqiEstimate {
  /** 0–100 — canonical scale matches `src/lib/scoring/dqi.ts`. */
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** 2–3 biases most responsible for the low score. */
  topBiases: string[];
  rationale?: string;
}

/** A primary-source citation backing a claim in the case. */
export interface CasePostMortemCitation {
  label: string;
  url?: string;
  excerpt?: string;
  year?: number;
}

/** Key quote from primary sources. */
export interface CaseKeyQuote {
  text: string;
  source: string;
  date?: string;
  speaker?: string;
}

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

  /** Key quotes from primary sources (optional). Tier 2 cases use `speaker`. */
  keyQuotes?: CaseKeyQuote[];

  /** Dated pre-decision signals. Tier 2 depth. */
  timeline?: CaseTimelineEvent[];

  /** Named board/exec participants and their positions. Tier 2 depth. */
  stakeholders?: CaseStakeholder[];

  /** What a decent audit process would have recommended. Tier 2 depth. */
  counterfactual?: CaseCounterfactual;

  /** Hypothetical DQI score pre-decision. Tier 2 depth. */
  dqiEstimate?: CaseDqiEstimate;

  /** Primary-source post-mortem citations. Tier 2 depth. */
  postMortemCitations?: CasePostMortemCitation[];

  /** IDs of other cases in this dataset that share a decision pattern. */
  relatedCases?: string[];

  /** Named archetype (e.g. "Founder Hubris + Capital Abundance"). */
  patternFamily?: string;

  /** Pre-decision evidence: the actual document/memo from BEFORE outcome was known.
   *  This eliminates hindsight bias — shows what the decision looked like at decision time,
   *  and what a Decision Intelligence platform would have flagged. */
  preDecisionEvidence?: {
    /** The memo, statement, or document excerpt from before the decision outcome */
    document: string;
    /** Source attribution for the pre-decision document */
    source: string;
    /** Date of the pre-decision document (ISO format or descriptive) */
    date: string;
    /** Type of pre-decision artifact */
    documentType:
      | 'board_memo'
      | 'press_release'
      | 'earnings_call'
      | 'internal_memo'
      | 'sec_filing'
      | 'public_statement'
      | 'strategy_document'
      | 'risk_assessment'
      | 'financial_report'
      | 'investor_deck';
    /** Red flags that were detectable AT DECISION TIME (without hindsight) */
    detectableRedFlags: string[];
    /** Biases that the platform would have flagged at decision time */
    flaggableBiases: string[];
    /** What the platform's analysis would have surfaced */
    hypotheticalAnalysis: string;
  };
}

/** Failure-only subset for backward compatibility with legacy data files */
export type FailureCaseOutcome = 'catastrophic_failure' | 'failure' | 'partial_failure';

export function isFailureOutcome(outcome: CaseOutcome): outcome is FailureCaseOutcome {
  return (
    outcome === 'catastrophic_failure' || outcome === 'failure' || outcome === 'partial_failure'
  );
}

export function isSuccessOutcome(outcome: CaseOutcome): boolean {
  return (
    outcome === 'success' || outcome === 'exceptional_success' || outcome === 'partial_success'
  );
}
