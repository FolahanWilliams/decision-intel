import { prisma } from '@/lib/prisma';
import { AnalysisResult, BiasDetectionResult } from '@/types';
import { safeJsonClone } from '@/lib/utils/json';

export interface ProgressUpdate {
    type: 'bias' | 'noise' | 'summary' | 'complete';
    biasType?: string;
    result?: unknown;
    progress: number;
}

export async function analyzeDocument(
    documentId: string,
    onProgress?: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {
    // Get the document
    const document = await prisma.document.findUnique({
        where: { id: documentId }
    });

    if (!document) {
        throw new Error(`Document ${documentId} not found`);
    }

    // Update status to analyzing
    await prisma.document.update({
        where: { id: documentId },
        data: { status: 'analyzing' }
    });

    try {
        const result = await runAnalysis(document.content, (update) => {
            if (onProgress) onProgress(update);
        });

        await saveAnalysisResult(documentId, result);

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

export async function saveAnalysisResult(documentId: string, result: AnalysisResult) {
    const foundBiases = result.biases.filter(b => b.found);
    await prisma.document.update({
        where: { id: documentId },
        data: {
            status: 'complete',
            analyses: {
                create: {
                    overallScore: result.overallScore,
                    noiseScore: result.noiseScore,
                    summary: result.summary,
                    biases: {
                        create: foundBiases.map(bias => ({
                            biasType: bias.biasType,
                            severity: bias.severity,
                            excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                            explanation: bias.explanation || '',
                            suggestion: bias.suggestion,
                            confidence: bias.confidence || 0.0
                        })),
                    },
                    // Persist new Multi-Agent Data
                    structuredContent: result.structuredContent || '',
                    noiseStats: result.noiseStats || undefined,
                    factCheck: result.factCheck || undefined,
                    compliance: result.compliance || undefined,
                    preMortem: result.preMortem || undefined,
                    sentiment: result.sentiment || undefined,
                    speakers: result.speakers || []
                }
            }
        }
    });
}

// New Multi-Agent// Mock Analysis function (simulating AI delay)
export async function runAnalysis(
    content: string,
    onProgress?: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {

    // Lazy load graph to avoid circular deps or init issues
    const { auditGraph } = await import('@/lib/agents/graph');

    // Run the Graph
    // In a real app we might stream events from the graph here
    if (onProgress) onProgress({ type: 'bias', progress: 10 });

    const result = await auditGraph.invoke({
        originalContent: content,
        documentId: "temp",
    });

    if (onProgress) onProgress({ type: 'summary', progress: 90 });

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
