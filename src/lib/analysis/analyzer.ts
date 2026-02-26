import { prisma } from '@/lib/prisma';
import { AnalysisResult, BiasDetectionResult } from '@/types';
import { safeJsonClone } from '@/lib/utils/json';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { Document } from '@prisma/client';
import { getCachedAnalysis, cacheAnalysis, generateAnalysisCacheKey } from '@/lib/utils/cache';
import { validateContent } from '@/lib/utils/resilience';
import { createLogger } from '@/lib/utils/logger';

import { z } from 'zod';

const log = createLogger('Analyzer');

export interface ProgressUpdate {
    type: 'step' | 'bias' | 'noise' | 'summary' | 'complete' | 'error';
    step?: string;
    description?: string;
    status?: 'running' | 'complete' | 'error';
    biasType?: string;
    result?: unknown;
    message?: string;
    progress: number;
}

// Zod Schemas for Data Validation
const NoiseStatsSchema = z.object({
    mean: z.number().default(0),
    stdDev: z.number().default(0),
    variance: z.number().default(0)
}).default({ mean: 0, stdDev: 0, variance: 0 });

const FactCheckSchema = z.object({
    score: z.number().default(0),
    summary: z.string().default('Unavailable'),
    verifications: z.array(z.record(z.string(), z.unknown())).default([]),
    flags: z.array(z.string()).default([])
}).default({ score: 0, summary: 'Unavailable', verifications: [], flags: [] });

const ComplianceSchema = z.object({
    status: z.string().default('WARN'),
    riskScore: z.number().default(0),
    summary: z.string().default('Compliance check unavailable'),
    regulations: z.array(z.record(z.string(), z.unknown())).default([])
}).default({ status: 'WARN', riskScore: 0, summary: 'Compliance check unavailable', regulations: [] });

const SentimentSchema = z.object({
    score: z.number().default(0),
    label: z.string().default('Neutral')
}).default({ score: 0, label: 'Neutral' });

const LogicalSchema = z.object({
    score: z.number().default(100),
    fallacies: z.array(z.record(z.string(), z.unknown())).default([])
}).default({ score: 100, fallacies: [] });

const SwotSchema = z.object({
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    opportunities: z.array(z.string()).default([]),
    threats: z.array(z.string()).default([]),
    advice: z.string().default('')
}).optional();

const CognitiveSchema = z.object({
    blindSpotGap: z.number().default(0),
    blindSpots: z.array(z.object({
        name: z.string(),
        description: z.string()
    })).default([]),
    counterArguments: z.array(z.record(z.string(), z.unknown())).default([])
}).optional();

const SimulationSchema = z.object({
    overallVerdict: z.string().default('Neutral'),
    twins: z.array(z.record(z.string(), z.unknown())).default([])
}).optional();

const MemorySchema = z.object({
    recallScore: z.number().default(0),
    similarEvents: z.array(z.record(z.string(), z.unknown())).default([])
}).optional();


