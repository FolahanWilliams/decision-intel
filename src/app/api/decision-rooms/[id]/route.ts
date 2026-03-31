/**
 * Decision Room Detail API
 *
 * GET  /api/decision-rooms/[id] — Get room details with participants and blind priors
 * PATCH /api/decision-rooms/[id] — Update room (close, add participants)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('DecisionRoomDetailRoute');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const room = await prisma.decisionRoom.findUnique({
      where: { id },
      include: {
        participants: true,
        blindPriors: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify user is a participant
    const isParticipant = room.participants.some(p => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
    }

    // Apply blind/reveal logic
    const allSubmitted = room.participants.every(p =>
      room.blindPriors.some(bp => bp.userId === p.userId)
    );
    const shouldReveal = allSubmitted || room.status === 'closed';

    const userHasSubmitted = room.blindPriors.some(bp => bp.userId === user.id);

    let priors;
    if (shouldReveal) {
      // All submitted or room closed — reveal everything
      priors = room.blindPriors;
    } else {
      // Still collecting — hide other people's answers
      priors = room.blindPriors.map(bp => {
        if (bp.userId === user.id) {
          return bp; // User can always see their own
        }
        return {
          ...bp,
          defaultAction: userHasSubmitted
            ? '[hidden until all submit]'
            : '[submit your prior first]',
          reasoning: null,
          isRevealed: false,
        };
      });
    }

    return NextResponse.json({
      ...room,
      blindPriors: priors,
      meta: {
        allSubmitted,
        revealed: shouldReveal,
        participantCount: room.participants.length,
        submissionCount: room.blindPriors.length,
      },
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({ error: 'Feature not available (schema drift)' }, { status: 503 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to get decision room:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Fetch room to verify ownership
    const room = await prisma.decisionRoom.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const { status, addParticipantUserIds } = body;

    // Only the creator can close or archive a room
    if (status && status !== room.status) {
      if (room.createdBy !== user.id) {
        return NextResponse.json(
          { error: 'Only the room creator can change the room status' },
          { status: 403 }
        );
      }

      if (!['open', 'closed', 'archived'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be open, closed, or archived' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status && status !== room.status) {
      updateData.status = status;
      if (status === 'closed') {
        updateData.closedAt = new Date();

        // Compute consensus score from blind priors on room close
        try {
          const priors = await prisma.blindPrior.findMany({
            where: { roomId: id },
            select: { userId: true, defaultAction: true, confidence: true },
          });

          if (priors.length >= 2) {
            const { computeConsensusScore } = await import('@/lib/learning/consensus-scoring');
            const consensus = computeConsensusScore(priors);
            updateData.consensusScore = consensus.score;

            log.info(
              `Room ${id} closed with consensus: ${consensus.convergenceLevel} (${consensus.score}/100), ${consensus.dissenterIds.length} dissenter(s)`
            );
          }
        } catch (consensusErr) {
          log.warn('Consensus scoring failed (non-critical):', consensusErr);
        }
      }
    }

    // Add new participants
    if (Array.isArray(addParticipantUserIds) && addParticipantUserIds.length > 0) {
      // Only creator or existing participants can add people
      const isParticipant = room.participants.some(p => p.userId === user.id);
      if (!isParticipant) {
        return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
      }

      const existingUserIds = new Set(room.participants.map(p => p.userId));
      const newParticipants = addParticipantUserIds
        .filter((uid: string) => typeof uid === 'string' && !existingUserIds.has(uid))
        .map((uid: string) => ({
          roomId: id,
          userId: uid,
          role: 'member' as const,
        }));

      if (newParticipants.length > 0) {
        await prisma.roomParticipant.createMany({
          data: newParticipants,
          skipDuplicates: true,
        });
      }
    }

    // Apply the update if there are changes
    let updatedRoom;
    if (Object.keys(updateData).length > 0) {
      updatedRoom = await prisma.decisionRoom.update({
        where: { id },
        data: updateData,
        include: {
          participants: true,
          _count: { select: { blindPriors: true } },
        },
      });
    } else {
      updatedRoom = await prisma.decisionRoom.findUnique({
        where: { id },
        include: {
          participants: true,
          _count: { select: { blindPriors: true } },
        },
      });
    }

    log.info(`Decision room ${id} updated by user ${user.id}`);

    // Emit webhook event (non-blocking, fire-and-forget)
    try {
      const { emitWebhookEvent } = await import('@/lib/integrations/webhooks/engine');
      emitWebhookEvent(
        'decision_room.updated',
        {
          roomId: id,
          status: updatedRoom?.status ?? 'unknown',
        },
        user.id
      );
    } catch {
      // Non-critical — webhook table may not exist
    }

    return NextResponse.json(updatedRoom);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      log.debug('DecisionRoom table not available (schema drift)');
      return NextResponse.json({ error: 'Feature not available (schema drift)' }, { status: 503 });
    }
    log.error('Failed to update decision room:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
