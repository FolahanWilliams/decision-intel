import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { structurerNode, biasDetectiveNode, noiseJudgeNode, riskScorerNode, gdprAnonymizerNode, verificationNode, deepAnalysisNode, simulationNode, intelligenceNode, metaJudgeNode } from "./nodes";
import { AnalysisResult, BiasDetectionResult, NoiseBenchmark, LogicalAnalysisResult, SwotAnalysisResult, CognitiveAnalysisResult, SimulationResult, InstitutionalMemoryResult, ComplianceResult } from '@/types';
import { type IntelligenceContext } from '@/lib/intelligence/contextBuilder';

// Define the State using Annotation.Root
const GraphState = Annotation.Root({
    documentId: Annotation<string>({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
    }),
    userId: Annotation<string>({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
    }),
    originalContent: Annotation<string>({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
    }),
    anonymizationStatus: Annotation<'success' | 'failed' | undefined>({
        reducer: (x, y) => y ?? x,
        default: () => undefined,
    }),
    structuredContent: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    speakers: Annotation<string[]>({
        reducer: (x, y) => y ?? x,
        default: () => [],
    }),
    biasAnalysis: Annotation<BiasDetectionResult[]>({
        reducer: (x, y) => [...(x || []), ...(y || [])],
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
    factCheckResult: Annotation<{ status: 'success' | 'error'; score: number; flags: string[] } | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    preMortem: Annotation<{ failureScenarios: string[]; preventiveMeasures: string[] } | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    compliance: Annotation<ComplianceResult | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    sentimentAnalysis: Annotation<{ score: number; label: 'Positive' | 'Negative' | 'Neutral' } | null>({
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
    .addNode("gdprAnonymizer", gdprAnonymizerNode)
    .addNode("structurer", structurerNode)
    .addNode("intelligenceGatherer", intelligenceNode)    // Web intelligence context assembly
    .addNode("biasDetective", biasDetectiveNode)
    .addNode("noiseJudge", noiseJudgeNode)
    .addNode("verificationNode", verificationNode)        // factChecker + complianceMapper
    .addNode("deepAnalysisNode", deepAnalysisNode)        // linguistic + strategic + cognitiveDiversity
    .addNode("simulationNode", simulationNode)            // decisionTwin + memoryRecall
    .addNode("metaJudgeNode", metaJudgeNode)              // debate orchestration
    .addNode("riskScorer", riskScorerNode)

    .setEntryPoint("gdprAnonymizer")

    // SECURITY: Conditional edge — if anonymization fails, skip to riskScorer
    // to prevent PII from reaching external LLM APIs.
    .addConditionalEdges("gdprAnonymizer", routeAfterAnonymization, {
        structurer: "structurer",
        riskScorer: "riskScorer",
    })

    // structurer → intelligence gathering (extracts topics + assembles context)
    .addEdge("structurer", "intelligenceGatherer")

    // Fan-out: intelligenceGatherer → 5 parallel super-nodes (all receive context via state)
    .addEdge("intelligenceGatherer", "biasDetective")
    .addEdge("intelligenceGatherer", "noiseJudge")
    .addEdge("intelligenceGatherer", "verificationNode")
    .addEdge("intelligenceGatherer", "deepAnalysisNode")
    .addEdge("intelligenceGatherer", "simulationNode")

    // Fan-in: 5 super-nodes → metaJudgeNode
    .addEdge("biasDetective", "metaJudgeNode")
    .addEdge("noiseJudge", "metaJudgeNode")
    .addEdge("verificationNode", "metaJudgeNode")
    .addEdge("deepAnalysisNode", "metaJudgeNode")
    .addEdge("simulationNode", "metaJudgeNode")

    // Meta Judge -> Final Risk Scorer
    .addEdge("metaJudgeNode", "riskScorer")

    .addEdge("riskScorer", END);

export const auditGraph = workflow.compile();

