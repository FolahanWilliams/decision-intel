import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { createLogger } from '@/lib/utils/logger';
import { releaseAnalysisSlotsForUser } from '@/lib/utils/plan-limits';

const log = createLogger('AnalyzeCancelRoute');

// Cancel an in-flight (or stuck) audit (2026-07-02). Aborting the client stream
// frees the reservation via the stream route's cancel() handler, but leaves the
// Document stuck at status 'analyzing' — so after a page reload the user has no
// way to reclaim control (no button, and the client hook can't abort a stream it
// never started). This endpoint is the server-side reset, and it works with OR
// without a live client stream — exactly what the reload case needs:
//   - an interrupted FIRST audit (no Analysis row exists — the row is created
//     only at completion) is SOFT-DELETED, so a re-upload re-runs FRESH via the
//     upload route's existing P2002 ghost-purge (the "run a new one cleanly" path);
//   - cancelling a RE-RUN of an already-audited doc restores its prior result;
//   - and the stuck quota slot is freed either way.
export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null); // canonical req.json() body-parse
    const documentId = typeof body?.documentId === 'string' ? body.documentId : undefined;
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Ownership + does a COMPLETED audit already exist? An interrupted first audit
    // leaves NO Analysis row (created only at completion), so analyses.length > 0
    // means this cancel is against a re-run of an already-audited doc.
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
      select: {
        id: true,
        status: true,
        analyses: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true } },
      },
    });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const hasPriorResult = doc.analyses.length > 0;

    // Only touch a doc that is actually mid-audit — never clobber a settled
    // 'complete'/'error' doc the user may want to read.
    let cleared = false;
    if (doc.status === 'analyzing' || doc.status === 'pending') {
      if (hasPriorResult) {
        // Restore the prior completed result (cancelled a re-run).
        await prisma.document.update({ where: { id: documentId }, data: { status: 'complete' } });
      } else {
        // Soft-delete the interrupted doc so a re-upload starts clean. The dedup
        // excludes soft-deleted docs; the upload route's P2002 fallback purges
        // this ghost + creates a fresh doc, giving a glitch-free re-run.
        await prisma.document.update({
          where: { id: documentId },
          data: { deletedAt: new Date(), deletionReason: 'audit_cancelled' },
        });
        cleared = true;
      }
    }

    // Free any stuck quota slot (the stream cancel() also frees it on a live
    // abort; this is the reload case where no stream is running).
    await releaseAnalysisSlotsForUser(userId);

    return NextResponse.json({ ok: true, id: documentId, cleared });
  } catch (error) {
    log.error('Analyze cancel failed:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
