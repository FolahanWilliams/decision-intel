import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import path from 'path';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { parseFile, extractTypeAwareStructuredData } from '@/lib/utils/file-parser';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { prewarmDocumentEmbedding } from '@/lib/rag/embeddings';
import { logAudit } from '@/lib/audit';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('UploadFinalize');

// Parsing a large doc (e.g. a 350-page S-1 downloaded from Storage) is the
// heavy work here — match the analyze routes' ceiling. The body is tiny
// (just a documentId), so the Vercel body limit doesn't apply.
export const maxDuration = 300;

/**
 * Large-file upload — step 2 of 2 (after /api/upload/create-signed-url).
 *
 * The browser has already uploaded the bytes straight to Supabase Storage at
 * `${userId}/${documentId}${ext}`. Here we download them SERVER-side (no
 * request-body limit), parse the text, dedup per-user, and flip the
 * placeholder Document from 'uploading' → 'pending' so the analyze pipeline
 * can run. On any failure the placeholder + its storage object are cleaned up
 * so a failed large upload never leaves an orphan.
 */
export async function POST(request: NextRequest) {
  let documentId = '';
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { documentId?: string; containerId?: string | null; frameId?: string | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const containerId = (body.containerId || '').trim() || null;
    const frameId = (body.frameId || '').trim() || null;
    documentId = (body.documentId || '').trim();
    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    // Ownership + state gate: only the owner can finalize their own placeholder.
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        userId: true,
        orgId: true,
        filename: true,
        fileType: true,
        status: true,
        documentType: true,
      },
    });
    if (!doc || doc.userId !== userId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (doc.status !== 'uploading') {
      // Already finalized (or never a large-upload placeholder) — return it as-is.
      return NextResponse.json({ id: doc.id, filename: doc.filename, status: doc.status });
    }

    const ext = path.extname(doc.filename);
    const storagePath = `${userId}/${doc.id}${ext}`;
    const bucket = process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf';

    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();

    const cleanup = async () => {
      await supabase.storage
        .from(bucket)
        .remove([storagePath])
        .catch(e => log.warn('cleanup: storage remove failed:', e));
      await prisma.document
        .delete({ where: { id: doc.id } })
        .catch(e => log.warn('cleanup: placeholder delete failed:', e));
    };

    // Download the bytes the browser uploaded directly to Storage.
    const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(storagePath);
    if (dlErr || !blob) {
      log.error('finalize download failed:', dlErr);
      await cleanup();
      return NextResponse.json(
        { error: 'Uploaded file not found in storage. Please try again.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    // Parse text + type-aware structured data.
    let content = '';
    let parsedStructuredData: Awaited<ReturnType<typeof extractTypeAwareStructuredData>> = null;
    try {
      content = await parseFile(buffer, doc.fileType, doc.filename, doc.documentType ?? undefined);
      parsedStructuredData = await extractTypeAwareStructuredData(
        buffer,
        doc.fileType,
        doc.filename,
        doc.documentType ?? null
      );
    } catch (parseErr) {
      log.error('finalize parse failed:', parseErr);
      await cleanup();
      return NextResponse.json({ error: getSafeErrorMessage(parseErr) }, { status: 400 });
    }

    if (!content.trim()) {
      await cleanup();
      return NextResponse.json({ error: 'Document appears to be empty' }, { status: 400 });
    }

    const contentHash = createHash('sha256').update(buffer).digest('hex');

    // Per-user dedup: if this exact content already exists under another of the
    // user's docs, drop the placeholder + storage object and return the cached one.
    // NOTE (2026-07-02): the match deliberately INCLUDES soft-deleted rows so we
    // can discriminate below — a LIVE match is a genuine cache hit; a SOFT-DELETED
    // match must be purged, NOT returned. Returning the ghost as "cached" was the
    // bug the founder hit re-uploading a previously-deleted filing: the dashboard
    // redirected to the dead doc's id and the detail page (which correctly
    // excludes soft-deleted docs) 404'd with "Document not found".
    const existing = await prisma.document.findFirst({
      where: { contentHash, userId, id: { not: doc.id } },
      include: {
        analyses: { orderBy: { createdAt: 'desc' }, take: 1, include: { biases: true } },
      },
    });
    if (existing && !existing.deletedAt) {
      await cleanup();
      // A still-analyzing match means a re-upload while the first audit runs —
      // surfacing it as "cached" dropped the user on an empty detail page
      // ("nothing found", 2026-07-02). Signal in-progress so the client points
      // them at Cancel instead.
      if (existing.status === 'analyzing') {
        return NextResponse.json({
          id: existing.id,
          filename: existing.filename,
          status: existing.status,
          inProgress: true,
          message: 'This document is already being analyzed. Cancel that audit to run it again.',
        });
      }
      return NextResponse.json({
        id: existing.id,
        filename: existing.filename,
        status: existing.status,
        cached: true,
        message: 'Document already analyzed (Cached)',
        analysis: (existing.analyses as unknown[])?.[0] || null,
      });
    }
    if (existing?.deletedAt) {
      // Soft-deleted ghost still owns the (userId, contentHash) unique key —
      // without this purge, the contentHash update below would P2002-collide.
      // Mirrors the direct upload route's P2002 fallback exactly: hard-delete
      // the ghost (cascades its dead analyses) so the fresh upload re-takes
      // the key. Re-uploading identical bytes after deleting is the clearest
      // "clean rerun" signal — the user gets a fresh document + fresh audit.
      log.info(`Purging soft-deleted duplicate ${existing.id} so re-upload proceeds fresh`);
      await prisma.document
        .delete({ where: { id: existing.id } })
        .catch(e => log.warn('Failed to purge soft-deleted duplicate before finalize:', e));
    }

    const encryptedFields = isDocumentEncryptionEnabled() ? encryptDocumentContent(content) : {};

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        content,
        ...encryptedFields,
        contentHash,
        status: 'pending',
        ...(parsedStructuredData
          ? { parsedStructuredData: parsedStructuredData as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });

    // Link to a DecisionFrame (fire-and-forget — parity with the direct route).
    if (frameId) {
      void prisma.decisionFrame
        .updateMany({
          where: { id: frameId, userId, documentId: { equals: null } },
          data: { documentId: doc.id },
        })
        .catch(err => log.warn('Failed to link DecisionFrame:', err));
    }

    // Attach to a DecisionContainer (fire-and-forget). Access is verified
    // here (owner OR same-org) before the join row is created — same policy
    // as the direct upload route.
    if (containerId) {
      void (async () => {
        try {
          const container = await prisma.decisionContainer.findFirst({
            where: {
              id: containerId,
              OR: [{ ownerUserId: userId }, { orgId: doc.orgId ?? undefined }],
            },
            select: { id: true },
          });
          if (!container) return;
          const existingCount = await prisma.decisionContainerDocument.count({
            where: { containerId: container.id },
          });
          await prisma.decisionContainerDocument.create({
            data: {
              containerId: container.id,
              documentId: doc.id,
              role: doc.documentType || null,
              position: existingCount,
            },
          });
          const { recomputeContainerMetrics } = await import('@/lib/scoring/container-aggregation');
          await recomputeContainerMetrics(container.id);
        } catch (joinErr) {
          log.warn(
            'Container attach failed (non-critical): ' +
              (joinErr instanceof Error ? joinErr.message : String(joinErr))
          );
        }
      })();
    }

    logAudit({
      action: 'UPLOAD_DOCUMENT',
      resource: 'Document',
      resourceId: doc.id,
      details: { filename: doc.filename, fileType: doc.fileType, large: true },
    });

    after(prewarmDocumentEmbedding(content));

    // Auto-name BEFORE returning (2026-07-02) — parity with the direct upload
    // route. A random-string / hash filename is meaningless on the DPR the
    // founder forwards; awaited (timeout-guarded + fail-soft) so the real title
    // lands before the client fires the audit. Good names are left untouched.
    let finalFilename = doc.filename;
    try {
      const { maybeAutoNameDocument } = await import('@/lib/utils/document-title');
      const renamed = await maybeAutoNameDocument(doc.id, content, doc.filename);
      if (renamed) finalFilename = renamed;
    } catch (err) {
      log.warn('finalize auto-name failed (keeping current name):', err);
    }

    return NextResponse.json({
      id: doc.id,
      filename: finalFilename,
      status: 'pending',
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    log.error(`finalize error [doc=${documentId}]: ${rawMsg}`);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
