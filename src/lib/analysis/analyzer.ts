import { prisma } from '@/lib/db';
import { detectBias, detectNoise, generateSummary } from '@/lib/ai/bias-engine';
import { BiasCategory, AnalysisResult, BIAS_CATEGORIES } from '@/types';

const ALL_BIASES: BiasCategory[] = Object.keys(BIAS_CATEGORIES) as BiasCategory[];

export interface ProgressUpdate {
    type: 'bias' | 'noise' | 'summary' | 'complete';
    biasType?: string;
    result?: any;
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
        const result = await simulateAnalysis(document.content, (update) => {
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
                        excerpt: bias.excerpts[0]?.text || '',
                        explanation: bias.excerpts[0]?.explanation || '',
                        suggestion: bias.suggestion
                    }))
                }
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

export async function simulateAnalysis(
    content: string,
    onProgress?: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {
    const biasResults = [];
    const totalSteps = ALL_BIASES.length + 2; // +1 for noise, +1 for summary
    let currentStep = 0;

    // Run bias detection for all bias types in batches
    for (let i = 0; i < ALL_BIASES.length; i += 3) { // Smaller batches for better streaming feel
        const batch = ALL_BIASES.slice(i, i + 3);
        const batchResults = await Promise.all(
            batch.map(async biasType => {
                const res = await detectBias(content, biasType);
                currentStep++;
                if (onProgress) {
                    onProgress({
                        type: 'bias',
                        biasType,
                        result: res,
                        progress: Math.round((currentStep / totalSteps) * 100)
                    });
                }
                return res;
            })
        );
        biasResults.push(...batchResults);
    }

    // Detect noise
    const noiseResult = await detectNoise(content);
    currentStep++;
    if (onProgress) {
        onProgress({
            type: 'noise',
            result: noiseResult,
            progress: Math.round((currentStep / totalSteps) * 100)
        });
    }

    // Calculate overall score
    const foundBiases = biasResults.filter(b => b.found);
    const severityScores: Record<string, number> = {
        low: 5,
        medium: 15,
        high: 30,
        critical: 50
    };

    const biasDeductions = foundBiases.reduce((sum, b) => sum + severityScores[b.severity], 0);
    const noiseDeduction = noiseResult.score * 0.3;
    const overallScore = Math.max(0, 100 - biasDeductions - noiseDeduction);

    // Generate summary
    const summary = await generateSummary(content, biasResults, noiseResult.score);
    currentStep++;
    if (onProgress) {
        onProgress({
            type: 'summary',
            result: summary,
            progress: 100
        });
    }

    return {
        overallScore,
        noiseScore: noiseResult.score,
        summary,
        biases: biasResults
    };
}

export function calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
}
