import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { resolveBiasInstanceAccess } from '@/lib/utils/bias-access';
import { deliverSlackNudge } from '@/lib/integrations/slack/handler';

const log = createLogger('BiasTasksRoute');

// GET  /api/bias-tasks?biasInstanceId=X        → list tasks for a bias
// GET  /api/bias-tasks?assigneeUserId=X        → list tasks assigned to a user (org-scoped)
// POST /api/bias-tasks                          → create + notify assignee

const MAX_TITLE_CHARS = 240;
const MAX_DESCRIPTION_CHARS = 4000;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const biasInstanceId = req.nextUrl.searchParams.get('biasInstanceId');
    const assigneeUserId = req.nextUrl.searchParams.get('assigneeUserId');

    // Listing by bias-instance: standard access check.
    if (biasInstanceId) {
      const access = await resolveBiasInstanceAccess(biasInstanceId, user.id);
      if (!access.ok) {
        return apiError({
          error: access.reason === 'not_found' ? 'Not found' : 'Forbidden',
          status: access.reason === 'not_found' ? 404 : 403,
        });
      }
      const tasks = await prisma.biasTask.findMany({
        where: { biasInstanceId },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      });
      return NextResponse.json({ tasks });
    }

    // Listing by assignee — only the assignee themselves OR an org admin
    // sharing the org with the assignee can list.
    if (assigneeUserId) {
      if (assigneeUserId !== user.id) {
        // Org-admin path: find an Org both share where the caller is admin.
        const callerAdminOrgs = await prisma.teamMember.findMany({
          where: { userId: user.id, role: 'admin' },
          select: { orgId: true },
        });
        const orgIds = callerAdminOrgs.map(m => m.orgId);
        if (orgIds.length === 0) {
          return apiError({ error: 'Forbidden', status: 403 });
        }
        const sharedOrg = await prisma.teamMember.findFirst({
          where: { userId: assigneeUserId, orgId: { in: orgIds } },
          select: { id: true },
        });
        if (!sharedOrg) return apiError({ error: 'Forbidden', status: 403 });
      }
      const tasks = await prisma.biasTask.findMany({
        where: { assigneeUserId },
        orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      });
      return NextResponse.json({ tasks });
    }

    return apiError({
      error: 'biasInstanceId or assigneeUserId query param required',
      status: 400,
    });
  } catch (err) {
    log.error('bias-tasks GET failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const rate = await checkRateLimit(user.id, 'bias-tasks-create', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
      failMode: 'closed',
    });
    if (!rate.success) {
      return apiError({ error: 'Too many task assignments. Try again shortly.', status: 429 });
    }

    const body = (await req.json().catch(() => null)) as {
      biasInstanceId?: string;
      assigneeUserId?: string;
      title?: string;
      description?: string;
      dueAt?: string;
    } | null;
    if (!body?.biasInstanceId || !body?.assigneeUserId || !body?.title) {
      return apiError({
        error: 'biasInstanceId, assigneeUserId and title are required',
        status: 400,
      });
    }

    const title = body.title.trim().slice(0, MAX_TITLE_CHARS);
    if (title.length === 0) return apiError({ error: 'Title required', status: 400 });

    const description =
      typeof body.description === 'string' && body.description.trim().length > 0
        ? body.description.trim().slice(0, MAX_DESCRIPTION_CHARS)
        : null;

    let dueAt: Date | null = null;
    if (body.dueAt) {
      const d = new Date(body.dueAt);
      if (isNaN(d.getTime())) {
        return apiError({ error: 'dueAt must be a valid ISO date string', status: 400 });
      }
      dueAt = d;
    }

    const access = await resolveBiasInstanceAccess(body.biasInstanceId, user.id);
    if (!access.ok) {
      return apiError({
        error: access.reason === 'not_found' ? 'Not found' : 'Forbidden',
        status: access.reason === 'not_found' ? 404 : 403,
      });
    }

    // Assignee must be in the same org as the bias instance (or be the
    // document owner for personal docs). Prevents assigning to random
    // userIds from outside the org.
    if (access.orgId) {
      const assigneeMember = await prisma.teamMember.findFirst({
        where: { userId: body.assigneeUserId, orgId: access.orgId },
        select: { id: true, displayName: true, email: true },
      });
      if (!assigneeMember) {
        return apiError({
          error: "Assignee must be a member of the document's organisation",
          status: 400,
        });
      }
    } else if (body.assigneeUserId !== access.documentOwnerId) {
      // Personal doc: the only valid assignee is the owner themselves.
      // (Self-assignment is allowed — useful for "remind me to address this".)
      return apiError({
        error: 'Personal documents can only assign tasks to the owner',
        status: 400,
      });
    }

    const task = await prisma.biasTask.create({
      data: {
        biasInstanceId: body.biasInstanceId,
        orgId: access.orgId,
        assigneeUserId: body.assigneeUserId,
        createdByUserId: user.id,
        status: 'open',
        title,
        description,
        dueAt,
      },
    });

    // Fire-and-forget assignee notifications:
    //   1. In-app Nudge (always, primary delivery)
    //   2. Slack DM via the org's first monitoredChannel (best-effort)
    //
    // Both are deliberately non-blocking — a notification failure must not
    // fail the task write. Errors logged at warn so we can spot delivery
    // regressions in Sentry without taking the user-visible action down.
    void notifyAssignee({
      assigneeUserId: body.assigneeUserId,
      orgId: access.orgId,
      analysisId: access.analysisId,
      taskId: task.id,
      taskTitle: title,
      assignedByEmail: user.email ?? 'a teammate',
    }).catch(err => log.warn('assignee notify failed:', err));

    logAudit({
      action: 'BIAS_TASK_CREATED',
      resource: 'bias_task',
      resourceId: task.id,
      details: {
        biasInstanceId: body.biasInstanceId,
        analysisId: access.analysisId,
        documentId: access.documentId,
        orgId: access.orgId,
        assigneeUserId: body.assigneeUserId,
      },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    log.error('bias-tasks POST failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}

/**
 * Notify the assignee out-of-band. Both delivery paths are best-effort —
 * the in-app Nudge is the primary record (always written when the row goes
 * through), Slack is supplementary and only fires when the org has an
 * installation with at least one monitored channel.
 */
async function notifyAssignee(args: {
  assigneeUserId: string;
  orgId: string | null;
  analysisId: string;
  taskId: string;
  taskTitle: string;
  assignedByEmail: string;
}) {
  const { assigneeUserId, orgId, analysisId, taskId, taskTitle, assignedByEmail } = args;

  // 1. In-app Nudge — primary delivery.
  await prisma.nudge.create({
    data: {
      targetUserId: assigneeUserId,
      orgId,
      analysisId,
      nudgeType: 'bias_task_assigned',
      triggerReason: 'bias_task_assignment',
      message: `${assignedByEmail} assigned you a bias-investigation task: "${taskTitle}"`,
      channel: 'dashboard',
      severity: 'info',
    },
  });

  // 2. Slack DM via org installation, if any.
  if (!orgId) return;
  const install = await prisma.slackInstallation
    .findFirst({
      where: { orgId, status: 'active' },
      select: { teamId: true, monitoredChannels: true },
    })
    .catch(() => null);
  if (!install || install.monitoredChannels.length === 0) return;

  const targetChannel = install.monitoredChannels[0];
  await deliverSlackNudge(
    {
      channel: targetChannel,
      text: `:bulb: New Decision Intel task: "${taskTitle}" — assigned by ${assignedByEmail}. Open in-app to review the underlying bias and suggest mitigation. Task id: ${taskId}`,
    },
    install.teamId
  ).catch(err => log.warn('slack delivery failed for bias task:', err));
}
