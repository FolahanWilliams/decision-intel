/**
 * PATCH /api/ambient-signals/[id] — confirm or dismiss a signal.
 * DELETE /api/ambient-signals/[id] — same effect as dismiss; semantic
 * convenience for the UI banner's close button.
 *
 * Body: { action: 'confirm' | 'dismiss', containerId?: string }
 *   - confirm + containerId → marks signal status='confirmed' + links
 *     to the supplied container (must be owned by the caller or shared
 *     via org). Use when the user clicked "Start an audit" from the
 *     banner and a new container was just created.
 *   - confirm without containerId → marks status='confirmed' but leaves
 *     containerId null. Used by the UI when the user wants to clear the
 *     banner without creating a container.
 *   - dismiss → marks status='dismissed'.
 *
 * Locked 2026-05-10 per Tier 2.2.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('AmbientSignalsResolve');

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

async function loadSignal(id: string, userId: string, orgId: string | null) {
  return prisma.ambientThesisSignal.findFirst({
    where: {
      id,
      OR: orgId ? [{ userId }, { orgId }] : [{ userId }],
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      action?: 'confirm' | 'dismiss';
      containerId?: string;
    } | null;
    if (!body?.action || (body.action !== 'confirm' && body.action !== 'dismiss')) {
      return NextResponse.json(
        { error: 'Missing or invalid action (expected confirm | dismiss)' },
        { status: 400 }
      );
    }

    const orgId = await resolveOrgId(user.id);
    const signal = await loadSignal(id, user.id, orgId);
    if (!signal) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }
    if (signal.status !== 'pending') {
      return NextResponse.json({ error: 'Signal already resolved' }, { status: 409 });
    }

    // If confirming with a containerId, verify the user can access it.
    if (body.action === 'confirm' && body.containerId) {
      const container = await prisma.decisionContainer.findFirst({
        where: {
          id: body.containerId,
          OR: orgId ? [{ ownerUserId: user.id }, { orgId }] : [{ ownerUserId: user.id }],
        },
        select: { id: true },
      });
      if (!container) {
        return NextResponse.json(
          { error: 'Container not found or not accessible' },
          { status: 404 }
        );
      }
    }

    const updated = await prisma.ambientThesisSignal.update({
      where: { id },
      data: {
        status: body.action === 'confirm' ? 'confirmed' : 'dismissed',
        containerId: body.action === 'confirm' && body.containerId ? body.containerId : null,
        resolvedAt: new Date(),
      },
    });

    await logAudit({
      action: body.action === 'confirm' ? 'AMBIENT_SIGNAL_CONFIRMED' : 'AMBIENT_SIGNAL_DISMISSED',
      resource: 'AmbientThesisSignal',
      resourceId: id,
      details: {
        source: updated.source,
        containerId: updated.containerId,
        confidence: updated.confidence,
      },
    });

    return NextResponse.json({ ok: true, signal: updated });
  } catch (error) {
    log.error('PATCH /api/ambient-signals/[id] failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrgId(user.id);
    const signal = await loadSignal(id, user.id, orgId);
    if (!signal) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }
    if (signal.status !== 'pending') {
      // Already-resolved DELETE is a no-op.
      return NextResponse.json({ ok: true, alreadyResolved: true });
    }

    await prisma.ambientThesisSignal.update({
      where: { id },
      data: { status: 'dismissed', resolvedAt: new Date() },
    });

    await logAudit({
      action: 'AMBIENT_SIGNAL_DISMISSED',
      resource: 'AmbientThesisSignal',
      resourceId: id,
      details: { source: signal.source, via: 'DELETE' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('DELETE /api/ambient-signals/[id] failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
