import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { getDocumentContent } from '@/lib/utils/encryption';
import { buildDocumentAccessWhere } from '@/lib/utils/document-access';

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

    // Document-level RBAC (3.5): the visibility model now governs read
    // access. The owner always wins; teammates see 'team' docs; explicit
    // grantees see 'specific' docs; nobody else sees 'private' docs.
    // buildDocumentAccessWhere also excludes soft-deleted rows.
    const access = await buildDocumentAccessWhere(id, userId);
    const where = access.where as {
      id: string;
      userId?: string;
      OR?: Array<Record<string, unknown>>;
      deletedAt?: null;
    };

    // Try with all analysis fields first; fall back to core-only if
    // extended columns don't exist yet (schema drift / P2022).
    let document;
    try {
      document = await prisma.document.findFirst({
        where,
        select: {
          id: true,
          userId: true,
          filename: true,
          fileType: true,
          fileSize: true,
          content: true,
          contentEncrypted: true,
          contentIv: true,
          contentTag: true,
          uploadedAt: true,
          status: true,
          visibility: true,
          legalHoldId: true,
          legalHold: {
            select: {
              id: true,
              reason: true,
              holdUntil: true,
              releasedAt: true,
              grantedById: true,
              createdAt: true,
            },
          },
          deal: {
            select: {
              id: true,
              name: true,
              sector: true,
              ticketSize: true,
            },
          },
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
              forgottenQuestions: true,
              marketContextApplied: true,
              marketContextOverride: true,
              outcomeStatus: true,
              recalibratedDqi: true,
              outcome: true,
            },
          },
        },
      });
    } catch (fetchErr: unknown) {
      const code = (fetchErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift: falling back to core analysis fields (' + code + ')');
        document = await prisma.document.findFirst({
          where: { id, userId }, // Fall back to userId-only on schema drift
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
    let decryptedContent: string;
    try {
      decryptedContent = getDocumentContent(
        document as Parameters<typeof getDocumentContent>[0]
      );
    } catch (decryptErr) {
      log.error('Document decryption failed:', decryptErr);
      return NextResponse.json(
        {
          error:
            'Document decryption failed. The encryption key version on this row is no longer resolvable in this deployment — check DOCUMENT_ENCRYPTION_KEY_V{N} env vars.',
        },
        { status: 500 }
      );
    }
    // Normalise Prisma Decimal (deal.ticketSize) to a plain number so the
    // client can compare it numerically without importing Decimal.
    const dealRaw = (docFields as { deal?: { ticketSize?: unknown } | null }).deal;
    const deal = dealRaw
      ? {
          ...dealRaw,
          ticketSize:
            dealRaw.ticketSize != null ? Number(dealRaw.ticketSize as unknown as string) : null,
        }
      : null;
    const isOwner = (docFields as { userId?: string }).userId === userId;
    return NextResponse.json({
      ...docFields,
      deal,
      content: decryptedContent,
      isOwner,
    });
  } catch (error) {
    const code = (error as { code?: string }).code ?? 'unknown';
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Error fetching document [code=${code}]: ${msg}`);
    return NextResponse.json(
      {
        error: `Could not load document. ${code !== 'unknown' ? `(${code}) ` : ''}${msg.slice(0, 240)}`,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/:id  (2.3 deep)
 *
 * Owner-only update of light metadata that doesn't have its own
 * dedicated route. Currently supports:
 *   versionLabel — free-text human label per version (≤80 chars).
 *
 * The visibility editor lives at /api/documents/:id/visibility and the
 * legal-hold attach lives at /api/legal-holds; this PATCH is for things
 * the document owner can change in-place without a workflow.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const update: { versionLabel?: string | null } = {};
    if ('versionLabel' in body) {
      const raw = (body as { versionLabel?: unknown }).versionLabel;
      if (raw === null || raw === '') {
        update.versionLabel = null;
      } else if (typeof raw === 'string') {
        const trimmed = raw.trim().slice(0, 80);
        update.versionLabel = trimmed.length === 0 ? null : trimmed;
      } else {
        return NextResponse.json({ error: 'versionLabel must be string or null' }, { status: 400 });
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No updatable fields supplied' }, { status: 400 });
    }

    // Owner-only.
    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Not found or not owner' }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: update,
      select: { id: true, versionLabel: true },
    });
    return NextResponse.json({ ok: true, ...updated });
  } catch (e) {
    log.error('PATCH document failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

    // Rate limit: 10 deletions per hour (fail closed for destructive operations)
    const rateLimitResult = await checkRateLimit(userId, '/api/documents/delete', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      failMode: 'closed',
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

    // Soft-delete only: stamp `deletedAt` + `deletionReason='user_request'`
    // and return immediately. The hard-purge (DB cascade + Supabase storage
    // cleanup) is performed by the daily /api/cron/enforce-retention pass
    // after a SOFT_DELETE_GRACE_DAYS grace window. Recovery during the
    // grace window is a support ticket today; a self-serve restore button
    // is a future plan item.
    //
    // Org-scoped access: an Org admin can soft-delete any doc in their Org.
    // Personal docs require ownership (userId match). The `deletedAt: null`
    // gate ensures double-deletes are no-ops rather than errors.
    let where: {
      id: string;
      userId?: string;
      OR?: Array<Record<string, unknown>>;
      deletedAt: null;
    } = {
      id,
      userId,
      deletedAt: null,
    };
    try {
      const orgAdmin = await prisma.teamMember.findFirst({
        where: { userId, role: 'admin' },
        select: { orgId: true },
      });
      if (orgAdmin?.orgId) {
        where = {
          id,
          OR: [{ userId }, { orgId: orgAdmin.orgId }],
          deletedAt: null,
        };
      }
    } catch {
      // Schema drift — fall back to ownership-only
    }

    const doc = await prisma.document.findFirst({
      where,
      select: { id: true },
    });

    if (!doc) {
      // Either doesn't exist, isn't owned by the caller, or already soft-deleted.
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        deletedAt: new Date(),
        deletionReason: 'user_request',
      },
    });

    // Audit-log the destructive action. Fire-and-forget so a logger outage
    // can't fail the user's delete; log a warning if it does.
    try {
      const { logAudit } = await import('@/lib/audit');
      logAudit({
        action: 'DELETE_ACCOUNT_DATA',
        resource: 'document',
        resourceId: doc.id,
        details: { reason: 'user_request', via: 'documents/[id] route' },
      }).catch(err => log.warn('audit log write failed:', err));
    } catch (err) {
      log.warn('audit module load failed:', err);
    }

    return NextResponse.json({
      success: true,
      softDeleted: true,
      recoverable: true,
      message: 'Document soft-deleted. It will be permanently purged after the grace window.',
    });
  } catch (error) {
    log.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
