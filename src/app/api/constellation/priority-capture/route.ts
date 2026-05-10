/**
 * /api/constellation/priority-capture — intelligent-antagonist
 * priority capture endpoint.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 8 / Finding #4
 * (automation-bias defense). Before the constellation reveals its
 * algorithmic recommendations, the user names what THEY think the
 * highest-priority decision is. The named gap between user-priority
 * and algo-priority is the recommendation's actual value — not the
 * recommendation alone.
 *
 * Flow:
 *   POST {userPriorityText, algoTopContainerId, algoTopReason}
 *     → server: extracts containerId from userText via LLM intent
 *       extraction, computes divergenceScore, persists row, returns
 *       the divergence + the inferred container.
 *
 *   GET (latest)
 *     → returns the most recent capture for the user. Used by the
 *       constellation page to skip the prompt when a recent (≤ 1h)
 *       capture exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { extractUserPriorityIntent } from '@/lib/recommendations/llm-augmentation';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const log = createLogger('PriorityCaptureRoute');

const RECENT_CAPTURE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 30 captures per hour per user — generous for the
  // constellation page mount + any deliberate re-prompting.
  const rl = await checkRateLimit(user.id, 'constellation/priority-capture', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 30,
    failMode: 'open',
  });
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: {
    userPriorityText?: string;
    algoTopContainerId?: string | null;
    algoTopReason?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const userPriorityText = (body.userPriorityText ?? '').trim();
  if (userPriorityText.length === 0 || userPriorityText.length > 1000) {
    return NextResponse.json({ error: 'userPriorityText must be 1-1000 chars' }, { status: 400 });
  }

  const orgId = await resolveOrgId(user.id);

  // Extract intent: which container does the user-text reference?
  // Pulls candidates from the user's own active containers + (when
  // present) org-scoped containers.
  const candidates = await prisma.decisionContainer.findMany({
    where: {
      OR: orgId ? [{ ownerUserId: user.id }, { orgId }] : [{ ownerUserId: user.id }],
      status: 'active',
    },
    select: { id: true, name: true, decisionFrame: true },
    take: 50,
  });

  let userPriorityContainerId: string | null = null;
  if (candidates.length > 0) {
    const intent = await extractUserPriorityIntent({
      userText: userPriorityText,
      candidates,
    });
    if (intent.confidence >= 0.5) {
      userPriorityContainerId = intent.containerId;
    }
  }

  // Divergence score: 0.0 = perfect agreement, 1.0 = total mismatch.
  const algoTopContainerId = body.algoTopContainerId ?? null;
  let divergenceScore: number | null = null;
  if (algoTopContainerId !== null) {
    if (userPriorityContainerId === null) {
      // User-priority didn't map to a container — partial divergence.
      divergenceScore = 0.5;
    } else if (userPriorityContainerId === algoTopContainerId) {
      divergenceScore = 0.0;
    } else {
      divergenceScore = 1.0;
    }
  }

  try {
    const row = await prisma.constellationPriorityCapture.create({
      data: {
        userId: user.id,
        orgId,
        userPriorityText,
        userPriorityContainerId,
        algoTopContainerId: body.algoTopContainerId ?? null,
        algoTopReason: body.algoTopReason ?? null,
        divergenceScore,
      },
      select: {
        id: true,
        capturedAt: true,
        userPriorityContainerId: true,
        algoTopContainerId: true,
        divergenceScore: true,
      },
    });

    return NextResponse.json({
      capture: row,
      userPriorityContainerId,
      divergenceScore,
    });
  } catch (err) {
    log.error('priority-capture POST failed:', err);
    return NextResponse.json({ error: 'Failed to record capture' }, { status: 500 });
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

  const url = new URL(req.url);
  const window = url.searchParams.get('window') === 'recent' ? RECENT_CAPTURE_WINDOW_MS : null;

  try {
    const where = window
      ? { userId: user.id, capturedAt: { gte: new Date(Date.now() - window) } }
      : { userId: user.id };
    const recent = await prisma.constellationPriorityCapture.findFirst({
      where,
      orderBy: { capturedAt: 'desc' },
      select: {
        id: true,
        capturedAt: true,
        userPriorityText: true,
        userPriorityContainerId: true,
        algoTopContainerId: true,
        algoTopReason: true,
        divergenceScore: true,
      },
    });
    return NextResponse.json({ capture: recent });
  } catch (err) {
    log.error('priority-capture GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch capture' }, { status: 500 });
  }
}
