/**
 * Toxic Combination Trends API
 *
 * GET /api/toxic-combinations/trends?orgId=...&days=90
 * Returns daily averages of toxic scores for the org over time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ToxicTrends');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const days = Math.max(7, Math.min(parseInt(searchParams.get('days') || '90', 10) || 90, 365));

    const since = new Date();
    since.setDate(since.getDate() - days);

    const trends = await prisma.$queryRaw<
      Array<{ date: Date; avg_score: number; count: bigint }>
    >`
      SELECT
        DATE_TRUNC('day', "createdAt") as date,
        AVG("toxicScore") as avg_score,
        COUNT(*) as count
      FROM "ToxicCombination"
      WHERE "createdAt" >= ${since}
        AND (${orgId}::text IS NULL OR "orgId" = ${orgId})
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    return NextResponse.json({
      trends: trends.map(t => ({
        date: t.date.toISOString().split('T')[0],
        avgToxicScore: Math.round(Number(t.avg_score) * 10) / 10,
        count: Number(t.count),
      })),
      period: { days, since: since.toISOString() },
    });
  } catch (error) {
    log.error('Failed to fetch toxic trends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
