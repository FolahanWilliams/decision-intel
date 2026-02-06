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

    // Define analysis steps with timing
    const analysisSteps = [
        { name: 'Preparing document', delay: 0, progress: 10 },
        { name: 'Detecting cognitive biases', delay: 8000, progress: 25 },
        { name: 'Analyzing decision noise', delay: 16000, progress: 40 },
        { name: 'Fact checking claims', delay: 24000, progress: 55 },
        { name: 'Evaluating compliance', delay: 32000, progress: 70 },
        { name: 'Generating risk assessment', delay: 40000, progress: 85 }
    ];

    // Track which step we're on
    let currentStepIndex = 0;

    // Start with first step immediately
    sendStep(analysisSteps[0].name, 'complete', analysisSteps[0].progress);
    sendStep(analysisSteps[1].name, 'running', 15);
    currentStepIndex = 1;

    // Set up interval to send progress updates during LLM call
    const progressInterval = setInterval(() => {
        if (currentStepIndex < analysisSteps.length - 1) {
            // Complete current step
            sendStep(analysisSteps[currentStepIndex].name, 'complete', analysisSteps[currentStepIndex].progress);
            currentStepIndex++;

            // Start next step
            if (currentStepIndex < analysisSteps.length) {
                sendStep(analysisSteps[currentStepIndex].name, 'running', analysisSteps[currentStepIndex].progress - 5);
            }
        }
    }, 8000); // Update every 8 seconds

    let result;
    try {
        result = await auditGraph.invoke({
            originalContent: content,
            documentId: documentId,
        });
    } finally {
        // Clear the interval when LLM call completes
        clearInterval(progressInterval);
    }

    // Complete all remaining steps rapidly after LLM finishes
    for (let i = currentStepIndex; i < analysisSteps.length; i++) {
        sendStep(analysisSteps[i].name, 'complete', analysisSteps[i].progress);
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
