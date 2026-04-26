/**
 * GET /api/billing/invoices — recent Stripe invoices + upcoming charge (4.5 deep).
 *
 * Returns the customer's last six invoices (with PDF download URL +
 * status) plus the upcoming-invoice preview when one exists. Gracefully
 * empty when the user has no Stripe customer record (free tier, or
 * never subscribed).
 *
 * The route does NOT trigger Stripe-side mutations; it's purely a read
 * surface for /dashboard/settings/billing.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('BillingInvoices');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ invoices: [], upcoming: null, customerless: true });
    }

    let stripeCustomerId: string | null = null;
    try {
      const sub = await prisma.subscription.findFirst({
        where: { userId: user.id },
        select: { stripeCustomerId: true },
        orderBy: { createdAt: 'desc' },
      });
      stripeCustomerId = sub?.stripeCustomerId ?? null;
    } catch (err) {
      if (!isSchemaDrift(err)) {
        log.warn('subscription lookup failed:', err instanceof Error ? err.message : String(err));
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json({ invoices: [], upcoming: null, customerless: true });
    }

    const stripe = getStripe();

    const [invoiceList, upcomingResult] = await Promise.allSettled([
      stripe.invoices.list({ customer: stripeCustomerId, limit: 6 }),
      // The Stripe SDK's retrieveUpcoming path is a typed-API quirk —
      // wrap it so a missing upcoming invoice (404) is a soft null.
      (async () => {
        try {
          // Cast to unknown then call to avoid SDK type drift on
          // optional method shape across Stripe SDK versions.
          const invoices = stripe.invoices as unknown as {
            retrieveUpcoming?: (params: { customer: string }) => Promise<unknown>;
          };
          if (typeof invoices.retrieveUpcoming === 'function') {
            return await invoices.retrieveUpcoming({ customer: stripeCustomerId! });
          }
          return null;
        } catch (err) {
          const code = (err as { code?: string }).code;
          if (code === 'invoice_upcoming_none') return null;
          throw err;
        }
      })(),
    ]);

    type InvoiceShape = {
      id: string;
      number?: string | null;
      status?: string | null;
      amount_due?: number;
      amount_paid?: number;
      currency?: string;
      created?: number;
      hosted_invoice_url?: string | null;
      invoice_pdf?: string | null;
      period_end?: number;
    };

    const invoices =
      invoiceList.status === 'fulfilled'
        ? (invoiceList.value as { data: InvoiceShape[] }).data.map(inv => ({
            id: inv.id,
            number: inv.number ?? null,
            status: inv.status ?? null,
            amountDue: inv.amount_due ?? 0,
            amountPaid: inv.amount_paid ?? 0,
            currency: inv.currency ?? 'usd',
            createdAt: inv.created ? new Date(inv.created * 1000).toISOString() : null,
            hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
            pdfUrl: inv.invoice_pdf ?? null,
            periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
          }))
        : [];

    let upcoming: {
      amountDue: number;
      currency: string;
      periodEnd: string | null;
      lineItemSummary: string | null;
    } | null = null;
    if (upcomingResult.status === 'fulfilled' && upcomingResult.value) {
      const inv = upcomingResult.value as {
        amount_due?: number;
        currency?: string;
        period_end?: number;
        lines?: { data?: Array<{ description?: string | null }> };
      };
      const firstLine = inv.lines?.data?.[0]?.description ?? null;
      upcoming = {
        amountDue: inv.amount_due ?? 0,
        currency: inv.currency ?? 'usd',
        periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
        lineItemSummary: firstLine,
      };
    }

    return NextResponse.json({ invoices, upcoming, customerless: false });
  } catch (err) {
    log.error('invoices failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
