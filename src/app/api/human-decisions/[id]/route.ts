/**
 * GET    /api/human-decisions/[id] — Get a human decision with full audit results
 * DELETE /api/human-decisions/[id] — Delete a human decision and its audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { logAudit } from '@/lib/audit';

const log = createLogger('HumanDecisionDetail');

function isSchemaDrift(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e.code === 'P2021' || e.code === 'P2022' || !!e.message?.includes('does not exist');
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    let decision;
    try {
      decision = await prisma.humanDecision.findFirst({
        where: { id, userId: user.id },
        include: {
          cognitiveAudit: true,
          nudges: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (dbError: unknown) {
      if (isSchemaDrift(dbError)) {
        log.warn('Schema drift in human decision detail: table not migrated yet');
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw dbError;
    }

    if (!decision) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Audit log (fire-and-forget)
    logAudit({
      action: 'VIEW_COGNITIVE_AUDIT',
      resource: 'HumanDecision',
      resourceId: id,
    }).catch(() => {});

    return NextResponse.json(decision);
  } catch (error) {
    log.error('Get human decision error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
      // Verify ownership
      const decision = await prisma.humanDecision.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });

      if (!decision) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      await prisma.humanDecision.delete({ where: { id } });
    } catch (dbError: unknown) {
      if (isSchemaDrift(dbError)) {
        log.warn('Schema drift in human decision delete: table not migrated yet');
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw dbError;
    }

    logAudit({
      action: 'DELETE_ACCOUNT_DATA',
      resource: 'HumanDecision',
      resourceId: id,
    }).catch(() => {});

    return NextResponse.json({ deleted: true });
  } catch (error) {
    log.error('Delete human decision error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
