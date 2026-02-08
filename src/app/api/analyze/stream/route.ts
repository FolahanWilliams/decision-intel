import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument, ProgressUpdate } from '@/lib/analysis/analyzer';
import { formatSSE } from '@/lib/sse';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSafeErrorMessage } from '@/lib/utils/error';

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
                    // Use the centralized analyzeDocument function which handles:
                    // 1. Status updates (analyzing -> complete/error)
                    // 2. Single-pass execution (using the fix we just applied)
                    // 3. Robust DB saving with Schema Drift Protection
                    await analyzeDocument(documentId, (update) => {
                        sendUpdate(update);
                    });

                    // Send final complete message
                    // Note: analyzeDocument also calls the callback with 'complete', 
                    // but we ensure it here to close the stream cleanly.
                    // If the callback already sent it, this might be redundant but harmless.
                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    const errorMessage = getSafeErrorMessage(error);
                    const errorSSE = formatSSE({ type: 'error', message: errorMessage });
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
