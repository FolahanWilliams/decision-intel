import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CalibrationRoute');

/**
 * GET /api/calibration
 * Returns prior intelligence metrics for the logged-in user.
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

    const priors = await prisma.decisionPrior.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const totalPriors = priors.length;

    if (totalPriors === 0) {
      return NextResponse.json({
        totalPriors: 0,
        avgConfidence: 0,
        avgBeliefDelta: 0,
        mindChangedRate: 0,
        priorsByConfidenceBand: [],
        recentPriors: [],
      });
    }

    // Avg confidence across all priors
    const avgConfidence = priors.reduce((sum, p) => sum + p.confidence, 0) / totalPriors;

    // Belief delta stats (only priors that have a beliefDelta value)
    const priorsWithDelta = priors.filter((p) => p.beliefDelta != null);
    const avgBeliefDelta =
      priorsWithDelta.length > 0
        ? priorsWithDelta.reduce((sum, p) => sum + (p.beliefDelta ?? 0), 0) /
          priorsWithDelta.length
        : 0;

    // Mind changed rate: % of priors where beliefDelta > 0 (out of those with a delta)
    const mindChangedCount = priorsWithDelta.filter((p) => (p.beliefDelta ?? 0) > 0).length;
    const mindChangedRate =
      priorsWithDelta.length > 0 ? (mindChangedCount / priorsWithDelta.length) * 100 : 0;

    // Group by confidence bands
    const bands = [
      { label: 'Low (0-25)', min: 0, max: 25 },
      { label: 'Moderate (25-50)', min: 25, max: 50 },
      { label: 'High (50-75)', min: 50, max: 75 },
      { label: 'Very High (75-100)', min: 75, max: 100 },
    ];

    const priorsByConfidenceBand = bands.map((band) => {
      const inBand = priors.filter((p) => p.confidence >= band.min && p.confidence < (band.max === 100 ? 101 : band.max));
      const bandWithDelta = inBand.filter((p) => p.beliefDelta != null);
      const avgDelta =
        bandWithDelta.length > 0
          ? bandWithDelta.reduce((sum, p) => sum + (p.beliefDelta ?? 0), 0) / bandWithDelta.length
          : 0;
      return {
        band: band.label,
        count: inBand.length,
        avgDelta: Math.round(avgDelta * 10) / 10,
      };
    });

    // Recent 5 priors
    const recentPriors = priors.slice(0, 5).map((p) => ({
      analysisId: p.analysisId,
      defaultAction: p.defaultAction.length > 60 ? p.defaultAction.slice(0, 60) + '...' : p.defaultAction,
      confidence: p.confidence,
      beliefDelta: p.beliefDelta,
      createdAt: p.createdAt,
    }));

    log.info(`Calibration data returned for user ${user.id}: ${totalPriors} priors`);

    return NextResponse.json({
      totalPriors,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      avgBeliefDelta: Math.round(avgBeliefDelta * 10) / 10,
      mindChangedRate: Math.round(mindChangedRate * 10) / 10,
      priorsByConfidenceBand,
      recentPriors,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      log.debug('DecisionPrior table not available (schema drift)');
      return NextResponse.json({
        totalPriors: 0,
        avgConfidence: 0,
        avgBeliefDelta: 0,
        mindChangedRate: 0,
        priorsByConfidenceBand: [],
        recentPriors: [],
      });
    }
    log.error('Failed to fetch calibration data:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
