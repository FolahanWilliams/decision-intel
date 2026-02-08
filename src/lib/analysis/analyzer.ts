import { prisma } from '@/lib/prisma';
import { AnalysisResult, BiasDetectionResult } from '@/types';
import { safeJsonClone } from '@/lib/utils/json';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { Document } from '@prisma/client';

export interface ProgressUpdate {
    type: 'step' | 'bias' | 'noise' | 'summary' | 'complete' | 'error';
    step?: string;
    status?: 'running' | 'complete' | 'error';
    biasType?: string;
    result?: unknown;
    message?: string;
    progress: number;
}

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

    // Run analysis within a transaction for atomicity
    try {
        const result = await runAnalysis(document.content, documentId, (update) => {
            if (onProgress) onProgress(update);
        });

        // Store analysis in database with Schema Drift Protection
        const foundBiases = result.biases.filter(b => b.found);

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Update status to analyzing
            await tx.document.update({
                where: { id: documentId },
                data: { status: 'analyzing' }
            });

            try {
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
                        },
                        // New Fields (May cause P2022 if DB not migrated)
                        structuredContent: result.structuredContent || '',
                        noiseStats: toPrismaJson(result.noiseStats),
                        factCheck: toPrismaJson(result.factCheck),
                        compliance: toPrismaJson(result.compliance),
                        preMortem: toPrismaJson(result.preMortem),
                        sentiment: toPrismaJson(result.sentiment),
                        speakers: result.speakers || [],
                        // Phase 4 Extensions
                        logicalAnalysis: toPrismaJson(result.logicalAnalysis),
                        swotAnalysis: toPrismaJson(result.swotAnalysis),
                        cognitiveAnalysis: toPrismaJson(result.cognitiveAnalysis),
                        simulation: toPrismaJson(result.simulation),
                        institutionalMemory: toPrismaJson(result.institutionalMemory)
                    }
                });
            } catch (dbError: any) {
                // Check for "Column does not exist" error (P2021, P2022)
                if (dbError.code === 'P2021' || dbError.code === 'P2022' || dbError.message?.includes('does not exist')) {
                    console.warn('⚠️ Schema drift detected. Retrying save with CORE fields only.', dbError.code);

                    // Fallback: Save only what the old schema supports
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
                        select: { id: true } // Only return ID to avoid selecting non-existent columns (P2022)
                    });
                } else {
                    throw dbError; // Rethrow other errors
                }
            }

            // Update document status to complete
            await tx.document.update({
                where: { id: documentId },
                data: { status: 'complete' }
            });
        });

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
            console.warn('Failed to store embedding (non-critical):', embeddingError);
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

async function getGraph() {
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
    onProgress?: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {

    const auditGraph = await getGraph();

    // Send step-by-step progress updates
    const sendStep = (step: string, status: 'running' | 'complete', progress: number) => {
        if (onProgress) onProgress({ type: 'step', step, status, progress });
    };

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

    // Track completed nodes for progress calculation
    const completedNodes = new Set<string>();
    const totalNodes = Object.keys(NODE_LABELS).length;

    // Initial step
    sendStep('Initializing audit pipeline', 'running', 5);

    let result;
    try {
        // Use streamEvents for real-time node tracking
        const eventStream = auditGraph.streamEvents(
            { originalContent: content, documentId: documentId },
            { version: 'v2' }
        );

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
                            if (bias.found && onProgress) {
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

        if (!result) {
            throw new Error("Stream ended without returning a final result");
        }

    } catch (error) {
        console.error('Streaming error, falling back to invoke:', error);
        // Fallback to non-streaming invoke if streaming fails
        sendStep('Processing document', 'running', 50);

        // Add timeout to fallback invocation (25 seconds max for serverless safety)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Analysis timed out")), 25000)
        );

        result = await Promise.race([
            auditGraph.invoke({
                originalContent: content,
                documentId: documentId,
            }),
            timeoutPromise
        ]) as any;
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

export function calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
}
