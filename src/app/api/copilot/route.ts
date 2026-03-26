import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { formatSSE } from '@/lib/sse';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { prepareCopilotTurn, runCopilotAgent } from '@/lib/copilot/graph';
import {
  type CopilotAgentType,
  type CopilotTurnData,
  COPILOT_AGENTS,
  AGENT_LABELS,
} from '@/lib/copilot/types';

const log = createLogger('CopilotRoute');

const MAX_MESSAGE_LENGTH = 10_000;
const MAX_HISTORY_LENGTH = 40;

/**
 * POST /api/copilot
 * Decision copilot endpoint with SSE streaming.
 *
 * Body: {
 *   sessionId?: string,       // Existing session to continue
 *   message: string,          // User's message
 *   decisionPrompt?: string,  // Required for new sessions
 *   forcedAgent?: string,     // Optional: force a specific agent
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 30 messages per hour
    const rateLimitResult = await checkRateLimit(userId, '/api/copilot', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
      failMode: 'open',
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { sessionId, message, decisionPrompt, forcedAgent } = body as {
      sessionId?: string;
      message: string;
      decisionPrompt?: string;
      forcedAgent?: string;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate forced agent if provided
    const validForcedAgent = forcedAgent && COPILOT_AGENTS.includes(forcedAgent as CopilotAgentType)
      ? (forcedAgent as CopilotAgentType)
      : undefined;

    // Resolve or create session
    let session: { id: string; decisionPrompt: string; orgId: string | null };
    let history: CopilotTurnData[] = [];

    if (sessionId) {
      // Load existing session
      const existing = await prisma.copilotSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          userId: true,
          orgId: true,
          decisionPrompt: true,
          turns: {
            orderBy: { createdAt: 'asc' },
            take: MAX_HISTORY_LENGTH,
            select: { role: true, agentType: true, content: true },
          },
        },
      });

      if (!existing || existing.userId !== userId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      session = { id: existing.id, decisionPrompt: existing.decisionPrompt, orgId: existing.orgId };
      history = existing.turns.map(t => ({
        role: t.role as 'user' | 'agent',
        agentType: t.agentType as CopilotAgentType | undefined,
        content: t.content,
      }));
    } else {
      // Create new session
      if (!decisionPrompt || typeof decisionPrompt !== 'string') {
        return NextResponse.json(
          { error: 'decisionPrompt is required for new sessions' },
          { status: 400 }
        );
      }

      // Look up org membership
      let orgId: string | null = null;
      try {
        const member = await prisma.teamMember.findFirst({
          where: { userId },
          select: { orgId: true },
        });
        orgId = member?.orgId ?? null;
      } catch {
        // No org — that's fine
      }

      const newSession = await prisma.copilotSession.create({
        data: {
          userId,
          orgId,
          decisionPrompt,
          title: decisionPrompt.slice(0, 100),
        },
        select: { id: true, decisionPrompt: true, orgId: true },
      });

      session = newSession;
    }

    // Persist the user's turn
    await prisma.copilotTurn.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message,
      },
    });

    // Prepare the copilot turn (context assembly + routing)
    const turnResult = await prepareCopilotTurn(
      userId,
      session.orgId,
      session.decisionPrompt,
      message,
      history,
      undefined,
      validForcedAgent
    );

    const { agentType, sources } = turnResult;

    // Stream the response via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send agent start event
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'agent_start',
                agent: agentType,
                label: AGENT_LABELS[agentType],
              })
            )
          );

          // Send sources
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'sources',
                sources: sources.map(s => ({
                  documentId: s.documentId,
                  filename: s.filename,
                  similarity: s.similarity,
                  score: s.score,
                })),
              })
            )
          );

          // Stream agent response
          let fullResponse = '';
          const agentStream = runCopilotAgent(
            agentType,
            session.decisionPrompt,
            message,
            turnResult.context,
            history
          );

          for await (const chunk of agentStream) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(formatSSE({ type: 'chunk', text: chunk })));
          }

          // Persist the agent's turn
          const agentTurn = await prisma.copilotTurn.create({
            data: {
              sessionId: session.id,
              role: 'agent',
              agentType,
              content: fullResponse,
              sources: sources.length > 0 ? toPrismaJson(sources.map(s => ({
                documentId: s.documentId,
                filename: s.filename,
                similarity: s.similarity,
                score: s.score,
              }))) : undefined,
            },
            select: { id: true },
          });

          // Update session title if this is the first agent response
          if (history.length === 0) {
            void prisma.copilotSession.update({
              where: { id: session.id },
              data: { title: session.decisionPrompt.slice(0, 100) },
            }).catch(() => {});
          }

          // Signal completion
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'done',
                turnId: agentTurn.id,
                agent: agentType,
                sessionId: session.id,
              })
            )
          );

          // Audit log (fire-and-forget)
          void logAudit({
            action: 'COPILOT_MESSAGE',
            resource: 'copilot',
            details: {
              sessionId: session.id,
              agentType,
              messageLength: message.length,
              responseLength: fullResponse.length,
              sourcesCount: sources.length,
            },
          });
        } catch (err) {
          log.error('Copilot stream error:', err);
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'error',
                message: 'An error occurred while generating the response.',
              })
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    log.error('Copilot API error:', error);
    return NextResponse.json({ error: 'Copilot failed' }, { status: 500 });
  }
}
