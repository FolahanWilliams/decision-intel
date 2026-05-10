/**
 * GET /api/ambient-signals  — list pending signals for caller
 *
 * Surfaces the signals the dashboard banner reads. Default returns
 * status='pending' signals for the authenticated user (own + org-scoped),
 * sorted detected-recent-first.
 *
 * Query params:
 *   - status (optional): pending | confirmed | dismissed | expired | auto_created.
 *     Defaults to 'pending'.
 *   - limit (optional): 1-50. Defaults to 10.
 *
 * Locked 2026-05-10 per Tier 2.2.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AmbientSignalsList');

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status') ?? 'pending';
    const allowed = ['pending', 'confirmed', 'dismissed', 'expired', 'auto_created'];
    const status = allowed.includes(statusParam) ? statusParam : 'pending';
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') ?? 10)));

    const orgId = await resolveOrgId(user.id);

    try {
      const signals = await prisma.ambientThesisSignal.findMany({
        where: {
          status,
          OR: orgId ? [{ userId: user.id }, { orgId }] : [{ userId: user.id }],
        },
        orderBy: { detectedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          source: true,
          sourceRef: true,
          sourceParentRef: true,
          detectedAt: true,
          confidence: true,
          extractedFields: true,
          excerpt: true,
          status: true,
          containerId: true,
          expiresAt: true,
        },
      });
      return NextResponse.json({ signals });
    } catch (err) {
      // @schema-drift-tolerant — pre-T2.2 env may lack the table
      log.warn('AmbientThesisSignal lookup failed (schema drift?)', { err: String(err) });
      return NextResponse.json({ signals: [] });
    }
  } catch (error) {
    log.error('GET /api/ambient-signals failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
