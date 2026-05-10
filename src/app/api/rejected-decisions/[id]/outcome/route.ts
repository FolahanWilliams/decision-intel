/**
 * /api/rejected-decisions/[id]/outcome — Anti-Portfolio outcome
 * attribution endpoint.
 *
 * Locked 2026-05-10. When a user logs the eventual outcome of a
 * decision they passed on (typically 6+ months later), the system
 * records the attribution. This is the Anti-Portfolio's load-bearing
 * pattern — without outcome attribution, the rejection log is
 * decoration; with it, the user can see which passes were correct
 * (true negatives) vs which were missed opportunities (false
 * negatives) and update their screening heuristics accordingly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('RejectedDecisionOutcomeRoute');

const ALLOWED_BANDS: ReadonlySet<string> = new Set([
  'outlier_success',
  'modest_success',
  'wash',
  'modest_failure',
  'outlier_failure',
]);

const ALLOWED_REDECIDE: ReadonlySet<string> = new Set(['yes', 'no', 'still_unclear']);

interface OutcomePayload {
  outcomeBand: 'outlier_success' | 'modest_success' | 'wash' | 'modest_failure' | 'outlier_failure';
  evidence: string;
  evidenceUrl?: string;
  learnedLesson: string;
  wouldRedecideToday: 'yes' | 'no' | 'still_unclear';
  loggedAt: string;
}

async function resolveOwnership(
  rejectedId: string,
  userId: string
): Promise<{ authorized: boolean }> {
  const teamRow = await prisma.teamMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  const orgId = teamRow?.orgId ?? null;

  const row = await prisma.rejectedDecision.findFirst({
    where: {
      id: rejectedId,
      OR: orgId ? [{ userId }, { orgId }] : [{ userId }],
      deletedAt: null,
    },
    select: { id: true },
  });
  return { authorized: row !== null };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { authorized } = await resolveOwnership(id, user.id);
  if (!authorized) {
    return NextResponse.json({ error: 'Rejected decision not found' }, { status: 404 });
  }

  let body: {
    outcomeBand?: string;
    evidence?: string;
    evidenceUrl?: string;
    learnedLesson?: string;
    wouldRedecideToday?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validation.
  if (!body.outcomeBand || !ALLOWED_BANDS.has(body.outcomeBand)) {
    return NextResponse.json(
      {
        error:
          'outcomeBand must be one of: outlier_success | modest_success | wash | modest_failure | outlier_failure',
      },
      { status: 400 }
    );
  }
  const evidence = (body.evidence ?? '').trim();
  if (evidence.length === 0 || evidence.length > 2000) {
    return NextResponse.json({ error: 'evidence must be 1-2000 chars' }, { status: 400 });
  }
  const learnedLesson = (body.learnedLesson ?? '').trim();
  if (learnedLesson.length === 0 || learnedLesson.length > 5000) {
    return NextResponse.json({ error: 'learnedLesson must be 1-5000 chars' }, { status: 400 });
  }
  if (!body.wouldRedecideToday || !ALLOWED_REDECIDE.has(body.wouldRedecideToday)) {
    return NextResponse.json(
      { error: 'wouldRedecideToday must be one of: yes | no | still_unclear' },
      { status: 400 }
    );
  }

  const outcome: OutcomePayload = {
    outcomeBand: body.outcomeBand as OutcomePayload['outcomeBand'],
    evidence,
    evidenceUrl: body.evidenceUrl?.trim() || undefined,
    learnedLesson,
    wouldRedecideToday: body.wouldRedecideToday as OutcomePayload['wouldRedecideToday'],
    loggedAt: new Date().toISOString(),
  };

  try {
    const row = await prisma.rejectedDecision.update({
      where: { id },
      data: {
        eventualOutcome: outcome as unknown as Prisma.InputJsonValue,
        eventualOutcomeAttributedAt: new Date(),
      },
    });
    return NextResponse.json({ rejectedDecision: row });
  } catch (err) {
    log.error('outcome attribution failed:', err);
    return NextResponse.json({ error: 'Failed to record outcome attribution' }, { status: 500 });
  }
}