export async function analyzeDocument(
    documentOrId: string | Document,
    onProgress?: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {
    let document: Document;
    let documentId: string;

    if (typeof documentOrId === 'string') {
        documentId = documentOrId;
        const fetched = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!fetched) {
            throw new Error(`Document ${documentId} not found`);
        }
        document = fetched;
    } else {
        document = documentOrId;
        documentId = document.id;
    }

    // Validate content before analysis
    const validation = validateContent(document.content);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Check cache first
    const cacheKey = generateAnalysisCacheKey(document.content, document.userId);
    const cached = await getCachedAnalysis(cacheKey);

    if (cached) {
        log.info('Cache hit for analysis: ' + cacheKey.substring(0, 16));
        if (onProgress) {
            onProgress({ type: 'step', step: 'Retrieved from cache', status: 'complete', progress: 100 });
        }
        return cached as unknown as AnalysisResult;
    }

    // Run analysis within a transaction for atomicity
    try {
        const result = await runAnalysis(document.content, documentId, document.userId, (update) => {
            if (onProgress) onProgress(update);
        });

        // Store analysis in database with Schema Drift Protection
        const foundBiases = result.biases.filter(b => b.found);

        // Try saving with ALL fields first. If the DB is missing newer
        // columns (schema drift / P2022), the transaction is poisoned —
        // PostgreSQL rejects every subsequent command in the same transaction
        // block. So the fallback MUST run in a separate transaction.
        await prisma.document.update({
            where: { id: documentId },
            data: { status: 'analyzing' }
        });

        let schemaDrift = false;
        try {
            await prisma.$transaction(async (tx) => {
                await tx.analysis.create({
                    data: {
                        documentId,
                        overallScore: result.overallScore,
                        noiseScore: result.noiseScore,
                        summary: result.summary,
                        modelVersion: process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview',
                        biases: {
                            create: foundBiases.map(bias => ({
                                biasType: bias.biasType,
                                severity: bias.severity,
                                excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                                explanation: bias.explanation || '',
                                suggestion: bias.suggestion || '',
                                confidence: bias.confidence || 0.0
                            }))
                        },
                        // New Fields (May cause P2022 if DB not migrated)
                        structuredContent: result.structuredContent || '',
                        noiseStats: toPrismaJson(NoiseStatsSchema.safeParse(result.noiseStats).success ? result.noiseStats : NoiseStatsSchema.parse({})),
                        noiseBenchmarks: toPrismaJson(result.noiseBenchmarks ?? []),
                        factCheck: toPrismaJson(FactCheckSchema.safeParse(result.factCheck).success ? result.factCheck : FactCheckSchema.parse({})),
                        compliance: toPrismaJson(ComplianceSchema.safeParse(result.compliance).success ? result.compliance : ComplianceSchema.parse({})),
                        preMortem: toPrismaJson(result.preMortem),
                        sentiment: toPrismaJson(SentimentSchema.safeParse(result.sentiment).success ? result.sentiment : SentimentSchema.parse({})),
                        speakers: result.speakers || [],
                        // Phase 4 Extensions
                        logicalAnalysis: toPrismaJson(LogicalSchema.safeParse(result.logicalAnalysis).success ? result.logicalAnalysis : LogicalSchema.parse({})),
                        swotAnalysis: toPrismaJson(SwotSchema.safeParse(result.swotAnalysis).data),
                        cognitiveAnalysis: toPrismaJson(CognitiveSchema.safeParse(result.cognitiveAnalysis).data),
                        simulation: toPrismaJson(SimulationSchema.safeParse(result.simulation).data),
                        institutionalMemory: toPrismaJson(MemorySchema.safeParse(result.institutionalMemory).data),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required: schema drift protection demands flexible Prisma data shape
                    } as any
                });

                await tx.document.update({
                    where: { id: documentId },
                    data: { status: 'complete' }
                });
            });
        } catch (dbError: unknown) {
            const prismaError = dbError as { code?: string; message?: string };
            if (prismaError.code === 'P2021' || prismaError.code === 'P2022' || prismaError.message?.includes('does not exist')) {
                log.warn('Schema drift detected. Retrying save with CORE fields only: ' + prismaError.code);
                schemaDrift = true;
            } else {
                throw dbError;
            }
        }

        if (schemaDrift) {
            await prisma.$transaction(async (tx) => {
                await tx.analysis.create({
                    data: {
                        documentId,
                        overallScore: result.overallScore,
                        noiseScore: result.noiseScore,
                        summary: result.summary,
                        biases: {
                            create: foundBiases.map(bias => ({
                                biasType: bias.biasType,
                                severity: bias.severity,
                                excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                                explanation: bias.explanation || '',
                                suggestion: bias.suggestion || '',
                                confidence: bias.confidence || 0.0
                            }))
                        }
                    },
                    select: { id: true }
                });

                await tx.document.update({
                    where: { id: documentId },
                    data: { status: 'complete' }
                });
            });
        }

        // Store embedding for RAG (non-blocking)
        try {
            const { storeAnalysisEmbedding } = await import('@/lib/rag/embeddings');
            await storeAnalysisEmbedding(
                documentId,
                document.filename,
                result.summary,
                foundBiases.map(b => ({
                    biasType: b.biasType,
                    severity: b.severity,
                    explanation: b.explanation || ''
                })),
                result.overallScore
            );
        } catch (embeddingError) {
            log.warn('Failed to store embedding (non-critical): ' + (embeddingError instanceof Error ? embeddingError.message : String(embeddingError)));
        }

        // Cache the result for future use (non-blocking)
        try {
            await cacheAnalysis(cacheKey, result as unknown as Record<string, unknown>);
        } catch (cacheError) {
            log.warn('Failed to cache analysis (non-critical): ' + (cacheError instanceof Error ? cacheError.message : String(cacheError)));
        }

        if (onProgress) {
            onProgress({ type: 'complete', progress: 100, result });
        }

        return result;
    } catch (error) {
        // Update document status to error
        await prisma.document.update({
            where: { id: documentId },
            data: { status: 'error' }
        });
        throw error;
    }
}

// Lazy singleton for the graph
let graphInstance: typeof import('@/lib/agents/graph').auditGraph | null = null;

export async function getGraph() {
    if (!graphInstance) {
        // Lazy load graph to avoid circular deps or init issues
        const { auditGraph } = await import('@/lib/agents/graph');
        graphInstance = auditGraph;
    }
    return graphInstance;
}

