/**
 * Decision Outcome Tracking API
 *
 * POST /api/outcomes/track - Report the actual outcome of a decision
 * GET /api/outcomes/track?analysisId=xxx - Get outcome for an analysis
 * GET /api/outcomes/track?userId=xxx - Get all outcomes for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { apiError } from '@/lib/utils/api-response';
import { DecisionOutcome } from '@prisma/client';
import {
  canonicalOutcome,
  scoreOutcome,
  type BrierCategory,
} from '@/lib/learning/brier-scoring';

const log = createLogger('OutcomeTracking');

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    const rateLimitResult = await checkRateLimit(user.id, '/api/outcomes/track', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
    });
    if (!rateLimitResult.success) {
      return apiError({ error: 'Rate limit exceeded', status: 429 });
    }

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
      return apiError({ error: 'Analysis ID and outcome are required', status: 400 });
    }

    // Validate outcome value
    const validOutcomes = ['success', 'partial_success', 'failure', 'too_early'];
    if (!validOutcomes.includes(outcome)) {
      return apiError({ error: 'Invalid outcome value', status: 400 });
    }

    // Verify the analysis exists and user has access
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        document: true,
        biases: true,
      },
    });

    if (!analysis) {
      return apiError({ error: 'Analysis not found', status: 404 });
    }

    // Verify ownership
    const orgId = analysis.document.orgId;
    if (analysis.document.userId !== user.id) {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
      });

      if (!membership || membership.orgId !== orgId) {
        return apiError({ error: 'Access denied', status: 403 });
      }
    }

    // Upsert outcome (avoids race condition with concurrent requests)
    const decisionOutcome = await prisma.decisionOutcome.upsert({
      where: { analysisId },
      update: {
        outcome,
        timeframe,
        impactScore,
        notes,
        lessonsLearned,
        confirmedBiases: confirmedBiases || [],
        falsPositiveBiases: falsPositiveBiases || [],
        mostAccurateTwin,
      },
      create: {
        analysisId,
        userId: user.id,
        orgId,
        outcome,
        timeframe,
        impactScore,
        notes,
        lessonsLearned,
        confirmedBiases: confirmedBiases || [],
        falsPositiveBiases: falsPositiveBiases || [],
        mostAccurateTwin,
      },
    });

    log.info(`Upserted outcome for analysis ${analysisId}: ${outcome}`);

    // Update bias accuracy based on confirmed/false positives
    if (confirmedBiases?.length || falsPositiveBiases?.length) {
      // Update confirmed biases with high rating
      if (confirmedBiases?.length) {
        await prisma.biasInstance.updateMany({
          where: {
            analysisId,
            biasType: { in: confirmedBiases },
          },
          data: { userRating: 5 },
        });
      }

      // Update false positives with low rating
      if (falsPositiveBiases?.length) {
        await prisma.biasInstance.updateMany({
          where: {
            analysisId,
            biasType: { in: falsPositiveBiases },
          },
          data: { userRating: 1 },
        });
      }
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId,
        action: 'outcome.upsert',
        resource: 'outcome',
        resourceId: decisionOutcome.id,
        details: {
          analysisId,
          outcome,
          impactScore,
        },
      },
    });

    // Recalibrate this specific analysis's DQI given what we now know from
    // the reported outcome. Writes Analysis.recalibratedDqi so the document
    // detail page (ReplayTab) can render the before/after comparison.
    // Previously this logic only ran in the parallel /api/outcomes route,
    // which OutcomeReporter does not call — so the "quarter-over-quarter
    // compounding" story was invisible from the main UI surface.
    let recalibrationStatus: 'ok' | 'failed' | 'skipped' = 'skipped';
    let recalibrationPayload: {
      originalScore: number;
      recalibratedScore: number;
      delta: number;
      grade: string;
    } | null = null;
    let brierPayload: { score: number; category: BrierCategory } | null = null;
    try {
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        select: { overallScore: true, biases: { select: { id: true } } },
      });
      if (analysis) {
        const originalScore = analysis.overallScore;
        const confirmedCount = (confirmedBiases || []).length;
        const falsePositiveCount = (falsPositiveBiases || []).length;
        const totalBiases = analysis.biases?.length || 0;

        let recalibratedScore = originalScore;
        if (totalBiases > 0 && falsePositiveCount > 0) {
          const falsePositiveRatio = falsePositiveCount / totalBiases;
          recalibratedScore += falsePositiveRatio * 12;
        }
        if (confirmedCount > 0) {
          recalibratedScore -= confirmedCount * 1.5;
        }
        recalibratedScore += 3; // outcome tracking boosts process maturity
        if (outcome === 'failure') recalibratedScore -= 5;
        else if (outcome === 'success') recalibratedScore += 4;

        recalibratedScore = Math.max(0, Math.min(100, Math.round(recalibratedScore)));
        const delta = recalibratedScore - Math.round(originalScore);
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

        // Brier scoring — proper-scoring-rule calibration of the
        // originalScore prediction against the confirmed outcome. Persisted
        // on the DecisionOutcome row so the outcome-flywheel dashboard can
        // compute per-org calibration trends over time. See
        // src/lib/learning/brier-scoring.ts for the math.
        const outcomeCode = canonicalOutcome(outcome);
        const brier = scoreOutcome(originalScore, outcomeCode);
        brierPayload = brier;

        await prisma.analysis.update({
          where: { id: analysisId },
          data: {
            recalibratedDqi: {
              originalScore: Math.round(originalScore),
              recalibratedScore,
              recalibratedGrade: grade,
              delta,
              recalibratedAt: new Date().toISOString(),
              brierScore: brier.score,
              brierCategory: brier.category,
            },
          },
        });

        // Stamp Brier on the DecisionOutcome row so per-org aggregation
        // queries (getOrgBrierStats) can pull directly from the indexed
        // column instead of parsing the JSON blob on Analysis.
        await prisma.decisionOutcome.update({
          where: { id: decisionOutcome.id },
          data: {
            brierScore: brier.score,
            brierCategory: brier.category,
          },
        });

        recalibrationStatus = 'ok';
        recalibrationPayload = {
          originalScore: Math.round(originalScore),
          recalibratedScore,
          delta,
          grade,
        };
        log.info(
          `Recalibrated DQI for ${analysisId}: ${Math.round(originalScore)} → ${recalibratedScore} (${delta > 0 ? '+' : ''}${delta}) · Brier ${brier.score} (${brier.category})`
        );
      }
    } catch (recalErr) {
      recalibrationStatus = 'failed';
      log.error(
        `DQI recalibration failed for ${analysisId}:`,
        recalErr instanceof Error ? recalErr.message : String(recalErr)
      );
    }

    // Emit webhook event (non-blocking, fire-and-forget)
    try {
      const { emitWebhookEvent } = await import('@/lib/integrations/webhooks/engine');
      emitWebhookEvent(
        'outcome.reported',
        {
          outcomeId: decisionOutcome.id,
          analysisId,
          outcome,
          confidence: impactScore ?? null,
        },
        orgId || user.id
      );
    } catch {
      // Non-critical — webhook table may not exist
    }

    // Auto-trigger recalibration if sufficient outcomes exist (behavioral data flywheel)
    try {
      const outcomeCount = await prisma.decisionOutcome.count({
        where: orgId ? { orgId } : { userId: user.id },
      });
      // Recalibrate every 5 outcomes to keep weights fresh
      if (outcomeCount > 0 && outcomeCount % 5 === 0) {
        const { runFullRecalibration } = await import('@/lib/learning/feedback-loop');
        runFullRecalibration(orgId).catch(err =>
          log.warn('Auto-recalibration failed (non-critical):', err)
        );
        log.info(
          `Auto-recalibration triggered at ${outcomeCount} outcomes for ${orgId || user.id}`
        );
      }
    } catch (recalErr) {
      // Non-critical — CalibrationProfile table may not exist yet
      log.debug(
        'Auto-recalibration skipped:',
        recalErr instanceof Error ? recalErr.message : String(recalErr)
      );
    }

    // Calculate outcome statistics for this user/org
    const outcomes = await prisma.decisionOutcome.findMany({
      where: orgId ? { orgId } : { userId: user.id },
      select: { outcome: true, impactScore: true },
      take: 500,
    });

    const withImpact = outcomes.filter(o => o.impactScore !== null);
    const stats = {
      total: outcomes.length,
      success: outcomes.filter(o => o.outcome === 'success').length,
      partialSuccess: outcomes.filter(o => o.outcome === 'partial_success').length,
      failure: outcomes.filter(o => o.outcome === 'failure').length,
      averageImpact:
        withImpact.length > 0
          ? withImpact.reduce((sum, o) => sum + (o.impactScore || 0), 0) / withImpact.length
          : 0,
    };

    return NextResponse.json({
      message: 'Outcome tracked',
      outcome: decisionOutcome,
      stats,
      recalibration: {
        status: recalibrationStatus,
        ...(recalibrationPayload ?? {}),
      },
      // Brier is surfaced so the client can render a calibration chip
      // in the outcome-submission success banner. Null on the "recalibration
      // skipped" branch (e.g. analysis was deleted between upsert and now).
      brier: brierPayload,
    });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift in outcome tracking: DecisionOutcome table not yet migrated');
      return NextResponse.json(
        { error: 'Outcome tracking not yet available. Database migration pending.' },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
    log.error('Failed to track outcome:', error);
    return apiError({ error: 'Failed to track outcome', status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'all':
        startDate.setFullYear(2020);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    if (analysisId) {
      // Get outcome for specific analysis
      const outcome = await prisma.decisionOutcome.findUnique({
        where: { analysisId },
        include: {
          analysis: {
            include: {
              document: { select: { filename: true } },
              biases: { select: { biasType: true, severity: true, userRating: true } },
            },
          },
        },
      });

      if (!outcome) {
        return NextResponse.json({ outcome: null });
      }

      // Verify access
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: { document: true },
      });

      if (analysis?.document.userId !== user.id) {
        const membership = await prisma.teamMember.findFirst({
          where: { userId: user.id },
        });

        if (!membership || membership.orgId !== analysis?.document.orgId) {
          return apiError({ error: 'Access denied', status: 403 });
        }
      }

      return NextResponse.json({ outcome });
    }

    // Get all outcomes for the authenticated user's scope.
    // If userId is provided, only allow it if it matches the authenticated user
    // or they share an org (prevents cross-user data leakage).
    const effectiveUserId = user.id;
    const membership = await prisma.teamMember.findFirst({
      where: { userId: effectiveUserId },
    });

    // If a different userId was requested, verify they're in the same org
    if (userId && userId !== user.id) {
      if (!membership?.orgId) {
        return apiError({ error: 'Access denied', status: 403 });
      }
      const targetMembership = await prisma.teamMember.findFirst({
        where: { userId, orgId: membership.orgId },
      });
      if (!targetMembership) {
        return apiError({ error: 'Access denied', status: 403 });
      }
    }

    const outcomes = await prisma.decisionOutcome.findMany({
      where: {
        ...(membership?.orgId ? { orgId: membership.orgId } : { userId: effectiveUserId }),
        reportedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { reportedAt: 'desc' },
      take: 500,
      include: {
        analysis: {
          include: {
            document: { select: { filename: true } },
          },
        },
      },
    });

    // Calculate metrics
    const metrics = {
      total: outcomes.length,
      byOutcome: {
        success: outcomes.filter(o => o.outcome === 'success').length,
        partialSuccess: outcomes.filter(o => o.outcome === 'partial_success').length,
        failure: outcomes.filter(o => o.outcome === 'failure').length,
        tooEarly: outcomes.filter(o => o.outcome === 'too_early').length,
      },
      averageImpact:
        outcomes
          .filter(o => o.impactScore !== null)
          .reduce((sum, o) => sum + (o.impactScore || 0), 0) /
          outcomes.filter(o => o.impactScore !== null).length || 0,
      biasAccuracy: calculateBiasAccuracy(outcomes),
    };

    return NextResponse.json({ outcomes, metrics });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift in outcome fetch: DecisionOutcome table not yet migrated');
      return NextResponse.json({ outcomes: [], metrics: null });
    }
    log.error('Failed to fetch outcomes:', error);
    return apiError({ error: 'Failed to fetch outcomes', status: 500 });
  }
}

/**
 * Calculate bias detection accuracy from outcomes
 */
