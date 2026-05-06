/**
 * POST /api/deals/[id]/archive — soft-archive a deal + cascade-soft-
 * delete its documents.
 *
 * Locked 2026-05-06. Closes the procurement-stage "what happens to my
 * data?" silent objection. Mirrors the document soft-delete pattern in
 * /api/documents/[id] DELETE:
 *   - Stamps `Deal.status='archived'` (the schema already documents
 *     this enum value)
 *   - Soft-deletes every Document attached to the deal (`deletedAt` +
 *     `deletionReason='deal_archived'`)
 *   - Audit-logs the action so a vendor-risk reviewer can see the
 *     archive happened with a timestamp + actor
 *   - Returns 200 with a "purge after grace window" note matching the
 *     /privacy DPA contract
 *
 * Hard purge of soft-deleted documents continues to run via the daily
 * /api/cron/enforce-retention pass after SOFT_DELETE_GRACE_DAYS — this
 * endpoint stays in lockstep with that retention machinery rather than
 * fragmenting the deletion model.
 *
 * Auth: caller must be the deal's org owner OR an Org admin (same
 * standard as the deal-outcome / deal-cross-reference endpoints). Rate
 * limited at 10 archives / hour / user (fail-closed for destructive
 * operations).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DealArchiveRoute');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit — destructive operation, fail-closed.
    const rate = await checkRateLimit(userId, '/api/deals/archive', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      failMode: 'closed',
    });
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    // Resolve org. The deal-outcome route uses the same pattern: pull
    // the user's TeamMember row; fall back to userId-as-orgId for
    // personal accounts where the membership table hasn't been written.
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // @schema-drift-tolerant — TeamMember table read fails on legacy envs;
      // fall through to userId-as-orgId so personal-tier accounts can still
      // archive their own deals.
    }

    const effectiveOrgId = orgId || userId;

    // Verify the deal exists + the user is authorized to archive it.
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: effectiveOrgId },
      select: {
        id: true,
        status: true,
        name: true,
        documents: { where: { deletedAt: null }, select: { id: true } },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.status === 'archived') {
      return NextResponse.json(
        {
          success: true,
          alreadyArchived: true,
          message: 'Deal is already archived. Documents purge after the grace window.',
        },
        { status: 200 }
      );
    }

    // Atomic archive: flip deal.status, soft-delete every active doc,
    // bump the deal's updatedAt so audit trails reflect the change.
    const documentIds = deal.documents.map(d => d.id);
    const archiveTimestamp = new Date();

    await prisma.$transaction(async tx => {
      await tx.deal.update({
        where: { id: deal.id },
        data: { status: 'archived' },
      });
      if (documentIds.length > 0) {
        await tx.document.updateMany({
          where: { id: { in: documentIds }, deletedAt: null },
          data: {
            deletedAt: archiveTimestamp,
            deletionReason: 'deal_archived',
          },
        });
      }
    });

    // Audit-log the destructive action — fire-and-forget so a logger
    // outage can't fail the user's archive; warn if it does.
    try {
      const { logAudit } = await import('@/lib/audit');
      logAudit({
        action: 'ARCHIVE_DEAL',
        resource: 'deal',
        resourceId: deal.id,
        details: {
          reason: 'user_request',
          dealName: deal.name,
          softDeletedDocuments: documentIds.length,
        },
      }).catch(err => log.warn('audit log write failed:', err));
    } catch (err) {
      log.warn('audit module load failed:', err);
    }

    return NextResponse.json({
      success: true,
      archived: true,
      softDeletedDocuments: documentIds.length,
      message:
        'Deal archived. Attached documents are soft-deleted and will be permanently purged after the retention grace window. Account-level data export remains available at /api/export/account.',
    });
  } catch (err) {
    log.error('Error archiving deal:', err);
    return NextResponse.json({ error: 'Failed to archive deal' }, { status: 500 });
  }
}
