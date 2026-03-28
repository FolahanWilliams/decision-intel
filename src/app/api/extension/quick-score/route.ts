/**
 * POST /api/extension/quick-score
 *
 * Lightweight bias-only scan for the browser extension popup.
 * Returns a quick score, grade, and list of detected biases.
 *
 * Auth: Extension API key via x-extension-key header.
 * Rate limit: 30 requests/hour per user.
 * Timeout: 15 seconds max.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { runQuickScore } from '@/lib/analysis/quick-score';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ExtensionQuickScore');

// Cap serverless function duration
export const maxDuration = 15;

// ─── Route Handler ───────────────────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 50_000;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const authResult = await authenticateApiRequest(request);
    if (authResult.error || !authResult.userId) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status || 401 }
      );
    }
    const userId = authResult.userId;

    // ── Rate limit: 30 req/hour ─────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(userId, '/api/extension/quick-score', {
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

    // ── Parse body ──────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
    }

    const { content, url, title } = body as {
      content?: string;
      url?: string;
      title?: string;
    };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `content must be at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Analysis timed out. Try with shorter content.' },
        { status: 504 }
      );
    }

    if (message.includes('Failed to parse')) {
      return NextResponse.json({ error: 'Failed to parse analysis result' }, { status: 502 });
    }

    return NextResponse.json({ error: 'Quick score analysis failed' }, { status: 500 });
  }
}
