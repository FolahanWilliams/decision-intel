import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analyzer';
import { auth } from '@clerk/nextjs/server';
import { getSafeErrorMessage } from '@/lib/utils/error';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content } = await request.json();
        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Run analysis in simulation mode (no DB storage)
        const result = await runAnalysis(content, "simulate", userId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json(
            { error: getSafeErrorMessage(error) },
            { status: 500 }
        );
    }
}
