import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { isFileTypeSupported, FILE_TYPE_LABELS } from '@/lib/constants/file-types';
import { INVESTMENT_DOCUMENT_TYPES } from '@/lib/prompts/investment-vertical';
import { getUserPlan, effectiveUploadMaxMB } from '@/lib/utils/plan-limits';

const log = createLogger('UploadSignedUrl');

/**
 * Large-file upload — step 1 of 2 (the other is /api/upload/finalize).
 *
 * Vercel serverless functions cap the REQUEST BODY at ~4.5MB, so the normal
 * multipart `/api/upload` route silently fails for anything bigger (the edge
 * rejects it before the function runs — no log, no row, "nothing happened").
 * Real CIMs / S-1s / board decks routinely exceed that. The fix: the browser
 * uploads the bytes DIRECTLY to Supabase Storage via a signed URL (never
 * through a Vercel function body), then /api/upload/finalize parses + persists
 * server-side by downloading from Storage.
 *
 * This route does no file I/O — it validates the metadata, creates a
 * placeholder Document (status 'uploading') so the storage path stays the
 * canonical `${userId}/${doc.id}${ext}` (delete reconstructs that), and returns
 * a signed Storage upload URL the client uploads to.
 */
export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(userId, '/api/upload');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can upload up to 5 documents per hour.' },
        { status: 429 }
      );
    }

    let body: {
      filename?: string;
      fileType?: string;
      fileSize?: number;
      documentType?: string | null;
      containerId?: string | null;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const filename = (body.filename || '').trim();
    const fileType = body.fileType || 'application/octet-stream';
    const fileSize = Number(body.fileSize) || 0;
    const documentType = body.documentType || null;

    if (!filename) {
      return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
    }
    if (!isFileTypeSupported(fileType, filename)) {
      return NextResponse.json(
        { error: `Invalid file type. Supported: ${FILE_TYPE_LABELS}` },
        { status: 400 }
      );
    }

    const VALID_DOC_TYPES: readonly string[] = [...INVESTMENT_DOCUMENT_TYPES, 'other'];
    if (documentType && !VALID_DOC_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Effective upload cap = lower of the plan ladder and the Supabase Storage
    // ceiling (same as the direct route).
    const userPlan = await getUserPlan(userId);
    const maxUploadMB = effectiveUploadMaxMB(userPlan);
    if (fileSize > maxUploadMB * 1024 * 1024) {
      const sizeMb = (fileSize / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        {
          error: `Too large at ${sizeMb}MB (limit ${maxUploadMB}MB). A full filing is mostly exhibits and financials — for a sharper audit, upload or paste just the strategic sections (the risk factors, the MD&A, or the thesis), not the whole document.`,
        },
        { status: 413 }
      );
    }

    // Resolve org membership (best-effort).
    let userOrgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      userOrgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — TeamMember may not exist yet
    }

    // Placeholder Document. status 'uploading' is transient — /finalize flips it
    // to 'pending' once the bytes land + parse. Using the real doc.id for the
    // storage path keeps deletion (which reconstructs the path) working.
    const doc = await prisma.document.create({
      data: {
        userId,
        orgId: userOrgId,
        filename,
        fileType,
        fileSize,
        content: '',
        status: 'uploading',
        ...(documentType ? { documentType } : {}),
      },
      select: { id: true },
    });

    const ext = path.extname(filename);
    const storagePath = `${userId}/${doc.id}${ext}`;
    const bucket = process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf';

    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (signErr || !signed) {
      // Roll back the placeholder so we don't leak an orphan row.
      await prisma.document
        .delete({ where: { id: doc.id } })
        .catch(e => log.warn('placeholder rollback failed:', e));
      log.error('createSignedUploadUrl failed:', signErr);
      return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      documentId: doc.id,
      path: signed.path,
      token: signed.token,
      bucket,
    });
  } catch (error) {
    log.error('create-signed-url error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Could not start upload' }, { status: 500 });
  }
}
