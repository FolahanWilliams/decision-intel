import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { runFullRecalibration } from '@/lib/learning/feedback-loop';

const log = createLogger('CopilotResolve');

/**
 * POST /api/copilot/sessions/[id]/resolve
 *
 * Resolves a copilot session and optionally logs an outcome.
 * This is the flywheel entry point: every outcome logged here
 * triggers recalibration that makes future agents smarter.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      chosenOption,
      outcome,
      impactScore,
      lessonsLearned,
      whatWorked,
      whatFailed,
      wouldChooseSame,
      helpfulAgents,
    } = body;

    if (!chosenOption || typeof chosenOption !== 'string' || !chosenOption.trim()) {
      return NextResponse.json({ error: 'chosenOption is required' }, { status: 400 });
    }

    // Validate optional fields
    if (outcome && !['success', 'partial_success', 'failure', 'inconclusive'].includes(outcome)) {
      return NextResponse.json({ error: 'Invalid outcome value' }, { status: 400 });
    }
    if (impactScore != null && (typeof impactScore !== 'number' || impactScore < 1 || impactScore > 10)) {
      return NextResponse.json({ error: 'impactScore must be 1-10' }, { status: 400 });
    }

    // Verify session exists and belongs to user
    const session = await prisma.copilotSession.findUnique({
      where: { id },
      select: { id: true, userId: true, orgId: true, status: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.status === 'resolved') {
      return NextResponse.json({ error: 'Session already resolved' }, { status: 409 });
    }

    // Update session to resolved
    const updatedSession = await prisma.copilotSession.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        chosenOption,
      },
      select: {
        id: true,
        title: true,
        status: true,
        resolvedAt: true,
        chosenOption: true,
      },
    });

    // If outcome data provided, create CopilotOutcome record
    let copilotOutcome = null;
    if (outcome) {
      const validOutcomes = ['success', 'partial_success', 'failure', 'inconclusive'];
      if (!validOutcomes.includes(outcome)) {
        return NextResponse.json(
          { error: `outcome must be one of: ${validOutcomes.join(', ')}` },
          { status: 400 }
        );
      }

      try {
        copilotOutcome = await prisma.copilotOutcome.create({
          data: {
            sessionId: id,
            userId: user.id,
            orgId: session.orgId,
            outcome,
            impactScore: impactScore != null ? Math.min(10, Math.max(1, Number(impactScore))) : null,
            lessonsLearned: lessonsLearned || null,
            whatWorked: whatWorked || null,
            whatFailed: whatFailed || null,
            wouldChooseSame: wouldChooseSame != null ? Boolean(wouldChooseSame) : null,
            helpfulAgents: Array.isArray(helpfulAgents) ? helpfulAgents : [],
          },
          select: {
            id: true,
            outcome: true,
            impactScore: true,
            reportedAt: true,
          },
        });

        // Fire-and-forget: trigger recalibration to close the flywheel loop
        runFullRecalibration(session.orgId).catch(err => {
          log.warn('Flywheel recalibration failed (non-blocking):', err);
        });
      } catch (err) {
        // CopilotOutcome table may not exist yet (schema drift)
        log.warn('Failed to create CopilotOutcome (schema drift?):', err);
      }
    }

    // Audit log
    logAudit({
      action: 'COPILOT_MESSAGE',
      resource: 'copilot_session',
      resourceId: id,
      details: {
        event: 'session_resolved',
        outcome: outcome || null,
        hasOutcome: !!copilotOutcome,
      },
    }).catch(() => {});

    return NextResponse.json({
      session: updatedSession,
      outcome: copilotOutcome,
      message: copilotOutcome
        ? 'Session resolved with outcome. Your agents are learning from this decision.'
        : 'Session resolved. Log an outcome later to help your agents learn.',
    });
  } catch (err) {
    log.error('Failed to resolve copilot session:', err);
    return NextResponse.json({ error: 'Failed to resolve session' }, { status: 500 });
  }
}
