import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { structurerNode, biasDetectiveNode, noiseJudgeNode, riskScorerNode, gdprAnonymizerNode, factCheckerNode, preMortemNode, complianceMapperNode, sentimentAnalyzerNode, logicalFallacyNode, strategicInsightNode, cognitiveDiversityNode, decisionTwinNode, memoryRecallNode } from "./nodes";
import { AnalysisResult, BiasDetectionResult, LogicalAnalysisResult, SwotAnalysisResult, CognitiveAnalysisResult, SimulationResult, InstitutionalMemoryResult, ComplianceResult } from '@/types';
import { BaseMessage } from "@langchain/core/messages";

// Define the State using Annotation.Root
const GraphState = Annotation.Root({
    documentId: Annotation<string>({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
    }),
    originalContent: Annotation<string>({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
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
    factCheckResult: Annotation<{ score: number; flags: string[] } | null>({
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
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => [...(x || []), ...(y || [])],
        default: () => [],
    }),
});

// Graph Definition
const workflow = new StateGraph(GraphState)
    .addNode("gdprAnonymizer", gdprAnonymizerNode)
    .addNode("structurer", structurerNode)
    .addNode("biasDetective", biasDetectiveNode)
    .addNode("noiseJudge", noiseJudgeNode)
    .addNode("factChecker", factCheckerNode)
    .addNode("preMortemAnalyzer", preMortemNode)
    .addNode("complianceMapper", complianceMapperNode)
    .addNode("sentimentAnalyzer", sentimentAnalyzerNode)
    .addNode("logicalFallacyScanner", logicalFallacyNode)
    .addNode("strategicInsight", strategicInsightNode)
    .addNode("cognitiveDiversity", cognitiveDiversityNode)
    .addNode("decisionTwin", decisionTwinNode)
    .addNode("memoryRecall", memoryRecallNode)
    .addNode("riskScorer", riskScorerNode)

    .setEntryPoint("gdprAnonymizer")

    .addEdge("gdprAnonymizer", "structurer")
    .addEdge("structurer", "biasDetective")
    .addEdge("structurer", "noiseJudge")
    .addEdge("structurer", "factChecker")
    .addEdge("structurer", "preMortemAnalyzer")
    .addEdge("structurer", "complianceMapper")
    .addEdge("structurer", "sentimentAnalyzer")
    .addEdge("structurer", "logicalFallacyScanner")
    .addEdge("structurer", "strategicInsight")
    .addEdge("structurer", "cognitiveDiversity")
    .addEdge("structurer", "decisionTwin")
    .addEdge("structurer", "memoryRecall")

    .addEdge("biasDetective", "riskScorer")
    .addEdge("noiseJudge", "riskScorer")
    .addEdge("factChecker", "riskScorer")
    .addEdge("preMortemAnalyzer", "riskScorer")
    .addEdge("complianceMapper", "riskScorer")
    .addEdge("sentimentAnalyzer", "riskScorer")
    .addEdge("logicalFallacyScanner", "riskScorer")
    .addEdge("strategicInsight", "riskScorer")
    .addEdge("cognitiveDiversity", "riskScorer")
    .addEdge("decisionTwin", "riskScorer")
    .addEdge("memoryRecall", "riskScorer")

    .addEdge("riskScorer", END);

export const auditGraph = workflow.compile();
