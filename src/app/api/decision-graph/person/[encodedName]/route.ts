/**
 * GET /api/decision-graph/person/[encodedName]?orgId=... — M9.2
 *
 * Returns the aggregated profile for a single person node in the decision
 * graph. Drives /dashboard/decision-graph/person/[encodedName].
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPersonProfile } from '@/lib/graph/graph-builder';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PersonProfileAPI');

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ encodedName: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { encodedName } = await params;
    if (!encodedName) {
      return NextResponse.json({ error: 'person name is required' }, { status: 400 });
    }

    let canonicalName: string;
    try {
      canonicalName = decodeURIComponent(encodedName);
    } catch {
      return NextResponse.json({ error: 'Invalid person name encoding' }, { status: 400 });
    }

    // Bounded length to prevent abuse
    if (canonicalName.length > 200) {
      return NextResponse.json({ error: 'Person name too long' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Ownership check — user must belong to the requested org
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id, orgId },
      select: { orgId: true },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const profile = await getPersonProfile(canonicalName, orgId);
    if (!profile) {
      return NextResponse.json({ error: 'Person not found in decision graph' }, { status: 404 });
    }

    return NextResponse.json(
      { profile },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (err) {
    log.error('GET /api/decision-graph/person/[encodedName] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