export async function runAnalysis(
    content: string,
    documentId: string,
    userId: string,
    onProgress?: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {

    const auditGraph = await getGraph();

    // Send step-by-step progress updates
    const sendStep = (step: string, status: 'running' | 'complete', progress: number) => {
        if (onProgress) onProgress({ type: 'step', step, status, progress });
    };

    // Map agent node names to human-readable labels (must match graph.ts nodes)
    const NODE_LABELS: Record<string, string> = {
        'gdprAnonymizer': 'Privacy Protection',
        'structurer': 'Document Parsing',
        'biasDetective': 'Bias Detection',
        'noiseJudge': 'Noise Analysis',
        'factChecker': 'Financial Fact Check',
        'complianceMapper': 'Compliance Check',
        'cognitiveDiversity': 'Cognitive Diversity (Red Team)',
        'decisionTwin': 'Decision Simulation',
        'memoryRecall': 'Institutional Memory',
        'linguisticAnalysis': 'Sentiment & Logic Analysis',
        'strategicAnalysis': 'Strategic Analysis',
        'riskScorer': 'Final Risk Scoring'
    };

    // Initial step
    sendStep('Initializing audit pipeline', 'running', 5);

    let result;
    try {
        // Use streamEvents for real-time node tracking (Check if method exists for test resilience)
        const eventStream = (typeof auditGraph.streamEvents === 'function')
            ? auditGraph.streamEvents(
                { originalContent: content, documentId: documentId, userId: userId },
                { version: 'v2' }
            )
            : null;

        if (eventStream) {
            // Track completed nodes for progress calculation
            const completedNodes = new Set<string>();
            const totalNodes = Object.keys(NODE_LABELS).length;

            // Capture the final output from the root graph end event
            for await (const event of eventStream) {
                // Track node start events
                if (event.event === 'on_chain_start' && event.name && NODE_LABELS[event.name]) {
                    const label = NODE_LABELS[event.name];
                    sendStep(label, 'running', Math.round((completedNodes.size / totalNodes) * 80) + 10);
                }

                // Track node end events
                if (event.event === 'on_chain_end') {
                    // Check for root graph completion
                    if (event.name === 'LangGraph') {
                        result = event.data.output;
                    }
                    else if (event.name && NODE_LABELS[event.name]) {
                        completedNodes.add(event.name);
                        const label = NODE_LABELS[event.name];
                        const progress = Math.round((completedNodes.size / totalNodes) * 80) + 10;
                        sendStep(label, 'complete', progress);

                        // Send bias detection updates specifically
                        if (event.name === 'biasDetective' && event.data?.output?.biasAnalysis) {
                            const biases = event.data.output.biasAnalysis;
                            for (const bias of biases) {
                                if (bias.biasType && onProgress) {
                                    onProgress({
                                        type: 'bias',
                                        biasType: bias.biasType,
                                        progress,
                                        result: { found: true, severity: bias.severity }
                                    });
                                }
                            }
                        }

                        // Send noise analysis updates
                        if (event.name === 'noiseJudge' && event.data?.output?.noiseStats) {
                            if (onProgress) {
                                onProgress({
                                    type: 'noise',
                                    progress,
                                    result: { score: event.data.output.noiseStats.mean }
                                });
                            }
                        }
                    }
                }
            }
        }

        if (!result) {
            // Fallback to non-streaming invoke if stream didn't yield result
            throw new Error("Stream did not return a final result");
        }

    } catch (error) {
        log.error('Streaming error, falling back to invoke:', error);
        // Fallback to non-streaming invoke if streaming fails
        sendStep('Processing document', 'running', 50);

        // Fallback timeout: aligned with maxDuration (300s) minus overhead
        const FALLBACK_TIMEOUT_MS = 240000; // 240 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Analysis timed out after ${FALLBACK_TIMEOUT_MS / 1000} seconds`)), FALLBACK_TIMEOUT_MS)
        );

        try {
            result = await Promise.race([
                auditGraph.invoke({
                    originalContent: content,
                    documentId: documentId,
                    userId: userId,
                }),
                timeoutPromise
            ]) as { finalReport: Record<string, unknown> };
        } catch (timeoutError) {
            log.error('Analysis timeout:', timeoutError);
            throw new Error("Analysis timed out. Please try again or contact support if the issue persists.");
        }
    }

    sendStep('Finalizing report', 'running', 95);

    if (!result.finalReport) {
        throw new Error("Audit Pipeline failed to generate a report");
    }

    // Ensure plain serializable object (removes Map, Set, Circular refs)
    result.finalReport = safeJsonClone(result.finalReport);

    if (!result.finalReport) {
        throw new Error("Report corrupted during normalization");
    }

    // Adapt to UI expected structure
    // Ensure all biased findings are marked as "found"
    const finalReport = {
        ...result.finalReport,
        overallScore: result.finalReport.overallScore || 0,
        biases: (result.finalReport.biases || []).map((b: BiasDetectionResult) => ({ ...b, found: true }))
    };

    return finalReport;
}