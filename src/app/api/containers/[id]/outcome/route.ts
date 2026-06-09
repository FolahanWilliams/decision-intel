/**
 * /api/containers/[id]/outcome — log an outcome on a DecisionContainer.
 *
 * The metric blob shape is mode-aware: investment → IRR/MOIC; acquisition
 * → synergy realisation %; strategic → forecast hit-rate. Validated
 * server-side against the SSOT outcomeShape.fields for the parent
 * container's kind. Recomputes Brier-scored DQI realisation against
 * the average of latest member-doc analyses on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { getContainerMode, type DecisionContainerKind } from '@/lib/data/decision-container-modes';
import { recomputeContainerMetrics } from '@/lib/scoring/container-aggregation';
import { checkPremortemDefenceGate } from '@/lib/containers/premortem-defence';
import { checkOperationalProxyGate } from '@/lib/containers/operational-proxy-gate';

const log = createLogger('ContainerOutcomeRoute');

interface OutcomeBody {
  summary: string;
  metrics: Record<string, unknown>;
}

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
      .catch(() => null);

    const container = await prisma.decisionContainer.findFirst({
      where: { id, OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }] },
      select: {
        id: true,
        kind: true,
        compositeDqi: true,
        analyzedDocCount: true,
        premortemDefence: true,
        priors: true,
      },
    });
    if (!container) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // V2 — mandatory pre-mortem dissent gate. Acquisition-mode decisions
    // with analyzed docs cannot log an outcome until the sponsor has
    // recorded a written defence to the Deal-Fever pre-mortem questions.
    // Shared pure predicate — identical to the client guard on the
    // detail page. Non-acquisition / empty containers always pass.
    const gate = checkPremortemDefenceGate({
      kind: container.kind,
      analyzedDocCount: container.analyzedDocCount,
      premortemDefence: container.premortemDefence,
    });
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, code: gate.code }, { status: 400 });
    }

    // Vector 1 — forced-at-vote 90-day operational-proxy gate (locked
    // 2026-05-17). ALL kinds with an analyzed decision must carry ≥1
    // falsifiable ≤90-day proxy (captured via the priors mechanism)
    // before an outcome can be logged. Shared pure predicate —
    // identical to the detail-page client guard. Empty containers pass.
    const proxyGate = checkOperationalProxyGate({
      analyzedDocCount: container.analyzedDocCount,
      priors: container.priors,
    });
    if (!proxyGate.allowed) {
      return NextResponse.json({ error: proxyGate.reason, code: proxyGate.code }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as OutcomeBody | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (typeof body.summary !== 'string' || body.summary.trim().length < 10) {
      return NextResponse.json(
        { error: 'Outcome summary required (min 10 chars)' },
        { status: 400 }
      );
    }

    // Validate metrics blob against the mode's outcomeShape.fields. We
    // accept any subset of fields — partial outcomes are useful (e.g.
    // an early "synergy_realisation_pct" stamp before the deal exits).
    const mode = getContainerMode(container.kind as DecisionContainerKind);
    const validKeys = new Set(mode.outcomeShape.fields.map(f => f.key));
    const metrics: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body.metrics ?? {})) {
      if (!validKeys.has(key)) continue;
      metrics[key] = value;
    }

    const created = await prisma.decisionContainerOutcome.upsert({
      where: { containerId: id },
      create: {
        containerId: id,
        summary: body.summary.trim(),
        metrics: metrics as Prisma.InputJsonValue,
        reportedByUserId: user.id,
      },
      update: {
        summary: body.summary.trim(),
        metrics: metrics as Prisma.InputJsonValue,
        reportedAt: new Date(),
        reportedByUserId: user.id,
      },
    });

    // Stamp decidedAt on first outcome land. Ownership predicate folded into
    // the WHERE (2026-06-06 check-then-act lock) so the stamp is tenant-scoped.
    await prisma.decisionContainer
      .updateMany({
        where: { id, OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }] },
        data: { decidedAt: new Date() },
      })
      .catch(err => log.warn(`decidedAt stamp failed: ${String(err)}`));

    await recomputeContainerMetrics(id).catch(err =>
      log.warn(`Outcome recompute failed (non-fatal): ${String(err)}`)
    );

    await logAudit({
      action: 'CONTAINER_OUTCOME_LOGGED',
      resource: 'decision_container',
      resourceId: id,
      details: { kind: container.kind, metricKeys: Object.keys(metrics) },
    }).catch(err => log.warn('Outcome audit log failed:', err));

    return NextResponse.json({ ok: true, outcomeId: created.id });
  } catch (error) {
    log.error('POST /api/containers/[id]/outcome failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
