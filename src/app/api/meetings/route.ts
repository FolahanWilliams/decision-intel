/**
 * GET /api/meetings — List meetings for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('MeetingsAPI');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    const where = { userId: user.id };

    let meetings: unknown[] = [];
    let total = 0;

    try {
      [meetings, total] = await Promise.all([
        prisma.meeting.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            transcript: {
              select: {
                id: true,
                speakers: true,
                language: true,
                confidence: true,
              },
            },
            humanDecision: {
              select: {
                id: true,
                status: true,
                cognitiveAudit: {
                  select: {
                    decisionQualityScore: true,
                    noiseScore: true,
                    biasFindings: true,
                    summary: true,
                  },
                },
              },
            },
          },
        }),
        prisma.meeting.count({ where }),
      ]);
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift in meetings list: table not migrated yet');
        return NextResponse.json({ meetings: [], total: 0, page, totalPages: 0 });
      }
      throw dbError;
    }

    return NextResponse.json({
      meetings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error('Meetings list error:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}
