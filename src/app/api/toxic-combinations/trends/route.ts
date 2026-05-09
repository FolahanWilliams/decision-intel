/**
 * Toxic Combination Trends API
 *
 * GET /api/toxic-combinations/trends?orgId=...&days=90
 *   Returns daily averages of toxic scores for the org over time.
 *
 * GET /api/toxic-combinations/trends?orgId=...&days=90&groupBy=patternLabel
 *   Returns per-pattern aggregation (count + avg + max toxic score) over the
 *   window. Powers the InsightsPageContent toxic-combination trending viz
 *   (cascade-depth audit ship #5, locked 2026-05-09 evening). Empty
 *   patternLabel rows excluded.
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
    const groupBy = searchParams.get('groupBy');

    const since = new Date();
    since.setDate(since.getDate() - days);

    if (groupBy === 'patternLabel') {
      // Per-pattern aggregation — feeds the InsightsPageContent trending viz.
      const rows = await prisma.$queryRaw<
        Array<{
          pattern_label: string;
          count: bigint;
          avg_score: number;
          max_score: number;
        }>
      >`
        SELECT
          "patternLabel" as pattern_label,
          COUNT(*) as count,
          AVG("toxicScore") as avg_score,
          MAX("toxicScore") as max_score
        FROM "ToxicCombination"
        WHERE "createdAt" >= ${since}
          AND "patternLabel" IS NOT NULL
          AND (${orgId}::text IS NULL OR "orgId" = ${orgId})
        GROUP BY "patternLabel"
        ORDER BY count DESC, avg_score DESC
      `;

      return NextResponse.json({
        patterns: rows.map(r => ({
          patternLabel: r.pattern_label,
          count: Number(r.count),
          avgToxicScore: Math.round(Number(r.avg_score) * 10) / 10,
          maxToxicScore: Math.round(Number(r.max_score) * 10) / 10,
        })),
        period: { days, since: since.toISOString() },
      });
    }

    const trends = await prisma.$queryRaw<Array<{ date: Date; avg_score: number; count: bigint }>>`
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
