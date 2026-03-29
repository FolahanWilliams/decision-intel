import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { formatSSE } from '@/lib/sse';
import { generateDecisionBrief, getLatestBrief } from '@/lib/synthesis/decision-brief';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('BriefRoute');

async function authenticateAndGetDeal(dealId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  let orgId: string | null = null;
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });
    orgId = membership?.orgId ?? null;
  } catch {
    // Schema drift
  }

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, orgId: orgId || user.id },
  });

  if (!deal) {
    return { error: 'Deal not found', status: 404 };
  }

  return { userId: user.id, orgId: orgId || user.id, deal };
}

/**
 * GET /api/deals/[id]/brief — Get the latest saved brief
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params;
    const auth = await authenticateAndGetDeal(dealId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const existing = await getLatestBrief(dealId);
    if (!existing) {
      return NextResponse.json({ brief: null }, { status: 200 });
    }

    return NextResponse.json({
      brief: existing.brief,
      version: existing.version,
      createdAt: existing.createdAt,
    });
  } catch (error) {
    log.error('GET brief failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/deals/[id]/brief — Generate (or regenerate) a decision brief via SSE streaming
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params;
    const auth = await authenticateAndGetDeal(dealId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, orgId } = auth;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of generateDecisionBrief(dealId, userId, orgId)) {
            controller.enqueue(encoder.encode(formatSSE(event)));
          }
        } catch (error) {
          log.error('Brief stream error:', error);
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'error',
                error: 'Brief generation failed',
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
    log.error('POST brief failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
