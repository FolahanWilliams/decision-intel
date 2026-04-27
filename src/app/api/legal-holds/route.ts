/**
 * Legal-hold register (2.1 deep).
 *
 * GET   — list active + recent holds for the caller's org.
 * POST  — create a hold with reason + optional holdUntil. Optionally
 *         attaches one or more documentIds in the same call.
 * PATCH — release a hold (sets releasedAt + releasedById). Documents
 *         retain `legalHoldId` historically but the cron's "released"
 *         filter excludes them from the protected set going forward.
 *
 * Auth: any signed-in member of the org. Procurement-grade tightening
 * (admin-only release) is a follow-up.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('LegalHolds');

const PostSchema = z.object({
  reason: z.string().min(4).max(2000),
  holdUntil: z.string().datetime().optional().nullable(),
  documentIds: z.array(z.string().min(1)).max(500).optional(),
});

const PatchSchema = z.object({
  id: z.string().min(1),
  release: z.literal(true),
});

async function getOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch (err) {
    log.warn('getOrgId failed (returning null fallback):', err);
    return null;
  }
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await getOrgId(user.id);
    const holds = await prisma.legalHold.findMany({
      where: orgId ? { orgId } : { grantedById: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        reason: true,
        holdUntil: true,
        grantedById: true,
        releasedAt: true,
        releasedById: true,
        createdAt: true,
        documents: {
          select: { id: true, filename: true, deletedAt: true },
          take: 50,
        },
      },
    });
    return NextResponse.json({ holds });
  } catch (err) {
    log.error('GET legal-holds failed:', err as Error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { reason, holdUntil, documentIds } = parsed.data;
    const orgId = await getOrgId(user.id);

    const hold = await prisma.$transaction(async tx => {
      const created = await tx.legalHold.create({
        data: {
          orgId,
          reason,
          holdUntil: holdUntil ? new Date(holdUntil) : null,
          grantedById: user.id,
        },
      });

      // Attach documents the caller actually owns. Silently skip foreign
      // ones rather than failing the create — the typical UX is "create
      // hold + attach selected docs" and partial attachment is expected.
      if (documentIds && documentIds.length > 0) {
        await tx.document.updateMany({
          where: { id: { in: documentIds }, userId: user.id, deletedAt: null },
          data: { legalHoldId: created.id },
        });
      }
      return created;
    });

    log.info(`Legal hold ${hold.id} created by ${user.id} (${documentIds?.length ?? 0} docs)`);
    return NextResponse.json({ hold }, { status: 201 });
  } catch (err) {
    log.error('POST legal-holds failed:', err as Error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    // Granter or any org-member with an explicit release intent can lift it.
    // For v1 we tighten to the granter only — admin elevation comes later.
    const hold = await prisma.legalHold.findUnique({ where: { id: parsed.data.id } });
    if (!hold || hold.releasedAt) {
      return NextResponse.json({ error: 'Not found or already released' }, { status: 404 });
    }
    if (hold.grantedById !== user.id) {
      return NextResponse.json(
        { error: 'Only the granter can release the hold.' },
        { status: 403 }
      );
    }

    const released = await prisma.legalHold.update({
      where: { id: parsed.data.id },
      data: {
        releasedAt: new Date(),
        releasedById: user.id,
      },
    });
    return NextResponse.json({ hold: released });
  } catch (err) {
    log.error('PATCH legal-holds failed:', err as Error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
