import { AnalysisResult, BiasDetectionResult, LogicalAnalysisResult, SwotAnalysisResult, CognitiveAnalysisResult, NoiseBenchmark } from '@/types';
import { BaseMessage } from "@langchain/core/messages";

export interface AuditState {
    // Input
    documentId: string;
    originalContent: string;

    // Internal Processing
    structuredContent?: string;
    speakers?: string[];

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
        score: number;
        flags: string[];
        searchSources?: string[];
        summary?: string;
        verifications?: { claim: string; result: string; source?: string }[];
    };
    preMortem?: {
        failureScenarios: string[];
        preventiveMeasures: string[];
    };
    compliance?: {
        status: "PASS" | "WARN" | "FAIL";
        details: string;
    };
    sentimentAnalysis?: {
        score: number;
        label: 'Positive' | 'Negative' | 'Neutral';
    };

    // Phase 4 Extensions
    logicalAnalysis?: LogicalAnalysisResult;
    swotAnalysis?: SwotAnalysisResult;
    cognitiveAnalysis?: CognitiveAnalysisResult;


    // Final Output
    finalReport?: AnalysisResult;

    // LangChain specific (optional for conversation history)
    messages?: BaseMessage[];
}
