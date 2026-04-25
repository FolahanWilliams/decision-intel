/**
 * Public API — GET /api/v1/documents
 *
 * List documents for the API key's user with pagination,
 * or get a specific document with its latest analysis.
 *
 * Auth: API key (Bearer di_live_xxx) — requires "documents" scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, requireScope, type ValidateError } from '@/lib/api/auth';
import { createLogger } from '@/lib/utils/logger';
import {
  buildDocumentAccessFilter,
  buildDocumentAccessWhere,
} from '@/lib/utils/document-access';

const log = createLogger('PublicDocumentsRoute');

export async function GET(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      const err = authResult as ValidateError;
      return NextResponse.json({ error: err.error }, { status: err.status, headers: err.headers });
    }
    const { context } = authResult;

    const scopeErr = requireScope(context, 'documents');
    if (scopeErr) {
      return NextResponse.json({ error: scopeErr.error }, { status: scopeErr.status });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (documentId) {
      // ── Get specific document with latest analysis ──────────────
      const access = await buildDocumentAccessWhere(documentId, context.userId);
      const document = await prisma.document.findFirst({
        where: access.where,
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { biases: true },
          },
        },
      });

      if (!document) {
        return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
      }

      return NextResponse.json({
        document: {
          id: document.id,
          filename: document.filename,
          fileType: document.fileType,
          fileSize: document.fileSize,
          status: document.status,
          uploadedAt: document.uploadedAt,
          analysis: document.analyses[0] || null,
        },
      });
    }

    // ── List documents with pagination ────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const { where: listWhere } = await buildDocumentAccessFilter(context.userId);
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: listWhere,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          filename: true,
          fileType: true,
          fileSize: true,
          status: true,
          uploadedAt: true,
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              overallScore: true,
              noiseScore: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.document.count({ where: listWhere }),
    ]);

    return NextResponse.json({
      documents: documents.map(d => ({
        id: d.id,
        filename: d.filename,
        fileType: d.fileType,
        fileSize: d.fileSize,
        status: d.status,
        uploadedAt: d.uploadedAt,
        latestAnalysis: d.analyses[0] || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      return NextResponse.json({
        documents: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }
    log.error('Public documents API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
