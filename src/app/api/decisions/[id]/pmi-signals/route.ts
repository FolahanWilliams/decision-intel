/**
 * /api/decisions/[id]/pmi-signals — PMI signal capture + Brier scoring
 * for acquisition-mode containers post-close (Path B + thin Path C,
 * locked 2026-05-10).
 *
 * Architecture rule: PMI signals are the AUDIT-LOOP CLOSURE surface for
 * the existing R²F audit, NOT a new product domain DI sells into. Each
 * signal carries:
 *   - the IC memo's claim (e.g. "30% synergy realisation by Q4")
 *   - the predicted confidence (from priors / memo)
 *   - the observed value when measured
 *   - a per-signal Brier score (observedValue - predictedConfidence)²
 *
 * Per Paper #2 Ch 7 + Ch 11: PMI is where the largest pool of M&A value
 * destruction fires; ex-post scorecards devolve into rationalization
 * theatre absent founder-dictator culture; we counter that by making
 * the ex-post comparison automatic + rule-based.
 *
 * GET    — read current pmiSignals blob.
 * POST   — add or replace a signal (idempotent on key per container).
 * PATCH  — observe a signal (sets observedValue + computes Brier).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';

const log = createLogger('PmiSignalsRoute');

export type PmiSignalKey =
  | 'synergy_realisation_pct'
  | 'talent_retention_pct'
  | 'integration_cost_vs_forecast'
  | 'day_one_milestone_hit_rate'
  | 'customer_retention_pct'
  | 'revenue_growth_vs_forecast';

export const PMI_SIGNAL_KEYS: ReadonlyArray<PmiSignalKey> = [
  'synergy_realisation_pct',
  'talent_retention_pct',
  'integration_cost_vs_forecast',
  'day_one_milestone_hit_rate',
  'customer_retention_pct',
  'revenue_growth_vs_forecast',
];

export interface PmiSignal {
  key: PmiSignalKey;
  proxy: string;
  horizonDays: 90 | 180 | 365;
  predictedConfidence: number;
  observedValue?: number;
  observedAt?: string;
  brierScore?: number;
  resolution?: 'hit' | 'miss' | 'partial' | 'unmeasured';
}

export interface PmiSignalsBlob {
  signals: PmiSignal[];
  capturedAt: string;
  capturedByUserId: string;
  lastUpdatedAt?: string;
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

async function loadContainerForUser(containerId: string, userId: string, orgId: string | null) {
  return prisma.decisionContainer.findFirst({
    where: {
      id: containerId,
      OR: orgId ? [{ ownerUserId: userId }, { orgId }] : [{ ownerUserId: userId }],
    },
    select: {
      id: true,
      kind: true,
      name: true,
      outcome: { select: { id: true, pmiSignals: true } },
    },
  });
}

/**
 * Compute a Brier score for a single signal.
 *
 * Brier for a binary outcome (hit / miss) is (predicted - observed)².
 * Here we use percent-realised vs predicted-confidence as a 0-1 proxy:
 * - observedValue normalised to 0-1 (most PMI metrics are already %)
 * - predictedConfidence is 0-1
 * - Brier = (predicted - observed)² capped at [0, 1]
 *
 * Resolution band:
 *   ≥ 0.85 observed → 'hit'
 *   0.50 - 0.85    → 'partial'
 *   < 0.50         → 'miss'
 *   undefined      → 'unmeasured'
 */
export function computeSignalBrier(predicted: number, observed: number): number {
  const obs = Math.max(0, Math.min(1, observed));
  const pred = Math.max(0, Math.min(1, predicted));
  return Math.round((pred - obs) ** 2 * 1000) / 1000;
}

