/**
 * POST /api/retroactive/bulk-upload — accepts N files in one multipart
 * upload, parses each, classifies role (memo/outcome/mixed), extracts
 * entities + dates, runs the bulk-pairing engine, and returns the
 * paired batch the UI renders for review.
 *
 * Locked 2026-05-21 (adaptation #1, the Sankore-killer feature).
 *
 * Per file:
 *   1. parseFile() extracts plain text (PDF/DOCX/CSV/TXT/HTML/PPTX/XLSX)
 *   2. detectDocumentRole classifies as memo/outcome/mixed/unknown
 *   3. extractEntities pulls orgs + amounts + project codenames
 *   4. inferDocumentDate finds a date from filename + content
 *   5. Document row created under the user (encrypted, hashed)
 *
 * After all files processed: pairBulkDocuments runs over the
 * UploadedHistoricalDoc[] collection. Auto-pairs by entity overlap +
 * temporal proximity + content similarity.
 *
 * Returns the BulkPairingResult shape — the UI consumes it directly.
 *
 * Caps: 30 files per request, 50MB total. Rate-limited 5 bulks/hr/user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { parseFile } from '@/lib/utils/file-parser';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { detectDocumentRole } from '@/lib/retroactive/outcomeExtractor';
import { extractEntities, inferDocumentDate } from '@/lib/retroactive/entityExtractor';
import { pairBulkDocuments } from '@/lib/retroactive/bulkPairing';
import type { UploadedHistoricalDoc, BulkPairingResult } from '@/lib/retroactive/types';

const log = createLogger('RetroactiveBulkUpload');

export const maxDuration = 60;

const MAX_FILES = 30;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB
const MIN_FILE_BYTES = 100;

// ──────────────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
      setAll: () => {
        /* canonical Supabase RSC exception class — read-only */
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

// ──────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return apiError({ error: 'Unauthenticated.', status: 401 });
  }

  // Rate limit
  const perUser = await checkRateLimit(
    `retroactive-bulk:${userId}`,
    '/api/retroactive/bulk-upload',
    { windowMs: 3600_000, maxRequests: 5, failMode: 'closed' }
  );
  if (!perUser.success) {
    return apiError({
      error: 'Bulk-upload rate limit reached. Try again later.',
      status: 429,
    });
  }

  // Multipart parsing
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    // canonical body-parse fallthrough exception class
    log.warn('Multipart parse failed.', err);
    return apiError({ error: 'Invalid multipart body.', status: 400 });
  }

  const files = formData.getAll('files') as File[];
  if (files.length === 0) {
    return apiError({ error: 'No files in upload.', status: 400 });
  }
  if (files.length > MAX_FILES) {
    return apiError({
      error: `Bulk upload is capped at ${MAX_FILES} files per request.`,
      status: 413,
    });
  }

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return apiError({
      error: `Total upload exceeds ${MAX_TOTAL_BYTES / 1024 / 1024}MB cap.`,
      status: 413,
    });
  }

  // Process each file
  const uploadedDocs: UploadedHistoricalDoc[] = [];
  const errors: Array<{ filename: string; reason: string }> = [];

  for (const file of files) {
    if (file.size < MIN_FILE_BYTES) {
      errors.push({ filename: file.name, reason: 'too_small' });
      continue;
    }

    let parsedContent = '';
    let buffer: Buffer | null = null;
    try {
      const arr = await file.arrayBuffer();
      buffer = Buffer.from(arr);
      parsedContent = await parseFile(buffer, file.type, file.name);
    } catch (err) {
      log.warn(`Parse failed for ${file.name}:`, err);
      errors.push({ filename: file.name, reason: 'parse_failed' });
      continue;
    }

    if (!parsedContent || parsedContent.length < 50) {
      errors.push({ filename: file.name, reason: 'empty_content' });
      continue;
    }

    // Persist Document row (encrypted if configured)
    let documentId: string;
    try {
      const contentHash = createHash('sha256').update(parsedContent).digest('hex');
      const encFields = isDocumentEncryptionEnabled() ? encryptDocumentContent(parsedContent) : {};
      const doc = await prisma.document.create({
        data: {
          userId,
          filename: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: buffer.byteLength,
          content: parsedContent,
          ...encFields,
          contentHash,
          status: 'uploaded',
        },
      });
      documentId = doc.id;
    } catch (err) {
      log.warn(`Document create failed for ${file.name}:`, err);
      errors.push({ filename: file.name, reason: 'persist_failed' });
      continue;
    }

    // Classify + enrich
    const roleResult = detectDocumentRole(parsedContent);
    const entities = extractEntities(parsedContent);
    const inferredDate = inferDocumentDate(file.name, parsedContent);

    uploadedDocs.push({
      documentId,
      filename: file.name,
      content: parsedContent,
      inferredDate,
      detectedRole: roleResult.role,
      roleConfidence: roleResult.confidence,
      entities,
    });
  }

  if (uploadedDocs.length === 0) {
    return apiError({
      error: `No documents could be processed. Errors: ${errors.map(e => `${e.filename} (${e.reason})`).join(', ')}`,
      status: 422,
    });
  }

  // Run the pairing engine
  const pairing: BulkPairingResult = pairBulkDocuments({ docs: uploadedDocs });

  log.info(
    `Bulk upload by ${userId}: ${uploadedDocs.length}/${files.length} processed, ` +
      `${pairing.pairs.length} pairs, ${pairing.unclassified.length} unclassified, ` +
      `${errors.length} file errors.`
  );

  return NextResponse.json({
    pairing,
    fileErrors: errors,
  });
}
