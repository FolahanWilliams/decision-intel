import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { apiError } from '@/lib/utils/api-response';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';

const log = createLogger('DocumentsRoute');

// Select objects for detailed vs core-only analysis fields.
// Separated so the schema-drift fallback can retry with core fields only.
const ANALYSIS_SELECT_DETAILED = {
  overallScore: true,
  noiseScore: true,
  biases: {
    select: { severity: true, biasType: true },
  },
  factCheck: true,
} as const;

const ANALYSIS_SELECT_CORE = {
  overallScore: true,
} as const;

// GET /api/documents - List all documents for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    // Rate limit: 60 requests per minute (generous for dashboard polling)
    const rateLimitResult = await checkRateLimit(userId, '/api/documents', {
      windowMs: 60 * 1000,
      maxRequests: 60,
      failMode: 'open',
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 10));
    const skip = (page - 1) * limit;

    // Document-level RBAC (3.5): private docs stay invisible to teammates,
    // team docs surface to org members, specific docs surface to grantees.
    // Owner sees all of their own regardless of visibility. Soft-deleted
    // rows excluded by the resolver — see buildDocumentAccessFilter.
    const { where } = await buildDocumentAccessFilter(userId);
    let schemaDrift = false;

    // Build the select — detailed mode requests extended analysis fields.
    const buildSelect = (useExtended: boolean) => ({
      id: true,
      filename: true,
      status: true,
      fileSize: true,
      uploadedAt: true,
      isSample: true,
      versionNumber: true,
      parentDocumentId: true,
      analyses: {
        orderBy: { createdAt: 'desc' } as const,
        take: 1,
        select: detailed && useExtended ? ANALYSIS_SELECT_DETAILED : ANALYSIS_SELECT_CORE,
      },
    });

    // Try with extended fields first; fall back to core-only if the DB
    // is missing newer columns (schema drift / P2021 / P2022).
    let documents;
    let total: number;
    try {
      [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          orderBy: { uploadedAt: 'desc' },
          skip,
          take: limit,
          select: buildSelect(true),
        }),
        prisma.document.count({ where }),
      ]);
    } catch (fetchErr: unknown) {
      const code = (fetchErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn(
          'Schema drift in document list: falling back to core analysis fields (' + code + ')'
        );
        schemaDrift = true;
        [documents, total] = await Promise.all([
          prisma.document.findMany({
            where,
            orderBy: { uploadedAt: 'desc' },
            skip,
            take: limit,
            select: buildSelect(false),
          }),
          prisma.document.count({ where }),
        ]);
      } else {
        throw fetchErr;
      }
    }

    // Transform to include score from latest analysis
    interface DocRow {
      id: string;
      filename: string;
      status: string;
      fileSize: number | null;
      uploadedAt: Date;
      isSample?: boolean;
      versionNumber?: number;
      parentDocumentId?: string | null;
      analyses: Array<{
        overallScore: number | null;
        noiseScore?: number | null;
        biases?: Array<{ severity: string; biasType: string }>;
        factCheck?: unknown;
      }>;
    }

    const transformedDocs = (documents as DocRow[]).map(doc => {
      const latestAnalysis = doc.analyses[0];
      return {
        id: doc.id,
        filename: doc.filename,
        status: doc.status,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        isSample: doc.isSample ?? false,
        versionNumber: doc.versionNumber ?? 1,
        parentDocumentId: doc.parentDocumentId ?? null,
        score: latestAnalysis?.overallScore ?? undefined,
        // Include details if requested and available
        ...(detailed &&
          latestAnalysis &&
          !schemaDrift && {
            analyses: [
              {
                overallScore: latestAnalysis.overallScore,
                noiseScore: latestAnalysis.noiseScore,
                biases: latestAnalysis.biases,
                factCheck: latestAnalysis.factCheck,
              },
            ],
          }),
      };
    });

    return NextResponse.json(
      {
        documents: transformedDocs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        headers: { 'Cache-Control': 'private, max-age=5, stale-while-revalidate=10' },
      }
    );
  } catch (error) {
    log.error('Error fetching documents:', error);
    return apiError({ error: 'Failed to fetch documents', status: 500 });
  }
}
