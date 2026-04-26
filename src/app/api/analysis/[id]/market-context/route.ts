/**
 * Market-context override (3.6 deep).
 *
 * GET   — returns { applied, override } so the chip can decide which
 *         to render (override wins when present).
 * PATCH — owner-only flip of the context. Body: { context, jurisdictions? }.
 *         The new payload is computed against the same prior table the
 *         auto-detector uses so the cagrCeiling/rationale stay consistent.
 *
 * Owner-only (resource owner of the underlying document) — a teammate
 * with read access cannot reshape the priors a downstream auditor sees.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';
import { GROWTH_RATE_PRIORS, type MarketContext } from '@/lib/constants/market-context';

const log = createLogger('MarketContextOverride');

const ContextEnum = z.enum(['emerging_market', 'developed_market', 'cross_border', 'unknown']);

const PatchSchema = z.object({
  context: ContextEnum,
  /** Optional explicit jurisdictions to surface in the chip. */
  emergingMarketCountries: z.array(z.string().min(1).max(80)).max(20).optional(),
  developedMarketCountries: z.array(z.string().min(1).max(80)).max(20).optional(),
  /** Free-form rationale entered by the user. Falls back to the prior table's default. */
  rationale: z.string().min(1).max(800).optional(),
});

interface MarketContextSnapshot {
  context: MarketContext;
  emergingMarketCountries: string[];
  developedMarketCountries: string[];
  cagrCeiling: number;
  rationale: string;
  overriddenAt?: string;
  overriddenBy?: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        document: { select: { userId: true } },
        marketContextApplied: true,
        marketContextOverride: true,
      },
    });
    if (!analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (analysis.document.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      applied: analysis.marketContextApplied ?? null,
      override: analysis.marketContextOverride ?? null,
    });
  } catch (e) {
    log.error('GET market-context failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { context, emergingMarketCountries, developedMarketCountries, rationale } = parsed.data;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        document: { select: { userId: true } },
        marketContextApplied: true,
      },
    });
    if (!analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (analysis.document.userId !== user.id) {
      return NextResponse.json({ error: 'Owner-only' }, { status: 403 });
    }

    const prior = GROWTH_RATE_PRIORS[context];
    const applied =
      (analysis.marketContextApplied as {
        emergingMarketCountries?: string[];
        developedMarketCountries?: string[];
      } | null) ?? null;

    const snapshot: MarketContextSnapshot = {
      context,
      emergingMarketCountries: emergingMarketCountries ?? applied?.emergingMarketCountries ?? [],
      developedMarketCountries: developedMarketCountries ?? applied?.developedMarketCountries ?? [],
      cagrCeiling: prior.cagrCeiling,
      rationale: rationale && rationale.trim().length > 0 ? rationale.trim() : prior.rationale,
      overriddenAt: new Date().toISOString(),
      overriddenBy: user.id,
    };

    await prisma.analysis.update({
      where: { id },
      data: {
        marketContextOverride: snapshot as unknown as Prisma.InputJsonValue,
      },
    });

    log.info(`Market-context override saved on analysis ${id}: ${context} (by ${user.id})`);

    return NextResponse.json({ override: snapshot });
  } catch (e) {
    log.error('PATCH market-context failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
