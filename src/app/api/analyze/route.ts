import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentId } = await request.json();

        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        // Verify document ownership
        const doc = await prisma.document.findFirst({
            where: { id: documentId, userId }
        });

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Start analysis (this runs async)
        const result = await analyzeDocument(documentId);

        return NextResponse.json({
            success: true,
            documentId,
            overallScore: result.overallScore,
            noiseScore: result.noiseScore,
            summary: result.summary,
            biasesFound: result.biases.filter(b => b.found).length
        });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze document' },
            { status: 500 }
        );
    }
}
