import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('BiasCommentDetailRoute');

// PATCH  /api/bias-comments/:id  → edit body (author only) OR resolve / unresolve
// DELETE /api/bias-comments/:id  → soft-style delete (hard-delete, but cascades
//                                  to replies — same as a forum thread close).

const MAX_BODY_CHARS = 4000;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const { id } = await params;
    const existing = await prisma.biasComment.findUnique({
      where: { id },
      select: {
        id: true,
        authorUserId: true,
        orgId: true,
        biasInstanceId: true,
        resolvedAt: true,
      },
    });
    if (!existing) return apiError({ error: 'Not found', status: 404 });

    const body = (await req.json().catch(() => null)) as {
      body?: string;
      resolved?: boolean;
    } | null;
    if (!body) return apiError({ error: 'Request body required', status: 400 });

    const isAuthor = existing.authorUserId === user.id;
    let isOrgMember = false;
    if (existing.orgId) {
      const m = await prisma.teamMember
        .findFirst({
          where: { userId: user.id, orgId: existing.orgId },
          select: { id: true },
        })
        .catch(() => null);
      isOrgMember = !!m;
    }

    // Editing the body is author-only. Toggling resolved is anyone with
    // org access (so a teammate can mark a thread done after addressing it).
    const updates: Record<string, unknown> = {};
    if (typeof body.body === 'string') {
      if (!isAuthor) return apiError({ error: 'Only the author can edit', status: 403 });
      const trimmed = body.body.trim();
      if (trimmed.length === 0) {
        return apiError({ error: 'Comment body required', status: 400 });
      }
      if (trimmed.length > MAX_BODY_CHARS) {
        return apiError({
          error: `Comment body too long (max ${MAX_BODY_CHARS} chars)`,
          status: 400,
        });
      }
      updates.body = trimmed;
    }
    if (typeof body.resolved === 'boolean') {
      if (!isAuthor && !isOrgMember) {
        return apiError({ error: 'Forbidden', status: 403 });
      }
      updates.resolvedAt = body.resolved ? new Date() : null;
      updates.resolvedByUserId = body.resolved ? user.id : null;
    }
    if (Object.keys(updates).length === 0) {
      return apiError({ error: 'Nothing to update', status: 400 });
    }

    const updated = await prisma.biasComment.update({ where: { id }, data: updates });

    logAudit({
      action:
        typeof body.resolved === 'boolean' && body.resolved
          ? 'BIAS_COMMENT_RESOLVED'
          : 'BIAS_COMMENT_UPDATED',
      resource: 'bias_comment',
      resourceId: id,
      details: {
        biasInstanceId: existing.biasInstanceId,
        orgId: existing.orgId,
        changes: Object.keys(updates),
      },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ comment: updated });
  } catch (err) {
    log.error('bias-comment PATCH failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const { id } = await params;
    const existing = await prisma.biasComment.findUnique({
      where: { id },
      select: { id: true, authorUserId: true, orgId: true, biasInstanceId: true },
    });
    if (!existing) return apiError({ error: 'Not found', status: 404 });

    // Author-only delete. Org admins can also delete via a future moderator
    // path; today only the author can remove their own comment.
    if (existing.authorUserId !== user.id) {
      return apiError({ error: 'Only the author can delete', status: 403 });
    }

    await prisma.biasComment.delete({ where: { id } });

    logAudit({
      action: 'BIAS_COMMENT_DELETED',
      resource: 'bias_comment',
      resourceId: id,
      details: { biasInstanceId: existing.biasInstanceId, orgId: existing.orgId },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('bias-comment DELETE failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}
