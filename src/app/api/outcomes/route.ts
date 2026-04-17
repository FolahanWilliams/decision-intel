/**
 * Decision Outcomes API
 *
 * POST /api/outcomes — Report an outcome for a completed analysis
 * GET  /api/outcomes?analysisId=xxx — Get outcome for an analysis
 *
 * This closes the feedback loop: outcomes feed back into the simulation
 * pipeline via RAG, improving future analysis accuracy over time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Outcomes');

const VALID_OUTCOMES = ['success', 'partial_success', 'failure', 'too_early'] as const;
const VALID_TIMEFRAMES = ['30_days', '60_days', '90_days', '6_months', '1_year'] as const;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      analysisId,
      outcome,
      timeframe,
      impactScore,
      notes,
      lessonsLearned,
      confirmedBiases,
      falsPositiveBiases,
      mostAccurateTwin,
    } = body;

    if (!analysisId || !outcome) {
      return NextResponse.json({ error: 'analysisId and outcome are required' }, { status: 400 });
    }

    // Validate array fields
    if (confirmedBiases !== undefined && !Array.isArray(confirmedBiases)) {
      return NextResponse.json({ error: 'confirmedBiases must be an array' }, { status: 400 });
    }
    if (falsPositiveBiases !== undefined && !Array.isArray(falsPositiveBiases)) {
      return NextResponse.json({ error: 'falsPositiveBiases must be an array' }, { status: 400 });
    }

    if (!VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json(
        { error: `outcome must be one of: ${VALID_OUTCOMES.join(', ')}` },
        { status: 400 }
      );
    }

    if (timeframe && !VALID_TIMEFRAMES.includes(timeframe)) {
      return NextResponse.json(
        { error: `timeframe must be one of: ${VALID_TIMEFRAMES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify the analysis exists and belongs to the user
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        overallScore: true,
        document: { select: { userId: true, orgId: true } },
        biases: { select: { id: true } },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.document.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Upsert — allows updating an existing outcome report
    const result = await prisma.decisionOutcome.upsert({
      where: { analysisId },
      create: {
        analysisId,
        userId: user.id,
        orgId: analysis.document.orgId,
        outcome,
        timeframe: timeframe || null,
        impactScore: impactScore != null ? Math.max(0, Math.min(100, impactScore)) : null,
        notes: notes || null,
        lessonsLearned: lessonsLearned || null,
        confirmedBiases: confirmedBiases || [],
        falsPositiveBiases: falsPositiveBiases || [],
        mostAccurateTwin: mostAccurateTwin || null,
      },
      update: {
        outcome,
        timeframe: timeframe || null,
        impactScore: impactScore != null ? Math.max(0, Math.min(100, impactScore)) : null,
        notes: notes || null,
        lessonsLearned: lessonsLearned || null,
        confirmedBiases: confirmedBiases || [],
        falsPositiveBiases: falsPositiveBiases || [],
        mostAccurateTwin: mostAccurateTwin || null,
      },
    });

    // Mark analysis as outcome_logged — awaited to prevent race conditions
    // where the outcome gate sees a stale status on subsequent requests.
    try {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { outcomeStatus: 'outcome_logged' },
      });
    } catch (err) {
      log.warn(
        'Failed to update outcomeStatus to outcome_logged:',
        err instanceof Error ? err.message : String(err)
      );
    }

    // Recalibrate DQI with outcome data.
    // This is the user-visible payoff of submitting an outcome — if it
    // silently fails, the "quarter-over-quarter compounding" story breaks
    // with no feedback to the user. Track status so the API response can
    // surface it to the client.
    let recalibrationStatus: 'ok' | 'failed' | 'skipped' = 'skipped';
    let recalibrationResult: {
      originalScore: number;
      recalibratedScore: number;
      delta: number;
      grade: string;
    } | null = null;
    try {
      const originalScore = analysis.overallScore;
      // Adjust Bias Load: remove false positives, boost confirmed bias weights
      const confirmedCount = (confirmedBiases || []).length;
      const falsePositiveCount = (falsPositiveBiases || []).length;
      const totalBiases = analysis.biases?.length || 0;

      // Recalibrated score adjusts for outcome knowledge
      let recalibratedScore = originalScore;

      // False positives were overpenalized → score should be higher
      if (totalBiases > 0 && falsePositiveCount > 0) {
        const falsePositiveRatio = falsePositiveCount / totalBiases;
        recalibratedScore += falsePositiveRatio * 12; // Recover some of the bias penalty
      }

      // Confirmed biases were real → score should be lower (validated the detection)
      if (confirmedCount > 0) {
        recalibratedScore -= confirmedCount * 1.5; // Small additional penalty for confirmed danger
      }

      // Outcome tracking boosts process maturity (+5 for having outcome data)
      recalibratedScore += 3;

      // Outcome success/failure adjusts historical alignment
      if (outcome === 'failure') recalibratedScore -= 5;
      else if (outcome === 'success') recalibratedScore += 4;

      recalibratedScore = Math.max(0, Math.min(100, Math.round(recalibratedScore)));
      const delta = recalibratedScore - Math.round(originalScore);

      // Determine grade
      const grade =
        recalibratedScore >= 85
          ? 'A'
          : recalibratedScore >= 70
            ? 'B'
            : recalibratedScore >= 55
              ? 'C'
              : recalibratedScore >= 40
                ? 'D'
                : 'F';

      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          recalibratedDqi: {
            originalScore: Math.round(originalScore),
            recalibratedScore,
            recalibratedGrade: grade,
            delta,
            recalibratedAt: new Date().toISOString(),
          },
        },
      });
      recalibrationStatus = 'ok';
      recalibrationResult = {
        originalScore: Math.round(originalScore),
        recalibratedScore,
        delta,
        grade,
      };
      log.info(
        `Recalibrated DQI for ${analysisId}: ${Math.round(originalScore)} → ${recalibratedScore} (${delta > 0 ? '+' : ''}${delta})`
      );
    } catch (recalErr) {
      recalibrationStatus = 'failed';
      log.error(
        `DQI recalibration failed for ${analysisId}:`,
        recalErr instanceof Error ? recalErr.message : String(recalErr)
      );
    }

    // Adjust graph edge weights from outcome (fire-and-forget flywheel)
    let contradictions: Array<{
      contradictedBias: string;
      expectedOutcome: string;
      actualOutcome: string;
    }> = [];
    try {
      const { adjustEdgeWeightsFromOutcome, detectOutcomeContradictions } =
        await import('@/lib/graph/edge-learning');
      const edgesUpdated = await adjustEdgeWeightsFromOutcome(
        analysisId,
        outcome,
        confirmedBiases || [],
        falsPositiveBiases || []
      );
      if (edgesUpdated > 0) {
        log.info(`Adjusted ${edgesUpdated} edge weight(s) from outcome for ${analysisId}`);
      }

      // Detect contradictions between biases and outcome
      contradictions = await detectOutcomeContradictions(analysisId, outcome);
    } catch (flyErr) {
      log.warn('Outcome flywheel failed (non-critical):', flyErr);
    }

    // Multi-touch attribution computation (fire-and-forget)
    try {
      const { computeMultiTouchAttribution } = await import('@/lib/graph/multi-touch-attribution');
      void computeMultiTouchAttribution(analysisId, analysis.document.orgId ?? null).catch(err =>
        log.warn('Attribution computation failed (non-critical):', err)
      );
    } catch {
      // multi-touch-attribution module not available — skip
    }

    // Calibration milestone tracking (fire-and-forget)
    let milestone: { level: string; value: number; metricAfter: number } | null = null;
    try {
      const totalOutcomes = await prisma.decisionOutcome.count({
        where: { userId: user.id },
      });
      const MILESTONES = [5, 10, 15, 25, 50];
      if (MILESTONES.includes(totalOutcomes)) {
        const existing = await prisma.calibrationMilestone.findFirst({
          where: {
            userId: user.id,
            milestoneType: 'outcomes_reported',
            milestoneValue: totalOutcomes,
          },
        });
        if (!existing) {
          const allOutcomes = await prisma.decisionOutcome.findMany({
            where: { userId: user.id },
            select: { outcome: true },
          });
          const successes = allOutcomes.filter(
            o => o.outcome === 'success' || o.outcome === 'partial_success'
          ).length;
          const accuracyRate =
            allOutcomes.length > 0 ? Math.round((successes / allOutcomes.length) * 100) : 0;

          await prisma.calibrationMilestone.create({
            data: {
              userId: user.id,
              orgId: analysis.document.orgId,
              milestoneType: 'outcomes_reported',
              milestoneValue: totalOutcomes,
              metricAfter: accuracyRate,
            },
          });

          const levelName =
            totalOutcomes >= 30
              ? 'Platinum'
              : totalOutcomes >= 15
                ? 'Gold'
                : totalOutcomes >= 5
                  ? 'Silver'
                  : 'Bronze';

          milestone = { level: levelName, value: totalOutcomes, metricAfter: accuracyRate };
          log.info(`Calibration milestone reached: ${totalOutcomes} outcomes for user ${user.id}`);
        }
      }
    } catch (msErr) {
      const code = (msErr as { code?: string }).code;
      if (code !== 'P2021' && code !== 'P2022') {
        log.warn('Milestone tracking failed (non-critical):', msErr);
      }
    }

    log.info(`Outcome reported for analysis ${analysisId}: ${outcome}`);
    return NextResponse.json({
      ...result,
      contradictions,
      milestone,
      recalibration: {
        status: recalibrationStatus,
        ...(recalibrationResult ?? {}),
      },
    });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift in outcomes POST: DecisionOutcome table not yet migrated');
      return NextResponse.json(
        { error: 'Outcome tracking not yet available. Database migration pending.' },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
    log.error('Failed to save outcome:', error);
    return NextResponse.json({ error: 'Failed to save outcome' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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

  try {
    // Verify the analysis belongs to this user before returning outcome data
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { document: { select: { userId: true } } },
    });

    if (!analysis || analysis.document.userId !== user.id) {
      return NextResponse.json(null);
    }

    const outcome = await prisma.decisionOutcome.findUnique({
      where: { analysisId },
    });

    return NextResponse.json(outcome || null);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift in outcomes GET: DecisionOutcome table not yet migrated');
      return NextResponse.json(null);
    }
    log.error('Failed to fetch outcome:', error);
    return NextResponse.json(null);
  }
}
