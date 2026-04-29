/**
 * Learning Impact API
 *
 * GET /api/learning/impact?analysisId=xxx — Returns what the platform
 * learned from this specific decision's outcome, or what it will
 * learn if the user reports one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('LearningImpactAPI');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysisId = req.nextUrl.searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId required' }, { status: 400 });
    }

    // Verify ownership
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        document: { select: { userId: true, orgId: true } },
        biases: { select: { biasType: true, severity: true } },
      },
    });

    if (!analysis || analysis.document.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const orgId = analysis.document.orgId;

    // Check for existing outcome
    let outcome = null;
    try {
      outcome = await prisma.decisionOutcome.findUnique({
        where: { analysisId },
        select: {
          outcome: true,
          impactScore: true,
          confirmedBiases: true,
          falsePositiveBiases: true,
          reportedAt: true,
        },
      });
    } catch {
      // Schema drift — DecisionOutcome table may not exist
    }

    if (!outcome) {
      // No outcome yet — compute potential learnings
      const biasCount = analysis.biases.length;

      // Count similar decisions in the org that would benefit
      let similarDecisions = 0;
      if (orgId) {
        try {
          const biasTypes = analysis.biases.map(b => b.biasType);
          if (biasTypes.length > 0) {
            similarDecisions = await prisma.biasInstance
              .groupBy({
                by: ['analysisId'],
                where: {
                  biasType: { in: biasTypes },
                  analysisId: { not: analysisId },
                  analysis: { document: { orgId } },
                },
                _count: { id: true },
              })
              .then(groups => groups.length);
          }
        } catch {
          // Schema drift
        }
      }

      // How many more outcomes needed for statistical significance
      let outcomesTracked = 0;
      try {
        const where = orgId ? { orgId } : { userId: user.id };
        outcomesTracked = await prisma.decisionOutcome.count({ where });
      } catch {
        // Schema drift
      }
      const outcomesNeeded = Math.max(0, 20 - outcomesTracked);

      return NextResponse.json({
        hasOutcome: false,
        potentialLearnings: {
          biasCount,
          biasTypes: analysis.biases.slice(0, 5).map(b => b.biasType),
          similarDecisions,
          outcomesNeeded,
          message:
            biasCount > 0
              ? `${biasCount} bias${biasCount === 1 ? '' : 'es'} detected — reporting the outcome will teach the platform whether ${biasCount === 1 ? 'it was' : 'they were'} real.`
              : "Report this decision's outcome to help the platform calibrate future analyses.",
        },
      });
    }

    // Outcome exists — compute what was learned
    const confirmedBiases = outcome.confirmedBiases as string[];
    const falsePositiveBiases = outcome.falsePositiveBiases as string[];

    // Count edge weights that were updated (graph edges connected to this analysis)
    let edgesUpdated = 0;
    try {
      const edges = await prisma.decisionEdge.count({
        where: {
          OR: [{ sourceId: analysisId }, { targetId: analysisId }],
          updatedAt: { gte: outcome.reportedAt },
        },
      });
      edgesUpdated = edges;
    } catch {
      // Schema drift — no DecisionEdge table
    }

    // Get org accuracy trend to show impact
    let orgAccuracyMessage: string | null = null;
    if (orgId) {
      try {
        const allOutcomes = await prisma.decisionOutcome.findMany({
          where: {
            orgId,
            OR: [
              { confirmedBiases: { isEmpty: false } },
              { falsePositiveBiases: { isEmpty: false } },
            ],
          },
          orderBy: { reportedAt: 'asc' },
          select: { confirmedBiases: true, falsePositiveBiases: true, analysisId: true },
        });

        if (allOutcomes.length >= 5) {
          // Find this outcome's position in the sequence
          const idx = allOutcomes.findIndex(o => o.analysisId === analysisId);
          if (idx >= 0) {
            const calcRate = (slice: typeof allOutcomes) => {
              const confirmed = slice.reduce((s, o) => s + o.confirmedBiases.length, 0);
              const fp = slice.reduce((s, o) => s + o.falsePositiveBiases.length, 0);
              return confirmed + fp > 0 ? (confirmed / (confirmed + fp)) * 100 : 0;
            };

            const rateBefore = idx > 0 ? calcRate(allOutcomes.slice(0, idx)) : 0;
            const rateAfter = calcRate(allOutcomes.slice(0, idx + 1));
            const delta = rateAfter - rateBefore;

            if (Math.abs(delta) >= 0.5) {
              orgAccuracyMessage =
                delta > 0
                  ? `This outcome improved org detection accuracy by ${delta.toFixed(1)}pp`
                  : `This outcome adjusted org detection accuracy by ${delta.toFixed(1)}pp`;
            }
          }
        }
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      hasOutcome: true,
      outcome: {
        outcome: outcome.outcome,
        impactScore: outcome.impactScore,
      },
      confirmedBiases,
      falsePositiveBiases,
      edgesUpdated,
      orgAccuracyMessage,
    });
  } catch (error) {
    log.error('Learning Impact API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch learning impact' }, { status: 500 });
  }
}
