/**
 * Decision Package detail (4.4 deep).
 *
 * GET    — full package detail (member docs filtered through doc-RBAC)
 *          + latest cross-reference run + outcome.
 * PATCH  — update name / decisionFrame / status / visibility (owner-only).
 * DELETE — owner-only delete (cascades the join + cross-refs + outcome).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { resolvePackageAccess } from '@/lib/utils/decision-package-access';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';
import { aggregateAnalyses, type AnalyzedDocument } from '@/lib/scoring/deal-aggregation';

const log = createLogger('DecisionPackageDetail');

const ALLOWED_STATUS = new Set(['drafting', 'under_review', 'decided', 'superseded']);
const ALLOWED_VISIBILITY = new Set(['private', 'team']);

export async function GET(
  _req: NextRequest,
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
    const { id } = await params;

    const pkg = await resolvePackageAccess(id, user.id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // RBAC on member docs — a teammate viewing a team package should NOT
    // see private member docs they aren't granted access to. We pull all
    // member docs visible to the caller; rejected docs simply don't appear.
    const docFilter = await buildDocumentAccessFilter(user.id);
    const memberDocs = await prisma.decisionPackageDocument.findMany({
      where: {
        packageId: id,
        document: docFilter.where,
      },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        documentId: true,
        role: true,
        position: true,
        addedAt: true,
        document: {
          select: {
            id: true,
            filename: true,
            uploadedAt: true,
            documentType: true,
            status: true,
            visibility: true,
            userId: true,
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                noiseScore: true,
                summary: true,
                createdAt: true,
                biases: { select: { biasType: true, severity: true } },
              },
            },
          },
        },
      },
    });

    // Recompute aggregation in-memory so the response is always live (the
    // cached columns are eventually-consistent on writes).
    const latestPerDoc: AnalyzedDocument[] = [];
    for (const m of memberDocs) {
      const a = m.document.analyses[0];
      if (!a) continue;
      latestPerDoc.push({
        documentId: m.documentId,
        analysisId: a.id,
        overallScore: a.overallScore,
        biases: a.biases.map(b => ({
          biasType: b.biasType,
          severity: b.severity ?? undefined,
        })),
      });
    }
    const aggregation = aggregateAnalyses(latestPerDoc);

    const [latestRun, outcome] = await Promise.all([
      prisma.decisionPackageCrossReference
        .findFirst({
          where: { packageId: id },
          orderBy: { runAt: 'desc' },
        })
        .catch(() => null),
      prisma.decisionPackageOutcome
        .findUnique({ where: { packageId: id } })
        .catch(() => null),
    ]);

    return NextResponse.json({
      package: {
        id: pkg.id,
        name: pkg.name,
        decisionFrame: pkg.decisionFrame,
        status: pkg.status,
        decidedAt: pkg.decidedAt?.toISOString() ?? null,
        visibility: pkg.visibility,
        ownerUserId: pkg.ownerUserId,
        orgId: pkg.orgId,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
        compositeDqi: pkg.compositeDqi,
        compositeGrade: pkg.compositeGrade,
        documentCount: pkg.documentCount,
        analyzedDocCount: pkg.analyzedDocCount,
        recurringBiasCount: pkg.recurringBiasCount,
        conflictCount: pkg.conflictCount,
        highSeverityConflictCount: pkg.highSeverityConflictCount,
        isOwner: pkg.ownerUserId === user.id,
      },
      aggregation,
      documents: memberDocs.map(m => ({
        id: m.id,
        documentId: m.documentId,
        role: m.role,
        position: m.position,
        addedAt: m.addedAt.toISOString(),
        filename: m.document.filename,
        documentType: m.document.documentType,
        status: m.document.status,
        visibility: m.document.visibility,
        uploadedAt: m.document.uploadedAt.toISOString(),
        latestAnalysis: m.document.analyses[0]
          ? {
              id: m.document.analyses[0].id,
              overallScore: m.document.analyses[0].overallScore,
              noiseScore: m.document.analyses[0].noiseScore,
              summary: m.document.analyses[0].summary,
              createdAt: m.document.analyses[0].createdAt.toISOString(),
              biases: m.document.analyses[0].biases,
            }
          : null,
      })),
      crossReference: latestRun
        ? {
            id: latestRun.id,
            runAt: latestRun.runAt.toISOString(),
            modelVersion: latestRun.modelVersion,
            documentSnapshot: latestRun.documentSnapshot,
            findings: latestRun.findings,
            conflictCount: latestRun.conflictCount,
            highSeverityCount: latestRun.highSeverityCount,
            status: latestRun.status,
            errorMessage: latestRun.errorMessage,
          }
        : null,
      outcome: outcome
        ? {
            id: outcome.id,
            summary: outcome.summary,
            realisedDqi: outcome.realisedDqi,
            brierScore: outcome.brierScore,
            reportedAt: outcome.reportedAt.toISOString(),
            reportedByUserId: outcome.reportedByUserId,
          }
        : null,
    });
  } catch (err) {
    log.error('GET failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const { id } = await params;

    const pkg = await prisma.decisionPackage.findUnique({
      where: { id },
      select: { id: true, ownerUserId: true, status: true, visibility: true },
    });
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    if (pkg.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Owner-only operation' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.name === 'string') {
      const trimmed = body.name.trim().slice(0, 120);
      if (trimmed.length > 0) update.name = trimmed;
    }
    if ('decisionFrame' in body) {
      const raw = body.decisionFrame;
      update.decisionFrame =
        typeof raw === 'string' ? (raw.trim().slice(0, 600) || null) : null;
    }
    if (typeof body.status === 'string' && ALLOWED_STATUS.has(body.status)) {
      update.status = body.status;
      if (body.status === 'decided') {
        update.decidedAt = new Date();
      }
    }
    if (typeof body.visibility === 'string' && ALLOWED_VISIBILITY.has(body.visibility)) {
      update.visibility = body.visibility;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No updatable fields supplied' }, { status: 400 });
    }

    const updated = await prisma.decisionPackage.update({
      where: { id },
      data: update,
      select: { id: true, name: true, status: true, visibility: true, updatedAt: true },
    });

    await logAudit({
      action: 'DECISION_PACKAGE_UPDATED',
      resource: 'decision_package',
      resourceId: id,
      details: { fields: Object.keys(update) },
    });

    return NextResponse.json({
      ok: true,
      package: { ...updated, updatedAt: updated.updatedAt.toISOString() },
    });
  } catch (err) {
    log.error('PATCH failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
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
    const { id } = await params;

    const pkg = await prisma.decisionPackage.findUnique({
      where: { id },
      select: { id: true, ownerUserId: true, name: true },
    });
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    if (pkg.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Owner-only operation' }, { status: 403 });
    }

    await prisma.decisionPackage.delete({ where: { id } });
    await logAudit({
      action: 'DECISION_PACKAGE_DELETED',
      resource: 'decision_package',
      resourceId: id,
      details: { name: pkg.name },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('DELETE failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
