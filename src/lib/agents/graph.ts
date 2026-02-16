import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { structurerNode, biasDetectiveNode, noiseJudgeNode, riskScorerNode, gdprAnonymizerNode, factCheckerNode, complianceMapperNode, cognitiveDiversityNode, decisionTwinNode, memoryRecallNode, linguisticAnalysisNode, strategicAnalysisNode } from "./nodes";
import { AnalysisResult, BiasDetectionResult, LogicalAnalysisResult, SwotAnalysisResult, CognitiveAnalysisResult, SimulationResult, InstitutionalMemoryResult, ComplianceResult } from '@/types';

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
});

// Routing function: if GDPR anonymization failed, skip all analysis nodes
// and go straight to riskScorer which will generate an error report.
function routeAfterAnonymization(state: typeof GraphState.State): string {
    if (state.anonymizationStatus === 'failed') {
        return 'riskScorer';
    }
    return 'structurer';
}

// Graph Definition
const workflow = new StateGraph(GraphState)
    .addNode("gdprAnonymizer", gdprAnonymizerNode)
    .addNode("structurer", structurerNode)
    .addNode("biasDetective", biasDetectiveNode)
    .addNode("noiseJudge", noiseJudgeNode)
    .addNode("factChecker", factCheckerNode)
    .addNode("complianceMapper", complianceMapperNode)
    .addNode("cognitiveDiversity", cognitiveDiversityNode)
    .addNode("decisionTwin", decisionTwinNode)
    .addNode("memoryRecall", memoryRecallNode)
    .addNode("linguisticAnalysis", linguisticAnalysisNode)
    .addNode("strategicAnalysis", strategicAnalysisNode)
    .addNode("riskScorer", riskScorerNode)

    .setEntryPoint("gdprAnonymizer")

    // SECURITY: Conditional edge — if anonymization fails, skip to riskScorer
    // to prevent PII from reaching external LLM APIs.
    .addConditionalEdges("gdprAnonymizer", routeAfterAnonymization, {
        structurer: "structurer",
        riskScorer: "riskScorer",
    })

    .addEdge("structurer", "biasDetective")
    .addEdge("structurer", "noiseJudge")
    .addEdge("structurer", "factChecker")
    .addEdge("structurer", "complianceMapper")
    .addEdge("structurer", "cognitiveDiversity")
    .addEdge("structurer", "decisionTwin")
    .addEdge("structurer", "memoryRecall")
    .addEdge("structurer", "linguisticAnalysis")
    .addEdge("structurer", "strategicAnalysis")

    .addEdge("biasDetective", "riskScorer")
    .addEdge("noiseJudge", "riskScorer")
    .addEdge("factChecker", "riskScorer")
    .addEdge("complianceMapper", "riskScorer")
    .addEdge("cognitiveDiversity", "riskScorer")
    .addEdge("decisionTwin", "riskScorer")
    .addEdge("memoryRecall", "riskScorer")
    .addEdge("linguisticAnalysis", "riskScorer")
    .addEdge("strategicAnalysis", "riskScorer")


    .addEdge("riskScorer", END);

export const auditGraph = workflow.compile();
