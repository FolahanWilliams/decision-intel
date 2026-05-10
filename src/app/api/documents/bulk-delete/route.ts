/**
 * POST /api/documents/bulk-delete — atomic soft-delete of N documents.
 *
 * Replaces the prior pattern of firing N parallel DELETE /api/documents/[id]
 * requests, which hit the per-route 10/hr rate limit and partially failed
 * with 429s on mass deletes. This endpoint uses ONE rate-limit budget
 * (8 bulk deletes per hour, allowing up to 100 docs per call) + a single
 * `updateMany` so the transaction commits in one DB round-trip.
 *
 * Soft-delete only: stamps `deletedAt` + `deletionReason='user_request'`.
 * The hard-purge runs in the daily /api/cron/enforce-retention pass after
 * SOFT_DELETE_GRACE_DAYS, same as the singleton DELETE.
 *
 * Body: { ids: string[] } — caps at 100 ids per call.
 * Response: { deletedCount, requestedCount, deletedIds[], skippedIds[] }
 *   — `skippedIds` covers ids the caller doesn't own or that are already
 *     soft-deleted (silent no-ops, NOT 404s, because mass-delete with
 *     missing rows shouldn't error the entire batch).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('DocumentsBulkDelete');

const MAX_IDS_PER_CALL = 100;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_REQUESTS = 8;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
    const ids = Array.isArray(body?.ids)
      ? body!.ids.filter((v): v is string => typeof v === 'string')
      : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No document ids supplied' }, { status: 400 });
    }
    if (ids.length > MAX_IDS_PER_CALL) {
      return NextResponse.json(
        {
          error: `Too many ids in one call (max ${MAX_IDS_PER_CALL}). Split into multiple bulk-delete calls.`,
        },
        { status: 400 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, '/api/documents/bulk-delete', {
      windowMs: RATE_WINDOW_MS,
      maxRequests: RATE_MAX_REQUESTS,
      failMode: 'closed',
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Bulk-delete rate limit exceeded. Please try again later.',
          retryAfterSeconds: rateLimitResult.reset - Math.floor(Date.now() / 1000),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    // Resolve the org scope so org admins can bulk-delete shared docs.
    let orgAdminOrgId: string | null = null;
    try {
      const m = await prisma.teamMember.findFirst({
        where: { userId, role: 'admin' },
        select: { orgId: true },
      });
      orgAdminOrgId = m?.orgId ?? null;
    } catch {
      // Schema drift — fall back to ownership-only
    }

    const ownershipWhere = orgAdminOrgId
      ? {
          id: { in: ids },
          deletedAt: null,
          OR: [{ userId }, { orgId: orgAdminOrgId }],
        }
      : { id: { in: ids }, deletedAt: null, userId };

    // Fetch matching docs first so we can report deleted vs skipped.
    const matching = await prisma.document.findMany({
      where: ownershipWhere,
      select: { id: true },
    });
    const matchingIds = matching.map(d => d.id);

    if (matchingIds.length === 0) {
      return NextResponse.json({
        deletedCount: 0,
        requestedCount: ids.length,
        deletedIds: [],
        skippedIds: ids,
      });
    }

    const now = new Date();
    await prisma.document.updateMany({
      where: { id: { in: matchingIds }, deletedAt: null },
      data: {
        deletedAt: now,
        deletionReason: 'user_request',
      },
    });

    // One audit-log entry per batch (NOT per id) — keeps the audit log
    // navigable. The entry's `details.ids` field carries the full list.
    logAudit({
      action: 'DELETE_ACCOUNT_DATA',
      resource: 'document',
      resourceId: matchingIds[0],
      details: {
        reason: 'user_request',
        via: 'documents/bulk-delete',
        batchSize: matchingIds.length,
        ids: matchingIds,
      },
    }).catch(err => log.warn('bulk-delete audit log write failed:', err));

    const skippedIds = ids.filter(id => !matchingIds.includes(id));

    return NextResponse.json({
      deletedCount: matchingIds.length,
      requestedCount: ids.length,
      deletedIds: matchingIds,
      skippedIds,
    });
  } catch (error) {
    log.error('POST /api/documents/bulk-delete failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
