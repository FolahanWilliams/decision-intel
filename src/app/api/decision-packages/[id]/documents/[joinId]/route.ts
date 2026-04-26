/**
 * Decision Package · single member operation (4.4 deep).
 *
 * DELETE /api/decision-packages/[id]/documents/[joinId] — remove a doc
 *   from a package by the join row id (NOT the documentId, so that
 *   removal doesn't accidentally drop the wrong join when a doc lives
 *   in multiple packages).
 *
 * PATCH  /api/decision-packages/[id]/documents/[joinId] — update role
 *   or position. Used by the package detail page to relabel a doc
 *   ("memo" → "model") or reorder.
 *
 * Owner-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { resolvePackageAccess } from '@/lib/utils/decision-package-access';
import { recomputePackageMetrics } from '@/lib/scoring/package-aggregation';

const log = createLogger('DecisionPackageMember');

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; joinId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: packageId, joinId } = await params;

    const pkg = await resolvePackageAccess(packageId, user.id);
    if (!pkg || pkg.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Owner-only operation' }, { status: 403 });
    }

    const member = await prisma.decisionPackageDocument.findFirst({
      where: { id: joinId, packageId },
      select: { id: true, documentId: true },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await prisma.decisionPackageDocument.delete({ where: { id: joinId } });
    await recomputePackageMetrics(packageId);

    await logAudit({
      action: 'DECISION_PACKAGE_DOCUMENT_REMOVED',
      resource: 'decision_package',
      resourceId: packageId,
      details: { documentId: member.documentId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('remove doc failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; joinId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: packageId, joinId } = await params;

    const pkg = await resolvePackageAccess(packageId, user.id);
    if (!pkg || pkg.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Owner-only operation' }, { status: 403 });
    }

    let body: { role?: unknown; position?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if ('role' in body) {
      update.role = typeof body.role === 'string' ? body.role.trim().slice(0, 60) || null : null;
    }
    if (typeof body.position === 'number') {
      update.position = Math.max(0, Math.floor(body.position));
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No updatable fields supplied' }, { status: 400 });
    }

    const updated = await prisma.decisionPackageDocument.update({
      where: { id: joinId },
      data: update,
      select: { id: true, role: true, position: true },
    });

    return NextResponse.json({ ok: true, member: updated });
  } catch (err) {
    log.error('patch member failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
