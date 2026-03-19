/**
 * GET /api/meetings/[id] — Get meeting details with transcript and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('MeetingDetail');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let meeting;
    try {
      meeting = await prisma.meeting.findFirst({
        where: { id, userId: user.id },
        include: {
          transcript: true,
          humanDecision: {
            include: {
              cognitiveAudit: true,
              nudges: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift in meeting detail');
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw dbError;
    }

    if (!meeting) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    log.error('Meeting detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}
