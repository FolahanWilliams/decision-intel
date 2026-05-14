/**
 * GET /api/ripple-alerts — proactive `depends_on` ripple-alert surface.
 *
 * Locked 2026-05-13 (M-7 ship). Closes the Aisha-persona blocker from
 * the 2026-05-12 audit (Section 8 A-2): "No proactive depends_on ripple
 * alert when a structural assumption changes status." Until this ship,
 * cross-decision detection only fired when the user opened the
 * recommendations endpoint. The Cornerstone-magnetic moment — "the
 * moment the assumption flips, see every dependent commit as a red
 * banner" — required manual constellation navigation.
 *
 * Returns a sorted list of RippleAlert objects describing
 * dependent-container-at-risk pairs where the anchor's status has
 * shifted or its outcome has resolved unfavorably. Pure read; nothing
 * persists. Dismissals ride on sessionStorage / localStorage today
 * (no Prisma model for v1 — the alerts are computed on read, dismissed
 * client-side, and re-fire on the next session by design since the
 * underlying anchor state hasn't changed).
 *
 * Architecture rules per CLAUDE.md:
 *   - Returns empty array on auth failure (per the AmbientSignalBanner
 *     pattern — the UI degrades silently when not authed). Returns 401
 *     ONLY when no session at all.
 *   - Scoped to containers the user can see (ownerUserId OR orgId match).
 *   - 60-second cache TTL via Cache-Control header to keep the
 *     dashboard banner cheap.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import {
  detectDependsOnRipples,
  groupRipplesByAnchor,
  type RippleContainerLite,
  type DependsOnEdge,
} from '@/lib/containers/ripple-detection';

const log = createLogger('RippleAlertsRoute');

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    // canonical schema-drift / fail-soft.
    return null;
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrgId(user.id);

    // 1) Fetch every container the user can see — minimum columns
    //    needed for the ripple-detector contract.
    const containers = await prisma.decisionContainer.findMany({
      where: {
        OR: orgId ? [{ ownerUserId: user.id }, { orgId }] : [{ ownerUserId: user.id }],
      },
      select: {
        id: true,
        name: true,
        kind: true,
        status: true,
        decisionFrame: true,
        outcome: {
          select: {
            summary: true,
            realisedDqi: true,
            brierScore: true,
            reportedAt: true,
          },
        },
      },
    });

    // 2) Fetch every depends_on edge in scope. We constrain to edges
    //    where EITHER endpoint is in the user's visible container set
    //    (otherwise we'd surface ripples about containers the user
    //    can't even see).
    const visibleIds = containers.map(c => c.id);
    const edges = await prisma.decisionContainerLink.findMany({
      where: {
        linkType: 'depends_on',
        OR: [{ fromId: { in: visibleIds } }, { toId: { in: visibleIds } }],
      },
      select: { fromId: true, toId: true, note: true, createdAt: true },
    });

    if (containers.length === 0 || edges.length === 0) {
      return NextResponse.json(
        { ripples: [], groups: [], counts: { total: 0, high: 0, medium: 0 } },
        {
          headers: { 'Cache-Control': 'private, max-age=60' },
        }
      );
    }

    // 3) Build the detector input map.
    const containerMap = new Map<string, RippleContainerLite>();
    for (const c of containers) {
      containerMap.set(c.id, {
        id: c.id,
        name: c.name,
        kind: c.kind as RippleContainerLite['kind'],
        status: c.status,
        decisionFrame: c.decisionFrame,
        outcome: c.outcome
          ? {
              summary: c.outcome.summary,
              realisedDqi: c.outcome.realisedDqi,
              brierScore: c.outcome.brierScore,
              reportedAt: c.outcome.reportedAt,
            }
          : null,
      });
    }

    const detectorEdges: DependsOnEdge[] = edges.map(e => ({
      fromId: e.fromId,
      toId: e.toId,
      note: e.note,
      createdAt: e.createdAt,
    }));

    // 4) Detect + group. Dismissal state lives client-side (v1) so we
    //    don't filter here.
    const ripples = detectDependsOnRipples({
      containers: containerMap,
      edges: detectorEdges,
    });
    const groups = groupRipplesByAnchor(ripples);

    const high = ripples.filter(r => r.severity === 'high').length;
    const medium = ripples.filter(r => r.severity === 'medium').length;

    return NextResponse.json(
      {
        ripples,
        groups,
        counts: { total: ripples.length, high, medium },
      },
      {
        headers: { 'Cache-Control': 'private, max-age=60' },
      }
    );
  } catch (error) {
    log.error('GET /api/ripple-alerts failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
