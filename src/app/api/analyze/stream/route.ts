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
                        { originalContent: doc.content, documentId: documentId, userId: userId },
                        { version: 'v2' }
                    );

                    let result: Record<string, unknown> | null = null;

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
                    const report = result.finalReport as Record<string, unknown>;
                    const foundBiases = ((report.biases as Array<Record<string, unknown>>) || []).filter((b) => b.found);

                    await prisma.$transaction(async (tx) => {
                        try {
                            await tx.analysis.create({
                                data: {
                                    documentId,
                                    overallScore: (report.overallScore as number) || 0,
                                    noiseScore: (report.noiseScore as number) || 0,
                                    summary: (report.summary as string) || '',
                                    biases: {
                                        create: foundBiases.map((bias) => ({
                                            biasType: bias.biasType as string,
                                            severity: bias.severity as string,
                                            excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                                            explanation: (bias.explanation as string) || '',
                                            suggestion: (bias.suggestion as string) || '',
                                            confidence: (bias.confidence as number) || 0.0
                                        }))
                                    },
                                    // New Fields
                                    structuredContent: (report.structuredContent as string) || '',
                                    noiseStats: toPrismaJson(NoiseStatsSchema.safeParse(report.noiseStats).success ? report.noiseStats : NoiseStatsSchema.parse({})),
                                    factCheck: toPrismaJson(FactCheckSchema.safeParse(report.factCheck).success ? report.factCheck : FactCheckSchema.parse({})),
                                    compliance: toPrismaJson(ComplianceSchema.safeParse(report.compliance).success ? report.compliance : ComplianceSchema.parse({})),
                                    preMortem: toPrismaJson(report.preMortem),
                                    sentiment: toPrismaJson(SentimentSchema.safeParse(report.sentiment).success ? report.sentiment : SentimentSchema.parse({})),
                                    speakers: (report.speakers as string[]) || [],
                                    // Phase 4 Extensions
                                    logicalAnalysis: toPrismaJson(LogicalSchema.safeParse(report.logicalAnalysis).success ? report.logicalAnalysis : LogicalSchema.parse({})),
                                    swotAnalysis: toPrismaJson(SwotSchema.safeParse(report.swotAnalysis).data),
                                    cognitiveAnalysis: toPrismaJson(CognitiveSchema.safeParse(report.cognitiveAnalysis).data),
                                    simulation: toPrismaJson(SimulationSchema.safeParse(report.simulation).data),
                                    institutionalMemory: toPrismaJson(MemorySchema.safeParse(report.institutionalMemory).data)
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required: schema drift protection demands flexible Prisma data shape
                                } as any
                            });
                        } catch (dbError: unknown) {
                            // Check for "Column does not exist" error (P2021, P2022)
                            const prismaError = dbError as { code?: string; message?: string };
                            if (prismaError.code === 'P2021' || prismaError.code === 'P2022' || prismaError.message?.includes('does not exist')) {
                                console.warn('⚠️ Schema drift detected. Retrying save with CORE fields only.', prismaError.code);

                                // Fallback: Save only what the old schema supports
                                await tx.analysis.create({
                                    data: {
                                        documentId,
                                        overallScore: (report.overallScore as number) || 0,
                                        noiseScore: (report.noiseScore as number) || 0,
                                        summary: (report.summary as string) || '',
                                        biases: {
                                            create: foundBiases.map((bias) => ({
                                                biasType: bias.biasType as string,
                                                severity: bias.severity as string,
                                                excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                                                explanation: (bias.explanation as string) || '',
                                                suggestion: (bias.suggestion as string) || '',
                                                confidence: (bias.confidence as number) || 0.0
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
                            (report.summary as string) || '',
                            foundBiases.map((b) => ({
                                biasType: b.biasType as string,
                                severity: b.severity as string,
                                explanation: (b.explanation as string) || ''
                            })),
                            (report.overallScore as number) || 0
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
