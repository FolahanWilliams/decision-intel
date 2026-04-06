/**
 * PATCH /api/red-team/challenge/[id] — M7.2
 *
 * Capture the user's "was this challenge useful?" rating. Feeds the
 * feedback loop so we can learn which types of Red Team challenges
 * actually move decisions for each org.
 *
 * DELETE available for users to remove challenges they regret generating.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('RedTeamChallengeDetailAPI');

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      usefulRating?: number;
      notes?: string;
    };

    // Ownership check — findFirst with userId predicate (defense-in-depth)
    const existing = await prisma.redTeamChallenge.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Validate rating: -1 (not useful), 0 (neutral), 1 (useful)
    if (body.usefulRating !== undefined) {
      if (typeof body.usefulRating !== 'number' || ![-1, 0, 1].includes(body.usefulRating)) {
        return NextResponse.json({ error: 'usefulRating must be -1, 0, or 1' }, { status: 400 });
      }
    }

    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : undefined;

    const updated = await prisma.redTeamChallenge.update({
      where: { id },
      data: {
        ...(body.usefulRating !== undefined && { usefulRating: body.usefulRating }),
        ...(notes !== undefined && { notes }),
      },
    });

    log.info(`Red Team challenge ${id} rated: ${body.usefulRating} by user ${user.id}`);

    return NextResponse.json({ challenge: updated });
  } catch (err) {
    log.error('PATCH /api/red-team/challenge/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.redTeamChallenge.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.redTeamChallenge.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    log.error('DELETE /api/red-team/challenge/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
