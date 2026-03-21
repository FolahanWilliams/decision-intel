/**
 * Speaker Profiles API
 *
 * GET /api/meetings/speakers?orgId=xxx — Team dynamics snapshot
 * GET /api/meetings/speakers?speaker=name&orgId=xxx — Individual speaker profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { aggregateSpeakerProfile, getTeamDynamicsSnapshot } from '@/lib/meetings/speaker-profiles';

const log = createLogger('SpeakersAPI');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const speakerName = searchParams.get('speaker');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId query parameter is required' }, { status: 400 });
    }

    // Verify user belongs to this org
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id, orgId },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json(
          { error: 'Team membership not available — schema migration required.' },
          { status: 503 }
        );
      }
      throw err;
    }

    if (speakerName) {
      const profile = await aggregateSpeakerProfile(speakerName, orgId);
      return NextResponse.json({ profile });
    }

    const snapshot = await getTeamDynamicsSnapshot(orgId);
    return NextResponse.json({ snapshot });
  } catch (error) {
    log.error('Speakers API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch speaker data' }, { status: 500 });
  }
}
