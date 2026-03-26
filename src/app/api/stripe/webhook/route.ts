import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import Stripe from 'stripe';

const log = createLogger('StripeWebhook');

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
          const subData = sub as unknown as Record<string, unknown>;
          const periodEnd =
            typeof subData.current_period_end === 'number'
              ? new Date(subData.current_period_end * 1000)
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
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const subObj = sub as unknown as Record<string, unknown>;
        const updatedPeriodEnd =
          typeof subObj.current_period_end === 'number'
            ? new Date(subObj.current_period_end * 1000)
            : null;

        await prisma.subscription
          .update({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              status:
                sub.status === 'trialing'
                  ? 'trialing'
                  : sub.cancel_at_period_end
                    ? 'canceled'
                    : 'active',
              currentPeriodEnd: updatedPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          })
          .catch(err => {
            log.warn(`Subscription update failed for ${subscriptionId}:`, err);
          });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription
          .update({
            where: { stripeSubscriptionId: sub.id },
            data: { status: 'canceled' },
          })
          .catch(err => {
            log.warn(`Subscription deletion update failed:`, err);
          });
        break;
      }

      default:
        log.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    log.error('Webhook processing failed:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
