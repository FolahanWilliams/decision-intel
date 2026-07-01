/**
 * Toxic Combinations API
 *
 * GET  /api/toxic-combinations?orgId=...&status=active — List toxic combos for org
 * PATCH /api/toxic-combinations — Acknowledge or mitigate a toxic combination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ToxicCombinationsAPI');

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'active';
  const analysisId = searchParams.get('analysisId');
  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100));

  try {
    // Scope to what the caller actually owns: combinations from their own
    // analyses + their org's combinations. The previous code trusted a
    // CLIENT-SUPPLIED ?orgId (and returned EVERY org's combinations when it was
    // omitted) — a cross-tenant read of other orgs' analysis summaries +
    // document filenames. The analysisId filter is ANDed with the ownership OR,
    // so it can't be used to read another tenant's analysis either.
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });
    const userOrgId = membership?.orgId ?? null;

    const combinations = await prisma.toxicCombination.findMany({
      where: {
        status,
        ...(analysisId ? { analysisId } : {}),
        OR: [
          { analysis: { document: { userId: user.id, deletedAt: null } } },
          ...(userOrgId ? [{ orgId: userOrgId }] : []),
        ],
      },
      orderBy: { toxicScore: 'desc' },
      take: limit,
      include: {
        analysis: {
          select: {
            id: true,
            overallScore: true,
            summary: true,
            document: {
              select: { id: true, filename: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      combinations,
      count: combinations.length,
    });
  } catch (error) {
    log.error('Failed to fetch toxic combinations:', error);
    return NextResponse.json({ error: 'Failed to fetch toxic combinations' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, mitigationNotes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const validStatuses = ['active', 'acknowledged', 'mitigated'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Ownership gate: the caller may only mutate a combination owned by their
    // org OR derived from one of their own analyses. Without this, any
    // authenticated user could acknowledge/mitigate ANY org's combination by id
    // (a cross-tenant write).
    const existing = await prisma.toxicCombination.findUnique({
      where: { id },
      select: {
        orgId: true,
        analysis: { select: { document: { select: { userId: true } } } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });
    const ownsByOrg = !!existing.orgId && existing.orgId === membership?.orgId;
    const ownsByAnalysis = existing.analysis?.document?.userId === user.id;
    if (!ownsByOrg && !ownsByAnalysis) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.toxicCombination.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(status === 'acknowledged' || status === 'mitigated'
          ? { acknowledgedAt: new Date(), acknowledgedBy: user.id }
          : {}),
        ...(mitigationNotes ? { mitigationNotes } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    log.error('Failed to update toxic combination:', error);
    return NextResponse.json({ error: 'Failed to update toxic combination' }, { status: 500 });
  }
}
