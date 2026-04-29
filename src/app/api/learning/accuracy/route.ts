/**
 * Accuracy Tracking API
 *
 * GET /api/learning/accuracy — Returns bias detection accuracy stats,
 * per-bias-type accuracy, trend over time, and improvement message.
 *
 * This endpoint surfaces the outcome learning loop to users:
 * "Your detection accuracy improved from 62% to 78%."
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getAccuracyImprovement, getOrgBiasHistory } from '@/lib/learning/outcome-scoring';

const log = createLogger('AccuracyAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org context
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift
    }

    try {
      const where = orgId ? { orgId } : { userId: user.id };

      const outcomes = await prisma.decisionOutcome.findMany({
        where,
        select: {
          confirmedBiases: true,
          falsePositiveBiases: true,
          reportedAt: true,
        },
        orderBy: { reportedAt: 'asc' },
      });

      // Overall accuracy
      const totalConfirmed = outcomes.reduce((s, o) => s + o.confirmedBiases.length, 0);
      const totalFalsePositives = outcomes.reduce((s, o) => s + o.falsePositiveBiases.length, 0);
      const totalRated = totalConfirmed + totalFalsePositives;
      const overallAccuracy = totalRated > 0 ? Math.round((totalConfirmed / totalRated) * 100) : 0;

      // Per-bias-type accuracy
      const biasStats: Record<string, { confirmed: number; fp: number }> = {};
      for (const o of outcomes) {
        for (const b of o.confirmedBiases) {
          if (!biasStats[b]) biasStats[b] = { confirmed: 0, fp: 0 };
          biasStats[b].confirmed++;
        }
        for (const b of o.falsePositiveBiases) {
          if (!biasStats[b]) biasStats[b] = { confirmed: 0, fp: 0 };
          biasStats[b].fp++;
        }
      }

      const perBiasAccuracy = Object.entries(biasStats)
        .map(([biasType, stats]) => {
          const total = stats.confirmed + stats.fp;
          return {
            biasType,
            confirmationRate: Number(((stats.confirmed / total) * 100).toFixed(1)),
            sampleSize: total,
          };
        })
        .sort((a, b) => b.sampleSize - a.sampleSize);

      // Monthly accuracy trend
      const monthlyBuckets: Record<string, { confirmed: number; fp: number }> = {};
      for (const o of outcomes) {
        const month = o.reportedAt.toISOString().slice(0, 7);
        if (!monthlyBuckets[month]) monthlyBuckets[month] = { confirmed: 0, fp: 0 };
        monthlyBuckets[month].confirmed += o.confirmedBiases.length;
        monthlyBuckets[month].fp += o.falsePositiveBiases.length;
      }

      const accuracyTrend = Object.entries(monthlyBuckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => {
          const total = stats.confirmed + stats.fp;
          return {
            month,
            accuracy: total > 0 ? Math.round((stats.confirmed / total) * 100) : 0,
            sampleSize: total,
          };
        });

      // Accuracy improvement message
      let improvement = null;
      if (orgId) {
        improvement = await getAccuracyImprovement(orgId);
      }

      // Org bias history
      let biasHistory = null;
      if (orgId) {
        try {
          biasHistory = await getOrgBiasHistory(orgId);
        } catch {
          // Non-critical
        }
      }

      return NextResponse.json({
        overallAccuracy,
        totalConfirmed,
        totalFalsePositives,
        totalRated,
        perBiasAccuracy,
        accuracyTrend,
        improvement,
        dangerousBiases: biasHistory?.dangerousBiases ?? [],
        overDetectedBiases: biasHistory?.overDetectedBiases ?? [],
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json({
          overallAccuracy: 0,
          totalConfirmed: 0,
          totalFalsePositives: 0,
          totalRated: 0,
          perBiasAccuracy: [],
          accuracyTrend: [],
          improvement: null,
          dangerousBiases: [],
          overDetectedBiases: [],
          _message: 'Outcome tracking not yet available. Database migration pending.',
        });
      }
      throw error;
    }
  } catch (error) {
    log.error('Accuracy API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch accuracy data' }, { status: 500 });
  }
}
