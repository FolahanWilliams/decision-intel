import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analyzer';
import { auth } from '@clerk/nextjs/server';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SimulateRoute');

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   "anonymous";
        
        const rateLimitResult = await checkRateLimit(ip, '/api/analyze/simulate');
        
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { 
                    error: "Rate limit exceeded. You can analyze up to 5 documents per hour.",
                    limit: rateLimitResult.limit,
                    reset: rateLimitResult.reset,
                    remaining: 0
                }, 
                { status: 429 }
            );
        }

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
        log.error('Simulation error:', error);
        return NextResponse.json(
            { error: getSafeErrorMessage(error) },
            { status: 500 }
        );
    }
}
