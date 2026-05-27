import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { createClient } from '@/utils/supabase/server';
import { parseFile, extractTypeAwareStructuredData } from '@/lib/utils/file-parser';
import { Prisma } from '@prisma/client';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { createHash } from 'crypto';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { logAudit } from '@/lib/audit';
import { isFileTypeSupported, FILE_TYPE_LABELS } from '@/lib/constants/file-types';
import { prewarmDocumentEmbedding } from '@/lib/rag/embeddings';
import { INVESTMENT_DOCUMENT_TYPES } from '@/lib/prompts/investment-vertical';
import { getUserPlan } from '@/lib/utils/plan-limits';
import { PLANS } from '@/lib/stripe';

const log = createLogger('UploadRoute');

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

    // Rate limit by authenticated user (not IP)
    const rateLimitResult = await checkRateLimit(userId, '/api/upload');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can upload up to 5 documents per hour.',
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

    // NOTE: Monthly analysis-limit enforcement lives in the analysis routes
    // (/api/analyze and /api/analyze/stream), not here. Uploads are free so
    // users can store and browse documents before committing a plan slot.

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const frameId = formData.get('frameId') as string | null;
    const documentType = formData.get('documentType') as string | null;
    // Container-context attach (replaces legacy `dealId`). Phase 2 of
    // the DecisionContainer refactor wires the actual containerId →
    // DecisionContainerDocument join on upload; for now any incoming
    // value is captured but not persisted to a join row.
    const containerId =
      (formData.get('containerId') as string | null) ?? (formData.get('dealId') as string | null);
    /** When set, this upload becomes a NEW VERSION of the referenced document.
     *  parentDocumentId is normalised to point at the chain root (v1.id), and
     *  versionNumber is computed as max(existing siblings) + 1. The analyze
     *  pipeline picks up `previousAnalysisId` automatically off the schema
     *  link. Plan reference: 2.3 — versioning + delta DQI. */
    const versionOfRaw = formData.get('versionOfDocumentId') as string | null;

    // Validate documentType against canonical INVESTMENT_DOCUMENT_TYPES.
    // Locked 2026-05-09 (synergy-parser deepening fix): the prior hardcoded
    // VALID_DOC_TYPES list was 6 entries while INVESTMENT_DOCUMENT_TYPES had
    // grown to 9 (qofe / synergy_model / integration_plan added in the
    // 2026-05-09 M&A P1 ship), silently rejecting uploads of those three
    // M&A-native document types. Deriving from the canonical export
    // structurally prevents this drift class — any future addition to
    // INVESTMENT_DOCUMENT_TYPES is accepted by the upload route automatically.
    const VALID_DOC_TYPES: readonly string[] = [...INVESTMENT_DOCUMENT_TYPES, 'other'];
    if (documentType && !VALID_DOC_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Enforce file size limit per the user's plan. Per-plan ladder
    // locked 2026-05-27 (soft-limit pass #2) — Free 25MB / Individual
    // 250MB / Strategy 250MB / Enterprise 500MB. Pro and Strategy
    // share upload size on purpose; upload size is NOT a meaningful
    // tier differentiator (the wedge needs real CIMs). The Strategy
    // tier earns its price on TEAM features, not upload ceiling.
    // Gemini 3 Flash's 1M token context (~3000 pages of dense text)
    // means model capacity is never the binding constraint; the
    // practical ceiling is Vercel Fluid Compute body size.
    const userPlan = await getUserPlan(userId);
    const maxUploadMB = PLANS[userPlan].maxUploadMB;
    const MAX_FILE_SIZE = maxUploadMB * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      const planLabel = PLANS[userPlan].name;
      // Upgrade hint skips Pro→Strategy (same size) and points
      // straight to the next-larger tier. Free→Individual unlocks
      // 10× more headroom (25→250); Pro/Strategy→Enterprise unlocks
      // 2× plus the signed-URL path for full data rooms.
      const upgradeHint =
        userPlan === 'free'
          ? 'Upgrade to Individual for 250MB uploads — 10× the Free cap.'
          : userPlan === 'pro' || userPlan === 'team'
            ? 'Talk to sales at /pricing/quote for Enterprise 500MB uploads + signed-URL upload path for full data rooms.'
            : 'Talk to sales at /pricing/quote for a custom contract.';
      return NextResponse.json(
        {
          error: `File too large (${sizeMb}MB · ${planLabel} plan cap is ${maxUploadMB}MB). ${upgradeHint}`,
        },
        { status: 413 }
      );
    }

    // Validate file type
    if (!isFileTypeSupported(file.type, file.name)) {
      return NextResponse.json(
        { error: `Invalid file type. Supported: ${FILE_TYPE_LABELS}` },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate SHA-256 hash for semantic caching
    const contentHash = createHash('sha256').update(buffer).digest('hex');

    // Check if document already exists (Semantic Caching)
    // Wrapped in schema-drift protection: if contentHash column doesn't
    // exist yet (migration pending) we skip the cache check gracefully.
    let existingDoc: { id: string; filename: string; status: string; analyses?: unknown[] } | null =
      null;
    try {
      existingDoc = await prisma.document.findFirst({
        where: { contentHash, userId },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              biases: true,
            },
          },
        },
      });
    } catch (cacheErr: unknown) {
      const code = (cacheErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift in cache check (' + code + '), retrying with core fields');
        try {
          existingDoc = await prisma.document.findFirst({
            where: { userId, filename: file.name },
            select: {
              id: true,
              filename: true,
              status: true,
              analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { id: true, overallScore: true, noiseScore: true, summary: true },
              },
            },
          });
        } catch {
          log.warn('Schema drift: cache fallback also failed, skipping cache check');
        }
      } else {
        throw cacheErr;
      }
    }

    if (existingDoc) {
      log.info('Cache hit: Document already analyzed ' + existingDoc.id);

      // Return cached result with the existing document ID and analysis
      return NextResponse.json({
        id: existingDoc.id,
        filename: existingDoc.filename,
        status: existingDoc.status,
        cached: true,
        message: 'Document already analyzed (Cached)',
        analysis: (existingDoc.analyses as unknown[])?.[0] || null,
      });
    }

    // Resolve org membership for this user (if any)
    let userOrgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      userOrgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — TeamMember table may not exist yet
    }

    // Container ownership verification + access check (Phase 3 P3.3
    // wiring). When the upload carries a containerId, verify the
    // requesting user can write to it — owner OR same-org with team
    // visibility. Failure modes:
    //   - containerId provided but unknown / no access → 400, abort
    //   - container exists but TeamMember check fails → ownership-only
    //   - schema-drift error → log warn, proceed without attach
    let resolvedContainerId: string | null = null;
    if (containerId) {
      try {
        const container = await prisma.decisionContainer.findFirst({
          where: {
            id: containerId,
            OR: [{ ownerUserId: userId }, { orgId: userOrgId ?? undefined }],
          },
          select: { id: true },
        });
        if (!container) {
          return NextResponse.json(
            { error: 'Container not found or access denied' },
            { status: 400 }
          );
        }
        resolvedContainerId = container.id;
      } catch (driftErr) {
        // @schema-drift-tolerant — DecisionContainer may not be migrated
        // on older deployments. Drop the attach silently rather than
        // blocking the upload; the user can attach manually post-create.
        log.warn(
          'Container attach skipped (schema drift?): ' +
            (driftErr instanceof Error ? driftErr.message : String(driftErr))
        );
      }
    }

    // Resolve version-chain ancestor when versionOfDocumentId is provided.
    // We anchor parentDocumentId on the CHAIN ROOT (always v1.id), so v3
    // points to v1 just like v2 does. versionNumber is computed as
    // max(existing chain siblings) + 1. The new analysis's
    // previousAnalysisId is wired in /api/analyze/stream (it queries the
    // immediate predecessor by versionNumber - 1 in the same chain).
    let resolvedParentDocumentId: string | null = null;
    let resolvedVersionNumber = 1;
    if (versionOfRaw && versionOfRaw.trim().length > 0) {
      try {
        const target = await prisma.document.findUnique({
          where: { id: versionOfRaw.trim() },
          select: {
            id: true,
            userId: true,
            orgId: true,
            parentDocumentId: true,
            versionNumber: true,
            deletedAt: true,
          },
        });
        if (!target || target.deletedAt) {
          return NextResponse.json(
            { error: 'Cannot version: source document not found' },
            { status: 400 }
          );
        }
        // Access check on the source — same policy as the GET on documents/[id].
        const ownsTarget = target.userId === userId;
        const sharedOrg = !ownsTarget && target.orgId && userOrgId && target.orgId === userOrgId;
        if (!ownsTarget && !sharedOrg) {
          return NextResponse.json(
            { error: 'Cannot version: access denied to source document' },
            { status: 403 }
          );
        }
        const rootId = target.parentDocumentId ?? target.id;
        const maxSibling = await prisma.document.aggregate({
          where: {
            OR: [{ id: rootId }, { parentDocumentId: rootId }],
            deletedAt: null,
          },
          _max: { versionNumber: true },
        });
        const nextVersion = (maxSibling._max.versionNumber ?? 1) + 1;
        resolvedParentDocumentId = rootId;
        resolvedVersionNumber = nextVersion;
        log.info(
          `Versioned upload: rootId=${rootId} nextVersion=${nextVersion} (source=${target.id})`
        );
      } catch (lookupErr) {
        log.warn('versionOfDocumentId lookup failed (proceeding as v1):', lookupErr);
      }
    }

    // Extract text content
    let content = '';
    // Type-aware structured-data extraction (locked 2026-05-09 hard-layer
    // ship). Runs in parallel to text parsing and persists to
    // Document.parsedStructuredData below. Null when no structured parser
    // matches the documentType OR extraction bailed — downstream consumers
    // fall back to the legacy text-content extraction path.
    let parsedStructuredData: Awaited<ReturnType<typeof extractTypeAwareStructuredData>> = null;

    try {
      // Pass documentType to enable synergy_model spreadsheet enrichment
      // (locked 2026-05-09). For other doc types the param is informational —
      // parseFile only uses it for synergy_model + .xlsx today.
      content = await parseFile(buffer, file.type, file.name, documentType ?? undefined);
      parsedStructuredData = await extractTypeAwareStructuredData(
        buffer,
        file.type,
        file.name,
        documentType
      );
    } catch (error) {
      log.error('File Parse Error:', error);
      return NextResponse.json(
        {
          error: getSafeErrorMessage(error),
        },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'Document appears to be empty' }, { status: 400 });
    }

    // Store in database with content hash for future caching.
    // Created BEFORE the storage upload so we can use the document's
    // cuid as the storage filename, making the path deterministic for
    // later deletion: ${userId}/${document.id}${ext}
    // Falls back to plain create if contentHash column is missing (schema drift).
    const encryptedFields = isDocumentEncryptionEnabled() ? encryptDocumentContent(content) : {};
    let document;
    try {
      document = await prisma.document.create({
        data: {
          userId,
          orgId: userOrgId,
          filename: file.name,
          fileType: file.type || 'text/plain',
          fileSize: file.size,
          content,
          ...encryptedFields,
          contentHash,
          status: 'pending',
          ...(documentType ? { documentType } : {}),
          // Persist type-aware structured parser output when present
          // (locked 2026-05-09 hard-layer ship). Replaces the inline-marker
          // text round-trip for downstream DPR/aggregation consumers. Cast
          // to Prisma.InputJsonValue per the JSON-field convention in
          // CLAUDE.md "Prisma JSON fields need explicit casting".
          ...(parsedStructuredData
            ? { parsedStructuredData: parsedStructuredData as unknown as Prisma.InputJsonValue }
            : {}),
          // Container attach via DecisionContainerDocument join row
          // ships in Phase 2; Document.dealId column is removed.
          ...(resolvedParentDocumentId
            ? { parentDocumentId: resolvedParentDocumentId, versionNumber: resolvedVersionNumber }
            : {}),
        },
      });
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift: new columns missing, falling back to core create (' + code + ')');
        document = await prisma.document.create({
          data: {
            userId,
            orgId: userOrgId,
            filename: file.name,
            fileType: file.type || 'text/plain',
            fileSize: file.size,
            content,
            status: 'pending',
          },
        });
      } else if (code === 'P2002') {
        // Unique constraint violation on contentHash — concurrent upload
        // of the same file. Return the existing document as a cache hit
        // instead of creating a duplicate.
        const existing = await prisma.document.findFirst({
          where: { contentHash, userId },
          include: {
            analyses: { orderBy: { createdAt: 'desc' }, take: 1, include: { biases: true } },
          },
        });
        if (existing) {
          log.info('Concurrent upload resolved as cache hit: ' + existing.id);
          return NextResponse.json({
            id: existing.id,
            filename: existing.filename,
            status: existing.status,
            cached: true,
            message: 'Document already analyzed (Cached)',
            analysis: (existing.analyses as unknown[])?.[0] || null,
          });
        }
        // If not found (different user's hash), create without hash
        document = await prisma.document.create({
          data: {
            userId,
            orgId: userOrgId,
            filename: file.name,
            fileType: file.type || 'text/plain',
            fileSize: file.size,
            content,
            status: 'pending',
            ...(documentType ? { documentType } : {}),
            // Container attach via DecisionContainerDocument join row
            // ships in Phase 2; Document.dealId column is removed.
            ...(resolvedParentDocumentId
              ? { parentDocumentId: resolvedParentDocumentId, versionNumber: resolvedVersionNumber }
              : {}),
          },
        });
      } else {
        throw dbError;
      }
    }

    // Upload to Supabase storage using document.id as the filename
    // so we can reconstruct the path on delete without extra DB columns.
    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();

    const fileExt = path.extname(file.name);
    const storagePath = `${userId}/${document.id}${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Clean up the DB record since the storage upload failed
      log.error('Supabase Storage Upload Error:', uploadError);
      await prisma.document
        .delete({ where: { id: document.id } })
        .catch((e: unknown) => log.error('Failed to clean up DB after storage error:', e));
      throw new Error(`Storage Upload Failed: ${uploadError.message}`);
    }

    // Link to DecisionFrame if frameId was provided (fire-and-forget)
    if (frameId) {
      void prisma.decisionFrame
        .updateMany({
          where: { id: frameId, userId, documentId: { equals: null } },
          data: { documentId: document.id },
        })
        .catch(err => log.warn('Failed to link DecisionFrame:', err));
    }

    // Phase 3 P3.3 — attach to DecisionContainer via the join table.
    // Container access was already verified above; this just creates
    // the join row + recomputes the container metrics. Position
    // defaults to the next slot (count + 1) so the doc lands at the
    // bottom of the container's existing roster. Fire-and-forget —
    // if the join fails the upload still succeeds; the user can
    // attach manually post-create.
    if (resolvedContainerId) {
      void (async () => {
        try {
          const existingCount = await prisma.decisionContainerDocument.count({
            where: { containerId: resolvedContainerId! },
          });
          await prisma.decisionContainerDocument.create({
            data: {
              containerId: resolvedContainerId!,
              documentId: document.id,
              role: documentType || null,
              position: existingCount,
            },
          });
          const { recomputeContainerMetrics } = await import('@/lib/scoring/container-aggregation');
          await recomputeContainerMetrics(resolvedContainerId!);
          log.info(`Attached document ${document.id} to container ${resolvedContainerId}`);
        } catch (joinErr) {
          log.warn(
            'Container join attach failed (non-critical): ' +
              (joinErr instanceof Error ? joinErr.message : String(joinErr))
          );
        }
      })();
    }

    // Audit log (fire-and-forget)
    logAudit({
      action: 'UPLOAD_DOCUMENT',
      resource: 'Document',
      resourceId: document.id,
      details: {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType: documentType || undefined,
        containerId: containerId || undefined,
      },
    });

    // Pre-warm embedding cache so the analysis pipeline's RAG query
    // hits a warm entry instead of paying the Gemini round-trip live.
    // `after()` keeps the serverless invocation alive past the response.
    after(prewarmDocumentEmbedding(content));

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      status: document.status,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    // Log the raw code + message internally so Vercel logs show the real
    // cause (e.g. P2022 schema drift) while the client only receives the
    // sanitised message.
    const rawCode = (error as { code?: string }).code ?? 'none';
    const rawMsg = error instanceof Error ? error.message : String(error);
    log.error(`Upload error [code=${rawCode}]: ${rawMsg}`);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const skip = (page - 1) * limit;

    // Include org-scoped documents if user belongs to a team
    let where: { userId?: string; OR?: Array<Record<string, unknown>> } = { userId };
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      if (membership?.orgId) {
        where = {
          OR: [{ userId }, { orgId: membership.orgId }],
        };
      }
    } catch {
      // Schema drift — fall back to userId-only
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          filename: true,
          fileType: true,
          fileSize: true,
          status: true,
          uploadedAt: true,
          updatedAt: true,
          analyses: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    log.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
