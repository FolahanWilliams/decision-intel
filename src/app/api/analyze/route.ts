import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { BiasDetectionResult } from '@/types';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { checkOutcomeGate } from '@/lib/learning/outcome-gate';

const log = createLogger('AnalyzeRoute');

// Allow longer processing times for AI analysis
export const maxDuration = 300;

// Simple stateless error handling
// NOTE: Global state is removed for serverless compatibility.
// and may reset at any time. Do not rely on it for critical production logic.

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request);
    if (authResult.error || !authResult.userId) {
      log.error('Unified Auth Failed: ' + (authResult.error || 'No User ID'));
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status || 401 }
      );
    }
    const effectiveUserId = authResult.userId;

    // Rate limit by authenticated user (not IP)
    const rateLimitResult = await checkRateLimit(effectiveUserId, '/api/analyze');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can analyze up to 5 documents per hour.',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
          remaining: 0,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    // Outcome enforcement gate — block when too many outcomes are overdue
    const outcomeGate = await checkOutcomeGate(effectiveUserId);
    if (!outcomeGate.allowed) {
      log.info(`Outcome gate: blocking user ${effectiveUserId} with ${outcomeGate.pendingCount} unreported outcomes`);
      return NextResponse.json(
        {
          error: 'Outcome reporting required before new analyses',
          code: 'OUTCOME_GATE',
          pendingOutcomes: outcomeGate.pendingCount,
          pendingAnalysisIds: outcomeGate.pendingAnalysisIds,
          message: outcomeGate.message,
        },
        { status: 423 }
      );
    }

    // Safety check for malformed or missing request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      log.error('Request body parse error:', parseError);
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
    }

    let documentId = body.documentId;

    // Handle direct text analysis (from extension)
    if (!documentId && body.text) {
      // Validate text length to prevent unbounded storage
      const MAX_TEXT_LENGTH = 100_000;
      if (typeof body.text !== 'string' || body.text.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { error: `Text must be a string of at most ${MAX_TEXT_LENGTH} characters` },
          { status: 400 }
        );
      }
      const newDoc = await prisma.document.create({
        data: {
          userId: effectiveUserId,
          filename: body.filename || 'Web analysis',
          fileType: body.fileType || 'web',
          fileSize: body.text.length,
          content: body.text,
          status: 'pending',
        },
      });
      documentId = newDoc.id;
    }

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId or text' }, { status: 400 });
    }

    // Verify ownership
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId: effectiveUserId },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // analyzeDocument handles the full status lifecycle internally:
    // pending → analyzing → complete (or → error on failure)
    const result = await analyzeDocument(doc);

    return NextResponse.json({
      success: true,
      documentId,
      overallScore: result.overallScore,
      noiseScore: result.noiseScore,
      summary: result.summary,
      biasesFound: result.biases.filter((b: BiasDetectionResult) => b.found).length,
      biases: result.biases,
    });
  } catch (error) {
    log.error('Analysis error:', error);
    // Sanitize error message to prevent prompt injection into Jules
    let errorMessage = error instanceof Error ? error.message : String(error);
    errorMessage = errorMessage.slice(0, 200).replace(/[<>]/g, ''); // Truncate and remove basic HTML/XML tags

    // Self-Healing Trigger
    const isHealableError =
      errorMessage.includes('JSON') ||
      errorMessage.includes('Unexpected end of JSON') ||
      errorMessage.includes('SAFETY') ||
      errorMessage.includes('blocked');

    if (isHealableError) {
      log.warn('Healable error detected: ' + errorMessage);
    }

    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: isHealableError
          ? 'The document could not be processed. Please try again.'
          : 'An unexpected error occurred during analysis.',
      },
      { status: 500 }
    );
  }
}
