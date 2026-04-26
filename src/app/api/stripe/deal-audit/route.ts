import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStripe, getDealAuditTier } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DealAuditCheckout');

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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { dealId } = body;
    if (!dealId) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    // Look up the deal and verify access. If the membership lookup itself
    // fails, log so we know — falling back to user.id keeps the personal-deal
    // case working but a silent failure on a team account would mis-route.
    const membership = await prisma.teamMember
      .findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      })
      .catch(err => {
        log.warn('teamMember lookup failed for deal audit:', err);
        return null;
      });

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: membership?.orgId || user.id },
      select: { id: true, name: true, ticketSize: true, orgId: true },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (!deal.ticketSize) {
      return NextResponse.json({ error: 'Deal has no ticket size set' }, { status: 400 });
    }

    // Check for existing active purchase. If this query fails, fail closed:
    // a silent null here would let us double-charge the customer.
    let existing: { id: string } | null = null;
    try {
      existing = await prisma.dealAuditPurchase.findFirst({
        where: { dealId, status: 'active' },
        select: { id: true },
      });
    } catch (err) {
      log.error('deal-audit purchase dedup lookup failed; failing closed:', err);
      return NextResponse.json(
        { error: 'Could not verify purchase state. Please retry.' },
        { status: 503 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Deal audit already purchased', purchaseId: existing.id },
        { status: 409 }
      );
    }

    const ticketSize = Number(deal.ticketSize);
    const tier = getDealAuditTier(ticketSize);

    if (!tier.priceId) {
      return NextResponse.json(
        { error: 'Deal audit pricing not configured for this tier' },
        { status: 503 }
      );
    }

    // Check for existing Stripe customer (graceful: if the lookup fails, we
    // proceed without a pre-existing customer — Stripe will create a new one).
    const existingSub = await prisma.subscription
      .findFirst({
        where: { userId: user.id },
        select: { stripeCustomerId: true },
      })
      .catch(err => {
        log.warn('subscription lookup failed for deal audit checkout:', err);
        return null;
      });

    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: tier.priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/deals/${dealId}?audit=purchased`,
      cancel_url: `${origin}/dashboard/deals/${dealId}?audit=cancelled`,
      metadata: {
        userId: user.id,
        dealId,
        tier: tier.id,
        ticketSize: String(ticketSize),
        orgId: deal.orgId || '',
        type: 'deal_audit',
      },
      ...(existingSub?.stripeCustomerId
        ? { customer: existingSub.stripeCustomerId }
        : { customer_email: user.email }),
    });

    log.info(`Deal audit checkout created: ${tier.label} ($${tier.price}) for deal ${dealId}`);

    return NextResponse.json({
      url: session.url,
      tier: tier.id,
      price: tier.price,
      dealName: deal.name,
    });
  } catch (err) {
    log.error('Deal audit checkout failed:', err);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
