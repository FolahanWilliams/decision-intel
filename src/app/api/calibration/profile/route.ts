import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { CalibrationProfile } from '@/types';

const log = createLogger('CalibrationProfile');

/**
 * GET /api/calibration/profile
 * Returns the full Klein-style personal calibration profile for the logged-in user.
 * Aggregates decision history, recurring biases, outcome rates, and pattern analysis.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch all analyses with biases and outcomes for this user
    let analyses: Array<{
      id: string;
      overallScore: number;
      noiseScore: number;
      createdAt: Date;
      biases: Array<{ biasType: string; severity: string }>;
      outcome: { outcome: string; notes: string | null } | null;
    }> = [];

    try {
      const rawAnalyses = await prisma.analysis.findMany({
        where: {
          document: { userId },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          biases: {
            select: { biasType: true, severity: true },
          },
          outcome: {
            select: { outcome: true, notes: true },
          },
        },
      });
      analyses = rawAnalyses.map(a => ({
        id: a.id,
        overallScore: a.overallScore,
        noiseScore: a.noiseScore,
        createdAt: a.createdAt,
        biases: a.biases,
        outcome: a.outcome,
      }));
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('Schema drift in calibration profile query — returning empty profile');
        return NextResponse.json(buildEmptyProfile(userId));
      }
      throw dbError;
    }

    const totalDecisions = analyses.length;

    if (totalDecisions === 0) {
      return NextResponse.json(buildEmptyProfile(userId));
    }

    // Outcome rate calculation
    const outcomeAnalyses = analyses.filter(a => a.outcome != null);
    const outcomeRate = {
      success: outcomeAnalyses.filter(a => a.outcome?.outcome === 'success').length,
      failure: outcomeAnalyses.filter(a => a.outcome?.outcome === 'failure').length,
      mixed: outcomeAnalyses.filter(
        a => a.outcome?.outcome === 'mixed' || a.outcome?.outcome === 'partial'
      ).length,
    };

    // Recurring biases — count frequency across all analyses
    const biasFrequency: Record<string, number> = {};
    for (const analysis of analyses) {
      for (const bias of analysis.biases) {
        const normalized = bias.biasType.toLowerCase().replace(/\s+/g, '_');
        biasFrequency[normalized] = (biasFrequency[normalized] || 0) + 1;
      }
    }

    // Determine trend by comparing recent half vs older half
    const midpoint = Math.floor(analyses.length / 2);
    const recentAnalyses = analyses.slice(0, midpoint || 1);
    const olderAnalyses = analyses.slice(midpoint || 1);

    const recentBiasFreq: Record<string, number> = {};
    for (const a of recentAnalyses) {
      for (const b of a.biases) {
        const normalized = b.biasType.toLowerCase().replace(/\s+/g, '_');
        recentBiasFreq[normalized] = (recentBiasFreq[normalized] || 0) + 1;
      }
    }

    const olderBiasFreq: Record<string, number> = {};
    for (const a of olderAnalyses) {
      for (const b of a.biases) {
        const normalized = b.biasType.toLowerCase().replace(/\s+/g, '_');
        olderBiasFreq[normalized] = (olderBiasFreq[normalized] || 0) + 1;
      }
    }

    const recurringBiases = Object.entries(biasFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([biasType, frequency]) => {
        const recentRate = (recentBiasFreq[biasType] || 0) / (recentAnalyses.length || 1);
        const olderRate = (olderBiasFreq[biasType] || 0) / (olderAnalyses.length || 1);
        const diff = recentRate - olderRate;
        const trend: 'increasing' | 'decreasing' | 'stable' =
          diff > 0.1 ? 'increasing' : diff < -0.1 ? 'decreasing' : 'stable';
        return { biasType, frequency, trend };
      });

    // Calibration score: based on outcome success rate and bias trend improvement
    let calibrationScore = 50; // base
    if (outcomeAnalyses.length > 0) {
      const successRate = outcomeRate.success / outcomeAnalyses.length;
      calibrationScore = Math.round(successRate * 60 + 40); // 40-100 range based on outcomes
    }
    // Bonus for decreasing bias trends
    const decreasingBiases = recurringBiases.filter(b => b.trend === 'decreasing').length;
    calibrationScore = Math.min(100, calibrationScore + decreasingBiases * 3);

    // Pattern blind spots — biases that appear frequently but never improve
    const patternBlindSpots = recurringBiases
      .filter(b => b.frequency >= 3 && b.trend !== 'decreasing')
      .map(b => b.biasType.replace(/_/g, ' '));

    // Strength patterns — biases that are decreasing
    const strengthPatterns = recurringBiases
      .filter(b => b.trend === 'decreasing')
      .map(b => `Improving on ${b.biasType.replace(/_/g, ' ')}`);

    // Add outcome-based strengths
    if (outcomeRate.success > outcomeRate.failure) {
      strengthPatterns.unshift('More successful outcomes than failures');
    }

    const profile: CalibrationProfile = {
      userId,
      totalDecisions,
      outcomeRate,
      recurringBiases,
      calibrationScore,
      patternBlindSpots,
      strengthPatterns,
    };

    log.info(
      `Calibration profile for user ${userId}: ${totalDecisions} decisions, score: ${calibrationScore}`
    );

    return NextResponse.json(profile);
  } catch (error) {
    log.error(
      'Failed to build calibration profile:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildEmptyProfile(userId: string): CalibrationProfile {
  return {
    userId,
    totalDecisions: 0,
    outcomeRate: { success: 0, failure: 0, mixed: 0 },
    recurringBiases: [],
    calibrationScore: 0,
    patternBlindSpots: [],
    strengthPatterns: [],
  };
}
