/**
 * Enterprise Quote Builder · admin-only quote API (4.5 deep).
 *
 * POST /api/billing/enterprise-quote — accepts a quote configuration,
 * generates the PDF, returns the bytes for inline download. The same
 * shape persists on AuditLog (action `EXPORT_PDF`) for traceability.
 *
 * Strategic note: this is a procurement-grade artefact, not a Stripe
 * subscription. The PDF goes to the customer's procurement team; the
 * eventual paid contract goes through Stripe Sales / a manual
 * subscription create. We do NOT auto-create a Stripe subscription
 * from this builder — the pricing handle survives manual review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { isAdminUserId } from '@/lib/utils/admin';
import { logAudit } from '@/lib/audit';
import {
  generateEnterpriseQuote,
  type EnterpriseQuoteInput,
} from '@/lib/reports/enterprise-quote-generator';
import { ENTERPRISE_QUOTE_DEFAULTS } from '@/lib/stripe';

const log = createLogger('EnterpriseQuoteAPI');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminUserId(user.id)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    let body: Partial<EnterpriseQuoteInput>;
    try {
      body = (await request.json()) as Partial<EnterpriseQuoteInput>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate + apply defaults from ENTERPRISE_QUOTE_DEFAULTS.
    const customerName = String(body.customerName ?? '').trim().slice(0, 120);
    if (customerName.length === 0) {
      return NextResponse.json({ error: 'customerName is required' }, { status: 400 });
    }
    const contactName = String(body.contactName ?? '').trim().slice(0, 120);
    const contactEmail = String(body.contactEmail ?? '').trim().slice(0, 200);
    const seats = Math.max(
      ENTERPRISE_QUOTE_DEFAULTS.minSeats,
      Math.floor(Number(body.seats ?? ENTERPRISE_QUOTE_DEFAULTS.minSeats))
    );
    const perSeatMonthly =
      typeof body.perSeatMonthly === 'number' && Number.isFinite(body.perSeatMonthly)
        ? Math.max(0, Math.floor(body.perSeatMonthly))
        : ENTERPRISE_QUOTE_DEFAULTS.perSeatMonthly;
    const dealOverageCount =
      typeof body.dealOverageCount === 'number' && Number.isFinite(body.dealOverageCount)
        ? Math.max(0, Math.floor(body.dealOverageCount))
        : 0;
    const perDealMonthly =
      typeof body.perDealMonthly === 'number' && Number.isFinite(body.perDealMonthly)
        ? Math.max(0, Math.floor(body.perDealMonthly))
        : ENTERPRISE_QUOTE_DEFAULTS.perDealMonthly;
    const retentionDays = Math.max(
      ENTERPRISE_QUOTE_DEFAULTS.minRetentionDays,
      Math.floor(Number(body.retentionDays ?? ENTERPRISE_QUOTE_DEFAULTS.minRetentionDays))
    );
    const slaTier =
      body.slaTier === 'Premium' || body.slaTier === 'Custom'
        ? body.slaTier
        : ENTERPRISE_QUOTE_DEFAULTS.slaTier;
    const volumeFloorAuditsPerQuarter = Math.max(
      0,
      Math.floor(Number(body.volumeFloorAuditsPerQuarter ?? ENTERPRISE_QUOTE_DEFAULTS.volumeFloorAuditsPerQuarter))
    );
    const region: 'EU' | 'US' | 'Multi-region' =
      body.region === 'EU' || body.region === 'Multi-region' ? body.region : 'US';
    const notes = String(body.notes ?? '').slice(0, 500);
    const validityDays = Math.max(7, Math.min(180, Math.floor(Number(body.validityDays ?? 30))));

    const input: EnterpriseQuoteInput = {
      customerName,
      contactName,
      contactEmail,
      seats,
      perSeatMonthly,
      dealOverageCount,
      perDealMonthly,
      retentionDays,
      slaTier,
      volumeFloorAuditsPerQuarter,
      region,
      notes,
      validityDays,
      authorUserId: user.id,
    };

    const { pdf, quoteHash, annualContractValue } = generateEnterpriseQuote(input);
    const bytes = pdf.output('arraybuffer');

    await logAudit({
      action: 'EXPORT_PDF',
      resource: 'enterprise_quote',
      resourceId: quoteHash.slice(0, 16),
      details: {
        customerName,
        seats,
        dealOverageCount,
        annualContractValue,
        slaTier,
        region,
      },
    });

    const filename = `enterprise-quote-${customerName
      .replace(/[^a-z0-9-]/gi, '_')
      .slice(0, 60)}-${quoteHash.slice(0, 8)}.pdf`;

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Quote-Hash': quoteHash.slice(0, 16),
        'X-Quote-ACV': String(annualContractValue),
      },
    });
  } catch (err) {
    log.error('Enterprise quote failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
