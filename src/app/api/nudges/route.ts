/**
 * GET  /api/nudges — List nudges for the authenticated user
 * POST /api/nudges/[id]/acknowledge — Mark a nudge as acknowledged
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { logAudit } from '@/lib/audit';

const log = createLogger('NudgesAPI');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const unacknowledgedOnly = searchParams.get('unacknowledged') === 'true';

    const where: Record<string, unknown> = {
      humanDecision: { userId: user.id },
    };
    if (unacknowledgedOnly) {
      where.acknowledgedAt = null;
    }

    const nudges = await prisma.nudge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        humanDecision: {
          select: {
            id: true,
            source: true,
            channel: true,
            decisionType: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ nudges });
  } catch (error) {
    log.error('Nudges list error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { nudgeId: string; wasHelpful?: boolean; outcomeNotes?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body.nudgeId) {
      return NextResponse.json({ error: 'Missing nudgeId' }, { status: 400 });
    }

    // Verify ownership through the related human decision
    const nudge = await prisma.nudge.findFirst({
      where: {
        id: body.nudgeId,
        humanDecision: { userId: user.id },
      },
      select: { id: true },
    });

    if (!nudge) {
      return NextResponse.json({ error: 'Nudge not found' }, { status: 404 });
    }

    await prisma.nudge.update({
      where: { id: body.nudgeId },
      data: {
        acknowledgedAt: new Date(),
        wasHelpful: body.wasHelpful,
        outcomeNotes: body.outcomeNotes,
      },
    });

    // Audit log (fire-and-forget)
    logAudit({
      action: 'ACKNOWLEDGE_NUDGE',
      resource: 'Nudge',
      resourceId: body.nudgeId,
      details: { wasHelpful: body.wasHelpful },
    }).catch(() => {});

    return NextResponse.json({ acknowledged: true });
  } catch (error) {
    log.error('Nudge acknowledge error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
