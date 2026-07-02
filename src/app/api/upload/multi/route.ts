import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { parseFile } from '@/lib/utils/file-parser';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { createHash } from 'crypto';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { logAudit } from '@/lib/audit';
import { isFileTypeSupported, FILE_TYPE_LABELS } from '@/lib/constants/file-types';
import { prewarmDocumentEmbedding } from '@/lib/rag/embeddings';
import { INVESTMENT_DOCUMENT_TYPES } from '@/lib/prompts/investment-vertical';
import { getUserPlan, effectiveUploadMaxMB } from '@/lib/utils/plan-limits';
import { stitchDecisionSources } from '@/lib/analysis/stitch-sources';

const log = createLogger('UploadMultiRoute');

// Multi-document decision upload (2026-07-02). Sometimes a single filing isn't
// the whole decision — it's 2-N official documents (an S-1 + its 424B4; an 8-K
// announcement + the deal exhibit) that together ARE the decision. This parses
// every source, STITCHES them into ONE audited record with fair per-source
// budgeting (stitch-sources.ts — each source thoroughly represented, distilled
// to its reasoning, never truncated to the first), then hands back one Document
// the normal analyze pipeline runs as ONE decision. The single-doc /api/upload
// path is untouched. Same request-path ceiling as upload (heavy multi-parse).
export const maxDuration = 300;

const MAX_SOURCES = 5;

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Share the upload rate limit (5/hr) — a stitched decision is one upload.
    const rl = await checkRateLimit(userId, '/api/upload');
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can upload up to 5 documents per hour.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);
    const documentType = formData.get('documentType') as string | null;

    const VALID_DOC_TYPES: readonly string[] = [...INVESTMENT_DOCUMENT_TYPES, 'other'];
    if (documentType && !VALID_DOC_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    if (files.length < 2) {
      return NextResponse.json(
        { error: 'Provide at least 2 documents to combine (use the standard upload for one).' },
        { status: 400 }
      );
    }
    if (files.length > MAX_SOURCES) {
      return NextResponse.json(
        { error: `Too many documents — combine at most ${MAX_SOURCES} into one decision.` },
        { status: 400 }
      );
    }

    const userPlan = await getUserPlan(userId);
    const maxUploadMB = effectiveUploadMaxMB(userPlan);
    const MAX_FILE_SIZE = maxUploadMB * 1024 * 1024;

    // Tenant scope — mirror /api/upload's org resolution.
    let userOrgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      userOrgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — TeamMember table may not exist yet; proceed org-less.
    }

    // Validate + parse each source, then stitch.
    const sources: { name: string; content: string }[] = [];
    let totalBytes = 0;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / 1024 / 1024).toFixed(1);
        return NextResponse.json(
          { error: `"${file.name}" is too large (${sizeMb}MB · current cap ${maxUploadMB}MB).` },
          { status: 413 }
        );
      }
      if (!isFileTypeSupported(file.type, file.name)) {
        return NextResponse.json(
          { error: `"${file.name}": unsupported type. Supported: ${FILE_TYPE_LABELS}` },
          { status: 400 }
        );
      }
      totalBytes += file.size;
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const text = await parseFile(buffer, file.type, file.name, documentType ?? undefined);
        if (text.trim()) sources.push({ name: file.name, content: text });
      } catch (error) {
        log.error('Multi-upload parse error:', error);
        return NextResponse.json(
          { error: `Failed to parse "${file.name}": ${getSafeErrorMessage(error)}` },
          { status: 400 }
        );
      }
    }

    if (sources.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 documents must contain readable text to combine.' },
        { status: 400 }
      );
    }

    // Stitch — fair per-source budgeting so every source is thoroughly represented.
    const stitched = stitchDecisionSources(sources);
    const content = stitched.content;
    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Combined documents appear to be empty.' },
        { status: 400 }
      );
    }

    const filename = `Combined decision · ${sources.length} sources (${sources
      .map(s => s.name)
      .join(', ')})`.slice(0, 250);
    const contentHash = createHash('sha256').update(content).digest('hex');
    const encryptedFields = isDocumentEncryptionEnabled() ? encryptDocumentContent(content) : {};

    const baseData = {
      userId,
      orgId: userOrgId,
      filename,
      fileType: 'text/plain',
      fileSize: totalBytes,
      content,
      status: 'pending' as const,
      ...(documentType ? { documentType } : {}),
    };

    let document;
    try {
      document = await prisma.document.create({
        data: { ...baseData, ...encryptedFields, contentHash },
      });
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        // Schema drift — create without the newer columns.
        document = await prisma.document.create({
          data: {
            userId,
            orgId: userOrgId,
            filename,
            fileType: 'text/plain',
            fileSize: totalBytes,
            content,
            status: 'pending',
          },
        });
      } else if (code === 'P2002') {
        // Same combined content already uploaded: a LIVE dup is a cache hit; a
        // SOFT-DELETED ghost must be purged so the fresh upload re-takes the key
        // (the per-user contentHash dedup discipline — a dead id 404s the reader).
        const existing = await prisma.document.findFirst({ where: { contentHash, userId } });
        if (existing && !existing.deletedAt) {
          return NextResponse.json({
            id: existing.id,
            filename: existing.filename,
            status: existing.status,
            cached: true,
            multiSource: true,
            sources: stitched.sources,
          });
        }
        if (existing) {
          await prisma.document
            .delete({ where: { id: existing.id } })
            .catch(err => log.warn('multi-upload ghost purge failed:', err));
        }
        document = await prisma.document.create({
          data: { ...baseData, ...encryptedFields, contentHash },
        });
      } else {
        throw dbError;
      }
    }

    // Audit log (fire-and-forget) — mirror /api/upload.
    logAudit({
      action: 'UPLOAD_DOCUMENT',
      resource: 'Document',
      resourceId: document.id,
      details: {
        multiSource: true,
        sourceCount: sources.length,
        sources: stitched.sources,
        anyDistilled: stitched.anyDistilled,
        documentType: documentType || undefined,
      },
    });

    // Pre-warm the embedding cache so the analysis RAG query hits a warm entry.
    after(prewarmDocumentEmbedding(content));

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      status: document.status,
      multiSource: true,
      sources: stitched.sources,
      anyDistilled: stitched.anyDistilled,
      message: `Combined ${sources.length} documents into one decision`,
    });
  } catch (error) {
    const rawCode = (error as { code?: string }).code ?? 'none';
    log.error(`Multi-upload error [code=${rawCode}]: ${getSafeErrorMessage(error)}`);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
