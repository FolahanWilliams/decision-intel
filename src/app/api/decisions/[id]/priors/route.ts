/**
 * /api/decisions/[id]/priors — pre-artefact priors capture endpoint.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 1 / Finding #1
 * (formalization-reality discontinuity). Capture the user's
 * conviction + kill criteria + micro-predictions BEFORE the IC memo
 * lands so the audit pipeline can compare against pre-artefact
 * reasoning, not the engineered post-hoc narrative.
 *
 * Persists to DecisionContainer.priors JSON column. Subsequent
 * priors captures append to a microPredictions[] array; the
 * conviction snapshot stays as the originally-captured value
 * (overwriting it would defeat the purpose of capturing pre-
 * artefact reasoning).
 *
 * The micro-predictions field is the Brier-scored intermediate-
 * proxy mechanism per paper Ch 9 — collapses the calibration
 * feedback loop from terminal-IRR (5-10 yr) to per-prediction
 * horizons (30-180 day).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PriorsRoute');

interface MicroPrediction {
  prediction: string;
  horizonDays: number;
  confidence: number;
  resolvedAt?: string;
  resolution?: 'true' | 'false' | 'partial';
}

interface PriorsPayload {
  convictionLevel: 'low' | 'medium' | 'high' | 'very_high';
  convictionRationale: string;
  killCriteria: string[];
  microPredictions: MicroPrediction[];
  capturedAt: string;
  capturedByUserId: string;
}

async function resolveContainerOwnership(
  containerId: string,
  userId: string
): Promise<{
  authorized: boolean;
  existingPriors: PriorsPayload | null;
}> {
  // Owner-OR-same-org access rule.
  const teamRow = await prisma.teamMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  const orgId = teamRow?.orgId ?? null;

  const container = await prisma.decisionContainer.findFirst({
    where: {
      id: containerId,
      OR: orgId ? [{ ownerUserId: userId }, { orgId }] : [{ ownerUserId: userId }],
    },
    select: { id: true, priors: true },
  });

  if (!container) {
    return { authorized: false, existingPriors: null };
  }

  return {
    authorized: true,
    existingPriors: (container.priors as PriorsPayload | null) ?? null,
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: containerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    convictionLevel?: string;
    convictionRationale?: string;
    killCriteria?: string[];
    microPredictions?: MicroPrediction[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validation.
  const allowedConviction: ReadonlySet<string> = new Set(['low', 'medium', 'high', 'very_high']);
  if (!body.convictionLevel || !allowedConviction.has(body.convictionLevel)) {
    return NextResponse.json(
      { error: 'convictionLevel must be one of: low | medium | high | very_high' },
      { status: 400 }
    );
  }
  const convictionRationale = (body.convictionRationale ?? '').trim();
  if (convictionRationale.length === 0 || convictionRationale.length > 2000) {
    return NextResponse.json(
      { error: 'convictionRationale must be 1-2000 chars' },
      { status: 400 }
    );
  }
  const killCriteria = Array.isArray(body.killCriteria)
    ? body.killCriteria
        .map(s => (typeof s === 'string' ? s.trim() : ''))
        .filter(s => s.length > 0 && s.length <= 500)
    : [];
  const microPredictions = Array.isArray(body.microPredictions)
    ? body.microPredictions
        .filter(
          (p): p is MicroPrediction =>
            typeof p === 'object' &&
            p !== null &&
            typeof p.prediction === 'string' &&
            p.prediction.trim().length > 0 &&
            typeof p.horizonDays === 'number' &&
            p.horizonDays > 0 &&
            p.horizonDays <= 365 &&
            typeof p.confidence === 'number' &&
            p.confidence >= 0 &&
            p.confidence <= 1
        )
        .slice(0, 10)
    : [];

  // Auth + ownership.
  const { authorized } = await resolveContainerOwnership(containerId, user.id);
  if (!authorized) {
    return NextResponse.json({ error: 'Container not found' }, { status: 404 });
  }

  // Conviction snapshot: keep the first-captured value if priors already exist.
  // Micro-predictions: append. Done ATOMICALLY — a bare read-existing-then-
  // write-merged is racy: two concurrent captures both read the same priors,
  // both append in JS, and one write is lost. Lock the container row and
  // re-read inside the transaction so the append can't drop a concurrent one.
  try {
    const merged = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "DecisionContainer" WHERE id = ${containerId} FOR UPDATE`;
      const fresh = await tx.decisionContainer.findUnique({
        where: { id: containerId },
        select: { priors: true },
      });
      const prev = (fresh?.priors as unknown as PriorsPayload | null) ?? null;
      const next: PriorsPayload = prev
        ? {
            convictionLevel: prev.convictionLevel,
            convictionRationale: prev.convictionRationale,
            killCriteria: Array.from(new Set([...(prev.killCriteria ?? []), ...killCriteria])),
            microPredictions: [...(prev.microPredictions ?? []), ...microPredictions],
            capturedAt: prev.capturedAt,
            capturedByUserId: prev.capturedByUserId,
          }
        : {
            convictionLevel: body.convictionLevel as PriorsPayload['convictionLevel'],
            convictionRationale,
            killCriteria,
            microPredictions,
            capturedAt: new Date().toISOString(),
            capturedByUserId: user.id,
          };
      await tx.decisionContainer.update({
        where: { id: containerId },
        data: { priors: next as unknown as Prisma.InputJsonValue },
      });
      return next;
    });
    return NextResponse.json({ priors: merged });
  } catch (err) {
    log.error('priors POST failed:', err);
    return NextResponse.json({ error: 'Failed to save priors' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: containerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { authorized, existingPriors } = await resolveContainerOwnership(containerId, user.id);
  if (!authorized) {
    return NextResponse.json({ error: 'Container not found' }, { status: 404 });
  }
  return NextResponse.json({ priors: existingPriors });
}
