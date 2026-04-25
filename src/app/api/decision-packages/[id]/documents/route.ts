/**
 * Decision Package · documents (4.4 deep).
 *
 * POST /api/decision-packages/[id]/documents — add a document.
 *   Body: { documentId: string, role?: string, position?: number }
 *   Owner-only. Document must be visible to the owner under the per-doc
 *   RBAC resolver (we deliberately don't widen visibility on add).
 *
 * Removal lives at /api/decision-packages/[id]/documents/[joinId].
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { resolvePackageAccess } from '@/lib/utils/decision-package-access';
import { buildDocumentAccessWhere } from '@/lib/utils/document-access';
import { recomputePackageMetrics } from '@/lib/scoring/package-aggregation';

const log = createLogger('DecisionPackageDocuments');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: packageId } = await params;

    const pkg = await resolvePackageAccess(packageId, user.id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    if (pkg.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Owner-only operation' }, { status: 403 });
    }

    let body: { documentId?: unknown; role?: unknown; position?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const documentId = typeof body.documentId === 'string' ? body.documentId : '';
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }
    const role =
      typeof body.role === 'string' ? body.role.trim().slice(0, 60) || null : null;
    const positionInput =
      typeof body.position === 'number' ? Math.max(0, Math.floor(body.position)) : null;

    // Visibility-gated read of the doc — caller must already have access.
    const access = await buildDocumentAccessWhere(documentId, user.id);
    const doc = await prisma.document.findFirst({
      where: access.where,
      select: { id: true, filename: true },
    });
    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found or you do not have access.' },
        { status: 404 }
      );
    }

    const existing = await prisma.decisionPackageDocument.findUnique({
      where: { packageId_documentId: { packageId, documentId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Document is already in this package.' },
        { status: 409 }
      );
    }

    let position = positionInput;
    if (position === null) {
      const last = await prisma.decisionPackageDocument.findFirst({
        where: { packageId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = (last?.position ?? -1) + 1;
    }

    const created = await prisma.decisionPackageDocument.create({
      data: { packageId, documentId, role, position },
      select: { id: true, position: true, role: true },
    });

    await recomputePackageMetrics(packageId);

    await logAudit({
      action: 'DECISION_PACKAGE_DOCUMENT_ADDED',
      resource: 'decision_package',
      resourceId: packageId,
      details: { documentId, role, filename: doc.filename },
    });

    return NextResponse.json({ ok: true, member: created }, { status: 201 });
  } catch (err) {
    log.error('add doc failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
