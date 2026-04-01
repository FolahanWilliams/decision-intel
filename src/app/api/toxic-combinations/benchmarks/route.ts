/**
 * Toxic Combination Org Benchmarking API
 *
 * GET /api/toxic-combinations/benchmarks?orgId=...
 * Returns the org's top toxic patterns compared to anonymized global averages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ToxicBenchmarks');

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

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Fetch global patterns (orgId IS NULL = global benchmarks)
    const globalPatterns = await prisma.toxicPattern.findMany({
      where: { orgId: null },
      select: {
        biasTypes: true,
        failureRate: true,
        sampleSize: true,
        label: true,
      },
    });

    // Fetch org-specific patterns
    const orgPatterns = await prisma.toxicPattern.findMany({
      where: { orgId },
      select: {
        biasTypes: true,
        failureRate: true,
        sampleSize: true,
        label: true,
      },
    });

    // Count org's toxic combos in last 90 days
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const orgComboCount = await prisma.toxicCombination.count({
      where: { orgId, createdAt: { gte: since } },
    });

    // Count global average combos per org in last 90 days
    const globalStats = await prisma.$queryRaw<
      Array<{ avg_combos: number; org_count: bigint }>
    >`
      SELECT
        AVG(combo_count) as avg_combos,
        COUNT(*) as org_count
      FROM (
        SELECT "orgId", COUNT(*) as combo_count
        FROM "ToxicCombination"
        WHERE "createdAt" >= ${since}
          AND "orgId" IS NOT NULL
        GROUP BY "orgId"
      ) subq
    `;

    const globalAvgCombos = Number(globalStats[0]?.avg_combos || 0);
    const orgCount = Number(globalStats[0]?.org_count || 1);

    // Build per-pattern comparison
    const globalMap = new Map(
      globalPatterns.map(p => [p.biasTypes.sort().join('|'), p])
    );

    const comparisons = orgPatterns.map(orgP => {
      const key = orgP.biasTypes.sort().join('|');
      const globalP = globalMap.get(key);
      const ratio = globalP && globalP.failureRate > 0
        ? orgP.failureRate / globalP.failureRate
        : null;

      return {
        biasTypes: orgP.biasTypes,
        label: orgP.label,
        orgFailureRate: Math.round(orgP.failureRate * 100) / 100,
        globalFailureRate: globalP ? Math.round(globalP.failureRate * 100) / 100 : null,
        ratio: ratio ? Math.round(ratio * 10) / 10 : null,
        orgSampleSize: orgP.sampleSize,
        globalSampleSize: globalP?.sampleSize ?? 0,
        status: ratio === null ? 'no_benchmark' : ratio > 1.5 ? 'above_average' : ratio < 0.7 ? 'below_average' : 'average',
      };
    });

    return NextResponse.json({
      orgId,
      period: { days: 90, since: since.toISOString() },
      summary: {
        orgToxicCombos: orgComboCount,
        globalAvgCombos: Math.round(globalAvgCombos * 10) / 10,
        ratio: globalAvgCombos > 0 ? Math.round((orgComboCount / globalAvgCombos) * 10) / 10 : null,
        benchmarkOrgCount: orgCount,
      },
      patterns: comparisons.sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0)),
    });
  } catch (error) {
    log.error('Failed to fetch toxic benchmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