export function resolveBand(observed: number | undefined): PmiSignal['resolution'] {
  if (observed === undefined) return 'unmeasured';
  if (observed >= 0.85) return 'hit';
  if (observed >= 0.5) return 'partial';
  return 'miss';
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    const container = await loadContainerForUser(id, user.id, orgId);
    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    if (container.kind !== 'acquisition') {
      return NextResponse.json(
        { error: 'PMI signals are scoped to acquisition-mode containers' },
        { status: 400 }
      );
    }

    const blob = (container.outcome?.pmiSignals as unknown as PmiSignalsBlob | null) ?? null;
    return NextResponse.json({
      containerId: container.id,
      kind: container.kind,
      pmiSignals: blob,
      hasOutcome: Boolean(container.outcome),
    });
  } catch (error) {
    log.error('GET /pmi-signals failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface PostBody {
  signal?: Omit<PmiSignal, 'observedValue' | 'observedAt' | 'brierScore' | 'resolution'>;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    const container = await loadContainerForUser(id, user.id, orgId);
    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    if (container.kind !== 'acquisition') {
      return NextResponse.json(
        { error: 'PMI signals are scoped to acquisition-mode containers' },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => null)) as PostBody | null;
    if (!body?.signal || !PMI_SIGNAL_KEYS.includes(body.signal.key)) {
      return NextResponse.json(
        { error: `Invalid signal — key must be one of ${PMI_SIGNAL_KEYS.join(', ')}` },
        { status: 400 }
      );
    }
    if (![90, 180, 365].includes(body.signal.horizonDays)) {
      return NextResponse.json({ error: 'horizonDays must be 90, 180, or 365' }, { status: 400 });
    }

    const existing = (container.outcome?.pmiSignals as unknown as PmiSignalsBlob | null) ?? {
      signals: [],
      capturedAt: new Date().toISOString(),
      capturedByUserId: user.id,
    };
    // Replace existing signal of same key (idempotent), else append.
    const otherSignals = existing.signals.filter(s => s.key !== body.signal!.key);
    const updated: PmiSignalsBlob = {
      ...existing,
      signals: [
        ...otherSignals,
        {
          key: body.signal.key,
          proxy: body.signal.proxy,
          horizonDays: body.signal.horizonDays,
          predictedConfidence: Math.max(0, Math.min(1, body.signal.predictedConfidence)),
          resolution: 'unmeasured',
        },
      ],
      lastUpdatedAt: new Date().toISOString(),
    };

    // Ensure an outcome row exists — required for the FK on pmiSignals.
    if (!container.outcome) {
      await prisma.decisionContainerOutcome.create({
        data: {
          containerId: container.id,
          summary: 'PMI signal capture initiated',
          metrics: {} as Prisma.InputJsonValue,
          reportedByUserId: user.id,
          pmiSignals: updated as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await prisma.decisionContainerOutcome.update({
        where: { id: container.outcome.id },
        data: { pmiSignals: updated as unknown as Prisma.InputJsonValue },
      });
    }

    await logAudit({
      action: 'PMI_SIGNAL_RECORDED',
      resource: 'DecisionContainerOutcome',
      resourceId: container.id,
      details: { key: body.signal.key, horizonDays: body.signal.horizonDays },
    });

    return NextResponse.json({ ok: true, pmiSignals: updated });
  } catch (error) {
    log.error('POST /pmi-signals failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface PatchBody {
  key?: PmiSignalKey;
  observedValue?: number;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    const container = await loadContainerForUser(id, user.id, orgId);
    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as PatchBody | null;
    if (!body?.key || !PMI_SIGNAL_KEYS.includes(body.key)) {
      return NextResponse.json({ error: 'Missing or invalid key' }, { status: 400 });
    }
    if (
      body.observedValue === undefined ||
      typeof body.observedValue !== 'number' ||
      !Number.isFinite(body.observedValue)
    ) {
      return NextResponse.json({ error: 'observedValue required (number)' }, { status: 400 });
    }

    const existing = (container.outcome?.pmiSignals as unknown as PmiSignalsBlob | null) ?? null;
    if (!existing) {
      return NextResponse.json(
        { error: 'No PMI signals to observe — POST first' },
        { status: 404 }
      );
    }
    const target = existing.signals.find(s => s.key === body.key);
    if (!target) {
      return NextResponse.json({ error: `No signal with key ${body.key}` }, { status: 404 });
    }

    // Update in place.
    const observed = body.observedValue;
    const observedAt = new Date().toISOString();
    const brierScore = computeSignalBrier(target.predictedConfidence, observed);
    const resolution = resolveBand(observed);

    const updatedSignals = existing.signals.map(s =>
      s.key === body.key ? { ...s, observedValue: observed, observedAt, brierScore, resolution } : s
    );
    const updated: PmiSignalsBlob = {
      ...existing,
      signals: updatedSignals,
      lastUpdatedAt: observedAt,
    };

    await prisma.decisionContainerOutcome.update({
      where: { id: container.outcome!.id },
      data: { pmiSignals: updated as unknown as Prisma.InputJsonValue },
    });

    await logAudit({
      action: 'PMI_SIGNAL_OBSERVED',
      resource: 'DecisionContainerOutcome',
      resourceId: container.id,
      details: { key: body.key, observedValue: observed, brierScore, resolution },
    });

    return NextResponse.json({ ok: true, pmiSignals: updated });
  } catch (error) {
    log.error('PATCH /pmi-signals failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
