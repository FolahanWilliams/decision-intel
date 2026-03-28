/**
 * POST /api/analyze/quick-score
 *
 * Platform quick-score endpoint — lightweight bias-only scan.
 * Returns a score, grade, and list of detected biases.
 *
 * Auth: Supabase session cookie (platform users).
 * Rate limit: 30 requests/hour per user.
 * Timeout: 15 seconds max.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { runQuickScore } from '@/lib/analysis/quick-score';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PlatformQuickScore');

// Cap serverless function duration
export const maxDuration = 15;

// ─── Validation ─────────────────────────────────────────────────────────────

const QuickScoreInput = z.object({
  content: z.string().min(1, 'content is required').max(50_000, 'content must be at most 50000 characters'),
  title: z.string().optional(),
  url: z.string().optional(),
});

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit: 30 req/hour ─────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(userId, '/api/analyze/quick-score', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
      failMode: 'closed',
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Maximum 30 quick scans per hour.',
          limit: rateLimitResult.limit,
          remaining: 0,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)),
          },
        }
      );
    }

    // ── Parse & validate body ───────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
    }

    const parsed = QuickScoreInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { content, title, url } = parsed.data;

    // ── Run quick score ─────────────────────────────────────────────────
    const result = await runQuickScore(content, { title, url });

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('Quick score error:', error);

    if (message.includes('timed out')) {
      return NextResponse.json({ error: 'Analysis timed out. Try with shorter content.' }, { status: 504 });
    }

    if (message.includes('Failed to parse')) {
      return NextResponse.json({ error: 'Failed to parse analysis result' }, { status: 502 });
    }

    return NextResponse.json({ error: 'Quick score analysis failed' }, { status: 500 });
  }
}
