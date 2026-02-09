import { NextRequest, NextResponse } from 'next/server';
import { getGraph, ProgressUpdate } from '@/lib/analysis/analyzer';
import { formatSSE } from '@/lib/sse';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { safeJsonClone } from '@/lib/utils/json';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { z } from 'zod';

// Reuse schemas from analyzer (or move to shared file)
const NoiseStatsSchema = z.object({
    mean: z.number().default(0),
    stdDev: z.number().default(0),
    variance: z.number().default(0)
}).default({ mean: 0, stdDev: 0, variance: 0 });

const FactCheckSchema = z.object({
    score: z.number().default(0),
    summary: z.string().default('Unavailable'),
    verifications: z.array(z.any()).default([]),
    flags: z.array(z.string()).default([])
}).default({ score: 0, summary: 'Unavailable', verifications: [], flags: [] });

const ComplianceSchema = z.object({
    status: z.string().default('WARN'),
    riskScore: z.number().default(0),
    summary: z.string().default('Compliance check unavailable'),
    regulations: z.array(z.any()).default([])
}).default({ status: 'WARN', riskScore: 0, summary: 'Compliance check unavailable', regulations: [] });

const SentimentSchema = z.object({
    score: z.number().default(0),
    label: z.string().default('Neutral')
}).default({ score: 0, label: 'Neutral' });

const LogicalSchema = z.object({
    score: z.number().default(100),
    fallacies: z.array(z.any()).default([])
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
    counterArguments: z.array(z.any()).default([])
}).optional();

const SimulationSchema = z.object({
    overallVerdict: z.string().default('Neutral'),
    twins: z.array(z.any()).default([])
}).optional();

const MemorySchema = z.object({
    recallScore: z.number().default(0),
    similarEvents: z.array(z.any()).default([])
}).optional();

