/**
 * Aggregate view for a Decision Room's pre-IC blind-prior survey (4.1 deep).
 *
 * GET /api/decision-rooms/[id]/blind-priors/aggregate
 *
 * Returns the anonymised aggregation computed by `aggregateBlindPriors`.
 * Access rules:
 *   - The room creator can always see the aggregate (and the roster +
 *     non-voter list, useful for nudging laggards).
 *   - Other participants only see the aggregate after `blindPriorRevealedAt`
 *     fires.
 *   - External invitees use a separate public route keyed off the
 *     invite id, never this authenticated one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { aggregateBlindPriors, type BlindPriorRow } from '@/lib/learning/blind-prior-aggregate';

const log = createLogger('BlindPriorAggregate');

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: roomId } = await params;

    const room = await prisma.decisionRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        createdBy: true,
        status: true,
        analysisId: true,
        blindPriorDeadline: true,
        blindPriorRevealedAt: true,
        blindPriorOutcomeFrame: true,
        outcomeId: true,
        decisionRoomInvites: {
          select: {
            id: true,
            userId: true,
            email: true,
            displayName: true,
            role: true,
            sentAt: true,
            usedAt: true,
            remindedAt: true,
            tokenExpiresAt: true,
          },
        },
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
        participants: {
          select: { userId: true, role: true },
        },
      },
    });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const isCreator = room.createdBy === user.id;
    const isParticipant = room.participants.some(p => p.userId === user.id);
    const matchedInvite = room.decisionRoomInvites.find(i => i.userId === user.id);
    const hasInvite = matchedInvite !== undefined;

    if (!isCreator && !isParticipant && !hasInvite) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const revealed = room.blindPriorRevealedAt !== null;
    if (!isCreator && !revealed) {
      return NextResponse.json(
        {
          ok: true,
          phase: 'collecting',
          revealed: false,
          deadline: room.blindPriorDeadline?.toISOString() ?? null,
          mySubmission: room.decisionRoomBlindPriors.find(p => p.respondentUserId === user.id)
            ? {
                submittedAt: room.decisionRoomBlindPriors
                  .find(p => p.respondentUserId === user.id)!
                  .submittedAt.toISOString(),
              }
            : null,
          waitingOn: undefined, // privacy: don't expose laggard list to non-creators
        },
        { status: 200 }
      );
    }

    const aggregate = aggregateBlindPriors(room.decisionRoomBlindPriors as BlindPriorRow[]);

    let phase: 'collecting' | 'revealed' | 'outcome_logged' = 'collecting';
    if (revealed) {
      phase = room.outcomeId !== null ? 'outcome_logged' : 'revealed';
    }

    const voterInvites = room.decisionRoomInvites.filter(i => i.role !== 'observer');
    const nonVoters = voterInvites.filter(i => i.usedAt === null);

    return NextResponse.json({
      ok: true,
      room: {
        id: room.id,
        title: room.title,
        outcomeFrame: room.blindPriorOutcomeFrame,
        deadline: room.blindPriorDeadline?.toISOString() ?? null,
        revealedAt: room.blindPriorRevealedAt?.toISOString() ?? null,
        outcomeId: room.outcomeId,
      },
      phase,
      aggregate,
      roster: {
        invites: room.decisionRoomInvites.map(i => ({
          id: i.id,
          displayName: i.displayName,
          recipientType: i.userId ? 'platform_user' : 'external',
          role: i.role,
          submitted: i.usedAt !== null,
          sentAt: i.sentAt.toISOString(),
          remindedAt: i.remindedAt?.toISOString() ?? null,
          tokenExpiresAt: i.tokenExpiresAt.toISOString(),
        })),
        nonVoterCount: nonVoters.length,
        voterCount: voterInvites.length,
      },
    });
  } catch (err) {
    log.error('Aggregate fetch failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
