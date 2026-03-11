import { AnalysisResult, BiasDetectionResult, LogicalAnalysisResult, SwotAnalysisResult, CognitiveAnalysisResult, NoiseBenchmark, SimulationResult, InstitutionalMemoryResult, ComplianceResult } from '@/types';
import { type IntelligenceContext } from '@/lib/intelligence/contextBuilder';

export interface AuditState {
    // Input
    documentId: string;
    userId: string;
    originalContent: string;

    // Pipeline safety — set by GDPR anonymizer to gate downstream processing
    anonymizationStatus?: 'success' | 'failed';

    // Internal Processing
    structuredContent?: string;
    speakers?: string[];

    // Web Intelligence Context — assembled after structuring, consumed by analysis nodes
    intelligenceContext?: IntelligenceContext;

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
        status: 'success' | 'error';
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
    } | null;
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
    metaVerdict?: string;

    // Final Output
    finalReport?: AnalysisResult;
}
