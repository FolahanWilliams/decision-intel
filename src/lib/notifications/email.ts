/**
 * Email notification service
 *
 * Uses a lightweight HTTP-based approach that works with any SMTP relay
 * or transactional email API (Resend, SendGrid, Postmark).
 *
 * Set EMAIL_FROM and RESEND_API_KEY in env to enable.
 * Falls back to logging when credentials are missing.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('EmailNotifications');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Decision Intel <notifications@decisionintel.app>';

/** Whether email delivery is configured (RESEND_API_KEY is set). */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Escape HTML entities to prevent XSS in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    log.warn(`[DRY RUN] Email not sent (RESEND_API_KEY not configured): ${payload.subject}`);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      log.error(`Resend API error: ${res.status} ${err}`);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Email send failed:', error);
    return false;
  }
}

async function logNotification(
  userId: string,
  channel: string,
  type: string,
  subject: string,
  success: boolean,
  error?: string
) {
  try {
    await prisma.notificationLog.create({
      data: {
        userId,
        channel,
        type,
        subject,
        status: success ? 'sent' : 'failed',
        error,
      },
    });
  } catch {
    // Schema drift — NotificationLog table may not exist yet
    log.warn('Failed to log notification (table may not exist)');
  }
}

/**
 * Send analysis completion notification to user.
 */
export async function notifyAnalysisComplete(
  userId: string,
  email: string,
  documentName: string,
  score: number,
  analysisId: string
) {
  // Check user settings
  const settings = await prisma.userSettings
    .findUnique({ where: { userId } })
    .catch((err: unknown) => {
      log.warn('Failed to fetch user settings:', err instanceof Error ? err.message : String(err));
      return null;
    });
  if (settings && !settings.analysisAlerts) return; // User opted out

  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const scoreLabel = score >= 70 ? 'Good' : score >= 40 ? 'Moderate Risk' : 'High Risk';

  const safeName = escapeHtml(documentName);
  const subject = `Analysis Complete: ${documentName} (${Math.round(score)}/100)`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="margin: 0 0 16px; color: #fff;">Analysis Complete</h2>
        <p style="color: #94a3b8; margin: 0 0 20px;">Your document has been analyzed.</p>

        <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 14px; color: #94a3b8; margin-bottom: 4px;">Document</div>
          <div style="font-weight: 600; color: #fff;">${safeName}</div>
        </div>

        <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 14px; color: #94a3b8; margin-bottom: 4px;">Decision Quality Score</div>
          <div style="font-size: 28px; font-weight: 700; color: ${scoreColor};">${Math.round(score)}/100</div>
          <div style="font-size: 13px; color: ${scoreColor};">${scoreLabel}</div>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/documents/${analysisId}"
           style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          View Full Analysis
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you have analysis alerts enabled in your
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/settings" style="color: #6366f1;">settings</a>.
        </p>
      </div>
    </div>
  `;

  const success = await sendEmail({ to: email, subject, html });
  await logNotification(userId, 'email', 'analysis_complete', subject, success);
}

/**
 * Send weekly digest email summarizing activity.
 */
export async function sendWeeklyDigest(
  userId: string,
  email: string,
  stats: {
    documentsAnalyzed: number;
    avgScore: number;
    topBiases: string[];
    nudgesReceived: number;
  }
) {
  const settings = await prisma.userSettings
    .findUnique({ where: { userId } })
    .catch((err: unknown) => {
      log.warn('Failed to fetch user settings:', err instanceof Error ? err.message : String(err));
      return null;
    });
  if (settings && !settings.weeklyDigest) return;

  const subject = `Your Weekly Decision Intel Digest`;
  const biasHtml =
    stats.topBiases.length > 0
      ? stats.topBiases.map(b => `<li style="color: #e2e8f0;">${escapeHtml(b)}</li>`).join('')
      : '<li style="color: #94a3b8;">No biases detected this week</li>';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="margin: 0 0 16px; color: #fff;">Weekly Digest</h2>
        <p style="color: #94a3b8; margin: 0 0 20px;">Here&rsquo;s your decision intelligence summary for the past week.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="background: #1a1a2e; padding: 14px; border-radius: 8px;">
            <div style="font-size: 12px; color: #94a3b8;">Documents Analyzed</div>
            <div style="font-size: 24px; font-weight: 700; color: #6366f1;">${stats.documentsAnalyzed}</div>
          </div>
          <div style="background: #1a1a2e; padding: 14px; border-radius: 8px;">
            <div style="font-size: 12px; color: #94a3b8;">Avg Score</div>
            <div style="font-size: 24px; font-weight: 700; color: ${stats.avgScore >= 70 ? '#22c55e' : stats.avgScore >= 40 ? '#eab308' : '#ef4444'};">
              ${stats.avgScore > 0 ? Math.round(stats.avgScore) : '—'}
            </div>
          </div>
          <div style="background: #1a1a2e; padding: 14px; border-radius: 8px;">
            <div style="font-size: 12px; color: #94a3b8;">Nudges Received</div>
            <div style="font-size: 24px; font-weight: 700; color: #eab308;">${stats.nudgesReceived}</div>
          </div>
          <div style="background: #1a1a2e; padding: 14px; border-radius: 8px;">
            <div style="font-size: 12px; color: #94a3b8;">Top Biases</div>
            <ul style="margin: 4px 0 0; padding-left: 16px; font-size: 13px;">${biasHtml}</ul>
          </div>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard"
           style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Go to Dashboard
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you have weekly digest enabled in your
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/settings" style="color: #6366f1;">settings</a>.
        </p>
      </div>
    </div>
  `;

  const success = await sendEmail({ to: email, subject, html });
  await logNotification(userId, 'email', 'weekly_digest', subject, success);
}

