import { AnalysisResult } from '@/types';
import { BaseMessage } from "@langchain/core/messages";

export interface AuditState {
    // Input
    documentId: string;
    originalContent: string;

    // Internal Processing
    structuredContent?: string;
    speakers?: string[];

    // Agent Outputs
    biasAnalysis?: any;
    noiseScores?: number[];
    noiseStats?: {
        mean: number;
        stdDev: number;
        variance: number;
    };
    factCheckResult?: {
        score: number;
        flags: string[];
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
        label: string;
    };

    // Final Output
    finalReport?: AnalysisResult;

    // LangChain specific (optional for conversation history)
    messages?: BaseMessage[];
}
