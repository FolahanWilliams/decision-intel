import {
  AnalysisResult,
  BiasDetectionResult,
  LogicalAnalysisResult,
  SwotAnalysisResult,
  CognitiveAnalysisResult,
  NoiseBenchmark,
  SimulationResult,
  InstitutionalMemoryResult,
  ComplianceResult,
  RecognitionCuesResult,
  NarrativePreMortem,
  ForgottenQuestionsResult,
} from '@/types';
import { type IntelligenceContext } from '@/lib/intelligence/contextBuilder';
import { type CrossDocContext } from '@/lib/rag/cross-document-context';

export interface AuditState {
  // Input
  documentId: string;
  userId: string;
  orgId?: string;
  documentType?: string; // ic_memo | cim | pitch_deck | term_sheet | due_diligence | lp_report
  dealId?: string;
  dealType?: string; // buyout | growth_equity | venture | secondary | add_on | recapitalization
  dealStage?: string; // screening | due_diligence | ic_review | closing | portfolio | exited
  originalContent: string;

  // Pipeline safety — set by GDPR anonymizer to gate downstream processing
  anonymizationStatus?: 'success' | 'failed';

  // Internal Processing
  structuredContent?: string;
  speakers?: string[];

  // Web Intelligence Context — assembled after structuring, consumed by analysis nodes
  intelligenceContext?: IntelligenceContext;

  // Cross-Document RAG Context — related sections/docs from user's portfolio
  crossDocContext?: CrossDocContext;

  // Agent Outputs
  biasAnalysis?: BiasDetectionResult[];
  noiseScores?: number[];
  noiseStats?: {
    mean: number;
    stdDev: number;
    variance: number;
  };
  noiseBenchmarks?: NoiseBenchmark[];
  factCheckResult?: {
    status: 'success' | 'error';
    score: number;
    flags: string[];
    searchSources?: string[];
    primaryTopic?: string;
    summary?: string;
    verifications?: Array<{
      claim: string;
      verdict: 'VERIFIED' | 'CONTRADICTED' | 'UNVERIFIABLE';
      explanation: string;
      sourceUrl?: string;
    }>;
  } | null;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
    inversion?: string[];
    redTeam?: Array<{
      objection: string;
      targetClaim: string;
      reasoning: string;
    }>;
  };
  compliance?: ComplianceResult;
  sentimentAnalysis?: {
    score: number;
    label: 'Positive' | 'Negative' | 'Neutral';
  };

  // Phase 4 Extensions
  logicalAnalysis?: LogicalAnalysisResult;
  swotAnalysis?: SwotAnalysisResult;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  simulation?: SimulationResult;
  institutionalMemory?: InstitutionalMemoryResult;
  metaVerdict?: string;

  // Klein RPD Framework
  recognitionCues?: RecognitionCuesResult;
  narrativePreMortem?: NarrativePreMortem;

  // "Forgotten Questions" — unknown-unknowns the memo never asks
  forgottenQuestions?: ForgottenQuestionsResult;

  // Final Output
  finalReport?: AnalysisResult;
}
