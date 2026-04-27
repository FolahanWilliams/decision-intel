import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { getStripe, getPriceId, type BillingCycle } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('StripeCheckout');

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan as 'pro' | 'team';
    const cycle = (body.cycle as BillingCycle) || 'monthly';

    if (!plan || !['pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!['monthly', 'annual'].includes(cycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const priceId = getPriceId(plan, cycle);
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 503 });
    }

    // Check for existing Stripe customer.
    // Fail-closed per CLAUDE.md commerce-dedup discipline: a silent failure
    // here would skip the customer-reuse path, causing Stripe to create a NEW
    // customer record for a user who already has one — duplicate customer
    // records and downstream subscription-state confusion. On query failure
    // surface a 503 retry, never silently fall through.
    let existing: { stripeCustomerId: string | null } | null;
    try {
      existing = await prisma.subscription.findFirst({
        where: { userId: user.id },
        select: { stripeCustomerId: true },
      });
    } catch (lookupErr) {
      log.error('Subscription lookup failed during checkout:', lookupErr);
      return NextResponse.json(
        { error: 'Could not verify subscription state. Please retry.' },
        { status: 503 }
      );
    }

    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/?pricing=cancelled`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId: user.id, plan },
      },
      metadata: { userId: user.id, plan },
      ...(existing?.stripeCustomerId
        ? { customer: existing.stripeCustomerId }
        : { customer_email: user.email }),
    };

    const session = await getStripe().checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    log.error('Stripe checkout failed:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
