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
import { recomputeContainerMetrics } from '@/lib/scoring/container-aggregation';

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
      // SECURITY: AND the search as its OWN nested OR — NEVER reassign
      // where.OR, which silently drops the tenancy scope on line 105
      // ([{ orgId }, { ownerUserId }]) and returns matching containers across
      // ALL orgs/users (cross-tenant leak). Top-level where fields are AND-ed,
      // so this resolves to: (tenancy OR) AND status AND (search OR).
      where.AND = [
        {
          OR: [
            { name: { contains: searchParam, mode: 'insensitive' } },
            { decisionFrame: { contains: searchParam, mode: 'insensitive' } },
            { targetCompany: { contains: searchParam, mode: 'insensitive' } },
          ],
        },
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
        // 2026-05-10 — list endpoint returns null for priors +
        // culturalPairingRisk to keep payload size bounded; the detail
        // endpoint returns the full JSON. Consumers reading from list
        // know to fetch detail when they need the captured values.
        priors: null,
        culturalPairingRisk: null,
        premortemDefence: null,
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
  /** Adaptation #1 — retroactive audit mode (locked 2026-05-21). When
   *  true, the container represents a historical closed decision; the
   *  caller MUST also supply retroactiveMetadata + outcomeOnCreate. */
  isRetroactive?: boolean;
  /** Per-container metadata for retroactive containers. */
  retroactiveMetadata?: {
    decidedAt: string;
    outcomeKnownAt: string;
    sourceProvenance?: string;
    bulkUploadBatchId?: string;
    pairingConfidence?: number;
    pairingMethod?: 'manual' | 'auto_high' | 'auto_medium' | 'auto_low';
  };
  /** Outcome to record at creation time — required when isRetroactive
   *  is true. The pipeline runs and immediately triggers Bias Genome /
   *  Decision DNA / Knowledge Graph updates (no 90-day wait). */
  outcomeOnCreate?: {
    summary: string;
    metrics?: Record<string, unknown>;
    realisedDqi?: number;
  };
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
    // Retroactive containers land on the FINAL committee-gate stage by
    // default — they represent decisions that are already past every
    // pre-committee gate (sourcing → diligence → IC review). Forward
    // containers use the mode's default starting stage.
    const isRetro = body.isRetroactive === true;
    const requestedStage =
      body.stageId && mode.stages.find(s => s.id === body.stageId) ? body.stageId : null;
    const stageId =
      requestedStage ?? (isRetro ? mode.stages[mode.stages.length - 1].id : mode.defaultStageId);

    // Retroactive integrity gate — both metadata + outcomeOnCreate are
    // mandatory when isRetroactive is true. The pipeline cannot honour
    // "no 90-day wait" without (a) the historical decidedAt to stamp,
    // (b) the outcomeKnownAt for outcome-detection lag analytics, and
    // (c) the outcome summary to create the DecisionContainerOutcome
    // row in the same transaction.
    if (isRetro) {
      const meta = body.retroactiveMetadata;
      if (!meta || typeof meta !== 'object') {
        return NextResponse.json(
          { error: 'retroactiveMetadata required when isRetroactive is true' },
          { status: 400 }
        );
      }
      if (!meta.decidedAt || !meta.outcomeKnownAt) {
        return NextResponse.json(
          { error: 'retroactiveMetadata.decidedAt + outcomeKnownAt required' },
          { status: 400 }
        );
      }
      if (
        !body.outcomeOnCreate ||
        typeof body.outcomeOnCreate !== 'object' ||
        typeof body.outcomeOnCreate.summary !== 'string' ||
        body.outcomeOnCreate.summary.trim().length < 10
      ) {
        return NextResponse.json(
          { error: 'outcomeOnCreate.summary required (min 10 chars) when isRetroactive is true' },
          { status: 400 }
        );
      }
    }

    const orgId = await resolveOrgId(user.id);

    const historicalDecidedAt =
      isRetro && body.retroactiveMetadata?.decidedAt
        ? new Date(body.retroactiveMetadata.decidedAt)
        : null;

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
        // Retroactive mode (locked 2026-05-21). On forward containers
        // these default to false / null and behave as before — the
        // additive migration is schema-drift-tolerant.
        isRetroactive: isRetro,
        retroactiveMetadata: isRetro
          ? (body.retroactiveMetadata as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        // Stamp decidedAt from the historical record so the container
        // represents the moment the decision was made, not the moment
        // the user uploaded it. Forward containers leave decidedAt null
        // until the outcome route stamps it.
        decidedAt: historicalDecidedAt,
      },
    });

    // Retroactive containers ship with the outcome already known — the
    // founder's "no 90-day wait" requirement. Stamp the outcome row in
    // the same flow, validate metrics against the SSOT outcomeShape,
    // then recompute container metrics so the calibration loop fires
    // immediately rather than at some future outcome-logging moment.
    let outcomeId: string | null = null;
    if (isRetro && body.outcomeOnCreate) {
      const validKeys = new Set(mode.outcomeShape.fields.map(f => f.key));
      const metricsBlob: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body.outcomeOnCreate.metrics ?? {})) {
        if (!validKeys.has(key)) continue;
        metricsBlob[key] = value;
      }

      const outcomeRow = await prisma.decisionContainerOutcome.create({
        data: {
          containerId: created.id,
          summary: body.outcomeOnCreate.summary.trim(),
          metrics: metricsBlob as Prisma.InputJsonValue,
          realisedDqi: body.outcomeOnCreate.realisedDqi ?? null,
          reportedByUserId: user.id,
        },
      });
      outcomeId = outcomeRow.id;

      // Container-level aggregation refresh. Per-analysis Brier scoring
      // + Bias Genome / Decision DNA / Knowledge Graph propagation fire
      // when documents land on the container and complete the audit
      // pipeline — the recalibration trigger on /api/analyze/stream
      // reads the outcome row that was just created here, so when the
      // memo doc is attached + audited (next step in the retroactive
      // flow), recalibration sharpens against KNOWN reality, not a
      // 90-day-old assumption. Non-fatal — drift-tolerant.
      await recomputeContainerMetrics(created.id).catch(err =>
        log.warn(
          `Retroactive recompute failed (non-fatal) for container ${created.id}: ${String(err)}`
        )
      );
    }

    await logAudit({
      action: isRetro ? 'CONTAINER_RETROACTIVE_CREATED' : 'CONTAINER_CREATED',
      resource: 'decision_container',
      resourceId: created.id,
      details: {
        kind: created.kind,
        stageId: created.stageId,
        name: created.name,
        ...(isRetro
          ? {
              isRetroactive: true,
              decidedAt: historicalDecidedAt?.toISOString() ?? null,
              outcomeKnownAt: body.retroactiveMetadata?.outcomeKnownAt ?? null,
              sourceProvenance: body.retroactiveMetadata?.sourceProvenance ?? null,
              bulkUploadBatchId: body.retroactiveMetadata?.bulkUploadBatchId ?? null,
              pairingMethod: body.retroactiveMetadata?.pairingMethod ?? null,
              pairingConfidence: body.retroactiveMetadata?.pairingConfidence ?? null,
              outcomeId,
            }
          : {}),
      },
    }).catch(err => log.warn('Audit log for container create failed:', err));

    return NextResponse.json({
      id: created.id,
      kind: created.kind,
      name: created.name,
      stageId: created.stageId,
      isRetroactive: created.isRetroactive,
      decidedAt: created.decidedAt?.toISOString() ?? null,
      outcomeId,
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
