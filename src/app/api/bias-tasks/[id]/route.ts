import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('BiasTaskDetailRoute');

// PATCH  /api/bias-tasks/:id  → status change / reassign / edit description / due-date
// DELETE /api/bias-tasks/:id  → remove (creator OR org admin)

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'dismissed'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

const MAX_TITLE_CHARS = 240;
const MAX_DESCRIPTION_CHARS = 4000;
const MAX_RESOLUTION_CHARS = 2000;

function isValidStatus(s: string): s is ValidStatus {
  return (VALID_STATUSES as readonly string[]).includes(s);
}

async function userInOrg(userId: string, orgId: string | null): Promise<boolean> {
  if (!orgId) return false;
  const m = await prisma.teamMember
    .findFirst({ where: { userId, orgId }, select: { id: true } })
    .catch(() => null);
  return !!m;
}

async function userIsOrgAdmin(userId: string, orgId: string | null): Promise<boolean> {
  if (!orgId) return false;
  const m = await prisma.teamMember
    .findFirst({ where: { userId, orgId, role: 'admin' }, select: { id: true } })
    .catch(() => null);
  return !!m;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const { id } = await params;
    const existing = await prisma.biasTask.findUnique({ where: { id } });
    if (!existing) return apiError({ error: 'Not found', status: 404 });

    const body = (await req.json().catch(() => null)) as {
      status?: string;
      assigneeUserId?: string;
      title?: string;
      description?: string | null;
      dueAt?: string | null;
      resolutionNote?: string;
    } | null;
    if (!body) return apiError({ error: 'Request body required', status: 400 });

    // Authorisation matrix:
    //   - creator can edit anything
    //   - assignee can change status + add resolution note
    //   - org admin can do anything (reassign, dismiss, delete)
    //   - any other org member: read-only via GET, no PATCH
    const isCreator = existing.createdByUserId === user.id;
    const isAssignee = existing.assigneeUserId === user.id;
    const isOrgAdmin = await userIsOrgAdmin(user.id, existing.orgId);
    const isOrgMember = isOrgAdmin || (await userInOrg(user.id, existing.orgId));

    if (!isCreator && !isAssignee && !isOrgAdmin && !isOrgMember) {
      return apiError({ error: 'Forbidden', status: 403 });
    }

    const updates: Record<string, unknown> = {};
    let auditAction: 'BIAS_TASK_UPDATED' | 'BIAS_TASK_REASSIGNED' | 'BIAS_TASK_RESOLVED' =
      'BIAS_TASK_UPDATED';

    if (typeof body.status === 'string') {
      if (!isValidStatus(body.status)) {
        return apiError({
          error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
          status: 400,
        });
      }
      // Status change: assignee, creator and org admin all allowed.
      if (!isAssignee && !isCreator && !isOrgAdmin) {
        return apiError({ error: 'Forbidden status change', status: 403 });
      }
      updates.status = body.status;
      if (body.status === 'resolved' || body.status === 'dismissed') {
        updates.resolvedAt = new Date();
        auditAction = 'BIAS_TASK_RESOLVED';
      } else if (existing.resolvedAt) {
        // Re-opening a resolved task — clear the timestamp.
        updates.resolvedAt = null;
      }
    }

    if (
      typeof body.assigneeUserId === 'string' &&
      body.assigneeUserId !== existing.assigneeUserId
    ) {
      // Reassignment: only creator or org admin can move a task to a new
      // person. The new assignee must also be in the org.
      if (!isCreator && !isOrgAdmin) {
        return apiError({ error: 'Only the creator or an org admin can reassign', status: 403 });
      }
      if (existing.orgId) {
        const newAssignee = await prisma.teamMember.findFirst({
          where: { userId: body.assigneeUserId, orgId: existing.orgId },
          select: { id: true },
        });
        if (!newAssignee) {
          return apiError({
            error: 'New assignee must be a member of the organisation',
            status: 400,
          });
        }
      }
      updates.assigneeUserId = body.assigneeUserId;
      auditAction = 'BIAS_TASK_REASSIGNED';
    }

    if (typeof body.title === 'string') {
      if (!isCreator && !isOrgAdmin) {
        return apiError({ error: 'Only the creator can edit the title', status: 403 });
      }
      const trimmed = body.title.trim().slice(0, MAX_TITLE_CHARS);
      if (trimmed.length === 0) return apiError({ error: 'Title required', status: 400 });
      updates.title = trimmed;
    }

    if (body.description !== undefined) {
      if (!isCreator && !isOrgAdmin) {
        return apiError({ error: 'Only the creator can edit the description', status: 403 });
      }
      updates.description =
        body.description && body.description.trim().length > 0
          ? body.description.trim().slice(0, MAX_DESCRIPTION_CHARS)
          : null;
    }

    if (body.dueAt !== undefined) {
      if (!isCreator && !isOrgAdmin) {
        return apiError({ error: 'Only the creator can change due date', status: 403 });
      }
      if (body.dueAt === null) {
        updates.dueAt = null;
      } else {
        const d = new Date(body.dueAt);
        if (isNaN(d.getTime())) {
          return apiError({ error: 'dueAt must be a valid ISO date string', status: 400 });
        }
        updates.dueAt = d;
      }
    }

    if (typeof body.resolutionNote === 'string') {
      // Resolution notes are author-by-assignee territory — useful when an
      // assignee marks resolved with a "what they did" note.
      if (!isAssignee && !isCreator && !isOrgAdmin) {
        return apiError({ error: 'Forbidden', status: 403 });
      }
      updates.resolutionNote = body.resolutionNote.trim().slice(0, MAX_RESOLUTION_CHARS) || null;
    }

    if (Object.keys(updates).length === 0) {
      return apiError({ error: 'Nothing to update', status: 400 });
    }

    const updated = await prisma.biasTask.update({ where: { id }, data: updates });

    logAudit({
      action: auditAction,
      resource: 'bias_task',
      resourceId: id,
      details: {
        biasInstanceId: existing.biasInstanceId,
        orgId: existing.orgId,
        changes: Object.keys(updates),
      },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ task: updated });
  } catch (err) {
    log.error('bias-task PATCH failed', err as Error);
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
    const existing = await prisma.biasTask.findUnique({ where: { id } });
    if (!existing) return apiError({ error: 'Not found', status: 404 });

    const isCreator = existing.createdByUserId === user.id;
    const isOrgAdmin = await userIsOrgAdmin(user.id, existing.orgId);
    if (!isCreator && !isOrgAdmin) {
      return apiError({ error: 'Forbidden', status: 403 });
    }

    await prisma.biasTask.delete({ where: { id } });

    logAudit({
      action: 'BIAS_TASK_DELETED',
      resource: 'bias_task',
      resourceId: id,
      details: { biasInstanceId: existing.biasInstanceId, orgId: existing.orgId },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('bias-task DELETE failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}
