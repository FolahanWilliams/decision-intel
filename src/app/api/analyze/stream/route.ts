import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis, saveAnalysisResult, ProgressUpdate } from '@/lib/analysis/analyzer';
import { formatSSE } from '@/lib/sse';
import { safeJsonClone } from '@/lib/utils/json';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

                try {
                    // Update status to analyzing
                    await prisma.document.update({
                        where: { id: documentId },
                        data: { status: 'analyzing' }
                    });

                    const result = await runAnalysis(doc.content, (update) => {
                        sendUpdate(update);
                    });

                    // Store analysis and update document status
                    await saveAnalysisResult(documentId, result);

                    sendUpdate({ type: 'complete', progress: 100, result: safeJsonClone(result) });
                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    const errorSSE = formatSSE({ type: 'error', message: 'Analysis failed' });
                    controller.enqueue(encoder.encode(errorSSE));
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
