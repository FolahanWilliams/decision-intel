/**
 * GET /api/cron/outreach-intel — nightly Outreach Intelligence Brief.
 *
 * Runs daily via the cron dispatcher, AFTER /api/cron/sync-intelligence
 * so the NewsArticle table is fresh. Distills the day's corp-dev / M&A
 * signal into one OutreachIntelBrief row (idempotent per UTC day via
 * the `briefDate` unique key — a duplicate dispatch upserts).
 *
 * Protected by CRON_SECRET (server-to-server Bearer header), same as
 * every other cron sub-route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { generateOutreachIntelBrief } from '@/lib/outreach/intel-brief';

const log = createLogger('OutreachIntelCron');

export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET?.trim();

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization') ?? '';
  if (!safeCompare(authHeader, `Bearer ${CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, candidateCount } = await generateOutreachIntelBrief();

    // Upsert by the per-day idempotency key. Phase B fills `shortlist`;
    // Phase A always writes it null so the column shape is stable.
    // items is a required Json column + always a real array here, so a
    // direct InputJsonValue cast is correct (toPrismaJson's union
    // carries a DbNull arm meant for nullable columns). shortlist is
    // Phase-B-only; omitted here so the column stays null.
    const itemsJson = data.items as unknown as Prisma.InputJsonValue;
    await prisma.outreachIntelBrief.upsert({
      where: { briefDate: data.briefDate },
      create: {
        briefDate: data.briefDate,
        summary: data.summary,
        items: itemsJson,
        articleCount: data.articleCount,
      },
      update: {
        summary: data.summary,
        items: itemsJson,
        articleCount: data.articleCount,
      },
    });

    log.info(
      `Outreach intel brief ${data.briefDate}: ${data.items.length} items from ${candidateCount} candidates`
    );

    return NextResponse.json({
      success: true,
      briefDate: data.briefDate,
      items: data.items.length,
      candidates: candidateCount,
    });
  } catch (error) {
    log.error('Outreach intel cron failed:', error);
    return NextResponse.json({ error: 'Outreach intel brief failed' }, { status: 500 });
  }
}
