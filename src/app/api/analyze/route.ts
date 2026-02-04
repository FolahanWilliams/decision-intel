import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const EXTENSION_API_KEY = process.env.EXTENSION_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        const apiKey = request.headers.get('x-extension-key');
        let effectiveUserId = userId;

        if (!effectiveUserId && apiKey === EXTENSION_API_KEY) {
            // Support unique extension users if provided, else separate 'guest'
            const extUserId = request.headers.get('x-extension-user-id');
            effectiveUserId = extUserId ? `ext_${extUserId}` : 'extension_guest';
        }

        if (!effectiveUserId) {
            console.error('Unified Auth Failed: No Session ID and Invalid API Key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Safety check for malformed or missing request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('Request body parse error:', parseError);
            return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
        }

        let documentId = body.documentId;

        // Handle direct text analysis (from extension)
        if (!documentId && body.text) {
            const newDoc = await prisma.document.create({
                data: {
                    userId: effectiveUserId,
                    filename: body.filename || 'Web analysis',
                    fileType: body.fileType || 'web',
                    fileSize: body.text.length,
                    content: body.text,
                    status: 'pending'
                }
            });
            documentId = newDoc.id;
        }

        if (!documentId) {
            return NextResponse.json({ error: 'Missing documentId or text' }, { status: 400 });
        }

        // Verify ownership
        const doc = await prisma.document.findFirst({
            where: { id: documentId, userId: effectiveUserId }
        });

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const result = await analyzeDocument(documentId);

        return NextResponse.json({
            success: true,
            documentId,
            overallScore: result.overallScore,
            noiseScore: result.noiseScore,
            summary: result.summary,
            biasesFound: result.biases.filter((b: any) => b.found).length,
            biases: result.biases
        });

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({
            error: 'Analysis failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
