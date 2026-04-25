/**
 * POST /api/documents/[id]/restore  (2.1 deep)
 *
 * Restores a soft-deleted document — clears `deletedAt` + `deletionReason`
 * + `deletionWarningSentAt` so the doc reappears in user-facing queries
 * and the retention warning email won't re-fire if it gets soft-deleted
 * again later.
 *
 * Owner-only. Hard-purged documents (deletedAt past the grace window) are
 * gone — restore returns 410 in that case to make the timing explicit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { SOFT_DELETE_GRACE_DAYS } from '@/lib/utils/plan-limits';

const log = createLogger('DocumentRestore');

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        filename: true,
        deletedAt: true,
        legalHoldId: true,
      },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (!doc.deletedAt) {
      return NextResponse.json({ error: 'Document is not deleted' }, { status: 400 });
    }

    // Past the grace window — the row is queued for hard-purge or already gone.
    const graceMs = SOFT_DELETE_GRACE_DAYS * 24 * 3600 * 1000;
    if (Date.now() - doc.deletedAt.getTime() > graceMs) {
      return NextResponse.json(
        { error: 'Restore window has closed; the document is queued for permanent deletion.' },
        { status: 410 }
      );
    }

    await prisma.document.update({
      where: { id },
      data: {
        deletedAt: null,
        deletionReason: null,
        deletionWarningSentAt: null,
      },
    });

    logAudit({
      action: 'DELETE_ACCOUNT_DATA', // closest existing action; the details note this is a restore, not a delete
      resource: 'Document',
      resourceId: id,
      details: { event: 'restored_within_grace', filename: doc.filename },
    }).catch(() => null);

    log.info(`Document ${id} restored within grace window by ${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    log.error('restore failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
}
