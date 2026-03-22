/**
 * Public API — POST /api/v1/analyze
 *
 * Accepts a documentId (existing document) or raw content, runs the full
 * analysis pipeline, and returns the AnalysisResult JSON.
 *
 * Auth: API key (Bearer di_live_xxx) — requires "write:analyses" scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, type ValidateError } from '@/lib/api/auth';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PublicAnalyzeRoute');

// Allow generous timeout for the synchronous pipeline
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      const err = authResult as ValidateError;
      return NextResponse.json(
        { error: err.error },
        { status: err.status, headers: err.headers }
      );
    }
    const { context } = authResult;

    // ── Scope check ────────────────────────────────────────────────────
    if (!context.scopes.includes('write:analyses')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // ── Parse body ────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    const { documentId, content, title, metadata } = body as {
      documentId?: string;
      content?: string;
      title?: string;
      metadata?: Record<string, unknown>;
    };

    if (!documentId && !content) {
      return NextResponse.json(
        { error: 'Either documentId or content is required' },
        { status: 400 }
      );
    }

    // ── Metadata from headers ─────────────────────────────────────────
    const requestId = request.headers.get('x-request-id') ?? undefined;
    const responseMeta = {
      requestId: requestId ?? `req_${Date.now()}`,
      timestamp: new Date().toISOString(),
      apiVersion: 'v1',
    };

    // ── Case 1: documentId provided ───────────────────────────────────
    if (documentId) {
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId: context.userId },
      });

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Check for existing analysis
      const existing = await prisma.analysis.findFirst({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        log.info(`Returning cached analysis for document ${documentId}`);
        return NextResponse.json({
          success: true,
          data: {
            analysisId: existing.id,
            overallScore: (existing as Record<string, unknown>).overallScore,
            biases: (existing as Record<string, unknown>).biases,
            recommendations: (existing as Record<string, unknown>).recommendations,
            cached: true,
          },
          metadata: responseMeta,
        });
      }

      // Run new analysis
      let analysisResult;
      try {
        analysisResult = await analyzeDocument(
          { content: document.content ?? '', title: document.filename },
          { userId: context.userId, orgId: context.orgId }
        );
      } catch (err) {
        log.error('Analysis failed:', err);
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
      }

      const saved = await prisma.analysis.create({
        data: {
          ...(analysisResult as Record<string, unknown>),
          documentId,
          userId: context.userId,
          orgId: context.orgId,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          analysisId: saved.id,
          overallScore: (saved as Record<string, unknown>).overallScore,
          biases: (saved as Record<string, unknown>).biases,
          recommendations: (saved as Record<string, unknown>).recommendations,
          cached: false,
        },
        metadata: responseMeta,
      });
    }

    // ── Case 2: raw content provided ──────────────────────────────────
    let analysisResult;
    try {
      analysisResult = await analyzeDocument(
        { content: content as string, title: title ?? 'Untitled', metadata },
        { userId: context.userId, orgId: context.orgId }
      );
    } catch (err) {
      log.error('Analysis failed:', err);
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }

    const saved = await prisma.analysis.create({
      data: {
        ...(analysisResult as Record<string, unknown>),
        userId: context.userId,
        orgId: context.orgId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: saved.id,
        overallScore: (saved as Record<string, unknown>).overallScore,
        biases: (saved as Record<string, unknown>).biases,
        recommendations: (saved as Record<string, unknown>).recommendations,
        cached: false,
      },
      metadata: responseMeta,
    });
  } catch (error) {
    log.error('Public analyze API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
