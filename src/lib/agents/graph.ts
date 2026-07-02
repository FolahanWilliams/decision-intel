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
  synergyValidationNode,
  achNode,
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
import { type AchResult } from './ach';

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
  containerId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  containerKind: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  /// Legacy `dealType` value carried for compatibility with prompts +
  /// reference-class lookups that still key on it. Populated from
  /// DecisionContainer.dealType when kind === 'acquisition' OR derived
  /// from kind for the other modes.
  dealType: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  dealStage: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  /**
   * Blind retro mode (locked 2026-07-02): when true, every LIVE-data
   * channel is disabled — market enricher, news context, Google-Search
   * grounding on the grounded nodes, live benchmark verification — and
   * an as-of-the-document's-date discipline block is injected into the
   * reasoning prompts. Static prior knowledge (the case-study analog
   * library, the user's own RAG corpus) stays on. Makes the retro's
   * "found blind" claim defensible: no retrieval channel could have
   * leaked the outcome. Model training memory cannot be switched off —
   * the honest claim is "live retrieval disabled + every finding cites
   * the document's own language", never "the model couldn't know".
   */
  blindMode: Annotation<boolean>({
    reducer: (x, y) => y ?? x ?? false,
    default: () => false,
  }),
  /**
   * Degraded-node honesty ledger (locked 2026-07-02 — the Gemini-billing-
   * outage lesson). When a LOAD-BEARING detector node errors and falls to
   * its safe default (biasDetective → [], verification → error stub), the
   * node appends its name here so the persisted audit record can
   * DISTINGUISH "the detector ran and found nothing" from "the detector
   * was unavailable". Downstream surfaces must never render a node ERROR
   * as a clean pass — the exact plausible-defaults trap that let two
   * blind runs ship 0 bias findings while every Gemini call 403'd.
   */
  degradedNodes: Annotation<string[]>({
    reducer: (x, y) => [...(x ?? []), ...(y ?? [])],
    default: () => [],
  }),
  originalContent: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  /**
   * Type-aware structured parser output (locked 2026-05-09 hard-layer
   * ship · Proposal 1 + 4). Populated at audit-start time from
   * Document.parsedStructuredData. Read by synergyValidationNode to
   * compute the deterministic synergy defensibility summary; null when
   * the document type doesn't have a type-aware parser or extraction
   * bailed out.
   */
  parsedStructuredData: Annotation<unknown | null>({
    reducer: (x, y) => y ?? x ?? null,
    default: () => null,
  }),
  /**
   * Deterministic synergy defensibility computed by synergyValidationNode
   * (locked 2026-05-09 hard-layer ship · Proposal 4). Pure-function
   * pattern detection over parsedStructuredData — no LLM call. Downstream
   * nodes (metaJudge, biasDetective context) can read this for
   * structured signal alongside their LLM judgment paths. Null when
   * documentType !== 'synergy_model' OR parsedStructuredData absent.
   */
  synergyDefensibility: Annotation<unknown | null>({
    reducer: (x, y) => y ?? x ?? null,
    default: () => null,
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
  distillationNote: Annotation<string | null>({
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
  // ACH — competing-hypothesis analysis (the case the memo never argued against).
  ach: Annotation<AchResult | null>({
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
// Flow: gdprAnonymizer → structurer → intelligenceGatherer → 7 parallel analysis nodes → metaJudge → riskScorer
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
  // Synergy validation — pure-function, deterministic structural check
  // (locked 2026-05-09 hard-layer ship · Proposal 4). Reads
  // state.parsedStructuredData (set at audit-start time from
  // Document.parsedStructuredData when documentType === 'synergy_model'),
  // computes synergyDefensibility deterministically, writes to state.
  // No LLM call — runs in parallel with the LLM-driven analysis nodes
  // and finishes ~milliseconds. Downstream nodes can read state.
  // synergyDefensibility for structured signal alongside their LLM
  // judgment paths.
  .addNode('synergyValidationNode', synergyValidationNode)
  .addNode('achNode', achNode) // ACH — the case the memo never argued against
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

  // Fan-out: intelligenceGatherer → 8 parallel super-nodes (all receive
  // context via state). Bumped 7 → 8 with synergyValidationNode (locked
  // 2026-05-09 hard-layer ship · Proposal 4). The new node is pure-
  // function, milliseconds, no LLM call — adds no measurable latency
  // and runs only meaningful work when documentType === 'synergy_model'
  // and parsedStructuredData is populated.
  .addEdge('intelligenceGatherer', 'biasDetective')
  .addEdge('intelligenceGatherer', 'noiseJudge')
  .addEdge('intelligenceGatherer', 'verificationNode')
  .addEdge('intelligenceGatherer', 'deepAnalysisNode')
  .addEdge('intelligenceGatherer', 'simulationNode')
  .addEdge('intelligenceGatherer', 'rpdRecognitionNode')
  .addEdge('intelligenceGatherer', 'forgottenQuestionsNode')
  .addEdge('intelligenceGatherer', 'synergyValidationNode')
  .addEdge('intelligenceGatherer', 'achNode')

  // Fan-in: all 9 parallel super-nodes → metaJudgeNode
  .addEdge('biasDetective', 'metaJudgeNode')
  .addEdge('noiseJudge', 'metaJudgeNode')
  .addEdge('verificationNode', 'metaJudgeNode')
  .addEdge('deepAnalysisNode', 'metaJudgeNode')
  .addEdge('simulationNode', 'metaJudgeNode')
  .addEdge('rpdRecognitionNode', 'metaJudgeNode')
  .addEdge('forgottenQuestionsNode', 'metaJudgeNode')
  .addEdge('synergyValidationNode', 'metaJudgeNode')
  .addEdge('achNode', 'metaJudgeNode')

  // Meta Judge -> Final Risk Scorer
  .addEdge('metaJudgeNode', 'riskScorer')

  .addEdge('riskScorer', END);

export const auditGraph = workflow.compile();
