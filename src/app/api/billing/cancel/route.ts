/**
 * Subscription Cancel/Resume API
 *
 * POST /api/billing/cancel — Cancel or resume a subscription.
 * Uses cancel_at_period_end for graceful cancellation (keeps access until period ends).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('BillingCancel');

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as 'cancel' | 'resume';

    if (!action || !['cancel', 'resume'].includes(action)) {
      return NextResponse.json({ error: 'action must be "cancel" or "resume"' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ['active', 'trialing'] } },
      select: { id: true, stripeSubscriptionId: true, plan: true },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (subscription.plan === 'free') {
      return NextResponse.json({ error: 'Cannot cancel a free plan' }, { status: 400 });
    }

    const cancelAtPeriodEnd = action === 'cancel';

    // Update Stripe subscription
    await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    // Update local record immediately for responsiveness
    // (webhook will also fire and update, but we want instant UI feedback)
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? 'canceled' : 'active',
      },
    });

    log.info(`Subscription ${action === 'cancel' ? 'canceled' : 'resumed'} for user ${user.id}`);

    return NextResponse.json({ success: true, cancelAtPeriodEnd });
  } catch (error) {
    log.error('Cancel/resume failed:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
