import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CopilotSessionDetail');

/**
 * GET /api/copilot/sessions/[id]
 * Get a single copilot session with all its turns.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const session = await prisma.copilotSession.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        decisionPrompt: true,
        status: true,
        dqiScore: true,
        decisionSummary: true,
        chosenOption: true,
        createdAt: true,
        updatedAt: true,
        outcome: {
          select: {
            id: true,
            outcome: true,
            impactScore: true,
            lessonsLearned: true,
            helpfulAgents: true,
            reportedAt: true,
          },
        },
        turns: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            agentType: true,
            content: true,
            sources: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        decisionPrompt: session.decisionPrompt,
        status: session.status,
        dqiScore: session.dqiScore,
        decisionSummary: session.decisionSummary,
        chosenOption: session.chosenOption,
        outcome: session.outcome
          ? {
              ...session.outcome,
              reportedAt: session.outcome.reportedAt.toISOString(),
            }
          : null,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        turns: session.turns.map(t => ({
          id: t.id,
          role: t.role,
          agentType: t.agentType,
          content: t.content,
          sources: t.sources,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    log.error('Failed to get copilot session:', err);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
