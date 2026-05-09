/**
 * /api/containers/constellation — read-side endpoint for the Decision
 * Pipeline Constellation viz. Returns NODES (containers visible to the
 * caller) + LINKS (DecisionContainerLink edges between them).
 *
 * Design constraints (locked 2026-05-09 evening, master KB synthesis):
 *   - Cognitive lineage, not data lineage. The viz reads nodes for
 *     risk-state cues (criticalPatternCount / committeeDate / DQI /
 *     recurringBiasCount) so the renderer can surface only the ones
 *     that need attention and fade the rest.
 *   - One round-trip. The kanban list endpoint already pulls the same
 *     container shape with cross-ref aggregation; this route reuses
 *     that pattern + adds the links layer + a dependency-fan-out chip
 *     count so the viz never needs N+1 link lookups.
 *   - Permission-aware. Only containers the user owns OR shares an org
 *     with surface; their links are clipped to that visible set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { CONTAINER_LINK_TYPES, type ContainerLinkType } from '@/lib/data/container-link-types';
import type { DecisionContainerKind } from '@/lib/data/decision-container-modes';

const log = createLogger('ConstellationRoute');

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

interface CrossRefAggregateRow {
  containerId: string;
  conflictCount: number;
  highSeverityCount: number;
}

async function fetchLatestCrossRefByContainer(
  containerIds: string[]
): Promise<Map<string, CrossRefAggregateRow>> {
  if (containerIds.length === 0) return new Map();
  try {
    const rows = await prisma.$queryRaw<CrossRefAggregateRow[]>`
      SELECT DISTINCT ON ("containerId")
        "containerId", "conflictCount", "highSeverityCount"
      FROM "DecisionContainerCrossReference"
      WHERE "containerId" = ANY(${containerIds}::text[])
      ORDER BY "containerId", "runAt" DESC
    `;
    const map = new Map<string, CrossRefAggregateRow>();
    for (const row of rows) map.set(row.containerId, row);
    return map;
  } catch (err) {
    // @schema-drift-tolerant — older envs without DecisionContainerCrossReference
    log.warn(`Cross-ref aggregation failed (non-fatal): ${String(err)}`);
    return new Map();
  }
}

export interface ConstellationNode {
  id: string;
  kind: DecisionContainerKind;
  name: string;
  stageId: string;
  status: string;
  decisionFrame: string | null;
  targetCompany: string | null;
  sector: string | null;
  ticketSize: number | null;
  currency: string;
  committeeDate: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Risk-state signals (the viz colors / opacity reads these)
  compositeDqi: number | null;
  compositeGrade: string | null;
  documentCount: number;
  analyzedDocCount: number;
  recurringBiasCount: number;
  crossRefConflictCount: number;
  crossRefHighSeverityCount: number;
}

export interface ConstellationLink {
  id: string;
  fromId: string;
  toId: string;
  linkType: ContainerLinkType;
  note: string | null;
  createdAt: string;
}

export interface ConstellationResponse {
  nodes: ConstellationNode[];
  links: ConstellationLink[];
  /** Counts by linkType for the legend + filter chips. */
  linkTypeCounts: Record<ContainerLinkType, number>;
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

    // Pull all visible containers (active + archived). The viz filters
    // client-side; archived rows surface in "show full history" mode
    // for longitudinal storytelling.
    const containers = await prisma.decisionContainer.findMany({
      where: {
        OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }],
      },
      orderBy: { createdAt: 'asc' },
      take: 500, // sane cap; the viz starts to blur past ~200 nodes
    });

    const containerIds = containers.map(c => c.id);
    const crossRefMap = await fetchLatestCrossRefByContainer(containerIds);

    const nodes: ConstellationNode[] = containers.map(c => {
      const crossRef = crossRefMap.get(c.id);
      return {
        id: c.id,
        kind: c.kind as DecisionContainerKind,
        name: c.name,
        stageId: c.stageId,
        status: c.status,
        decisionFrame: c.decisionFrame,
        targetCompany: c.targetCompany,
        sector: c.sector,
        ticketSize: c.ticketSize != null ? Number(c.ticketSize) : null,
        currency: c.currency,
        committeeDate: c.committeeDate?.toISOString() ?? null,
        decidedAt: c.decidedAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        compositeDqi: c.compositeDqi,
        compositeGrade: c.compositeGrade,
        documentCount: c.documentCount,
        analyzedDocCount: c.analyzedDocCount,
        recurringBiasCount: c.recurringBiasCount,
        crossRefConflictCount: crossRef?.conflictCount ?? 0,
        crossRefHighSeverityCount: crossRef?.highSeverityCount ?? 0,
      };
    });

    // Pull links where BOTH endpoints are in the visible set. A link
    // pointing to a container the user can't see is silently clipped —
    // structurally protective when an analyst leaves the org.
    let rawLinks: Array<{
      id: string;
      fromId: string;
      toId: string;
      linkType: string;
      note: string | null;
      createdAt: Date;
    }> = [];
    try {
      rawLinks = await prisma.decisionContainerLink.findMany({
        where: {
          AND: [{ fromId: { in: containerIds } }, { toId: { in: containerIds } }],
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (err) {
      // @schema-drift-tolerant — pre-3.5 envs return null here
      log.warn(`Link lookup failed (non-fatal): ${String(err)}`);
    }

    const linkTypeCounts: Record<ContainerLinkType, number> = {
      precedes: 0,
      spawned_from: 0,
      depends_on: 0,
      parent_of: 0,
    };

    const links: ConstellationLink[] = rawLinks
      .filter((l): l is typeof l & { linkType: ContainerLinkType } =>
        (CONTAINER_LINK_TYPES as readonly string[]).includes(l.linkType)
      )
      .map(l => {
        linkTypeCounts[l.linkType] += 1;
        return {
          id: l.id,
          fromId: l.fromId,
          toId: l.toId,
          linkType: l.linkType,
          note: l.note,
          createdAt: l.createdAt.toISOString(),
        };
      });

    const body: ConstellationResponse = { nodes, links, linkTypeCounts };
    return NextResponse.json(body);
  } catch (error) {
    log.error('GET /api/containers/constellation failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
