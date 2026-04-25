/**
 * External-invitee aggregate view (4.1 deep).
 *
 * GET /api/blind-prior/[token]/aggregate
 *
 * Token here is the DecisionRoomInvite.id (NOT the submission token —
 * that one is rotated/destroyed on submit). Used by the reveal-email
 * link for external invitees who don't have a Decision Intel account.
 * Read-only; never accepts submissions.
 *
 * Privacy: no document content leaks. The token resolves to an invite
 * row only; we render the same anonymised aggregate as the dashboard
 * page but never the raw priors or the participant roster.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import {
  aggregateBlindPriors,
  type BlindPriorRow,
} from '@/lib/learning/blind-prior-aggregate';

const log = createLogger('BlindPriorPublicAggregate');

function ipFromRequest(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const ip = ipFromRequest(request);
    const rateLimitResult = await checkRateLimit(ip, '/api/blind-prior/aggregate', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 60,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { token } = await params;
    if (!token || token.length < 16) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const invite = await prisma.decisionRoomInvite.findUnique({
      where: { id: token },
      select: {
        id: true,
        roomId: true,
        room: {
          select: {
            id: true,
            title: true,
            blindPriorOutcomeFrame: true,
            blindPriorDeadline: true,
            blindPriorRevealedAt: true,
            outcomeId: true,
            decisionRoomBlindPriors: {
              select: {
                id: true,
                respondentUserId: true,
                respondentEmail: true,
                respondentName: true,
                confidencePercent: true,
                topRisks: true,
                privateRationale: true,
                shareRationale: true,
                shareIdentity: true,
                brierScore: true,
                brierCategory: true,
                brierCalculatedAt: true,
                submittedAt: true,
              },
            },
          },
        },
      },
    });
    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (!invite.room.blindPriorRevealedAt) {
      return NextResponse.json(
        { error: 'The aggregate has not been revealed yet.' },
        { status: 425 }
      );
    }

    const aggregate = aggregateBlindPriors(
      invite.room.decisionRoomBlindPriors as BlindPriorRow[]
    );

    return NextResponse.json({
      ok: true,
      room: {
        id: invite.room.id,
        title: invite.room.title,
        outcomeFrame: invite.room.blindPriorOutcomeFrame,
        deadline: invite.room.blindPriorDeadline?.toISOString() ?? null,
        revealedAt: invite.room.blindPriorRevealedAt.toISOString(),
        outcomeLogged: invite.room.outcomeId !== null,
      },
      aggregate,
    });
  } catch (err) {
    log.error('Public aggregate failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
