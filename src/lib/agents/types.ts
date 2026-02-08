import { AnalysisResult, BiasDetectionResult, LogicalAnalysisResult, SwotAnalysisResult, CognitiveAnalysisResult, NoiseBenchmark, SimulationResult, InstitutionalMemoryResult, ComplianceResult } from '@/types';
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
        primaryTopic?: string;
        summary?: string;
        verifications?: Array<{
            claim: string;
            verdict: 'VERIFIED' | 'CONTRADICTED' | 'UNVERIFIABLE';
            explanation: string;
            sourceUrl?: string;
        }>;
    };
    preMortem?: {
        failureScenarios: string[];
        preventiveMeasures: string[];
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


    // Final Output
    finalReport?: AnalysisResult;

    // LangChain specific (optional for conversation history)
    messages?: BaseMessage[];
}
