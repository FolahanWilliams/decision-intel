export interface FailureCase {
  id: string;
  title: string;
  company: string;
  industry:
    | 'financial_services'
    | 'technology'
    | 'healthcare'
    | 'energy'
    | 'automotive'
    | 'retail'
    | 'aerospace'
    | 'government';
  year: number;
  yearDiscovered: number;
  summary: string;
  decisionContext: string;
  outcome: 'failure' | 'partial_failure' | 'catastrophic_failure';
  impactScore: number;
  estimatedLoss: string;
  biasesPresent: string[];
  primaryBias: string;
  toxicCombinations: string[];
  contextFactors: {
    monetaryStakes: 'low' | 'medium' | 'high' | 'very_high';
    dissentAbsent: boolean;
    timePressure: boolean;
    unanimousConsensus: boolean;
    participantCount: number;
  };
  lessonsLearned: string[];
  preDecisionEvidence?: {
    document: string;
    source: string;
    date: string;
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
    detectableRedFlags: string[];
    flaggableBiases: string[];
    hypotheticalAnalysis: string;
  };
  source: string;
  sourceType:
    | 'sec_filing'
    | 'ntsb_report'
    | 'fda_action'
    | 'fca_enforcement'
    | 'case_study'
    | 'post_mortem'
    | 'academic_paper'
    | 'news_investigation';

  // ---------- Tier 2 depth fields (optional — flow through adapter) ----------

  /** Key quotes from primary sources. */
  keyQuotes?: Array<{ text: string; source: string; date?: string; speaker?: string }>;

  /** Dated pre-decision signals. */
  timeline?: Array<{ date: string; event: string; source?: string }>;

  /** Named board/exec participants and their positions on the decision. */
  stakeholders?: Array<{
    name: string;
    role: string;
    position: 'advocate' | 'dissenter' | 'silent' | 'overruled' | 'unknown';
    notes?: string;
  }>;

  /** What a competent audit process would have recommended instead. */
  counterfactual?: {
    recommendation: string;
    rationale: string;
    estimatedOutcome?: string;
  };

  /** Hypothetical DQI score the platform would have assigned pre-decision. */
  dqiEstimate?: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    topBiases: string[];
    rationale?: string;
  };

  /** Primary-source post-mortem citations. */
  postMortemCitations?: Array<{
    label: string;
    url?: string;
    excerpt?: string;
    year?: number;
  }>;

  /** IDs of other cases that share a decision pattern. */
  relatedCases?: string[];

  /** Named archetype (e.g. "Founder Hubris + Capital Abundance"). */
  patternFamily?: string;
}
