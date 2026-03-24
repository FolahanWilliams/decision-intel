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
  const orgId = searchParams.get('orgId');
  const status = searchParams.get('status') || 'active';
  const analysisId = searchParams.get('analysisId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const combinations = await prisma.toxicCombination.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
        ...(analysisId ? { analysisId } : {}),
        status,
      },
      orderBy: { toxicScore: 'desc' },
      take: Math.min(limit, 100),
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
    return NextResponse.json(
      { error: 'Failed to fetch toxic combinations' },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: 'Failed to update toxic combination' },
      { status: 500 }
    );
  }
}
