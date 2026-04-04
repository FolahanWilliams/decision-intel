/**
 * Deal audit status endpoint — GET /api/deals/[id]/audit-status
 *
 * Returns whether a deal has an active one-off DealAuditPurchase, the tier
 * that was purchased, and the current user's subscription plan. Powers the
 * <UpgradeFromAudit /> CTA that offers a subscription upgrade path to users
 * who just paid for a single-deal audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getUserPlan } from '@/lib/utils/plan-limits';
import { PLANS, type PlanType } from '@/lib/stripe';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('DealAuditStatus');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let hasActiveAudit = false;
    let tier: string | null = null;
    try {
      const purchase = await prisma.dealAuditPurchase.findFirst({
        where: { dealId: id, status: 'active' },
        orderBy: { createdAt: 'desc' },
        select: { tier: true },
      });
      hasActiveAudit = !!purchase;
      tier = purchase?.tier ?? null;
    } catch (err) {
      if (!isSchemaDrift(err)) {
        log.error('Failed to read DealAuditPurchase:', err);
      }
    }

    const userPlan: PlanType = await getUserPlan(user.id);
    const isMetered = userPlan === 'free' || userPlan === 'pro' || userPlan === 'team';
    const planName = PLANS[userPlan].name;

    return NextResponse.json({
      hasActiveAudit,
      tier,
      userPlan,
      planName,
      isMetered,
    });
  } catch (error) {
    log.error('audit-status failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
