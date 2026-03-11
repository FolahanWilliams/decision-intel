import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FeedbackRoute');

/**
 * POST /api/feedback
 * Handles user feedback ratings for AI insights (biases and pre-mortems)
 * 
 * Body: 
 * { 
 *   type: 'bias' | 'preMortem',
 *   id: string, // BiasInstance.id or Analysis.id
 *   rating: number // e.g. 1 for helpful, -1 for unhelpful, 0 to clear
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        const { type, id, rating } = body;

        if (!type || !id || typeof rating !== 'number') {
            return NextResponse.json({ error: 'Missing required fields: type, id, rating' }, { status: 400 });
        }

        if (type === 'bias') {
            // Verify ownership through the Analysis -> Document relation
            const biasInstance = await prisma.biasInstance.findUnique({
                where: { id },
                include: { analysis: { include: { document: true } } }
            });

            if (!biasInstance) {
                return NextResponse.json({ error: 'BiasInstance not found' }, { status: 404 });
            }

            if (biasInstance.analysis.document.userId !== userId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            await prisma.biasInstance.update({
                where: { id },
                data: { userRating: rating }
            });

        } else if (type === 'preMortem') {
            // Verify ownership through the Document relation
            const analysis = await prisma.analysis.findUnique({
                where: { id },
                include: { document: true }
            });

            if (!analysis) {
                return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
            }

            if (analysis.document.userId !== userId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            await prisma.analysis.update({
                where: { id },
                data: { preMortemRating: rating }
            });
            
        } else {
            return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        log.error('Feedback API error:', error);
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
}
