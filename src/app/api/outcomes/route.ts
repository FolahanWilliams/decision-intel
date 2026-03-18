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
        document: { select: { userId: true, orgId: true } },
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

    log.info(`Outcome reported for analysis ${analysisId}: ${outcome}`);
    return NextResponse.json(result);
  } catch (error) {
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
    const outcome = await prisma.decisionOutcome.findUnique({
      where: { analysisId },
    });

    return NextResponse.json(outcome || null);
  } catch (error) {
    log.error('Failed to fetch outcome:', error);
    return NextResponse.json(null);
  }
}
