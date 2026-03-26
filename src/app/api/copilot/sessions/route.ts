import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CopilotSessions');

/**
 * GET /api/copilot/sessions
 * List the authenticated user's copilot sessions (most recent first, limit 20).
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

    const sessions = await prisma.copilotSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        decisionPrompt: true,
        status: true,
        dqiScore: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { turns: true } },
      },
    });

    const result = sessions.map(s => ({
      id: s.id,
      title: s.title,
      decisionPrompt: s.decisionPrompt,
      status: s.status,
      dqiScore: s.dqiScore,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      turnCount: s._count.turns,
    }));

    return NextResponse.json({ sessions: result });
  } catch (err) {
    log.error('Failed to list copilot sessions:', err);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

/**
 * DELETE /api/copilot/sessions?id=...
 * Delete a copilot session. Verifies ownership before deleting.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    if (!sessionId) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    const session = await prisma.copilotSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.copilotSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Failed to delete copilot session:', err);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
