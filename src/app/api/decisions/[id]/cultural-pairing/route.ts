/**
 * /api/decisions/[id]/cultural-pairing — Cultural-pairing risk
 * capture endpoint for cross-border deals.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 10 (Daimler-Chrysler
 * + HP-Autonomy class failures). When a container's market context
 * spans jurisdictions, force the team to explicitly name the
 * regulatory pairing, the cultural integration risks, and a named
 * historical analog deal — preventing the cultural-reasoning
 * failure that drives the canonical cross-border M&A failure cases.
 *
 * Persists to DecisionContainer.culturalPairingRisk JSON column.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CulturalPairingRoute');

interface CulturalPairingRisk {
  regulatoryPairing: string;
  culturalIntegrationRisks: string[];
  historicalAnalogDeal: string;
  gaapIfrsReconciliationNote?: string;
  capturedAt: string;
  capturedByUserId: string;
}

async function resolveContainerOwnership(
  containerId: string,
  userId: string
): Promise<{
  authorized: boolean;
  existing: CulturalPairingRisk | null;
}> {
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
    select: { id: true, culturalPairingRisk: true },
  });
  if (!container) return { authorized: false, existing: null };
  return {
    authorized: true,
    existing: (container.culturalPairingRisk as CulturalPairingRisk | null) ?? null,
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    regulatoryPairing?: string;
    culturalIntegrationRisks?: string[];
    historicalAnalogDeal?: string;
    gaapIfrsReconciliationNote?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const regulatoryPairing = (body.regulatoryPairing ?? '').trim();
  if (regulatoryPairing.length === 0 || regulatoryPairing.length > 500) {
    return NextResponse.json({ error: 'regulatoryPairing must be 1-500 chars' }, { status: 400 });
  }
  const culturalIntegrationRisks = Array.isArray(body.culturalIntegrationRisks)
    ? body.culturalIntegrationRisks
        .map(s => (typeof s === 'string' ? s.trim() : ''))
        .filter(s => s.length > 0 && s.length <= 500)
        .slice(0, 10)
    : [];
  if (culturalIntegrationRisks.length === 0) {
    return NextResponse.json(
      { error: 'culturalIntegrationRisks must list at least one risk' },
      { status: 400 }
    );
  }
  const historicalAnalogDeal = (body.historicalAnalogDeal ?? '').trim();
  if (historicalAnalogDeal.length === 0 || historicalAnalogDeal.length > 500) {
    return NextResponse.json(
      { error: 'historicalAnalogDeal must be 1-500 chars (a named historical comparable)' },
      { status: 400 }
    );
  }

  const { authorized } = await resolveContainerOwnership(id, user.id);
  if (!authorized) {
    return NextResponse.json({ error: 'Container not found' }, { status: 404 });
  }

  const payload: CulturalPairingRisk = {
    regulatoryPairing,
    culturalIntegrationRisks,
    historicalAnalogDeal,
    gaapIfrsReconciliationNote: body.gaapIfrsReconciliationNote?.trim() || undefined,
    capturedAt: new Date().toISOString(),
    capturedByUserId: user.id,
  };

  try {
    await prisma.decisionContainer.update({
      where: { id },
      data: { culturalPairingRisk: payload as unknown as Prisma.InputJsonValue },
    });
    return NextResponse.json({ culturalPairingRisk: payload });
  } catch (err) {
    log.error('cultural-pairing POST failed:', err);
    return NextResponse.json({ error: 'Failed to save cultural-pairing risk' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { authorized, existing } = await resolveContainerOwnership(id, user.id);
  if (!authorized) {
    return NextResponse.json({ error: 'Container not found' }, { status: 404 });
  }
  return NextResponse.json({ culturalPairingRisk: existing });
}
