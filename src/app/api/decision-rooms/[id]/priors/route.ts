/**
 * Decision Room Blind Priors API
 *
 * POST /api/decision-rooms/[id]/priors — Submit a blind prior for a room
 * GET  /api/decision-rooms/[id]/priors — Get priors for a room (with blind/reveal logic)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('DecisionRoomPriorsRoute');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { defaultAction, confidence, reasoning } = body;

    if (!defaultAction || typeof defaultAction !== 'string' || defaultAction.trim().length === 0) {
      return NextResponse.json({ error: 'Missing required field: defaultAction' }, { status: 400 });
    }

    if (
      confidence == null ||
      typeof confidence !== 'number' ||
      confidence < 0 ||
      confidence > 100
    ) {
      return NextResponse.json(
        { error: 'confidence must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Verify the room exists and user is a participant
    const room = await prisma.decisionRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'open') {
      return NextResponse.json({ error: 'Room is not open for submissions' }, { status: 400 });
    }

    const isParticipant = room.participants.some(p => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
    }

    // Upsert the blind prior (one per user per room)
    const prior = await prisma.blindPrior.upsert({
      where: {
        roomId_userId: {
          roomId,
          userId: user.id,
        },
      },
      create: {
        roomId,
        userId: user.id,
        defaultAction: defaultAction.trim(),
        confidence,
        reasoning: reasoning || null,
      },
      update: {
        defaultAction: defaultAction.trim(),
        confidence,
        reasoning: reasoning || null,
      },
    });

    log.info(`Blind prior submitted for room ${roomId} by user ${user.id}`);
    return NextResponse.json({ id: prior.id }, { status: 201 });
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('BlindPrior table not available (schema drift)');
      return NextResponse.json({ id: 'schema-drift-noop' });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to submit blind prior:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      priors = room.blindPriors;
    } else {
      priors = room.blindPriors.map(bp => {
        if (bp.userId === user.id) {
          return bp;
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
      priors,
      meta: {
        allSubmitted,
        revealed: shouldReveal,
        participantCount: room.participants.length,
        submissionCount: room.blindPriors.length,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      return NextResponse.json({
        priors: [],
        meta: { allSubmitted: false, revealed: false, participantCount: 0, submissionCount: 0 },
      });
    }
    log.error('Failed to get blind priors:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
