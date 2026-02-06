import { AnalysisResult, BiasDetectionResult } from '@/types';
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
    factCheckResult?: {
        score: number;
        flags: string[];
        searchSources?: string[];
        summary?: string;
        verifications?: any[];
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

    // Final Output
    finalReport?: AnalysisResult;

    // LangChain specific (optional for conversation history)
    messages?: BaseMessage[];
}
