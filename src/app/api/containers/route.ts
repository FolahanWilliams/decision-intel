/**
 * /api/containers — list + create unified DecisionContainer rows.
 * Phase 2 of the container refactor; replaces /api/deals/* +
 * /api/decision-packages/* with one mode-aware route.
 *
 * Filters: kind | stageId | status | search | sector | ticketSizeMin |
 * ticketSizeMax. All optional. Defaults to status = 'active'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import {
  CONTAINER_KINDS,
  getContainerMode,
  type DecisionContainerKind,
} from '@/lib/data/decision-container-modes';
import type { ContainerSummary } from '@/types/containers';
import { logAudit } from '@/lib/audit';

const log = createLogger('ContainersRoute');

function isValidKind(value: string | null): value is DecisionContainerKind {
  return value != null && CONTAINER_KINDS.includes(value as DecisionContainerKind);
}

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

/**
 * Pulls the LATEST cross-reference run per container in one query —
 * the same DISTINCT ON pattern the legacy deal route used. Avoids N+1
 * fetches across the kanban.
 */
async function fetchLatestCrossRefByContainer(
  containerIds: string[]
): Promise<Map<string, CrossRefAggregateRow>> {
  if (containerIds.length === 0) return new Map();
  try {
    const rows = await prisma.$queryRaw<CrossRefAggregateRow[]>`
      SELECT DISTINCT ON ("containerId")
        "containerId",
        "conflictCount",
        "highSeverityCount"
      FROM "DecisionContainerCrossReference"
      WHERE "containerId" = ANY(${containerIds}::text[])
      ORDER BY "containerId", "runAt" DESC
    `;
    const map = new Map<string, CrossRefAggregateRow>();
    for (const row of rows) map.set(row.containerId, row);
    return map;
  } catch (err) {
    log.warn(`Cross-reference aggregation lookup failed (non-fatal): ${String(err)}`);
    return new Map();
  }
}

// ─── GET — list ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrgId(user.id);

    const url = new URL(request.url);
    const kindParam = url.searchParams.get('kind');
    const stageIdParam = url.searchParams.get('stageId');
    const statusParam = url.searchParams.get('status') ?? 'active';
    const searchParam = url.searchParams.get('search');
    const sectorParam = url.searchParams.get('sector');
    const ticketSizeMin = url.searchParams.get('ticketSizeMin');
    const ticketSizeMax = url.searchParams.get('ticketSizeMax');
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50)
    );

    const where: Prisma.DecisionContainerWhereInput = {
      OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }],
      status: statusParam === 'archived' ? 'archived' : 'active',
    };
    if (isValidKind(kindParam)) where.kind = kindParam;
    if (stageIdParam) where.stageId = stageIdParam;
    if (sectorParam) where.sector = sectorParam;
    if (searchParam && searchParam.trim().length > 0) {
      where.OR = [
        { name: { contains: searchParam, mode: 'insensitive' } },
        { decisionFrame: { contains: searchParam, mode: 'insensitive' } },
        { targetCompany: { contains: searchParam, mode: 'insensitive' } },
      ];
    }
    if (ticketSizeMin || ticketSizeMax) {
      where.ticketSize = {
        ...(ticketSizeMin ? { gte: parseFloat(ticketSizeMin) } : {}),
        ...(ticketSizeMax ? { lte: parseFloat(ticketSizeMax) } : {}),
      };
    }

    const [rows, total] = await Promise.all([
      prisma.decisionContainer.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.decisionContainer.count({ where }),
    ]);

    const crossRefMap = await fetchLatestCrossRefByContainer(rows.map(r => r.id));

    const data: ContainerSummary[] = rows.map(r => {
      const crossRef = crossRefMap.get(r.id);
      return {
        id: r.id,
        orgId: r.orgId,
        ownerUserId: r.ownerUserId,
        kind: r.kind as DecisionContainerKind,
        name: r.name,
        decisionFrame: r.decisionFrame,
        stageId: r.stageId,
        status: r.status,
        decidedAt: r.decidedAt?.toISOString() ?? null,
        committeeDate: r.committeeDate?.toISOString() ?? null,
        fundName: r.fundName,
        vintage: r.vintage,
        dealType: r.dealType,
        ticketSize: r.ticketSize != null ? Number(r.ticketSize) : null,
        currency: r.currency,
        targetCompany: r.targetCompany,
        sector: r.sector,
        exitDate: r.exitDate?.toISOString() ?? null,
        compositeDqi: r.compositeDqi,
        compositeGrade: r.compositeGrade,
        documentCount: r.documentCount,
        analyzedDocCount: r.analyzedDocCount,
        recurringBiasCount: r.recurringBiasCount,
        conflictCount: r.conflictCount,
        highSeverityConflictCount: r.highSeverityConflictCount,
        crossRefConflictCount: crossRef?.conflictCount ?? 0,
        crossRefHighSeverityCount: crossRef?.highSeverityCount ?? 0,
        updatedAt: r.updatedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    log.error('GET /api/containers failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST — create ──────────────────────────────────────────────────────────

interface CreateBody {
  kind: DecisionContainerKind;
  name: string;
  decisionFrame?: string | null;
  stageId?: string;
  fundName?: string | null;
  vintage?: number | null;
  dealType?: string | null;
  ticketSize?: number | null;
  currency?: string;
  targetCompany?: string | null;
  sector?: string | null;
  committeeDate?: string | null;
  visibility?: 'private' | 'team' | 'specific';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as CreateBody | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!isValidKind(body.kind)) {
      return NextResponse.json(
        { error: `Invalid kind. Must be one of: ${CONTAINER_KINDS.join(', ')}` },
        { status: 400 }
      );
    }
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Container name required' }, { status: 400 });
    }

    const mode = getContainerMode(body.kind);
    const stageId =
      body.stageId && mode.stages.find(s => s.id === body.stageId)
        ? body.stageId
        : mode.defaultStageId;

    const orgId = await resolveOrgId(user.id);

    const created = await prisma.decisionContainer.create({
      data: {
        orgId,
        ownerUserId: user.id,
        kind: body.kind,
        name: body.name.trim(),
        decisionFrame: body.decisionFrame?.trim() || null,
        stageId,
        status: 'active',
        visibility: body.visibility ?? 'team',
        committeeDate: body.committeeDate ? new Date(body.committeeDate) : null,
        fundName: body.fundName?.trim() || null,
        vintage: body.vintage ?? null,
        dealType: body.dealType?.trim() || null,
        ticketSize: body.ticketSize != null ? new Prisma.Decimal(body.ticketSize) : null,
        currency: body.currency ?? 'USD',
        targetCompany: body.targetCompany?.trim() || null,
        sector: body.sector?.trim() || null,
      },
    });

    await logAudit({
      action: 'CONTAINER_CREATED',
      resource: 'decision_container',
      resourceId: created.id,
      details: { kind: created.kind, stageId: created.stageId, name: created.name },
    }).catch(err => log.warn('Audit log for container create failed:', err));

    return NextResponse.json({
      id: created.id,
      kind: created.kind,
      name: created.name,
      stageId: created.stageId,
    });
  } catch (error) {
    log.error('POST /api/containers failed:', error);
    // Surface the actual error message in development so the founder can
    // diagnose in the browser console without tailing dev-server logs.
    // In production we collapse to the generic "Internal error" so we
    // don't leak Prisma error shapes / SQL fragments to end users.
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal error'
        : `Internal error: ${error instanceof Error ? error.message : String(error)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
