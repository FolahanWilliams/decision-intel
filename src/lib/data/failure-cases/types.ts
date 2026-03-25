export interface FailureCase {
  id: string;
  title: string;
  company: string;
  industry: 'financial_services' | 'technology' | 'healthcare' | 'energy' | 'automotive' | 'retail' | 'aerospace' | 'government';
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
  source: string;
  sourceType: 'sec_filing' | 'ntsb_report' | 'fda_action' | 'fca_enforcement' | 'case_study' | 'post_mortem' | 'academic_paper' | 'news_investigation';
}
