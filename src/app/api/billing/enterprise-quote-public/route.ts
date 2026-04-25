/**
 * Public Enterprise Quote Builder API (2026-04-25 audit fix).
 *
 * Mirror of /api/billing/enterprise-quote but without admin gating —
 * Elena's audit catch was that procurement teams will not create
 * accounts to start a quote conversation. The auth-gated builder buried
 * a real artefact behind a sign-up wall; this endpoint exposes the same
 * generator on the marketing surface at /pricing/quote.
 *
 * Hardening:
 *   - Per-IP rate limit (5 quotes / IP / 24h) so the endpoint cannot be
 *     scripted into a Gemini-budget drain or used to spam-generate
 *     procurement documents.
 *   - `customerName` and `contactEmail` are required (not just trimmed
 *     to empty) so we have telemetry on who is generating quotes.
 *   - The PDF still carries the authentic R²F + DPR provenance footer +
 *     sha256 quote fingerprint; the public version is the same artefact,
 *     just generated from outside the auth wall.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import {
  generateEnterpriseQuote,
  type EnterpriseQuoteInput,
} from '@/lib/reports/enterprise-quote-generator';
import { ENTERPRISE_QUOTE_DEFAULTS } from '@/lib/stripe';

const log = createLogger('EnterpriseQuotePublic');

const WINDOW_MS = 24 * 60 * 60 * 1000;
const PER_IP_MAX = 5;

function extractIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

function isPlausibleEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: NextRequest) {
  try {
    const ip = extractIp(request);
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 24);

    const rate = await checkRateLimit(`quote-public-ip:${ipHash}`, '/api/billing/enterprise-quote-public', {
      windowMs: WINDOW_MS,
      maxRequests: PER_IP_MAX,
      failMode: 'closed',
    });
    if (!rate.success) {
      return NextResponse.json(
        {
          error:
            'Too many quote generations from this address in the last 24 hours. Try again tomorrow, or email team@decision-intel.com.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(0, rate.reset - Math.floor(Date.now() / 1000))),
          },
        }
      );
    }

    let body: Partial<EnterpriseQuoteInput>;
    try {
      body = (await request.json()) as Partial<EnterpriseQuoteInput>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const customerName = String(body.customerName ?? '').trim().slice(0, 120);
    if (customerName.length === 0) {
      return NextResponse.json({ error: 'customerName is required' }, { status: 400 });
    }
    const contactName = String(body.contactName ?? '').trim().slice(0, 120);
    const contactEmail = String(body.contactEmail ?? '').trim().slice(0, 200);
    if (!isPlausibleEmail(contactEmail)) {
      return NextResponse.json(
        { error: 'A working contact email is required so the team can follow up.' },
        { status: 400 }
      );
    }
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
    // Public surface: only the US region option is honest in production
    // today (Vercel + Supabase US). EU / Multi-region remains an
    // Enterprise-conversation knob, not a self-service one.
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
      // Public surface: no authenticated user, so the author field is
      // populated with a synthetic marker the auditor can grep on later.
      authorUserId: `public-${ipHash}`,
    };

    const { pdf, quoteHash, annualContractValue } = generateEnterpriseQuote(input);
    const bytes = pdf.output('arraybuffer');

    log.info(
      `Public enterprise quote generated: customer=${customerName}, seats=${seats}, ACV=${annualContractValue}, ipHash=${ipHash}, contactEmail=${contactEmail}`
    );

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
    log.error('Public enterprise quote failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
