import { StateGraph, END, Annotation } from '@langchain/langgraph';
import {
  structurerNode,
  biasDetectiveNode,
  noiseJudgeNode,
  riskScorerNode,
  gdprAnonymizerNode,
  verificationNode,
  deepAnalysisNode,
  simulationNode,
  intelligenceNode,
  metaJudgeNode,
  rpdRecognitionNode,
  forgottenQuestionsNode,
} from './nodes';
import {
  AnalysisResult,
  BiasDetectionResult,
  NoiseBenchmark,
  LogicalAnalysisResult,
  SwotAnalysisResult,
  CognitiveAnalysisResult,
  SimulationResult,
  InstitutionalMemoryResult,
  ComplianceResult,
  RecognitionCuesResult,
  NarrativePreMortem,
  ForgottenQuestionsResult,
} from '@/types';
import { type IntelligenceContext } from '@/lib/intelligence/contextBuilder';
import { type CrossDocContext } from '@/lib/rag/cross-document-context';

// Define the State using Annotation.Root
const GraphState = Annotation.Root({
  documentId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  orgId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  documentType: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  dealId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  dealType: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  dealStage: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  originalContent: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  anonymizationStatus: Annotation<'success' | 'failed' | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  structuredContent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  speakers: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  biasAnalysis: Annotation<BiasDetectionResult[]>({
    reducer: (x, y) => {
      const merged = [...(x || []), ...(y || [])];
      const seen = new Set<string>();
      return merged.filter(b => {
        const key = `${b.biasType}:${b.excerpt?.slice(0, 50) || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    default: () => [],
  }),
  noiseScores: Annotation<number[]>({
    reducer: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  }),
  noiseStats: Annotation<{ mean: number; stdDev: number; variance: number }>({
    reducer: (x, y) => y ?? x,
    default: () => ({ mean: 0, stdDev: 0, variance: 0 }),
  }),
  noiseBenchmarks: Annotation<NoiseBenchmark[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  factCheckResult: Annotation<{
    status: 'success' | 'error';
    score: number;
    flags: string[];
  } | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  preMortem: Annotation<{
    failureScenarios: string[];
    preventiveMeasures: string[];
    inversion?: string[];
    redTeam?: Array<{ objection: string; targetClaim: string; reasoning: string }>;
  } | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  compliance: Annotation<ComplianceResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  sentimentAnalysis: Annotation<{
    score: number;
    label: 'Positive' | 'Negative' | 'Neutral';
  } | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  logicalAnalysis: Annotation<LogicalAnalysisResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  swotAnalysis: Annotation<SwotAnalysisResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  finalReport: Annotation<AnalysisResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  cognitiveAnalysis: Annotation<CognitiveAnalysisResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  simulation: Annotation<SimulationResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  institutionalMemory: Annotation<InstitutionalMemoryResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  intelligenceContext: Annotation<IntelligenceContext | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  crossDocContext: Annotation<CrossDocContext | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  metaVerdict: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  recognitionCues: Annotation<RecognitionCuesResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  narrativePreMortem: Annotation<NarrativePreMortem | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  forgottenQuestions: Annotation<ForgottenQuestionsResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

// Routing function: only allow content into the analysis pipeline when
// anonymization explicitly succeeded.  Any other status (failed, undefined,
// unexpected value) short-circuits to riskScorer to prevent PII leakage.
function routeAfterAnonymization(state: typeof GraphState.State): string {
  if (state.anonymizationStatus === 'success') {
    return 'structurer';
  }
  return 'riskScorer';
}

// Graph Definition — Optimized Super-Node Architecture with Intelligence Layer
// Flow: gdprAnonymizer → structurer → intelligenceGatherer → 5 parallel analysis nodes → riskScorer
const workflow = new StateGraph(GraphState)
  .addNode('gdprAnonymizer', gdprAnonymizerNode)
  .addNode('structurer', structurerNode)
  .addNode('intelligenceGatherer', intelligenceNode) // Web intelligence context assembly
  .addNode('biasDetective', biasDetectiveNode)
  .addNode('noiseJudge', noiseJudgeNode)
  .addNode('verificationNode', verificationNode) // factChecker + complianceMapper
  .addNode('deepAnalysisNode', deepAnalysisNode) // linguistic + strategic + cognitiveDiversity
  .addNode('simulationNode', simulationNode) // decisionTwin + memoryRecall
  .addNode('rpdRecognitionNode', rpdRecognitionNode) // Klein RPD pattern recognition
  .addNode('forgottenQuestionsNode', forgottenQuestionsNode) // unknown-unknowns surface
  .addNode('metaJudgeNode', metaJudgeNode) // debate orchestration
  .addNode('riskScorer', riskScorerNode)

  .setEntryPoint('gdprAnonymizer')

  // SECURITY: Conditional edge — if anonymization fails, skip to riskScorer
  // to prevent PII from reaching external LLM APIs.
  .addConditionalEdges('gdprAnonymizer', routeAfterAnonymization, {
    structurer: 'structurer',
    riskScorer: 'riskScorer',
  })

  // structurer → intelligence gathering (extracts topics + assembles context)
  .addEdge('structurer', 'intelligenceGatherer')

  // Fan-out: intelligenceGatherer → 6 parallel super-nodes (all receive context via state)
  .addEdge('intelligenceGatherer', 'biasDetective')
  .addEdge('intelligenceGatherer', 'noiseJudge')
  .addEdge('intelligenceGatherer', 'verificationNode')
  .addEdge('intelligenceGatherer', 'deepAnalysisNode')
  .addEdge('intelligenceGatherer', 'simulationNode')
  .addEdge('intelligenceGatherer', 'rpdRecognitionNode')
  .addEdge('intelligenceGatherer', 'forgottenQuestionsNode')

  // Fan-in: 7 super-nodes → metaJudgeNode
  .addEdge('biasDetective', 'metaJudgeNode')
  .addEdge('noiseJudge', 'metaJudgeNode')
  .addEdge('verificationNode', 'metaJudgeNode')
  .addEdge('deepAnalysisNode', 'metaJudgeNode')
  .addEdge('simulationNode', 'metaJudgeNode')
  .addEdge('rpdRecognitionNode', 'metaJudgeNode')
  .addEdge('forgottenQuestionsNode', 'metaJudgeNode')

  // Meta Judge -> Final Risk Scorer
  .addEdge('metaJudgeNode', 'riskScorer')

  .addEdge('riskScorer', END);

export const auditGraph = workflow.compile();
