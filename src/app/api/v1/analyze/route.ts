/**
 * Public API — POST /api/v1/analyze
 *
 * Accepts document content, runs the full LangGraph analysis pipeline
 * synchronously, and returns the AnalysisResult JSON.
 *
 * Auth: API key (Bearer di_live_xxx) — requires "analyze" scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, requireScope, type ValidateError } from '@/lib/api/auth';
import { runAnalysis } from '@/lib/analysis/analyzer';
import { createLogger } from '@/lib/utils/logger';
import { createHash } from 'crypto';

const log = createLogger('PublicAnalyzeRoute');

// Allow generous timeout for the synchronous pipeline
export const maxDuration = 300;

const MAX_CONTENT_LENGTH = 50_000;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      const err = authResult as ValidateError;
      return NextResponse.json({ error: err.error }, { status: err.status, headers: err.headers });
    }
    const { context } = authResult;

    const scopeErr = requireScope(context, 'analyze');
    if (scopeErr) {
      return NextResponse.json({ error: scopeErr.error }, { status: scopeErr.status });
    }

    // ── Parse body ───────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    const {
      content,
      filename,
      options: _options,
    } = body as {
      content?: string;
      filename?: string;
      options?: { skipBoardroom?: boolean };
    };

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '"content" is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH.toLocaleString()} characters (got ${content.length.toLocaleString()}).`,
        },
        { status: 400 }
      );
    }

    const resolvedFilename = filename || 'api-upload.txt';

    // ── Deduplicate by content hash ──────────────────────────────────
    const contentHash = createHash('sha256').update(content).digest('hex');

    // ── Create Document record ───────────────────────────────────────
    let document;
    try {
      document = await prisma.document.create({
        data: {
          userId: context.userId,
          orgId: context.orgId,
          filename: resolvedFilename,
          fileType: 'text/plain',
          fileSize: Buffer.byteLength(content, 'utf-8'),
          content,
          contentHash,
          status: 'analyzing',
        },
      });
    } catch (createErr: unknown) {
      // If contentHash already exists, find the existing document
      const prismaErr = createErr as { code?: string };
      if (prismaErr.code === 'P2002') {
        // Unique constraint on contentHash — find existing & return its latest analysis
        const existing = await prisma.document.findFirst({
          where: { contentHash, userId: context.userId },
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { biases: true },
            },
          },
        });
        if (existing?.analyses?.[0]) {
          return NextResponse.json({
            documentId: existing.id,
            cached: true,
            analysis: existing.analyses[0],
          });
        }
        // Existing doc but no analysis — fall through to re-analyze
        if (existing) {
          document = existing;
        } else {
          throw createErr;
        }
      } else {
        const code = (createErr as { code?: string }).code;
        if (code === 'P2021' || code === 'P2022') {
          // Schema drift — retry without newer columns
          document = await prisma.document.create({
            data: {
              userId: context.userId,
              filename: resolvedFilename,
              fileType: 'text/plain',
              fileSize: Buffer.byteLength(content, 'utf-8'),
              content,
              status: 'analyzing',
            },
          });
        } else {
          throw createErr;
        }
      }
    }

    // ── Run analysis pipeline ────────────────────────────────────────
    log.info(`Starting API analysis for document ${document.id} (user: ${context.userId})`);

    let analysisResult;
    try {
      analysisResult = await runAnalysis(content, document.id, context.userId);
    } catch (pipelineErr) {
      // Mark document as errored
      await prisma.document
        .update({
          where: { id: document.id },
          data: { status: 'error' },
        })
        .catch(() => {});

      log.error('Analysis pipeline failed:', pipelineErr);
      return NextResponse.json(
        { error: 'Analysis pipeline failed. Please try again later.' },
        { status: 502 }
      );
    }

    // The runAnalysis function already persists the analysis to the DB,
    // so we just need to fetch the saved record for the response.
    let savedAnalysis;
    try {
      savedAnalysis = await prisma.analysis.findFirst({
        where: { documentId: document.id },
        orderBy: { createdAt: 'desc' },
        include: { biases: true },
      });
    } catch {
      // If fetching fails, return the in-memory result
      savedAnalysis = null;
    }

    log.info(`API analysis complete for document ${document.id}`);

    return NextResponse.json({
      documentId: document.id,
      cached: false,
      analysis: savedAnalysis || analysisResult,
    });
  } catch (error) {
    log.error('Public analyze API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
