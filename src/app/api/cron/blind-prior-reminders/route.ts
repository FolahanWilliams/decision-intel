/**
 * Pre-IC blind-prior reminder cron (4.1 deep).
 *
 * GET /api/cron/blind-prior-reminders — for every open room with a
 * blindPriorDeadline in the next 12h, fire a one-time reminder email
 * to invitees who haven't submitted (and haven't already been
 * reminded in this cycle).
 *
 * Protected by CRON_SECRET. Recommended schedule: every 30 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { sendEmail } from '@/lib/notifications/email';
import { logAudit } from '@/lib/audit';

const log = createLogger('BlindPriorReminderCron');

export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET?.trim();
const REMIND_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function resolveEmail(invite: {
  email: string | null;
  userId: string | null;
}): Promise<string | null> {
  if (invite.email) return invite.email;
  if (!invite.userId) return null;
  try {
    const supabaseAdmin = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    const adminClient = supabaseAdmin.createClient(url, serviceKey);
    const { data } = await adminClient.auth.admin.getUserById(invite.userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token || !safeCompare(token, CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const horizon = new Date(now + REMIND_WINDOW_MS);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  try {
    const rooms = await prisma.decisionRoom.findMany({
      where: {
        status: 'open',
        blindPriorRevealedAt: null,
        blindPriorDeadline: {
          not: null,
          gte: new Date(now),
          lte: horizon,
        },
      },
      select: {
        id: true,
        title: true,
        blindPriorDeadline: true,
        blindPriorOutcomeFrame: true,
        decisionRoomInvites: {
          where: {
            usedAt: null,
            remindedAt: null,
            role: 'voter',
            tokenExpiresAt: { gte: new Date(now) },
          },
          select: {
            id: true,
            userId: true,
            email: true,
            displayName: true,
            submissionToken: true,
          },
        },
      },
    });

    for (const room of rooms) {
      processed += 1;
      for (const invite of room.decisionRoomInvites) {
        const recipientEmail = await resolveEmail({
          email: invite.email,
          userId: invite.userId,
        });
        if (!recipientEmail) {
          skipped += 1;
          continue;
        }

        const surveyUrl = `${appUrl}/shared/blind-prior/${encodeURIComponent(invite.submissionToken)}`;
        const deadlineDisplay =
          room.blindPriorDeadline?.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
          }) || 'soon';
        const subject = `Reminder: blind prior due ${deadlineDisplay}`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:560px; margin:0 auto;">
            <div style="background:#0f0f23; padding:24px; border-radius:12px; color:#e2e8f0;">
              <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#eab308; font-weight:700; margin-bottom:8px;">Decision Intel · Reminder</div>
              <h2 style="margin:0 0 16px; color:#fff;">${escapeHtml(room.title)}</h2>
              <p style="color:#94a3b8; margin:0 0 18px;">
                The pre-IC blind-prior survey is due <strong style="color:#fff;">${deadlineDisplay}</strong>.
                Submit before the deadline so the room can reveal a complete aggregate.
              </p>
              <a href="${surveyUrl}" style="display:inline-block; padding:12px 24px; background:#16A34A; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">
                Submit your blind prior
              </a>
              <p style="color:#64748b; font-size:12px; margin-top:24px;">
                This is the only reminder you'll receive for this room.
              </p>
            </div>
          </div>
        `;
        const result = await sendEmail({
          to: recipientEmail,
          subject,
          html,
          includeUnsubscribe: false,
        });
        if (result === 'sent' || result === 'dry_run') {
          await prisma.decisionRoomInvite.update({
            where: { id: invite.id },
            data: { remindedAt: new Date() },
          });
          if (result === 'sent') sent += 1;
        } else {
          skipped += 1;
        }
      }
      await logAudit({
        action: 'BLIND_PRIOR_REMINDER_SENT',
        resource: 'decision_room',
        resourceId: room.id,
        details: {
          inviteCount: room.decisionRoomInvites.length,
          deadline: room.blindPriorDeadline?.toISOString() ?? null,
        },
      }).catch(err => log.warn('blind-prior reminder audit log failed:', err));
    }

    log.info(`Blind-prior reminder cron: rooms=${rooms.length} sent=${sent} skipped=${skipped}`);
    return NextResponse.json({
      ok: true,
      processed,
      sent,
      skipped,
      durationMs: Date.now() - now,
    });
  } catch (err) {
    log.error('Reminder cron failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
