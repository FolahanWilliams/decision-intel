/**
 * POST /api/extension/analyze
 *
 * Full analysis endpoint for the browser extension side panel.
 * Runs the complete LangGraph analysis pipeline on the submitted content.
 *
 * Auth: Extension API key via x-extension-key header.
 * Rate limit: 10 requests/hour per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import type { BiasDetectionResult } from '@/types';

const log = createLogger('ExtensionAnalyze');

// Allow longer processing times for the full pipeline
export const maxDuration = 300;

const MAX_CONTENT_LENGTH = 100_000;

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

    // ── Rate limit: 10 req/hour ─────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(userId, '/api/extension/analyze', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      failMode: 'closed',
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Maximum 10 full analyses per hour.',
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

    // ── Create document record for the pipeline ─────────────────────────
    const filename = title || (url ? new URL(url).hostname : 'Web Page');
    const document = await prisma.document.create({
      data: {
        userId,
        filename,
        fileType: 'web',
        fileSize: content.length,
        content,
        status: 'pending',
      },
    });

    // ── Run the full analysis pipeline ──────────────────────────────────
    const result = await analyzeDocument(document);

    return NextResponse.json(
      {
        success: true,
        documentId: document.id,
        overallScore: result.overallScore,
        noiseScore: result.noiseScore,
        summary: result.summary,
        biasesFound: result.biases.filter((b: BiasDetectionResult) => b.found).length,
        biases: result.biases,
        factCheck: result.factCheck ?? null,
        processedAt: new Date().toISOString(),
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    );
  } catch (error) {
    log.error('Extension analyze error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const sanitized = errorMessage.slice(0, 200).replace(/[<>]/g, '');

    const isHealableError =
      sanitized.includes('JSON') || sanitized.includes('SAFETY') || sanitized.includes('blocked');

    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: isHealableError
          ? 'The content could not be processed. Please try again.'
          : 'An unexpected error occurred during analysis.',
      },
      { status: 500 }
    );
  }
}
