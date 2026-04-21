import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import Stripe from 'stripe';

const log = createLogger('StripeWebhook');

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      log.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Idempotency check: skip if this event was already processed
    const existing = await prisma.auditLog.findFirst({
      where: { resourceId: event.id, action: 'stripe.webhook' },
    });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    let orgId: string | undefined;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || 'pro';
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && customerId && subscriptionId) {
          // Fetch subscription details for period end
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const periodEnd =
            isRecord(sub) && typeof sub.current_period_end === 'number'
              ? new Date(sub.current_period_end * 1000)
              : null;

          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscriptionId },
            update: {
              plan,
              status: sub.status === 'trialing' ? 'trialing' : 'active',
              currentPeriodEnd: periodEnd,
            },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              plan,
              status: sub.status === 'trialing' ? 'trialing' : 'active',
              currentPeriodEnd: periodEnd,
            },
          });

          log.info(`Subscription created: ${plan} for user ${userId}`);

          // Deal-audit → subscription attribution: if this user paid for a
          // single-deal audit in the last 30 days, log the conversion so the
          // funnel query can measure one-off → recurring lift without adding
          // a schema column.
          try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentAudit = await prisma.dealAuditPurchase.findFirst({
              where: { userId, status: 'active', createdAt: { gte: thirtyDaysAgo } },
              orderBy: { createdAt: 'desc' },
              select: { id: true, dealId: true, tier: true, createdAt: true },
            });
            if (recentAudit) {
              await prisma.analyticsEvent.create({
                data: {
                  name: 'deal_audit_converted_to_subscription',
                  userId,
                  properties: {
                    plan,
                    auditId: recentAudit.id,
                    auditDealId: recentAudit.dealId,
                    auditTier: recentAudit.tier,
                    daysFromAuditToSubscribe: Math.floor(
                      (Date.now() - recentAudit.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                    ),
                  },
                },
              });
            }
          } catch (attrErr) {
            log.warn('Deal-audit attribution failed (non-fatal):', attrErr);
          }
        }

        // Handle one-time deal audit payment
        if (session.mode === 'payment' && session.metadata?.type === 'deal_audit') {
          const {
            userId: auditUserId,
            dealId,
            tier,
            ticketSize,
            orgId: metaOrgId,
          } = session.metadata;
          orgId = metaOrgId;
          if (auditUserId && dealId && tier) {
            try {
              await prisma.dealAuditPurchase.create({
                data: {
                  userId: auditUserId,
                  orgId: orgId || null,
                  dealId,
                  stripePaymentId: session.id,
                  tier,
                  amount: session.amount_total || 0,
                  currency: (session.currency || 'usd').toUpperCase(),
                  ticketSize: parseFloat(ticketSize || '0'),
                  status: 'active',
                },
              });
              log.info(`Deal audit purchased: ${tier} for deal ${dealId} by user ${auditUserId}`);
            } catch (err) {
              log.error('Failed to create DealAuditPurchase:', err);
            }
          }
          break;
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const updatedPeriodEnd =
          isRecord(sub) && typeof sub.current_period_end === 'number'
            ? new Date(sub.current_period_end * 1000)
            : null;

        const updatedStatus =
          sub.status === 'trialing'
            ? 'trialing'
            : sub.cancel_at_period_end
              ? 'canceled'
              : 'active';

        // Use upsert to handle out-of-order delivery: if
        // checkout.session.completed hasn't arrived yet, the subscription
        // row won't exist.  Rather than crash, we create it so the state
        // isn't lost.
        const customerId =
          typeof sub.customer === 'string'
            ? sub.customer
            : isRecord(sub.customer) && typeof sub.customer.id === 'string'
              ? sub.customer.id
              : '';
        const subMetadata = isRecord(sub.metadata) ? sub.metadata : {};
        const userId = typeof subMetadata.userId === 'string' ? subMetadata.userId : 'unknown';
        const plan = typeof subMetadata.plan === 'string' ? subMetadata.plan : 'pro';

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            status: updatedStatus,
            currentPeriodEnd: updatedPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          create: {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            status: updatedStatus,
            currentPeriodEnd: updatedPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });

        log.info(`Subscription updated: ${subscriptionId} → ${updatedStatus}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        // Use updateMany instead of update: if the row doesn't exist
        // (e.g. orphaned subscription), this is a safe no-op rather
        // than a P2025 crash.  The count tells us whether it matched.
        const deleteResult = await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'canceled' },
        });

        if (deleteResult.count === 0) {
          log.warn(`Subscription deletion: no matching row for ${sub.id}`);
        } else {
          log.info(`Subscription canceled: ${sub.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const rawSub = isRecord(invoice) ? invoice.subscription : undefined;
        const subId =
          typeof rawSub === 'string'
            ? rawSub
            : isRecord(rawSub) && typeof rawSub.id === 'string'
              ? rawSub.id
              : undefined;
        if (subId) {
          const paymentResult = await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { status: 'past_due' },
          });

          if (paymentResult.count === 0) {
            log.warn(`Payment failure: no matching subscription for ${subId}`);
          } else {
            log.info(`Marked subscription ${subId} as past_due after payment failure`);
          }
        }
        break;
      }

      default:
        log.debug(`Unhandled Stripe event: ${event.type}`);
    }

    // Record successful processing for idempotency
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        orgId: orgId || 'stripe',
        action: 'stripe.webhook',
        resource: 'stripe_event',
        resourceId: event.id,
        details: { type: event.type },
      },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    log.error('Webhook processing failed:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
