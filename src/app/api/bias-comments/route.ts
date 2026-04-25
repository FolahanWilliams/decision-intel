import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { resolveBiasInstanceAccess, resolveMentions } from '@/lib/utils/bias-access';

const log = createLogger('BiasCommentsRoute');

// GET  /api/bias-comments?biasInstanceId=X       → list thread (newest-first
//                                                   top-level + nested replies)
// POST /api/bias-comments                        → create top-level or reply

const MAX_BODY_CHARS = 4000;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    const biasInstanceId = req.nextUrl.searchParams.get('biasInstanceId');
    if (!biasInstanceId) {
      return apiError({ error: 'biasInstanceId query param required', status: 400 });
    }

    const access = await resolveBiasInstanceAccess(biasInstanceId, user.id);
    if (!access.ok) {
      return apiError({
        error: access.reason === 'not_found' ? 'Not found' : 'Forbidden',
        status: access.reason === 'not_found' ? 404 : 403,
      });
    }

    // Top-level (no parent) comments + their replies. We pull the whole
    // thread in one query and assemble client-side rather than streaming —
    // bias threads are small (typically <50 entries) and the network round-trip
    // dominates the assembly cost.
    const all = await prisma.biasComment.findMany({
      where: { biasInstanceId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        biasInstanceId: true,
        authorUserId: true,
        body: true,
        parentCommentId: true,
        mentions: true,
        resolvedAt: true,
        resolvedByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Resolve author display info (email / displayName) via TeamMember if the
    // author is in the same org. Fall back to "you" for self, "User" for
    // unknowns. Single batched lookup per request.
    const authorIds = Array.from(new Set(all.map(c => c.authorUserId)));
    const members =
      authorIds.length > 0 && access.orgId
        ? await prisma.teamMember.findMany({
            where: { orgId: access.orgId, userId: { in: authorIds } },
            select: { userId: true, displayName: true, email: true },
          })
        : [];
    const authorMap = new Map(members.map(m => [m.userId, m]));

    return NextResponse.json({
      comments: all.map(c => ({
        ...c,
        author: {
          userId: c.authorUserId,
          isSelf: c.authorUserId === user.id,
          displayName: authorMap.get(c.authorUserId)?.displayName ?? null,
          email: authorMap.get(c.authorUserId)?.email ?? null,
        },
      })),
    });
  } catch (err) {
    log.error('bias-comments GET failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    // Per-user rate limit: 60 comment creates per hour. Generous enough for
    // an active discussion, tight enough to stop a script from flooding a
    // bias thread.
    const rate = await checkRateLimit(user.id, 'bias-comments-create', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 60,
      failMode: 'closed',
    });
    if (!rate.success) {
      return apiError({ error: 'Too many comments. Try again in a few minutes.', status: 429 });
    }

    const body = (await req.json().catch(() => null)) as {
      biasInstanceId?: string;
      body?: string;
      parentCommentId?: string | null;
    } | null;
    if (!body?.biasInstanceId || !body?.body) {
      return apiError({ error: 'biasInstanceId and body are required', status: 400 });
    }

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

    const access = await resolveBiasInstanceAccess(body.biasInstanceId, user.id);
    if (!access.ok) {
      return apiError({
        error: access.reason === 'not_found' ? 'Not found' : 'Forbidden',
        status: access.reason === 'not_found' ? 404 : 403,
      });
    }

    // If parentCommentId is set, verify the parent belongs to the same
    // bias-instance. Prevents reply-cross-thread injection.
    if (body.parentCommentId) {
      const parent = await prisma.biasComment.findUnique({
        where: { id: body.parentCommentId },
        select: { id: true, biasInstanceId: true },
      });
      if (!parent || parent.biasInstanceId !== body.biasInstanceId) {
        return apiError({ error: 'Parent comment not in this thread', status: 400 });
      }
    }

    const { userIds: mentionedUserIds, emails: mentionedEmails } = await resolveMentions(
      trimmed,
      access.orgId
    );

    const comment = await prisma.biasComment.create({
      data: {
        biasInstanceId: body.biasInstanceId,
        authorUserId: user.id,
        orgId: access.orgId,
        body: trimmed,
        parentCommentId: body.parentCommentId ?? null,
        mentions: mentionedUserIds,
      },
    });

    // Fire @mention Nudges fire-and-forget — never block the comment write
    // on a notification side-effect.
    if (mentionedUserIds.length > 0) {
      const previewBody = trimmed.length > 200 ? `${trimmed.slice(0, 197)}…` : trimmed;
      Promise.all(
        mentionedUserIds
          .filter(id => id !== user.id) // don't nudge the author for self-mentions
          .map(targetUserId =>
            prisma.nudge.create({
              data: {
                targetUserId,
                orgId: access.orgId,
                analysisId: access.analysisId,
                nudgeType: 'bias_comment_mention',
                triggerReason: 'mentioned_in_bias_comment',
                message: `You were mentioned on a flagged bias: "${previewBody}"`,
                channel: 'dashboard',
                severity: 'info',
              },
            })
          )
      ).catch(err => log.warn('bias-comment mention nudges failed:', err));
    }

    logAudit({
      action: 'BIAS_COMMENT_CREATED',
      resource: 'bias_comment',
      resourceId: comment.id,
      details: {
        biasInstanceId: body.biasInstanceId,
        analysisId: access.analysisId,
        documentId: access.documentId,
        orgId: access.orgId,
        mentionCount: mentionedUserIds.length,
        mentionedEmails,
      },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json(
      {
        comment: {
          ...comment,
          author: {
            userId: user.id,
            isSelf: true,
            displayName: null,
            email: user.email ?? null,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    log.error('bias-comments POST failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}
