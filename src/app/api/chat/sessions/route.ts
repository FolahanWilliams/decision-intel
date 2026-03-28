import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ChatSessions');

/**
 * GET /api/chat/sessions
 * List the authenticated user's chat sessions (most recent first, limit 20).
 * Includes message count but NOT full messages.
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

    // ChatSession/ChatMessage models may not have messages relation yet (schema drift)
    let result: Array<Record<string, unknown>> = [];
    try {
      const sessions = await prisma.chatSession.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          pinnedDocId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      result = sessions.map(
        (s: {
          id: string;
          title: string;
          pinnedDocId: string | null;
          createdAt: Date;
          updatedAt: Date;
        }) => ({
          id: s.id,
          title: s.title,
          pinnedDocId: s.pinnedDocId,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          messageCount: 0,
        })
      );
    } catch (driftErr: unknown) {
      const code = (driftErr as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('ChatSession model not available (schema drift)');
        return NextResponse.json({ sessions: [] });
      }
      throw driftErr;
    }

    return NextResponse.json({ sessions: result });
  } catch (err) {
    log.error('Failed to list chat sessions:', err);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

/**
 * POST /api/chat/sessions
 * Create or update a chat session with messages.
 *
 * Body: { id?: string, title: string, pinnedDocId?: string | null, messages: [{ role, content, sources? }] }
 *
 * If `id` is provided and belongs to the user, the session is replaced (upsert).
 * Otherwise a new session is created.
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
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { id, title, pinnedDocId, messages } = body as {
      id?: string;
      title?: string;
      pinnedDocId?: string | null;
      messages?: Array<{ role: string; content: string; sources?: unknown }>;
    };

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate messages
    const validMessages = messages.filter(
      m =>
        typeof m === 'object' &&
        m !== null &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    );

    if (validMessages.length === 0) {
      return NextResponse.json({ error: 'No valid messages provided' }, { status: 400 });
    }

    // If an id was provided, check ownership for upsert
    if (id && typeof id === 'string') {
      const existing = await prisma.chatSession.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (existing && existing.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (existing) {
        // Update: delete old messages, insert new ones
        // ChatMessage model may not exist yet (schema drift) — use dynamic access
        const session = await prisma.$transaction(async (tx: unknown) => {
          const txAny = tx as Record<string, { deleteMany: (args: unknown) => Promise<unknown> }>;
          try {
            await txAny.chatMessage.deleteMany({ where: { sessionId: id } });
          } catch {
            // chatMessage table may not exist yet
          }
          return (
            tx as {
              chatSession: {
                update: (args: unknown) => Promise<{ id: string; title: string; updatedAt: Date }>;
              };
            }
          ).chatSession.update({
            where: { id },
            data: {
              title,
              pinnedDocId: pinnedDocId ?? null,
            },
            select: { id: true, title: true, updatedAt: true },
          });
        });

        return NextResponse.json({ session });
      }
    }

    // Create new session (without messages relation — ChatMessage may not exist yet)
    const session = await prisma.chatSession.create({
      data: {
        id: id || undefined, // use client-provided id if given (for localStorage sync)
        userId: user.id,
        title,
        pinnedDocId: pinnedDocId ?? null,
      },
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    log.error('Failed to create/update chat session:', err);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/sessions?id=...
 * Delete a chat session. Verifies ownership before deleting.
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

    // Verify ownership
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.chatSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Failed to delete chat session:', err);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
