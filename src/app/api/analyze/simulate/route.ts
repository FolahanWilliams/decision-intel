import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analyzer';
import { createClient } from '@/utils/supabase/server';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('SimulateRoute');

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by authenticated user (not IP)
        const rateLimitResult = await checkRateLimit(userId, '/api/analyze/simulate');
        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded. You can analyze up to 5 documents per hour.",
                    limit: rateLimitResult.limit,
                    reset: rateLimitResult.reset,
                    remaining: 0
                },
                { status: 429, headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) } }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        const { content } = body;
        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Run analysis in simulation mode (no DB storage)
        const result = await runAnalysis(content, "simulate", userId);

        logAudit({
            action: 'SIMULATE_SCENARIO',
            resource: 'Simulation',
            details: { contentLength: content.length }
        }).catch((err: unknown) => {
            log.warn('Audit log failed (non-critical): ' + (err instanceof Error ? err.message : String(err)));
        });

        return NextResponse.json(result);
    } catch (error) {
        log.error('Simulation error:', error);
        return NextResponse.json(
            { error: getSafeErrorMessage(error) },
            { status: 500 }
        );
    }
}
