import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { createClient } from '@/utils/supabase/server';
import { parseFile } from '@/lib/utils/file-parser';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { createHash } from 'crypto';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkAnalysisLimit } from '@/lib/utils/plan-limits';
import { createLogger } from '@/lib/utils/logger';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { logAudit } from '@/lib/audit';
import { isFileTypeSupported, FILE_TYPE_LABELS } from '@/lib/constants/file-types';

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

    // Enforce monthly plan limits (check before accepting upload to save bandwidth)
    const planCheck = await checkAnalysisLimit(userId);
    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          error: `Monthly analysis limit reached (${planCheck.used}/${planCheck.limit}). Upgrade your plan for more.`,
          code: 'PLAN_LIMIT',
          plan: planCheck.plan,
          used: planCheck.used,
          limit: planCheck.limit,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const frameId = formData.get('frameId') as string | null;
    const documentType = formData.get('documentType') as string | null;
    const dealId = formData.get('dealId') as string | null;

    // Validate documentType against known investment document types
    const VALID_DOC_TYPES = [
      'ic_memo',
      'cim',
      'pitch_deck',
      'term_sheet',
      'due_diligence',
      'lp_report',
      'other',
    ];
    if (documentType && !VALID_DOC_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Enforce file size limit (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
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

    // Verify deal ownership if dealId provided
    if (dealId) {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: dealId, orgId: userOrgId || userId },
        });
        if (!deal) {
          return NextResponse.json({ error: 'Deal not found or access denied' }, { status: 400 });
        }
      } catch {
        // Schema drift — Deal table may not exist yet, allow upload without deal link
        log.warn('Deal ownership check failed (schema drift), proceeding without deal link');
      }
    }

    // Extract text content
    let content = '';

    try {
      content = await parseFile(buffer, file.type, file.name);
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
          ...(dealId ? { dealId } : {}),
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
        // Unique constraint violation on contentHash — another user
        // already has this hash. Safe to ignore: create without hash.
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
            ...(dealId ? { dealId } : {}),
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
        dealId: dealId || undefined,
      },
    });

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
