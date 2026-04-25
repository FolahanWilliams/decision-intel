/**
 * Document visibility + access grants (3.5).
 *
 * GET    — returns { visibility, grants: [{ userId, email?, permission }] } for the doc.
 *          Owner only. Teammates with read access see the doc but cannot read grants.
 * PATCH  — owner-only update of { visibility, grantedUserIds? }. Replaces the
 *          full grant list when grantedUserIds is provided so the UI can do a
 *          simple multiselect → save flow without diff bookkeeping.
 *
 * Auth: must be authenticated AND must be Document.userId (the owner).
 * No org-admin override for v1 — keeps the access-grant authority at the
 * file level with the person who uploaded it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const log = createLogger('DocumentVisibility');

const PatchSchema = z.object({
  visibility: z.enum(['private', 'team', 'specific']),
  /**
   * Full replacement list of user IDs to grant read access. Required when
   * visibility is 'specific'; ignored otherwise. Setting to [] with
   * visibility='specific' clears all grants (effectively making the doc
   * private to everyone except the owner).
   */
  grantedUserIds: z.array(z.string().min(1)).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      select: { id: true, visibility: true },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const grants = await prisma.documentAccess.findMany({
      where: { documentId: id },
      select: { userId: true, permission: true, grantedAt: true },
    });

    return NextResponse.json({
      visibility: doc.visibility,
      grants,
    });
  } catch (e) {
    log.error('GET visibility failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const { visibility, grantedUserIds } = parsed.data;

    // Owner-only check.
    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      select: { id: true, visibility: true, filename: true, orgId: true },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Not found or not owner' }, { status: 404 });
    }

    if (visibility === 'specific' && !grantedUserIds) {
      return NextResponse.json(
        { error: 'visibility=specific requires grantedUserIds' },
        { status: 400 }
      );
    }

    const previousVisibility = doc.visibility ?? 'team';

    let added: string[] = [];
    let removed: string[] = [];

    await prisma.$transaction(async tx => {
      await tx.document.update({
        where: { id },
        data: { visibility },
      });

      // For non-specific modes, drop any leftover grants so a future flip
      // back to 'specific' starts from a clean state.
      if (visibility !== 'specific') {
        const existing = await tx.documentAccess.findMany({
          where: { documentId: id },
          select: { userId: true },
        });
        removed = existing.map(g => g.userId);
        await tx.documentAccess.deleteMany({ where: { documentId: id } });
        return;
      }

      // visibility === 'specific' — replace the full grant list.
      const desired = new Set(grantedUserIds!.filter(u => u !== user.id));
      const existing = await tx.documentAccess.findMany({
        where: { documentId: id },
        select: { userId: true },
      });
      const existingSet = new Set(existing.map(g => g.userId));

      const toDelete = [...existingSet].filter(u => !desired.has(u));
      const toAdd = [...desired].filter(u => !existingSet.has(u));

      if (toDelete.length > 0) {
        await tx.documentAccess.deleteMany({
          where: { documentId: id, userId: { in: toDelete } },
        });
      }
      if (toAdd.length > 0) {
        await tx.documentAccess.createMany({
          data: toAdd.map(uid => ({
            documentId: id,
            userId: uid,
            permission: 'read',
            grantedById: user.id,
          })),
        });
      }
      added = toAdd;
      removed = toDelete;
    });

    // Audit log + Nudge fire-and-forget — never block the visibility update.
    if (previousVisibility !== visibility) {
      logAudit({
        action: 'DOCUMENT_VISIBILITY_CHANGED',
        resource: 'Document',
        resourceId: id,
        details: {
          from: previousVisibility,
          to: visibility,
          filename: doc.filename,
        },
      }).catch(err =>
        log.warn('audit log for visibility change failed:', err)
      );
    }

    if (added.length > 0) {
      logAudit({
        action: 'DOCUMENT_ACCESS_GRANTED',
        resource: 'Document',
        resourceId: id,
        details: { addedUserIds: added, filename: doc.filename },
      }).catch(err => log.warn('audit log for grant failed:', err));

      // Nudge each grantee so they know the doc just appeared in their
      // accessible set. Fire-and-forget; never block the PATCH.
      Promise.allSettled(
        added.map(grantee =>
          prisma.nudge
            .create({
              data: {
                targetUserId: grantee,
                orgId: doc.orgId ?? undefined,
                nudgeType: 'document_access_granted',
                message: `${doc.filename} was just shared with you.`,
                triggerReason: `granted by ${user.id} on doc ${id}`,
                channel: 'dashboard',
                severity: 'info',
                phase: 'post_decision',
              },
            })
            .catch(() => null)
        )
      ).catch(() => null);
    }

    if (removed.length > 0) {
      logAudit({
        action: 'DOCUMENT_ACCESS_REVOKED',
        resource: 'Document',
        resourceId: id,
        details: { removedUserIds: removed, filename: doc.filename },
      }).catch(err => log.warn('audit log for revoke failed:', err));
    }

    log.info(`Document ${id} visibility set to ${visibility} by ${user.id}`);
    return NextResponse.json({ ok: true, visibility });
  } catch (e) {
    log.error('PATCH visibility failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