/**
 * Send team invite notification email.
 */
export async function notifyTeamInvite(
  inviteeEmail: string,
  inviterName: string,
  orgName: string,
  inviteToken: string
) {
  const safeInviter = escapeHtml(inviterName);
  const safeOrg = escapeHtml(orgName);
  const subject = `You've been invited to join ${orgName} on Decision Intel`;
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/invite/${inviteToken}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="margin: 0 0 16px; color: #fff;">Team Invitation</h2>
        <p style="color: #94a3b8; margin: 0 0 20px;">
          <strong>${safeInviter}</strong> has invited you to join <strong>${safeOrg}</strong> on Decision Intel.
        </p>

        <a href="${acceptUrl}"
           style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Accept Invitation
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          This invitation expires in 7 days. If you didn&rsquo;t expect this, you can safely ignore it.
        </p>
      </div>
    </div>
  `;

  const success = await sendEmail({ to: inviteeEmail, subject, html });
  // Log under a system user since invitee may not have an account yet
  try {
    await prisma.notificationLog.create({
      data: {
        userId: 'system',
        channel: 'email',
        type: 'invite',
        subject,
        status: success ? 'sent' : 'failed',
      },
    });
  } catch (err) {
    // Schema drift — NotificationLog table may not exist yet
    log.warn(
      'Failed to log invite notification:',
      err instanceof Error ? err.message : String(err)
    );
  }
}

/**
 * Send nudge via email channel.
 */
export async function deliverEmailNudge(
  userId: string,
  email: string,
  nudgeMessage: string,
  nudgeType: string,
  severity: string
) {
  const settings = await prisma.userSettings
    .findUnique({ where: { userId } })
    .catch((err: unknown) => {
      log.warn('Failed to fetch user settings:', err instanceof Error ? err.message : String(err));
      return null;
    });
  if (settings && !settings.emailNotifications) return;

  const severityColor =
    severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#eab308' : '#6366f1';

  const subject = `Decision Nudge: ${nudgeType.replace(/_/g, ' ')}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <div style="display: inline-block; padding: 3px 10px; background: ${severityColor}22; border: 1px solid ${severityColor}44; border-radius: 12px; font-size: 12px; color: ${severityColor}; font-weight: 600; margin-bottom: 16px;">
          ${severity.toUpperCase()}
        </div>
        <h2 style="margin: 0 0 12px; color: #fff;">Cognitive Bias Alert</h2>
        <p style="color: #e2e8f0; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(nudgeMessage)}</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/nudges"
           style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          View All Nudges
        </a>
      </div>
    </div>
  `;

  const success = await sendEmail({ to: email, subject, html });
  await logNotification(userId, 'email', 'nudge', subject, success);
}

/**
 * Look up a user's email via Supabase admin API.
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      log.warn('Missing Supabase credentials for admin email lookup');
      return null;
    }
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data } = await supabase.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch (e) {
    log.warn(
      `Could not fetch email for user ${userId}: ${e instanceof Error ? e.message : String(e)}`
    );
    return null;
  }
}

/**
 * Send outcome reminder email to a user with overdue decision outcomes.
 */
export async function notifyOutcomeReminder(
  userId: string,
  items: Array<{ analysisId: string; filename: string }>
): Promise<void> {
  const settings = await prisma.userSettings
    .findUnique({ where: { userId } })
    .catch((err: unknown) => {
      log.warn('Failed to fetch user settings:', err instanceof Error ? err.message : String(err));
      return null;
    });
  if (settings && !settings.emailNotifications) return;

  const email = await getUserEmail(userId);
  if (!email) {
    log.warn(`Cannot send outcome reminder — no email found for user ${userId}`);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const count = items.length;
  const subject = `You have ${count} decision outcome${count > 1 ? 's' : ''} to report`;

  const itemsHtml = items
    .map(
      item => `
        <tr>
          <td style="padding: 10px 14px; color: #e2e8f0; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
            ${escapeHtml(item.filename)}
          </td>
          <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <a href="${appUrl}/documents/${item.analysisId}"
               style="color: #6366f1; font-size: 13px; font-weight: 500; text-decoration: none;">
              Report Outcome
            </a>
          </td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="margin: 0 0 8px; color: #fff;">Outcome Reminder</h2>
        <p style="color: #94a3b8; margin: 0 0 20px;">
          ${count} decision${count > 1 ? 's are' : ' is'} waiting for outcome reporting.
          Logging outcomes helps calibrate your future analyses.
        </p>

        <table style="width: 100%; background: #1a1a2e; border-radius: 8px; border-collapse: collapse; margin-bottom: 20px;">
          ${itemsHtml}
        </table>

        <a href="${appUrl}/dashboard"
           style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Go to Dashboard
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you have email notifications enabled in your
          <a href="${appUrl}/dashboard/settings" style="color: #6366f1;">settings</a>.
        </p>
      </div>
    </div>
  `;

  const success = await sendEmail({ to: email, subject, html });
  await logNotification(userId, 'email', 'outcome_reminder', subject, success);
}
