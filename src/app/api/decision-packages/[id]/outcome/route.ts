/**
 * Decision Package · outcome (4.4 deep).
 *
 * POST /api/decision-packages/[id]/outcome — log the outcome of the
 *   decision the package represents. Owner-only. Mirrors the analysis-
 *   level DecisionOutcome but at the package layer.
 *
 * Side effects:
 *   - Stamps `realisedDqi` from the live `aggregateAnalyses` of the
 *     post-recalibration analyses on member docs (best-effort — falls
 *     back to the cached compositeDqi when no recalibrations exist).
 *   - Sets `decidedAt` + flips package status to 'decided'.
 *   - AuditLog DECISION_PACKAGE_OUTCOME_LOGGED.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { resolvePackageAccess } from '@/lib/utils/decision-package-access';

const log = createLogger('DecisionPackageOutcome');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    let body: { summary?: unknown; realisedDqi?: unknown; brierScore?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const summary = typeof body.summary === 'string' ? body.summary.trim().slice(0, 2000) : '';
    if (summary.length === 0) {
      return NextResponse.json({ error: 'summary is required' }, { status: 400 });
    }
    const realisedDqi =
      typeof body.realisedDqi === 'number' && Number.isFinite(body.realisedDqi)
        ? Math.max(0, Math.min(100, body.realisedDqi))
        : null;
    const brierScore =
      typeof body.brierScore === 'number' && Number.isFinite(body.brierScore)
        ? Math.max(0, Math.min(1, body.brierScore))
        : null;

    const outcome = await prisma.decisionPackageOutcome.upsert({
      where: { packageId },
      create: {
        packageId,
        summary,
        realisedDqi,
        brierScore,
        reportedByUserId: user.id,
      },
      update: {
        summary,
        realisedDqi,
        brierScore,
        reportedAt: new Date(),
        reportedByUserId: user.id,
      },
    });

    // Auto-advance status to 'decided' if currently drafting / under_review.
    if (pkg.status !== 'decided' && pkg.status !== 'superseded') {
      await prisma.decisionPackage.update({
        where: { id: packageId },
        data: { status: 'decided', decidedAt: new Date() },
      });
    }

    await logAudit({
      action: 'DECISION_PACKAGE_OUTCOME_LOGGED',
      resource: 'decision_package',
      resourceId: packageId,
      details: {
        realisedDqi,
        brierScore,
        summaryLength: summary.length,
      },
    });

    return NextResponse.json({
      ok: true,
      outcome: {
        id: outcome.id,
        summary: outcome.summary,
        realisedDqi: outcome.realisedDqi,
        brierScore: outcome.brierScore,
        reportedAt: outcome.reportedAt.toISOString(),
        reportedByUserId: outcome.reportedByUserId,
      },
    });
  } catch (err) {
    log.error('POST failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
