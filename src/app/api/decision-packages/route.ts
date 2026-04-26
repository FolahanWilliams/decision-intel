/**
 * Decision Package list + create (4.4 deep).
 *
 * GET  /api/decision-packages — list packages visible to the caller.
 *      Query params: ?status=drafting|under_review|decided|superseded
 *                    ?limit=20 (max 50) ?cursor=<iso-date>
 *
 * POST /api/decision-packages — create a package, optionally adding
 *      documents in the same call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { logAudit } from '@/lib/audit';
import { buildPackageAccessFilter } from '@/lib/utils/decision-package-access';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';
import { recomputePackageMetrics } from '@/lib/scoring/package-aggregation';

const log = createLogger('DecisionPackages');

const MAX_NAME = 120;
const MAX_FRAME = 600;
const MAX_DOCS_ON_CREATE = 25;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request.nextUrl;
    const status = url.searchParams.get('status');
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20)
    );
    const cursor = url.searchParams.get('cursor');
    const cursorDate = cursor ? new Date(cursor) : null;

    const access = await buildPackageAccessFilter(user.id);
    const where: Record<string, unknown> = { ...access.where };
    if (
      status === 'drafting' ||
      status === 'under_review' ||
      status === 'decided' ||
      status === 'superseded'
    ) {
      where.status = status;
    }
    if (cursorDate && !Number.isNaN(cursorDate.getTime())) {
      where.updatedAt = { lt: cursorDate };
    }

    const packages = await prisma.decisionPackage
      .findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          decisionFrame: true,
          status: true,
          decidedAt: true,
          compositeDqi: true,
          compositeGrade: true,
          documentCount: true,
          analyzedDocCount: true,
          recurringBiasCount: true,
          conflictCount: true,
          highSeverityConflictCount: true,
          visibility: true,
          ownerUserId: true,
          updatedAt: true,
          createdAt: true,
        },
      })
      .catch(err => {
        log.warn('list packages failed (likely schema drift):', err);
        return [] as never[];
      });

    const nextCursor =
      packages.length === limit ? packages[packages.length - 1].updatedAt.toISOString() : null;

    return NextResponse.json({
      packages: packages.map(p => ({
        ...p,
        decidedAt: p.decidedAt?.toISOString() ?? null,
        updatedAt: p.updatedAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (err) {
    log.error('GET failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface CreateInput {
  name?: unknown;
  decisionFrame?: unknown;
  visibility?: unknown;
  documentIds?: unknown;
  documentRoles?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await checkRateLimit(user.id, 'decision-packages-create', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
    });
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    let body: CreateInput;
    try {
      body = (await request.json()) as CreateInput;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
    if (name.length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const decisionFrame =
      typeof body.decisionFrame === 'string'
        ? body.decisionFrame.trim().slice(0, MAX_FRAME) || null
        : null;
    const visibility =
      body.visibility === 'private' || body.visibility === 'team' ? body.visibility : 'team';
    const documentIds = Array.isArray(body.documentIds)
      ? body.documentIds
          .filter((d): d is string => typeof d === 'string' && d.length > 0)
          .slice(0, MAX_DOCS_ON_CREATE)
      : [];
    const documentRoles =
      body.documentRoles && typeof body.documentRoles === 'object'
        ? (body.documentRoles as Record<string, unknown>)
        : {};

    // Resolve org from membership.
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // schema drift — fall through; package is private/personal.
    }

    // Filter requested documentIds through visibility resolver — a
    // teammate's private doc must NOT end up inside a package they
    // create. The doc's visibility stays as-is; the package join is
    // simply rejected for any doc the caller can't read.
    let allowedIds: string[] = [];
    if (documentIds.length > 0) {
      const filter = await buildDocumentAccessFilter(user.id);
      const allowed = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          ...filter.where,
        },
        select: { id: true },
      });
      allowedIds = allowed.map(d => d.id);
    }

    const created = await prisma.decisionPackage.create({
      data: {
        orgId,
        ownerUserId: user.id,
        name,
        decisionFrame,
        visibility,
        documents:
          allowedIds.length > 0
            ? {
                create: allowedIds.map((documentId, idx) => ({
                  documentId,
                  role:
                    typeof documentRoles[documentId] === 'string'
                      ? String(documentRoles[documentId]).slice(0, 60)
                      : null,
                  position: idx,
                })),
              }
            : undefined,
      },
      select: {
        id: true,
        name: true,
        decisionFrame: true,
        visibility: true,
        status: true,
      },
    });

    if (allowedIds.length > 0) {
      await recomputePackageMetrics(created.id);
    }

    await logAudit({
      action: 'DECISION_PACKAGE_CREATED',
      resource: 'decision_package',
      resourceId: created.id,
      details: {
        name: created.name,
        documentCount: allowedIds.length,
        rejectedCount: documentIds.length - allowedIds.length,
      },
    });

    return NextResponse.json({ ok: true, package: created }, { status: 201 });
  } catch (err) {
    log.error('POST failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
