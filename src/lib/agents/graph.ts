import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { structurerNode, biasDetectiveNode, noiseJudgeNode, riskScorerNode, gdprAnonymizerNode, factCheckerNode, preMortemNode, complianceMapperNode, sentimentAnalyzerNode } from "./nodes";
import { AnalysisResult } from '@/types';
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
    biasAnalysis: Annotation<any>({
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
    sentimentAnalysis: Annotation<{ score: number; label: string } | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    finalReport: Annotation<AnalysisResult | null>({
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
    .addNode("preMortem", preMortemNode)
    .addNode("complianceMapper", complianceMapperNode)
    .addNode("sentimentAnalyzer", sentimentAnalyzerNode)
    .addNode("riskScorer", riskScorerNode)

    .setEntryPoint("gdprAnonymizer")

    .addEdge("gdprAnonymizer", "structurer")
    .addEdge("structurer", "biasDetective")
    .addEdge("structurer", "noiseJudge")
    .addEdge("structurer", "factChecker")
    .addEdge("structurer", "preMortem")
    .addEdge("structurer", "complianceMapper")
    .addEdge("structurer", "sentimentAnalyzer")

    .addEdge("biasDetective", "riskScorer")
    .addEdge("noiseJudge", "riskScorer")
    .addEdge("factChecker", "riskScorer")
    .addEdge("preMortem", "riskScorer")
    .addEdge("complianceMapper", "riskScorer")
    .addEdge("sentimentAnalyzer", "riskScorer")

    .addEdge("riskScorer", END);

export const auditGraph = workflow.compile();
