import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { normalizeBiasType, getBiasDisplayName } from '@/lib/utils/bias-normalize';

const log = createLogger('BiasFrequencyRoute');

/**
 * Returns per-bias-type frequency across the user's document history,
 * bucketed by analysis date. Used for sparkline visualizations.
 *
 * Response shape:
 * {
 *   frequencies: {
 *     [biasType: string]: {
 *       displayName: string;
 *       total: number;
 *       timeline: Array<{ date: string; count: number }>
 *     }
 *   }
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Raw SQL for efficiency: group bias instances by type and analysis date
    let rows: Array<{ biasType: string; analysisDate: string; count: bigint }>;
    try {
      rows = await prisma.$queryRaw<
        Array<{ biasType: string; analysisDate: string; count: bigint }>
      >`
        SELECT
          bi."biasType",
          DATE(a."createdAt") as "analysisDate",
          COUNT(*)::bigint as count
        FROM "BiasInstance" bi
        JOIN "Analysis" a ON a.id = bi."analysisId"
        JOIN "Document" d ON d.id = a."documentId"
        WHERE d."userId" = ${userId}
        GROUP BY bi."biasType", DATE(a."createdAt")
        ORDER BY DATE(a."createdAt") ASC
      `;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift in bias-frequency query, returning empty');
        return NextResponse.json({ frequencies: {} });
      }
      throw err;
    }

    // Aggregate into per-type timeline
    const frequencies: Record<
      string,
      { displayName: string; total: number; timeline: Array<{ date: string; count: number }> }
    > = {};

    for (const row of rows) {
      const key = normalizeBiasType(row.biasType);
      if (!frequencies[key]) {
        frequencies[key] = {
          displayName: getBiasDisplayName(row.biasType),
          total: 0,
          timeline: [],
        };
      }

      const count = Number(row.count);
      frequencies[key].total += count;
      // Merge into existing date entry or create new
      const dateStr =
        typeof row.analysisDate === 'string'
          ? row.analysisDate
          : new Date(row.analysisDate).toISOString().split('T')[0];
      const existing = frequencies[key].timeline.find(t => t.date === dateStr);
      if (existing) {
        existing.count += count;
      } else {
        frequencies[key].timeline.push({ date: dateStr, count });
      }
    }

    return NextResponse.json(
      { frequencies },
      { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } }
    );
  } catch (error) {
    log.error('Error fetching bias frequency:', error);
    return NextResponse.json({ error: 'Failed to fetch bias frequency' }, { status: 500 });
  }
}
