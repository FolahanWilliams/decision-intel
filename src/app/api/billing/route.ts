/**
 * Billing API
 *
 * GET /api/billing — Returns subscription status, usage, and plan limits.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { PLANS, PlanType } from '@/lib/stripe';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('BillingAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch subscription
    let subscription: {
      plan: string;
      status: string;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
      stripeCustomerId: string;
    } | null = null;

    try {
      subscription = await prisma.subscription.findFirst({
        where: { userId: user.id, status: { in: ['active', 'trialing', 'past_due', 'canceled'] } },
        orderBy: { createdAt: 'desc' },
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          stripeCustomerId: true,
        },
      });
    } catch (err) {
      if (!isSchemaDrift(err)) {
        log.error('Failed to fetch subscription:', err);
      }
    }

    const plan = (subscription?.plan as PlanType) || 'free';
    const limits = PLANS[plan];
    const status = subscription?.status || 'none';

    // Count analyses this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let analysesUsed = 0;
    try {
      analysesUsed = await prisma.analysis.count({
        where: {
          document: { userId: user.id },
          createdAt: { gte: startOfMonth },
        },
      });
    } catch (err) {
      if (!isSchemaDrift(err)) {
        log.error('Failed to count analyses:', err);
      }
    }

    const analysesLimit = limits.analysesPerMonth === Infinity ? -1 : limits.analysesPerMonth;
    const percentUsed = analysesLimit > 0 ? Math.round((analysesUsed / analysesLimit) * 100) : 0;

    // Determine trial end date
    let trialEndsAt: string | null = null;
    if (status === 'trialing' && subscription?.currentPeriodEnd) {
      trialEndsAt = subscription.currentPeriodEnd.toISOString();
    }

    return NextResponse.json({
      plan,
      planName: limits.name,
      status,
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      trialEndsAt,
      hasStripeCustomer: !!subscription?.stripeCustomerId,
      upgradeAvailable:
        !!process.env.STRIPE_SECRET_KEY && !!(PLANS.pro.priceId || PLANS.team.priceId),
      usage: {
        analysesUsed,
        analysesLimit,
        percentUsed,
      },
      limits: {
        analysesPerMonth: analysesLimit,
        maxPages: limits.maxPages === Infinity ? -1 : limits.maxPages,
        biasTypes: limits.biasTypes,
      },
    });
  } catch (error) {
    log.error('Billing API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
  }
}
