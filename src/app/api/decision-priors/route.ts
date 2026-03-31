import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('DecisionPriorsRoute');

/**
 * POST /api/decision-priors
 * Records a decision-maker's prior beliefs before analysis (Moat 3: Structured RLHF).
 *
 * Body: { analysisId, defaultAction, confidence, evidenceToChange? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { analysisId, defaultAction, confidence, evidenceToChange } = body;

    if (!analysisId || !defaultAction || confidence == null) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisId, defaultAction, confidence' },
        { status: 400 }
      );
    }

    if (typeof confidence !== 'number' || confidence < 0 || confidence > 100) {
      return NextResponse.json(
        { error: 'confidence must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Verify the analysis belongs to this user before writing a prior
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { document: { select: { userId: true } } },
    });

    if (!analysis || analysis.document.userId !== user.id) {
      return NextResponse.json(
        { error: 'Analysis not found or not owned by you' },
        { status: 403 }
      );
    }

    const prior = await prisma.decisionPrior.upsert({
      where: { analysisId },
      create: {
        analysisId,
        userId: user.id,
        defaultAction,
        confidence,
        evidenceToChange: evidenceToChange || null,
      },
      update: {
        defaultAction,
        confidence,
        evidenceToChange: evidenceToChange || null,
      },
    });

    log.info(`Decision prior recorded for analysis ${analysisId} by user ${user.id}`);
    return NextResponse.json({ id: prior.id });
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('DecisionPrior table not available (schema drift)');
      return NextResponse.json({ id: 'schema-drift-noop' });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to create decision prior:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/decision-priors
 * Updates post-analysis action and calculates belief delta.
 *
 * Body: { analysisId, postAnalysisAction }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { analysisId, postAnalysisAction } = body;

    if (!analysisId || !postAnalysisAction) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisId, postAnalysisAction' },
        { status: 400 }
      );
    }

    // Fetch the existing prior to calculate belief delta
    const existing = await prisma.decisionPrior.findUnique({
      where: { analysisId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No prior found for this analysis' }, { status: 404 });
    }

    // Verify ownership
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to update this prior' }, { status: 403 });
    }

    // Calculate belief delta: how much did the analysis change their position?
    // Simple heuristic: compare prior default action vs post-analysis action
    // If they're identical -> delta = 0, if different -> delta based on confidence shift
    const actionChanged = existing.defaultAction.trim() !== postAnalysisAction.trim();
    const beliefDelta = actionChanged ? Math.min(100, existing.confidence) : 0;

    const updated = await prisma.decisionPrior.update({
      where: { analysisId },
      data: {
        postAnalysisAction,
        beliefDelta,
      },
    });

    log.info(`Decision prior updated for analysis ${analysisId}: beliefDelta=${beliefDelta}`);
    return NextResponse.json({ id: updated.id, beliefDelta });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({ id: 'schema-drift-noop', beliefDelta: 0 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to update decision prior:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/decision-priors?analysisId=xxx
 * Fetches an existing prior for a given analysis.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysisId = request.nextUrl.searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId query parameter required' }, { status: 400 });
    }

    const prior = await prisma.decisionPrior.findUnique({
      where: { analysisId },
    });

    if (!prior) {
      return NextResponse.json({ prior: null });
    }

    // Verify ownership
    if (prior.userId !== user.id) {
      return NextResponse.json({ prior: null });
    }

    return NextResponse.json({ prior });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({ prior: null });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to fetch decision prior:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
