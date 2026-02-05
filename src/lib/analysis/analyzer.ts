import { prisma } from '@/lib/prisma';
import { AnalysisResult, BiasDetectionResult } from '@/types';
import { safeJsonClone } from '@/lib/utils/json';
import { Document, Prisma } from '@prisma/client';

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

    // Update status to analyzing
    await prisma.document.update({
        where: { id: documentId },
        data: { status: 'analyzing' }
    });

    try {
        const result = await runAnalysis(document.content, documentId, (update) => {
            if (onProgress) onProgress(update);
        });

        // Store analysis in database
        const foundBiases = result.biases.filter(b => b.found);
        await prisma.analysis.create({
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
                // Persist new Multi-Agent Data
                structuredContent: result.structuredContent || '',
                noiseStats: result.noiseStats ?? Prisma.JsonNull,
                factCheck: result.factCheck ?? Prisma.JsonNull,
                compliance: result.compliance ?? Prisma.JsonNull,
                preMortem: result.preMortem ?? Prisma.JsonNull,
                sentiment: result.sentiment ?? Prisma.JsonNull,
                speakers: result.speakers || []
            }
        });

        // Update document status
        await prisma.document.update({
            where: { id: documentId },
            data: { status: 'complete' }
        });

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

    // Start analysis pipeline with detailed steps
    sendStep('Preparing document', 'running', 5);
    sendStep('Preparing document', 'complete', 10);
    sendStep('Detecting cognitive biases', 'running', 15);

    const result = await auditGraph.invoke({
        originalContent: content,
        documentId: documentId,
    });

    // Mark all analysis steps as complete
    sendStep('Detecting cognitive biases', 'complete', 40);
    sendStep('Analyzing decision noise', 'complete', 55);
    sendStep('Fact checking claims', 'complete', 70);
    sendStep('Evaluating compliance', 'complete', 80);
    sendStep('Generating risk assessment', 'complete', 90);
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
