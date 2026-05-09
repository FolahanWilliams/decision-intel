/**
 * /api/containers/[id]/audit-status — has the user paid for a per-
 * container audit (DecisionContainerAuditPurchase) on this container?
 * Used by the upload flow + plan-limit gate to bypass the subscription
 * cap for paid containers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ContainerAuditStatusRoute');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const purchase = await prisma.decisionContainerAuditPurchase.findFirst({
      where: { containerId: id, userId: user.id, status: 'active' },
      select: { id: true, tier: true, createdAt: true, ticketSize: true },
    });

    return NextResponse.json({
      paid: Boolean(purchase),
      tier: purchase?.tier ?? null,
      purchasedAt: purchase?.createdAt.toISOString() ?? null,
      ticketSize: purchase?.ticketSize != null ? Number(purchase.ticketSize) : null,
    });
  } catch (error) {
    log.error('GET /api/containers/[id]/audit-status failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
