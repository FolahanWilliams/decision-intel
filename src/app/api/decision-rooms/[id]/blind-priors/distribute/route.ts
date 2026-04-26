/**
 * Distribute pre-IC blind-prior survey (4.1 deep).
 *
 * POST /api/decision-rooms/[id]/blind-priors/distribute
 *
 * Owner-only. Body shape:
 *   {
 *     deadline: ISO string (required, > now),
 *     outcomeFrame?: string (optional, ≤500 chars),
 *     invitees: Array<
 *       | { userId: string; displayName?: string; role?: 'voter' | 'observer' }
 *       | { email: string; displayName?: string; role?: 'voter' | 'observer' }
 *     >,
 *     channel?: 'email' | 'slack' | 'both' (default: 'email')
 *   }
 *
 * Side effects:
 *   - Stamps `blindPriorDeadline` + `blindPriorOutcomeFrame` on the room.
 *   - Upserts a `DecisionRoomInvite` per invitee (single-use signed token,
 *     14-day max expiry capped to the deadline + 24h).
 *   - Sends a magic-link email per invitee (Resend; falls back to dry-run
 *     when `RESEND_API_KEY` is unset).
 *   - Audit-logs `BLIND_PRIOR_INVITES_DISTRIBUTED`.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { logAudit } from '@/lib/audit';
import { sendEmail } from '@/lib/notifications/email';

const log = createLogger('BlindPriorDistribute');

const MAX_INVITEES = 50;
const HARD_CAP_DAYS = 14;

interface InviteeInput {
  userId?: string;
  email?: string;
  displayName?: string;
  role?: 'voter' | 'observer';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateToken(): string {
  // 32 bytes → 43-char base64url, plenty of entropy for a single-use
  // submission token. Stored verbatim; uniqueness enforced at the
  // schema level.
  return crypto.randomBytes(32).toString('base64url');
}

function buildInviteEmail({
  inviterName,
  roomTitle,
  outcomeFrame,
  deadlineIso,
  surveyUrl,
}: {
  inviterName: string;
  roomTitle: string;
  outcomeFrame: string | null;
  deadlineIso: string;
  surveyUrl: string;
}): { subject: string; html: string } {
  const safeTitle = escapeHtml(roomTitle);
  const safeFrame = outcomeFrame ? escapeHtml(outcomeFrame) : null;
  const safeInviter = escapeHtml(inviterName);
  const deadlineDisplay = new Date(deadlineIso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  const subject = `Pre-IC blind prior: ${roomTitle}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #16A34A; font-weight: 700; margin-bottom: 8px;">Decision Intel · Pre-IC Survey</div>
        <h2 style="margin: 0 0 16px; color: #fff;">${safeTitle}</h2>
        ${
          safeFrame
            ? `<p style="color:#cbd5f5; font-size:15px; line-height:1.5; margin:0 0 18px;">${safeFrame}</p>`
            : ''
        }
        <p style="color:#94a3b8; margin:0 0 18px; font-size:14px;">
          ${safeInviter} has asked you to submit a blind prior <strong style="color:#fff;">before</strong> the meeting.
          You'll see no one else's confidence or risks until everyone has submitted (or the room owner reveals).
          The platform also computes a Brier score per participant once the actual outcome is known — calibration matters more than agreement.
        </p>
        <p style="color:#94a3b8; margin:0 0 24px; font-size:14px;">
          <strong style="color:#fff;">Deadline:</strong> ${deadlineDisplay}
        </p>
        <a href="${surveyUrl}" style="display:inline-block; padding:12px 24px; background:#16A34A; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
          Submit your blind prior
        </a>
        <p style="color:#64748b; font-size:12px; margin-top:24px;">
          This link is single-use and expires at the deadline. Forwarding it to a colleague would let them submit on your behalf — please don't.
        </p>
      </div>
    </div>
  `;
  return { subject, html };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = await params;

    const rateLimitResult = await checkRateLimit(user.id, '/api/blind-priors/distribute', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const { deadline, outcomeFrame, invitees, channel } = body as {
      deadline?: unknown;
      outcomeFrame?: unknown;
      invitees?: unknown;
      channel?: unknown;
    };

    if (typeof deadline !== 'string') {
      return NextResponse.json({ error: 'deadline (ISO string) is required' }, { status: 400 });
    }
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ error: 'deadline must be a valid ISO date' }, { status: 400 });
    }
    if (deadlineDate.getTime() <= Date.now() + 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'deadline must be at least 5 minutes in the future' },
        { status: 400 }
      );
    }
    const cap = Date.now() + HARD_CAP_DAYS * 24 * 60 * 60 * 1000;
    if (deadlineDate.getTime() > cap) {
      return NextResponse.json(
        { error: `deadline cannot be more than ${HARD_CAP_DAYS} days from now` },
        { status: 400 }
      );
    }

    if (!Array.isArray(invitees) || invitees.length === 0) {
      return NextResponse.json({ error: 'invitees must be a non-empty array' }, { status: 400 });
    }
    if (invitees.length > MAX_INVITEES) {
      return NextResponse.json(
        { error: `Too many invitees (max ${MAX_INVITEES} per distribution)` },
        { status: 400 }
      );
    }
    const cleaned: InviteeInput[] = [];
    for (const raw of invitees) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as InviteeInput;
      if (typeof r.userId === 'string' && r.userId.length > 0) {
        cleaned.push({
          userId: r.userId,
          displayName: typeof r.displayName === 'string' ? r.displayName.slice(0, 80) : undefined,
          role: r.role === 'observer' ? 'observer' : 'voter',
        });
      } else if (typeof r.email === 'string' && /.+@.+\..+/.test(r.email)) {
        cleaned.push({
          email: r.email.toLowerCase().trim(),
          displayName: typeof r.displayName === 'string' ? r.displayName.slice(0, 80) : undefined,
          role: r.role === 'observer' ? 'observer' : 'voter',
        });
      }
    }
    if (cleaned.length === 0) {
      return NextResponse.json(
        { error: 'No valid invitees (each entry needs userId or email).' },
        { status: 400 }
      );
    }

    const trimmedFrame =
      typeof outcomeFrame === 'string' ? outcomeFrame.trim().slice(0, 500) : null;

    const room = await prisma.decisionRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        createdBy: true,
        status: true,
        analysisId: true,
        documentId: true,
        blindPriorRevealedAt: true,
      },
    });
    if (!room) {
      return NextResponse.json({ error: 'Decision room not found' }, { status: 404 });
    }
    if (room.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Only the room creator can distribute the blind-prior survey.' },
        { status: 403 }
      );
    }
    if (room.status !== 'open') {
      return NextResponse.json(
        { error: 'Room is not open. Reopen it before distributing a survey.' },
        { status: 400 }
      );
    }
    if (room.blindPriorRevealedAt) {
      return NextResponse.json(
        { error: 'The aggregate has already been revealed for this room.' },
        { status: 400 }
      );
    }

    // Update the room's deadline + outcome frame.
    await prisma.decisionRoom.update({
      where: { id: roomId },
      data: {
        blindPriorDeadline: deadlineDate,
        blindPriorOutcomeFrame: trimmedFrame ?? null,
      },
    });

    // Token expiry — capped to deadline + 24h so a token never lives
    // beyond the natural close window. The 24h grace covers late
    // submissions if the owner extends the deadline by a day.
    const tokenExpiresAt = new Date(Math.min(deadlineDate.getTime() + 24 * 60 * 60 * 1000, cap));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const deliveryChannel = channel === 'slack' || channel === 'both' ? channel : 'email';

    const inviterName = user.email?.split('@')[0] || 'A teammate';
    const created: Array<{
      id: string;
      channel: 'email' | 'dry_run' | 'failed';
      recipient: string;
    }> = [];

    for (const invitee of cleaned) {
      const submissionToken = generateToken();

      // Upsert path: an invitee already exists when re-distributing.
      // We rotate the token + extend expiry but never reset usedAt — if
      // they already submitted, the new link is harmless because the
      // public POST returns the existing prior on a re-played token.
      let invite;
      try {
        invite = await prisma.decisionRoomInvite.upsert({
          where: invitee.userId
            ? { roomId_userId: { roomId, userId: invitee.userId } }
            : { roomId_email: { roomId, email: invitee.email! } },
          create: {
            roomId,
            userId: invitee.userId ?? null,
            email: invitee.email ?? null,
            displayName: invitee.displayName ?? null,
            role: invitee.role ?? 'voter',
            submissionToken,
            tokenExpiresAt,
          },
          update: {
            displayName: invitee.displayName ?? undefined,
            role: invitee.role ?? undefined,
            submissionToken,
            tokenExpiresAt,
            sentAt: new Date(),
            // remindedAt cleared so the cron re-sends a 12h reminder
            // for this fresh token.
            remindedAt: null,
          },
        });
      } catch (err) {
        log.warn(
          'Failed to upsert invite for ' +
            (invitee.userId ?? invitee.email ?? 'unknown') +
            ': ' +
            (err instanceof Error ? err.message : String(err))
        );
        continue;
      }

      const surveyUrl = `${appUrl}/shared/blind-prior/${encodeURIComponent(submissionToken)}`;

      // Resolve the recipient's email. For external invitees this is the
      // email field directly. For platform users, fall back to the
      // displayName + supabase email lookup.
      let recipientEmail = invitee.email ?? null;
      if (!recipientEmail && invitee.userId) {
        try {
          const supabaseAdmin = await import('@supabase/supabase-js');
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (url && serviceKey) {
            const adminClient = supabaseAdmin.createClient(url, serviceKey);
            const { data } = await adminClient.auth.admin.getUserById(invitee.userId);
            recipientEmail = data?.user?.email ?? null;
          }
        } catch (err) {
          log.warn(
            'Supabase admin email lookup failed:',
            err instanceof Error ? err.message : String(err)
          );
        }
      }

      let deliveryStatus: 'email' | 'dry_run' | 'failed' = 'failed';
      if (recipientEmail && (deliveryChannel === 'email' || deliveryChannel === 'both')) {
        const { subject, html } = buildInviteEmail({
          inviterName,
          roomTitle: room.title,
          outcomeFrame: trimmedFrame,
          deadlineIso: deadlineDate.toISOString(),
          surveyUrl,
        });
        const result = await sendEmail({
          to: recipientEmail,
          subject,
          html,
          includeUnsubscribe: false, // Operational, not marketing.
        });
        deliveryStatus = result === 'sent' ? 'email' : result === 'dry_run' ? 'dry_run' : 'failed';
      }

      // Slack DM-by-userId path is intentionally not wired here.
      // `deliverSlackNudge` expects a pre-built `chat.postMessage`
      // payload keyed off a Slack channel ID — resolving a Slack DM
      // channel from a Decision Intel userId requires the Slack
      // user-installation lookup that the existing nudge dispatcher
      // owns. To keep this feature shippable in the procurement window,
      // we route invites + reminders via email and surface a Slack
      // nudge separately when the existing nudge dispatcher fires for
      // the room owner. Future work: thread blind-prior invites through
      // the existing user-channel resolver.
      void deliveryChannel;

      created.push({
        id: invite.id,
        channel: deliveryStatus,
        recipient: recipientEmail ?? invitee.userId ?? invitee.email ?? 'unknown',
      });
    }

    await logAudit({
      action: 'BLIND_PRIOR_INVITES_DISTRIBUTED',
      resource: 'decision_room',
      resourceId: roomId,
      details: {
        inviteCount: created.length,
        deadline: deadlineDate.toISOString(),
        channel: deliveryChannel,
      },
    });

    return NextResponse.json({
      ok: true,
      roomId,
      deadline: deadlineDate.toISOString(),
      outcomeFrame: trimmedFrame,
      sent: created,
    });
  } catch (err) {
    log.error('Distribute failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
