import { NextRequest, NextResponse } from 'next/server';
import { simulateAnalysis } from '@/lib/analysis/analyzer';
import { auth } from '@clerk/nextjs/server';

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
        const result = await simulateAnalysis(content);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json({ error: 'Failed to simulate analysis' }, { status: 500 });
    }
}
