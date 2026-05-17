/**
 * /api/containers/[id]/proxy-resolution — resolve a 90-day operational
 * proxy (Defensibility Vector 1, locked 2026-05-17).
 *
 * The sponsor returns at horizon and records what actually happened
 * (true | false | partial). The route stamps resolvedAt + resolution
 * + a per-proxy Brier score onto the existing
 * `DecisionContainer.priors.microPredictions[]` entry — no new column,
 * no migration. The Brier shape is the canonical PMI per-signal one
 * (`(confidence − observed)²`). Pure transform lives in
 * operational-proxy-gate.ts; this is the thin I/O wrapper.
 *
 * Auth: Supabase user + owner-OR-same-org on the container (mirrors
 * the priors route's ownership rule verbatim).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import {
  parsePriorsForProxies,
  applyProxyResolution,
  type ProxyResolution,
} from '@/lib/containers/operational-proxy-gate';

const log = createLogger('ProxyResolutionRoute');

const RESOLUTIONS: ReadonlySet<string> = new Set(['true', 'false', 'partial']);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await prisma.teamMember
      .findFirst({ where: { userId: user.id }, select: { orgId: true } })
      .then(m => m?.orgId ?? null)
      // canonical orgId-resolve fail-soft — mirrors the outcome route verbatim
      .catch(() => null);

    const container = await prisma.decisionContainer.findFirst({
      where: { id, OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }] },
      select: { id: true, priors: true },
    });
    if (!container) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json().catch(() => null)) as {
      index?: unknown;
      resolution?: unknown;
    } | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const index = typeof body.index === 'number' ? body.index : NaN;
    const resolution = typeof body.resolution === 'string' ? body.resolution : '';
    if (!RESOLUTIONS.has(resolution)) {
      return NextResponse.json(
        { error: 'resolution must be one of: true | false | partial' },
        { status: 400 }
      );
    }

    const parsed = parsePriorsForProxies(container.priors);
    if (!parsed) {
      return NextResponse.json(
        { error: 'No operational proxies on record for this decision' },
        { status: 400 }
      );
    }

    const nextProxies = applyProxyResolution(
      parsed,
      index,
      resolution as ProxyResolution,
      Date.now()
    );
    if (!nextProxies) {
      return NextResponse.json({ error: 'Proxy not found, or already resolved' }, { status: 400 });
    }

    // Merge back into the FULL priors blob — preserve the conviction
    // snapshot + kill criteria + capture provenance; only the
    // microPredictions array changes.
    const existing = (container.priors as Record<string, unknown> | null) ?? {};
    const merged = { ...existing, microPredictions: nextProxies };

    await prisma.decisionContainer.update({
      where: { id },
      data: { priors: merged as unknown as Prisma.InputJsonValue },
    });

    await logAudit({
      action: 'OPERATIONAL_PROXY_RESOLVED',
      resource: 'decision_container',
      resourceId: id,
      details: {
        index,
        resolution,
        brierScore: nextProxies[index].brierScore,
      },
    }).catch(err => log.warn('Proxy-resolution audit log failed:', err));

    return NextResponse.json({ ok: true, microPredictions: nextProxies });
  } catch (error) {
    log.error('POST /api/containers/[id]/proxy-resolution failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