// Map agent node names to human-readable labels
const NODE_LABELS: Record<string, string> = {
    'gdprAnonymizer': 'Privacy Protection',
    'structurer': 'Document Parsing',
    'biasDetective': 'Bias Detection',
    'noiseJudge': 'Noise Analysis',
    'factChecker': 'Financial Fact Check',
    'preMortemAnalyzer': 'Pre-Mortem Analysis',
    'complianceMapper': 'Compliance Check',
    'sentimentAnalyzer': 'Sentiment Analysis',
    'logicalFallacyScanner': 'Logical Analysis',
    'strategicInsight': 'SWOT Analysis',
    'cognitiveDiversity': 'Cognitive Diversity (Red Team)',
    'riskScorer': 'Final Risk Scoring'
};

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentId } = await request.json();
        if (!documentId) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
        }

        // Verify ownership
        const doc = await prisma.document.findFirst({
            where: { id: documentId, userId }
        });

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendUpdate = (update: ProgressUpdate) => {
                    const sseString = formatSSE(update);
                    controller.enqueue(encoder.encode(sseString));
                };

                // Track completed nodes for progress calculation
                const completedNodes = new Set<string>();
                const totalNodes = Object.keys(NODE_LABELS).length;

                try {
                    // Update status to analyzing
                    await prisma.document.update({
                        where: { id: documentId },
                        data: { status: 'analyzing' }
                    });

                    sendUpdate({ type: 'step', step: 'Initializing audit pipeline', status: 'running', progress: 5 });

                    const auditGraph = await getGraph();
                    const eventStream = auditGraph.streamEvents(
                        { originalContent: doc.content, documentId: documentId },
                        { version: 'v2' }
                    );

                    let result: any = null;

                    for await (const event of eventStream) {
                        // Track node start events
                        if (event.event === 'on_chain_start' && event.name && NODE_LABELS[event.name]) {
                            const label = NODE_LABELS[event.name];
                            sendUpdate({
                                type: 'step',
                                step: label,
                                status: 'running',
                                progress: Math.round((completedNodes.size / totalNodes) * 80) + 10
                            });
                        }

                        // Track node end events
                        if (event.event === 'on_chain_end') {
                            if (event.name === 'LangGraph') {
                                result = event.data.output;
                            } else if (event.name && NODE_LABELS[event.name]) {
                                completedNodes.add(event.name);
                                const label = NODE_LABELS[event.name];
                                const progress = Math.round((completedNodes.size / totalNodes) * 80) + 10;
                                sendUpdate({ type: 'step', step: label, status: 'complete', progress });

                                // Send bias detection updates
                                if (event.name === 'biasDetective' && event.data?.output?.biasAnalysis) {
                                    const biases = event.data.output.biasAnalysis;
                                    for (const bias of biases) {
                                        if (bias.found) {
                                            sendUpdate({
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
                                    sendUpdate({
                                        type: 'noise',
                                        progress,
                                        result: { score: event.data.output.noiseStats.mean }
                                    });
                                }
                            }
                        }
                    }

                    if (!result || !result.finalReport) {
                        throw new Error("Audit Pipeline failed to generate a report");
                    }

                    // Normalize result
                    result.finalReport = safeJsonClone(result.finalReport);

                    // Save to DB
                    const foundBiases = (result.finalReport.biases || []).filter((b: any) => b.found);

                    await prisma.$transaction(async (tx) => {
                        try {
                            await tx.analysis.create({
                                data: {
                                    documentId,
                                    overallScore: result.finalReport.overallScore || 0,
                                    noiseScore: result.finalReport.noiseScore || 0,
                                    summary: result.finalReport.summary || '',
                                    biases: {
                                        create: foundBiases.map((bias: any) => ({
                                            biasType: bias.biasType,
                                            severity: bias.severity,
                                            excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                                            explanation: bias.explanation || '',
                                            suggestion: bias.suggestion || '',
                                            confidence: bias.confidence || 0.0
                                        }))
                                    },
                                    // New Fields
                                    structuredContent: result.finalReport.structuredContent || '',
                                    noiseStats: toPrismaJson(NoiseStatsSchema.safeParse(result.finalReport.noiseStats).success ? result.finalReport.noiseStats : NoiseStatsSchema.parse({})),
                                    factCheck: toPrismaJson(FactCheckSchema.safeParse(result.finalReport.factCheck).success ? result.finalReport.factCheck : FactCheckSchema.parse({})),
                                    compliance: toPrismaJson(ComplianceSchema.safeParse(result.finalReport.compliance).success ? result.finalReport.compliance : ComplianceSchema.parse({})),
                                    preMortem: toPrismaJson(result.finalReport.preMortem),
                                    sentiment: toPrismaJson(SentimentSchema.safeParse(result.finalReport.sentiment).success ? result.finalReport.sentiment : SentimentSchema.parse({})),
                                    speakers: result.finalReport.speakers || [],
                                    // Phase 4 Extensions
                                    logicalAnalysis: toPrismaJson(LogicalSchema.safeParse(result.finalReport.logicalAnalysis).success ? result.finalReport.logicalAnalysis : LogicalSchema.parse({})),
                                    swotAnalysis: toPrismaJson(SwotSchema.safeParse(result.finalReport.swotAnalysis).data),
                                    cognitiveAnalysis: toPrismaJson(CognitiveSchema.safeParse(result.finalReport.cognitiveAnalysis).data),
                                    simulation: toPrismaJson(SimulationSchema.safeParse(result.finalReport.simulation).data),
                                    institutionalMemory: toPrismaJson(MemorySchema.safeParse(result.finalReport.institutionalMemory).data)
                                } as any
                            });
                        } catch (dbError: any) {
                            // Check for "Column does not exist" error (P2021, P2022)
                            if (dbError.code === 'P2021' || dbError.code === 'P2022' || dbError.message?.includes('does not exist')) {
                                console.warn('⚠️ Schema drift detected. Retrying save with CORE fields only.', dbError.code);

                                // Fallback: Save only what the old schema supports
                                await tx.analysis.create({
                                    data: {
                                        documentId,
                                        overallScore: result.finalReport.overallScore,
                                        noiseScore: result.finalReport.noiseScore,
                                        summary: result.finalReport.summary,
                                        biases: {
                                            create: foundBiases.map((bias: any) => ({
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
                            } else {
                                throw dbError;
                            }
                        }

                        await tx.document.update({
                            where: { id: documentId },
                            data: { status: 'complete' }
                        });
                    });

                    // Store embedding (fire and forget)
                    try {
                        const { storeAnalysisEmbedding } = await import('@/lib/rag/embeddings');
                        await storeAnalysisEmbedding(
                            documentId,
                            doc.filename,
                            result.finalReport.summary,
                            foundBiases.map((b: any) => ({
                                biasType: b.biasType,
                                severity: b.severity,
                                explanation: b.explanation || ''
                            })),
                            result.finalReport.overallScore
                        );
                    } catch (embError) {
                        console.warn('Embedding storage failed:', embError);
                    }

                    // Send final complete
                    sendUpdate({ type: 'complete', progress: 100, result: result.finalReport });
                    controller.close();

                } catch (error) {
                    console.error('Stream processing error:', error);
                    await prisma.document.update({
                        where: { id: documentId },
                        data: { status: 'error' }
                    });
                    const errorMessage = getSafeErrorMessage(error);
                    sendUpdate({ type: 'error', message: errorMessage, progress: 0 });
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
