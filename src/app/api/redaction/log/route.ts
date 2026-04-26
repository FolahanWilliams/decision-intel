/**
 * Server-side redaction audit trail (3.2 deep).
 *
 * POST  — accepts a payload from the redaction modal and persists it as
 *         an AuditLog row. NEVER receives the original memo; only hashes,
 *         category counts, and the outcome action. Fire-and-forget on the
 *         client side; this endpoint always returns 200 unless the user
 *         is unauthenticated.
 * GET    — returns the redaction audit rows for an analysis (owner-scoped).
 *         Powers the RedactionTrailCard on the document detail page.
 *
 * Why exists: the buyer's procurement question is "prove you redacted
 * before content left the browser." A signed audit row with the
 * pre/post hashes + the category summary lets us answer that.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';
import { resolveAnalysisAccess } from '@/lib/utils/document-access';

const log = createLogger('RedactionTrail');

const Categories = z.object({
  email: z.number().int().min(0).max(10000),
  phone: z.number().int().min(0).max(10000),
  ssn: z.number().int().min(0).max(10000),
  amount: z.number().int().min(0).max(10000),
  entity: z.number().int().min(0).max(10000),
  name: z.number().int().min(0).max(10000),
});

const PostSchema = z.object({
  analysisId: z.string().min(1).max(50).optional(),
  originalHash: z.string().regex(/^[a-f0-9]{0,64}$/i),
  submittedHash: z.string().regex(/^[a-f0-9]{64}$/i),
  detectedCounts: Categories,
  redactedCounts: Categories,
  action: z.enum(['applied', 'skipped']),
  source: z.string().min(1).max(60),
  placeholderCount: z.number().int().min(0).max(10000),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
    }

    const data = parsed.data;
    const action = data.action === 'applied' ? 'REDACTION_APPLIED' : 'REDACTION_SKIPPED';

    let orgId: string | null = null;
    try {
      const m = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = m?.orgId ?? null;
    } catch {
      // Schema drift
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId,
        action,
        resource: 'Redaction',
        resourceId: data.analysisId ?? null,
        details: {
          source: data.source,
          originalHash: data.originalHash,
          submittedHash: data.submittedHash,
          detectedCounts: data.detectedCounts,
          redactedCounts: data.redactedCounts,
          placeholderCount: data.placeholderCount,
          // Total counts as quick-read fields so the UI doesn't have to
          // sum the categories every render.
          detectedTotal: Object.values(data.detectedCounts).reduce((a, b) => a + b, 0),
          redactedTotal: Object.values(data.redactedCounts).reduce((a, b) => a + b, 0),
        } as unknown as Prisma.InputJsonValue,
        ipAddress: req.headers.get('x-forwarded-for') ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    log.warn(
      'redaction log POST failed (non-critical):',
      e instanceof Error ? e.message : String(e)
    );
    // Always return 200 so an audit-trail failure never blocks a real
    // submission; we still log the failure for observability.
    return NextResponse.json({ ok: false });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    // RBAC (3.5): visibility-aware. Audit trail is metadata only, but
    // tying it to an analysis the user can read is the right scope.
    const access = await resolveAnalysisAccess(analysisId, user.id);
    if (!access) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const rows = await prisma.auditLog.findMany({
      where: {
        resourceId: analysisId,
        action: { in: ['REDACTION_APPLIED', 'REDACTION_SKIPPED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        userId: true,
        action: true,
        details: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ rows });
  } catch (e) {
    log.error('redaction log GET failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
