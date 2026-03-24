/**
 * Decision Rooms API — Real-Time Collaborative Decision Making
 *
 * POST /api/decision-rooms — Create a new decision room
 * GET /api/decision-rooms — List user's rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionRoomsRoute');

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
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { title, documentId, analysisId, participantUserIds } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
    }

    // Build participant creates — always include the creator
    const participantCreates = [{ userId: user.id, role: 'creator' }];

    if (Array.isArray(participantUserIds)) {
      for (const uid of participantUserIds) {
        if (typeof uid === 'string' && uid !== user.id) {
          participantCreates.push({ userId: uid, role: 'member' });
        }
      }
    }

    const room = await prisma.decisionRoom.create({
      data: {
        title: title.trim(),
        createdBy: user.id,
        documentId: documentId || null,
        analysisId: analysisId || null,
        participants: {
          create: participantCreates,
        },
      },
      include: {
        participants: true,
      },
    });

    log.info(`Decision room created: ${room.id} by user ${user.id}`);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      log.debug('DecisionRoom table not available (schema drift)');
      return NextResponse.json({ id: 'schema-drift-noop' });
    }
    log.error('Failed to create decision room:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      prisma.decisionRoom.findMany({
        where: {
          participants: {
            some: { userId: user.id },
          },
        },
        include: {
          _count: {
            select: {
              participants: true,
              blindPriors: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.decisionRoom.count({
        where: {
          participants: {
            some: { userId: user.id },
          },
        },
      }),
    ]);

    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      return NextResponse.json({
        rooms: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }
    log.error('Failed to list decision rooms:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
