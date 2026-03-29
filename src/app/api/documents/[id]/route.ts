import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { deleteVisualizations } from '@/lib/utils/visualization-storage';
import { getDocumentContent } from '@/lib/utils/encryption';

const log = createLogger('DocumentRoute');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try with all analysis fields first; fall back to core-only if
    // extended columns don't exist yet (schema drift / P2022).
    let document;
    try {
      document = await prisma.document.findFirst({
        where: { id, userId },
        select: {
          id: true,
          filename: true,
          fileType: true,
          fileSize: true,
          content: true,
          contentEncrypted: true,
          contentIv: true,
          contentTag: true,
          uploadedAt: true,
          status: true,
          analyses: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              overallScore: true,
              noiseScore: true,
              summary: true,
              createdAt: true,
              biases: true,
              noiseStats: true,
              noiseBenchmarks: true,
              factCheck: true,
              compliance: true,
              preMortem: true,
              sentiment: true,
              logicalAnalysis: true,
              swotAnalysis: true,
              cognitiveAnalysis: true,
              simulation: true,
              institutionalMemory: true,
              intelligenceContext: true,
              speakers: true,
              biasWebImageUrl: true,
              preMortemImageUrl: true,
              metaVerdict: true,
              recognitionCues: true,
              narrativePreMortem: true,
            },
          },
        },
      });
    } catch (fetchErr: unknown) {
      const code = (fetchErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift: falling back to core analysis fields (' + code + ')');
        document = await prisma.document.findFirst({
          where: { id, userId },
          select: {
            id: true,
            filename: true,
            fileType: true,
            fileSize: true,
            content: true,
            uploadedAt: true,
            status: true,
            analyses: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                overallScore: true,
                noiseScore: true,
                summary: true,
                createdAt: true,
                biases: true,
              },
            },
          },
        });
      } else {
        throw fetchErr;
      }
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Decrypt content transparently — never send encrypted fields to the client
    const docAny = document as Record<string, unknown>;
    const { contentEncrypted: _ce, contentIv: _ci, contentTag: _ct, ...docFields } = docAny;
    const decryptedContent = getDocumentContent(
      document as Parameters<typeof getDocumentContent>[0]
    );
    return NextResponse.json({ ...docFields, content: decryptedContent });
  } catch (error) {
    log.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 deletions per hour
    const rateLimitResult = await checkRateLimit(userId, '/api/documents/delete', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      failMode: 'open',
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    // Fetch the document first so we know the filename (for the
    // storage path) and can verify it exists before deleting.
    const doc = await prisma.document.findFirst({
      where: { id, userId },
      select: { id: true, filename: true, analyses: { select: { id: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from DB (cascades to analyses, biases, embeddings).
    // Wrap in a retry: if a leftover RESTRICT FK blocks the cascade,
    // attempt a raw cleanup first, then retry the delete.
    try {
      await prisma.document.delete({ where: { id } });
    } catch (deleteErr: unknown) {
      const code = (deleteErr as { code?: string }).code;
      // P2003 = foreign key constraint violation
      if (code === 'P2003') {
        log.warn('FK constraint blocked delete — attempting raw cleanup for document', id);
        // Clean up any orphaned rows in legacy tables that still reference
        // this document with ON DELETE RESTRICT.
        await prisma
          .$executeRawUnsafe(`DELETE FROM "HumanDecisionAudit" WHERE "documentId" = $1`, id)
          .catch(() => {});
        // Retry the delete
        await prisma.document.delete({ where: { id } });
      } else {
        throw deleteErr;
      }
    }

    // Clean up visualization storage (fire-and-forget)
    for (const analysis of doc.analyses) {
      deleteVisualizations('analysis', analysis.id).catch(() => {});
    }

    // Clean up Supabase storage (fire-and-forget).
    // Storage path matches the upload convention: ${userId}/${documentId}${ext}
    try {
      const { getServiceSupabase } = await import('@/lib/supabase');
      const supabase = getServiceSupabase();
      const ext = path.extname(doc.filename);
      const storagePath = `${userId}/${doc.id}${ext}`;
      const bucket = process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf';

      const { error: removeError } = await supabase.storage.from(bucket).remove([storagePath]);

      if (removeError) {
        log.warn(`Storage cleanup failed for ${storagePath}: ${removeError.message}`);
      }
    } catch (storageErr) {
      // Don't fail the request — the DB record is already gone.
      log.warn('Storage cleanup error:', storageErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
