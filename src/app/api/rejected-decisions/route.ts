/**
 * /api/rejected-decisions — Anti-Portfolio CRUD endpoint.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 4 (Bessemer
 * Anti-Portfolio model). Tracks decisions the user passed on with
 * explicit rationale + eventual outcome attribution. Surfaces
 * false-negative patterns (decisions we should have made) the same
 * way the audit pipeline surfaces false-positive patterns (decisions
 * we made but shouldn't have).
 *
 * Bessemer's discipline: institutionalize vulnerability. The
 * Anti-Portfolio neutralizes the ego-defense mechanisms that block
 * organizational learning from passes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('RejectedDecisionsRoute');

const ALLOWED_KINDS: ReadonlySet<string> = new Set(['investment', 'acquisition', 'strategic']);

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = await resolveOrgId(user.id);
  const url = new URL(req.url);
  const kindFilter = url.searchParams.get('kind');
  const includeOutcomeAttributed = url.searchParams.get('includeOutcomeAttributed') !== 'false';

  const where: Record<string, unknown> = {
    OR: orgId ? [{ userId: user.id }, { orgId }] : [{ userId: user.id }],
    deletedAt: null,
  };
  if (kindFilter && ALLOWED_KINDS.has(kindFilter)) {
    where.kind = kindFilter;
  }
  if (!includeOutcomeAttributed) {
    where.eventualOutcome = null;
  }

  try {
    const rows = await prisma.rejectedDecision.findMany({
      where,
      orderBy: { rejectedAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ rejectedDecisions: rows });
  } catch (err) {
    log.error('GET rejected-decisions failed:', err);
    return NextResponse.json({ error: 'Failed to fetch rejected decisions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    name?: string;
    decisionFrame?: string;
    kind?: string;
    sector?: string;
    rejectionReason?: string;
    passedToCompetitor?: boolean;
    competitorName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validation
  const name = (body.name ?? '').trim();
  if (name.length === 0 || name.length > 200) {
    return NextResponse.json({ error: 'name must be 1-200 chars' }, { status: 400 });
  }
  if (!body.kind || !ALLOWED_KINDS.has(body.kind)) {
    return NextResponse.json(
      { error: 'kind must be one of: investment | acquisition | strategic' },
      { status: 400 }
    );
  }
  const rejectionReason = (body.rejectionReason ?? '').trim();
  if (rejectionReason.length === 0 || rejectionReason.length > 5000) {
    return NextResponse.json({ error: 'rejectionReason must be 1-5000 chars' }, { status: 400 });
  }

  const orgId = await resolveOrgId(user.id);

  try {
    const row = await prisma.rejectedDecision.create({
      data: {
        userId: user.id,
        orgId,
        name,
        decisionFrame: body.decisionFrame?.trim() || null,
        kind: body.kind,
        sector: body.sector?.trim() || null,
        rejectionReason,
        passedToCompetitor: body.passedToCompetitor === true,
        competitorName: body.competitorName?.trim() || null,
      },
    });
    return NextResponse.json({ rejectedDecision: row }, { status: 201 });
  } catch (err) {
    log.error('POST rejected-decisions failed:', err);
    return NextResponse.json({ error: 'Failed to record rejected decision' }, { status: 500 });
  }
}
