import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
    // 1. Authentication
    const apiKey = req.headers.get('x-api-key');
    const userId = await validateApiKey(apiKey || '');

    if (!userId) {
        return NextResponse.json(
            { error: 'Unauthorized', message: 'Invalid or missing x-api-key header' },
            { status: 401 }
        );
    }

    try {
        // 2. Parse Input
        const body = await req.json();
        const { content, filename = 'api_submission.txt' } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Bad Request', message: '"content" field is required and must be a string' },
                { status: 400 }
            );
        }

        // 3. Create Document Record
        const document = await prisma.document.create({
            data: {
                userId,
                filename,
                fileType: 'text/plain', // Assumed for API text input
                fileSize: content.length,
                content,
                status: 'pending'
            }
        });

        // 4. Log Audit Event
        await logAudit({
            action: 'SCAN_DOCUMENT', // Differentiate API vs UI?
            resource: 'Document',
            resourceId: document.id,
            details: { source: 'API', filename }
        });

        // 5. Run Analysis Synchronously
        // In a real high-throughput system, this might be async with a webhook.
        // For this MVP version, we wait for the result.
        const analysisResult = await analyzeDocument(document, (progress) => {
            // Optional: Could log progress or stream bytes if we switched to streaming response
        });

        // 6. Format Response
        return NextResponse.json({
            success: true,
            documentId: document.id,
            analysis: {
                overallScore: analysisResult.overallScore,
                riskLevel: analysisResult.overallScore < 50 ? 'high' : analysisResult.overallScore < 80 ? 'medium' : 'low',
                biases: analysisResult.biases.map(b => ({
                    type: b.biasType,
                    severity: b.severity,
                    excerpt: b.excerpt
                })),
                factCheck: analysisResult.factCheck,
                summary: analysisResult.summary
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
