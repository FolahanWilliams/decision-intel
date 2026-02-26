import { NextRequest, NextResponse } from 'next/server';
import { getGraph, ProgressUpdate } from '@/lib/analysis/analyzer';
import { formatSSE } from '@/lib/sse';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { safeJsonClone } from '@/lib/utils/json';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const log = createLogger('StreamRoute');

// Reuse schemas from analyzer (or move to shared file)
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

// Map agent node names to human-readable labels with dynamic descriptions
const NODE_LABELS: Record<string, { label: string; description: string }> = {
    'gdprAnonymizer': { label: 'Privacy Shield', description: 'Scanning for personal data and applying GDPR redactions…' },
    'structurer': { label: 'Document Intelligence', description: 'Parsing structure, identifying speakers and key sections…' },
    'biasDetective': { label: 'Bias Detection', description: 'Analyzing for 15 cognitive biases with research verification…' },
    'noiseJudge': { label: 'Noise Analysis', description: 'Running 3 independent judges to measure decision consistency…' },
    'verificationNode': { label: 'Fact & Compliance Check', description: 'Verifying claims via Google Search and checking regulatory compliance…' },
    'deepAnalysisNode': { label: 'Deep Analysis', description: 'Performing sentiment, logic, SWOT, and cognitive diversity analysis…' },
    'simulationNode': { label: 'Boardroom Simulation', description: 'Running decision twin simulation with institutional memory…' },
    'riskScorer': { label: 'Risk Scoring', description: 'Calculating final decision quality score…' },
};

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            "anonymous";

        const rateLimitResult = await checkRateLimit(ip, '/api/analyze/stream');

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded. You can analyze up to 5 documents per hour.",
                    limit: rateLimitResult.limit,
                    reset: rateLimitResult.reset,
                    remaining: 0
                },
                { status: 429 }
            );
        }

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        const { documentId } = body;
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

        // Guard against concurrent analysis — block if one is already in
        // flight, but allow re-analysis of completed documents (e.g. "Run
        // Live Audit" on the detail page).
        if (doc.status === 'analyzing') {
            return NextResponse.json({ error: 'Analysis already in progress', status: doc.status }, { status: 409 });
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
                            const { label, description } = NODE_LABELS[event.name];
                            sendUpdate({
                                type: 'step',
                                step: label,
                                description,
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
                                const { label, description } = NODE_LABELS[event.name];
                                const progress = Math.round((completedNodes.size / totalNodes) * 80) + 10;
                                sendUpdate({ type: 'step', step: label, description, status: 'complete', progress });

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

                    // Try saving with ALL fields first. If the DB is missing
                    // newer columns (schema drift / P2022), the transaction is
                    // poisoned — PostgreSQL rejects every subsequent command in
                    // the same transaction block. So the fallback MUST run in a
                    // separate transaction instead of inside the same one.
                    let schemaDrift = false;
                    try {
                        await prisma.$transaction(async (tx) => {
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
                                    noiseBenchmarks: toPrismaJson(report.noiseBenchmarks ?? []),
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

                            await tx.document.update({
                                where: { id: documentId },
                                data: { status: 'complete' }
                            });
                        });
                    }

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
                        log.warn('Embedding storage failed: ' + (embError instanceof Error ? embError.message : String(embError)));
                    }

                    // Log audit event (fire and forget)
                    logAudit({
                        action: 'SCAN_DOCUMENT',
                        resource: 'Document',
                        resourceId: documentId,
                        details: { filename: doc.filename, overallScore: (report.overallScore as number) || 0 }
                    }).catch(() => {});

                    // Send final complete
                    sendUpdate({ type: 'complete', progress: 100, result: result.finalReport });
                    controller.close();

                } catch (error) {
                    log.error('Stream processing error:', error);
                    try {
                        await prisma.document.update({
                            where: { id: documentId },
                            data: { status: 'error' }
                        });
                    } catch (updateErr) {
                        log.error('Failed to update document status to error:', updateErr);
                    }
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
        log.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
