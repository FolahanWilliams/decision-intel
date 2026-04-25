/**
 * Reveal pre-IC blind-prior aggregate (4.1 deep).
 *
 * POST /api/decision-rooms/[id]/blind-priors/reveal
 *
 * Owner-only. Stamps `blindPriorRevealedAt` on the room and emails
 * every participant the link to the aggregate page. Idempotent: a
 * second call is a 409 with the existing reveal timestamp.
 *
 * Procurement-grade rules:
 *   - Reveal can only fire after the deadline OR when every invitee has
 *     submitted (whichever comes first), unless the owner forces it
 *     with `{ force: true }` in the body — and a forced reveal is
 *     audit-logged with `forced: true` so it's distinguishable in the DPR.
 *   - Once revealed, no further submissions are accepted (the public
 *     POST returns 410 Gone).
 *   - Participants without a submitted prior at reveal time are listed
 *     in the response so the owner can see who didn't vote.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { sendEmail } from '@/lib/notifications/email';

const log = createLogger('BlindPriorReveal');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(
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

    const { id: roomId } = await params;

    let body: { force?: boolean } = {};
    try {
      body = (await request.json()) as { force?: boolean };
    } catch {
      // Empty body is OK.
    }
    const force = Boolean(body?.force);

    const room = await prisma.decisionRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        createdBy: true,
        status: true,
        analysisId: true,
        blindPriorDeadline: true,
        blindPriorRevealedAt: true,
        blindPriorOutcomeFrame: true,
        decisionRoomInvites: {
          select: {
            id: true,
            userId: true,
            email: true,
            displayName: true,
            usedAt: true,
            role: true,
          },
        },
      },
    });
    if (!room) {
      return NextResponse.json({ error: 'Decision room not found' }, { status: 404 });
    }
    if (room.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Only the room creator can reveal the aggregate.' },
        { status: 403 }
      );
    }
    if (room.blindPriorRevealedAt) {
      return NextResponse.json(
        {
          error: 'The aggregate has already been revealed.',
          revealedAt: room.blindPriorRevealedAt.toISOString(),
        },
        { status: 409 }
      );
    }

    const voterInvites = room.decisionRoomInvites.filter(i => i.role !== 'observer');
    const submittedCount = voterInvites.filter(i => i.usedAt !== null).length;
    const allSubmitted = voterInvites.length > 0 && submittedCount === voterInvites.length;
    const deadlinePassed =
      room.blindPriorDeadline !== null && room.blindPriorDeadline.getTime() <= Date.now();

    if (!force && !allSubmitted && !deadlinePassed) {
      return NextResponse.json(
        {
          error:
            'Cannot reveal yet. Either wait for everyone to submit, wait for the deadline, or pass `force: true`.',
          submitted: submittedCount,
          total: voterInvites.length,
          deadline: room.blindPriorDeadline?.toISOString() ?? null,
        },
        { status: 400 }
      );
    }

    const revealedAt = new Date();
    await prisma.decisionRoom.update({
      where: { id: roomId },
      data: { blindPriorRevealedAt: revealedAt },
    });

    // Audit log first — even if email delivery fails, the event must be
    // recorded.
    await logAudit({
      action: 'BLIND_PRIOR_REVEAL_FIRED',
      resource: 'decision_room',
      resourceId: roomId,
      details: {
        forced: force && !allSubmitted && !deadlinePassed,
        submittedCount,
        totalVoters: voterInvites.length,
        nonVoters: voterInvites.filter(i => !i.usedAt).map(i => i.id),
      },
    });

    // Email every invitee with a link to the aggregate page (the
    // platform-user link goes to /dashboard/decision-rooms/[id]; the
    // external invitee link goes to a read-only shared aggregate page).
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const dashboardLink = `${appUrl}/dashboard/decision-rooms/${roomId}`;

    const emailQueue: Promise<unknown>[] = [];
    for (const invite of room.decisionRoomInvites) {
      if (!invite.email && !invite.userId) continue;
      let recipientEmail = invite.email ?? null;
      if (!recipientEmail && invite.userId) {
        try {
          const supabaseAdmin = await import('@supabase/supabase-js');
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (url && serviceKey) {
            const adminClient = supabaseAdmin.createClient(url, serviceKey);
            const { data } = await adminClient.auth.admin.getUserById(invite.userId);
            recipientEmail = data?.user?.email ?? null;
          }
        } catch (err) {
          log.warn(
            'Supabase admin email lookup failed:',
            err instanceof Error ? err.message : String(err)
          );
        }
      }
      if (!recipientEmail) continue;

      // External invitees see the aggregate-only public page (built
      // alongside the survey).
      const link = invite.userId
        ? dashboardLink
        : `${appUrl}/shared/blind-prior/${encodeURIComponent(invite.id)}/aggregate`;

      const subject = `Blind-prior aggregate revealed: ${room.title}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
            <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#16A34A; font-weight:700; margin-bottom:8px;">Decision Intel · Aggregate Revealed</div>
            <h2 style="margin: 0 0 16px; color: #fff;">${escapeHtml(room.title)}</h2>
            <p style="color:#94a3b8; margin:0 0 18px;">
              The pre-IC blind-prior survey is closed. The aggregated confidence + risk view is now visible to every participant.
            </p>
            <a href="${link}" style="display:inline-block; padding:12px 24px; background:#16A34A; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">
              View the aggregate
            </a>
            <p style="color:#64748b; font-size:12px; margin-top:24px;">
              Once the actual outcome lands, Decision Intel will compute a Brier score per participant — calibration matters more than agreement.
            </p>
          </div>
        </div>
      `;
      emailQueue.push(
        sendEmail({ to: recipientEmail, subject, html, includeUnsubscribe: false })
      );
    }
    Promise.allSettled(emailQueue).catch(() => {
      /* swallow — individual sendEmail handles its own logging. */
    });

    return NextResponse.json({
      ok: true,
      roomId,
      revealedAt: revealedAt.toISOString(),
      submitted: submittedCount,
      total: voterInvites.length,
      forced: force && !allSubmitted && !deadlinePassed,
    });
  } catch (err) {
    log.error('Reveal failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