function calculateBiasAccuracy(outcomes: DecisionOutcome[]): {
  confirmed: string[];
  falsePositives: string[];
  accuracy: number;
} {
  const allBiases = new Set<string>();
  const confirmedBiases = new Set<string>();
  const falsePositiveBiases = new Set<string>();

  outcomes.forEach(outcome => {
    outcome.confirmedBiases?.forEach((bias: string) => {
      allBiases.add(bias);
      confirmedBiases.add(bias);
    });

    outcome.falsPositiveBiases?.forEach((bias: string) => {
      allBiases.add(bias);
      falsePositiveBiases.add(bias);
    });
  });

  const accuracy = allBiases.size > 0 ? (confirmedBiases.size / allBiases.size) * 100 : 0;

  return {
    confirmed: Array.from(confirmedBiases),
    falsePositives: Array.from(falsePositiveBiases),
    accuracy,
  };
}

/**
 * Get outcome prediction accuracy by digital twin
 */
export async function PUT(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    // Get outcomes with twin accuracy data
    const outcomes = await prisma.decisionOutcome.findMany({
      where: {
        userId: user.id,
        mostAccurateTwin: { not: null },
      },
      select: {
        mostAccurateTwin: true,
        outcome: true,
        impactScore: true,
      },
      take: 500,
    });

    // Group by digital twin
    const twinAccuracy = outcomes.reduce(
      (acc, outcome) => {
        const twin = outcome.mostAccurateTwin || 'Unknown';
        if (!acc[twin]) {
          acc[twin] = { count: 0, successRate: 0, averageImpact: 0 };
        }
        acc[twin].count++;
        if (outcome.outcome === 'success') {
          acc[twin].successRate++;
        }
        if (outcome.impactScore) {
          acc[twin].averageImpact += outcome.impactScore;
        }
        return acc;
      },
      {} as Record<string, { count: number; successRate: number; averageImpact: number }>
    );

    // Calculate percentages
    Object.keys(twinAccuracy).forEach(twin => {
      const data = twinAccuracy[twin];
      data.successRate = (data.successRate / data.count) * 100;
      data.averageImpact = data.averageImpact / data.count;
    });

    return NextResponse.json({
      twinAccuracy,
      mostAccurate: Object.entries(twinAccuracy)
        .sort((a, b) => b[1].successRate - a[1].successRate)
        .slice(0, 3)
        .map(([name, data]) => ({ name, ...data })),
    });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift in twin accuracy: DecisionOutcome table not yet migrated');
      return NextResponse.json({ twinAccuracy: {}, mostAccurate: [] });
    }
    log.error('Failed to analyze twin accuracy:', error);
    return apiError({ error: 'Failed to analyze accuracy', status: 500 });
  }
}
