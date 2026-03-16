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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const decision = await prisma.humanDecision.findFirst({
      where: { id, userId: user.id },
      include: {
        cognitiveAudit: true,
        nudges: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const decision = await prisma.humanDecision.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.humanDecision.delete({ where: { id } });

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
