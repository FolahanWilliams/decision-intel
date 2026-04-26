/**
 * Decision Rooms API — Real-Time Collaborative Decision Making
 *
 * POST /api/decision-rooms — Create a new decision room
 * GET /api/decision-rooms — List user's rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { buildDocumentAccessWhere, resolveAnalysisAccess } from '@/lib/utils/document-access';

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

    const rateLimitResult = await checkRateLimit(user.id, '/api/decision-rooms', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { title, documentId, analysisId, participantUserIds, decisionType } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
    }

    // RBAC (3.5): if a documentId/analysisId is supplied, the creator must
    // be allowed to read the document the room is being built around.
    // Otherwise a teammate could create a "Decision Room" exposing a
    // private doc to extra participants.
    if (typeof documentId === 'string' && documentId.length > 0) {
      const access = await buildDocumentAccessWhere(documentId, user.id);
      const canRead = await prisma.document.findFirst({
        where: access.where,
        select: { id: true },
      });
      if (!canRead) {
        return NextResponse.json(
          { error: 'Document not found or you do not have access.' },
          { status: 404 }
        );
      }
    }
    if (typeof analysisId === 'string' && analysisId.length > 0) {
      const analysisAccess = await resolveAnalysisAccess(analysisId, user.id);
      if (!analysisAccess) {
        return NextResponse.json(
          { error: 'Analysis not found or you do not have access.' },
          { status: 404 }
        );
      }
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

    // Auto-generate bias briefing from linked analysis
    let biasBriefing = null;
    if (analysisId) {
      try {
        const analysis = await prisma.analysis.findUnique({
          where: { id: analysisId },
          select: {
            overallScore: true,
            noiseScore: true,
            biases: { select: { biasType: true, severity: true }, take: 10 },
          },
        });
        if (analysis) {
          let toxicCombinations: Array<{
            patternLabel: string | null;
            toxicScore: number;
            biasTypes: string[];
          }> = [];
          try {
            const toxics = await prisma.toxicCombination.findMany({
              where: { analysisId },
              select: { patternLabel: true, toxicScore: true, biasTypes: true },
              orderBy: { toxicScore: 'desc' },
              take: 3,
            });
            toxicCombinations = toxics;
          } catch {
            // ToxicCombination table may not exist
          }

          biasBriefing = {
            overallScore: analysis.overallScore,
            noiseScore: analysis.noiseScore,
            biases: analysis.biases,
            toxicCombinations,
            generatedAt: new Date().toISOString(),
          };
        }
      } catch (briefErr) {
        log.debug('Bias briefing generation skipped:', briefErr);
      }
    }

    const VALID_DECISION_TYPES = [
      'investment_committee',
      'board_review',
      'deal_committee',
      'risk_committee',
      'executive_committee',
      'strategy_review',
      'ma_committee',
      'general',
    ];
    const validType =
      decisionType && VALID_DECISION_TYPES.includes(decisionType) ? decisionType : null;

    const room = await prisma.decisionRoom.create({
      data: {
        title: title.trim(),
        createdBy: user.id,
        documentId: documentId || null,
        analysisId: analysisId || null,
        decisionType: validType,
        biasBriefing: biasBriefing ? (biasBriefing as Prisma.InputJsonValue) : undefined,
        participants: {
          create: participantCreates,
        },
      },
      include: {
        participants: true,
      },
    });

    log.info(
      `Decision room created: ${room.id} (type: ${validType ?? 'general'}) by user ${user.id}`
    );
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('DecisionRoom table not available (schema drift)');
      return NextResponse.json({ id: 'schema-drift-noop' });
    }
    const msg = error instanceof Error ? error.message : String(error);
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
    if (isSchemaDrift(error)) {
      return NextResponse.json({
        rooms: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to list decision rooms:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
