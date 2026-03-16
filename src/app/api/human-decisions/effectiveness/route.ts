/**
 * GET /api/human-decisions/effectiveness — Aggregated effectiveness metrics
 *
 * Returns bias frequency, quality trends, nudge effectiveness, and
 * source distribution for the authenticated user's audited decisions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getSafeErrorMessage } from '@/lib/utils/error';

const log = createLogger('EffectivenessAPI');

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
    const periodDays = parseInt(searchParams.get('period') || '30', 10);
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Fetch all audited decisions in the period
    let decisions;
    try {
      decisions = await prisma.humanDecision.findMany({
        where: {
          userId: user.id,
          status: 'analyzed',
          createdAt: { gte: since },
        },
        select: {
          id: true,
          source: true,
          createdAt: true,
          cognitiveAudit: {
            select: {
              decisionQualityScore: true,
              noiseScore: true,
              biasFindings: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string; message?: string };
      if (
        prismaError.code === 'P2021' ||
        prismaError.code === 'P2022' ||
        prismaError.message?.includes('does not exist')
      ) {
        return NextResponse.json(
          { error: 'Database schema not yet migrated.', code: 'SCHEMA_DRIFT' },
          { status: 503 }
        );
      }
      throw dbError;
    }

    // Fetch nudge stats for the period
    let nudges: Array<{ acknowledgedAt: Date | null; wasHelpful: boolean | null }>;
    try {
      nudges = await prisma.nudge.findMany({
        where: {
          humanDecision: { userId: user.id },
          createdAt: { gte: since },
        },
        select: {
          acknowledgedAt: true,
          wasHelpful: true,
        },
      });
    } catch {
      nudges = [];
    }

    // Compute aggregates
    const totalDecisions = decisions.length;
    let totalQuality = 0;
    let totalNoise = 0;
    const biasFrequency: Record<string, number> = {};
    const sourceDistribution: Record<string, number> = {};
    const weeklyScores: Record<string, { total: number; count: number }> = {};

    for (const d of decisions) {
      const audit = d.cognitiveAudit;
      if (!audit) continue;

      totalQuality += audit.decisionQualityScore;
      totalNoise += audit.noiseScore;

      // Bias frequency
      const biases = Array.isArray(audit.biasFindings) ? audit.biasFindings : [];
      for (const b of biases) {
        const biasType = (b as { biasType?: string }).biasType || 'Unknown';
        biasFrequency[biasType] = (biasFrequency[biasType] || 0) + 1;
      }

      // Source distribution
      sourceDistribution[d.source] = (sourceDistribution[d.source] || 0) + 1;

      // Weekly quality trend
      const weekKey = getWeekKey(d.createdAt);
      if (!weeklyScores[weekKey]) weeklyScores[weekKey] = { total: 0, count: 0 };
      weeklyScores[weekKey].total += audit.decisionQualityScore;
      weeklyScores[weekKey].count += 1;
    }

    const avgQualityScore = totalDecisions > 0 ? Math.round(totalQuality / totalDecisions) : 0;
    const avgNoiseScore = totalDecisions > 0 ? Math.round(totalNoise / totalDecisions) : 0;

    // Top biases sorted by frequency
    const topBiases = Object.entries(biasFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([biasType, count]) => ({ biasType, count }));

    // Quality trend by week
    const qualityTrend = Object.entries(weeklyScores)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        avgScore: Math.round(data.total / data.count),
        count: data.count,
      }));

    // Nudge effectiveness
    const totalNudges = nudges.length;
    const acknowledged = nudges.filter(n => n.acknowledgedAt !== null).length;
    const helpful = nudges.filter(n => n.wasHelpful === true).length;
    const notHelpful = nudges.filter(n => n.wasHelpful === false).length;
    const pending = totalNudges - acknowledged;

    return NextResponse.json({
      period: periodDays,
      totalDecisions,
      avgQualityScore,
      avgNoiseScore,
      topBiases,
      qualityTrend,
      sourceDistribution,
      nudgeEffectiveness: {
        total: totalNudges,
        acknowledged,
        helpful,
        notHelpful,
        pending,
        helpfulRate: acknowledged > 0 ? Math.round((helpful / acknowledged) * 100) : 0,
      },
    });
  } catch (error) {
    log.error('Effectiveness API error:', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error) },
      { status: 500 }
    );
  }
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to Monday of the week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
