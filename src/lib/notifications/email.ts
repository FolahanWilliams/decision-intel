/**
 * Email notification service
 *
 * Uses a lightweight HTTP-based approach that works with any SMTP relay
 * or transactional email API (Resend, SendGrid, Postmark).
 *
 * Set EMAIL_FROM and RESEND_API_KEY in env to enable.
 * Falls back to logging when credentials are missing.
 */

import { createLogger } from '@/lib/utils/logger';

const log = createLogger('EmailNotifications');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Decision Intel <team@decision-intel.com>';

/** Lazy-load Prisma to avoid module-level failures when DB is unavailable. */
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

/** Whether email delivery is configured (RESEND_API_KEY is set). */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** If true, include List-Unsubscribe headers for CAN-SPAM/GDPR compliance. */
  includeUnsubscribe?: boolean;
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

/** Sentinel return value distinguishing "not configured" from "send failure". */
type SendResult = 'sent' | 'dry_run' | 'failed';

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    log.warn(
      `[DRY RUN] Email not sent (RESEND_API_KEY not configured): "${payload.subject}" to ${payload.to}`
    );
    return 'dry_run';
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const unsubscribeUrl = `${appUrl}/dashboard/settings`;

    // Build Resend email payload
    const emailBody: Record<string, unknown> = {
      from: EMAIL_FROM,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    };

    // Add List-Unsubscribe headers for CAN-SPAM / GDPR compliance
    if (payload.includeUnsubscribe && appUrl) {
      emailBody.headers = {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!res.ok) {
      const err = await res.text();
      log.error(`Resend API error: ${res.status} ${err}`);
      return 'failed';
    }

    return 'sent';
  } catch (error) {
    log.error('Email send failed:', error);
    return 'failed';
  }
}

async function logNotification(
  userId: string,
  channel: string,
  type: string,
  subject: string,
  result: SendResult,
  error?: string
) {
  try {
    await (
      await getPrisma()
    ).notificationLog.create({
      data: {
        userId,
        channel,
        type,
        subject,
        status: result === 'sent' ? 'sent' : result === 'dry_run' ? 'skipped' : 'failed',
        error: result === 'dry_run' ? 'RESEND_API_KEY not configured' : error,
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
  const settings = await (await getPrisma()).userSettings
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
           style="display: inline-block; padding: 10px 20px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          View Full Analysis
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you have analysis alerts enabled in your
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/settings" style="color: #16A34A;">settings</a>.
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail({ to: email, subject, html, includeUnsubscribe: true });
  await logNotification(userId, 'email', 'analysis_complete', subject, result);
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
    /**
     * Count of analyses currently in the `pending_outcome` or
     * `outcome_overdue` state for this user. Surfaces the flywheel's
     * "what do I owe" side every Monday.
     */
    pendingOutcomes?: number;
    /**
     * DQI trend (current week's avg minus last week's avg). Positive
     * means decisions are improving week-over-week. Omit when there
     * isn't enough prior-week data to compute.
     */
    dqiTrendPts?: number;
  }
) {
  const settings = await (await getPrisma()).userSettings
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
            <div style="font-size: 24px; font-weight: 700; color: #16A34A;">${stats.documentsAnalyzed}</div>
          </div>
          <div style="background: #1a1a2e; padding: 14px; border-radius: 8px;">
            <div style="font-size: 12px; color: #94a3b8;">Avg Score</div>
            <div style="font-size: 24px; font-weight: 700; color: ${stats.avgScore >= 70 ? '#22c55e' : stats.avgScore >= 40 ? '#eab308' : '#ef4444'};">
              ${stats.avgScore > 0 ? Math.round(stats.avgScore) : '—'}
            </div>
          </div>
          <div style="background: #1a1a2e; padding: 14px; border-radius: 8px;">
            <div style="font-size: 12px; color: #94a3b8;">Pending outcomes</div>
            <div style="font-size: 24px; font-weight: 700; color: ${(stats.pendingOutcomes ?? 0) > 0 ? '#eab308' : '#64748b'};">${stats.pendingOutcomes ?? 0}</div>
          </div>
          <div style="background: #1a1a2e; padding: 14px; border-radius: 8px;">
            <div style="font-size: 12px; color: #94a3b8;">DQI trend (WoW)</div>
            <div style="font-size: 24px; font-weight: 700; color: ${
              stats.dqiTrendPts == null
                ? '#64748b'
                : stats.dqiTrendPts > 0
                  ? '#22c55e'
                  : stats.dqiTrendPts < 0
                    ? '#ef4444'
                    : '#94a3b8'
            };">
              ${
                stats.dqiTrendPts == null
                  ? '—'
                  : `${stats.dqiTrendPts > 0 ? '+' : ''}${stats.dqiTrendPts.toFixed(1)}pt`
              }
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
           style="display: inline-block; padding: 10px 20px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Go to Dashboard
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you have weekly digest enabled in your
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/settings" style="color: #16A34A;">settings</a>.
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail({ to: email, subject, html, includeUnsubscribe: true });
  await logNotification(userId, 'email', 'weekly_digest', subject, result);
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
           style="display: inline-block; padding: 12px 24px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Accept Invitation
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          This invitation expires in 7 days. If you didn&rsquo;t expect this, you can safely ignore it.
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail({ to: inviteeEmail, subject, html });
  // Log under a system user since invitee may not have an account yet
  try {
    await (
      await getPrisma()
    ).notificationLog.create({
      data: {
        userId: 'system',
        channel: 'email',
        type: 'invite',
        subject,
        status: result === 'sent' ? 'sent' : result === 'dry_run' ? 'skipped' : 'failed',
        error: result === 'dry_run' ? 'RESEND_API_KEY not configured' : undefined,
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
  const settings = await (await getPrisma()).userSettings
    .findUnique({ where: { userId } })
    .catch((err: unknown) => {
      log.warn('Failed to fetch user settings:', err instanceof Error ? err.message : String(err));
      return null;
    });
  if (settings && !settings.emailNotifications) return;

  // Respect notification severity threshold
  if (settings?.notificationSeverity) {
    const pref = settings.notificationSeverity;
    if (pref === 'critical' && severity !== 'critical') return;
    if (pref === 'high_critical' && severity !== 'critical' && severity !== 'warning') return;
  }

  const severityColor =
    severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#eab308' : '#16A34A';

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
           style="display: inline-block; padding: 10px 20px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          View All Nudges
        </a>
      </div>
    </div>
  `;

  const result = await sendEmail({ to: email, subject, html, includeUnsubscribe: true });
  await logNotification(userId, 'email', 'nudge', subject, result);
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
  const settings = await (await getPrisma()).userSettings
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
               style="color: #16A34A; font-size: 13px; font-weight: 500; text-decoration: none;">
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
           style="display: inline-block; padding: 10px 20px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Go to Dashboard
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you have email notifications enabled in your
          <a href="${appUrl}/dashboard/settings" style="color: #16A34A;">settings</a>.
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail({ to: email, subject, html, includeUnsubscribe: true });
  await logNotification(userId, 'email', 'outcome_reminder', subject, result);
}

/**
 * Notify a user that they are approaching their monthly analysis limit.
 * Fires once per billing period per user (idempotency enforced by the caller
 * checking NotificationLog for an existing `usage_limit_80` entry this month).
 */
export async function notifyUsageLimit(
  userId: string,
  opts: {
    planName: string;
    used: number;
    limit: number;
    percentUsed: number;
    nextPlanName: string;
    nextPlanCheckoutUrl: string;
  }
): Promise<void> {
  const settings = await (await getPrisma()).userSettings
    .findUnique({ where: { userId } })
    .catch(() => null);
  if (settings && !settings.emailNotifications) return;

  const email = await getUserEmail(userId);
  if (!email) {
    log.warn(`Cannot send usage limit nudge — no email for user ${userId}`);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const subject = `You've used ${opts.percentUsed}% of your ${opts.planName} plan`;
  const safePlanName = escapeHtml(opts.planName);
  const safeNextPlan = escapeHtml(opts.nextPlanName);
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 24px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="margin: 0 0 16px; color: #fff;">You're approaching your monthly limit</h2>
        <p style="color: #94a3b8; margin: 0 0 20px;">
          You've used <strong style="color:#fff;">${opts.used} of ${opts.limit}</strong>
          analyses on the ${safePlanName} plan this month (${opts.percentUsed}%).
          Upgrade to ${safeNextPlan} to keep auditing without interruption.
        </p>

        <a href="${escapeHtml(opts.nextPlanCheckoutUrl)}"
           style="display: inline-block; padding: 12px 24px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Upgrade to ${safeNextPlan}
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because your usage crossed 80% of your plan limit.
          Manage notifications in your
          <a href="${appUrl}/dashboard/settings" style="color: #16A34A;">settings</a>.
        </p>
      </div>
    </div>
  `;
  const result = await sendEmail({ to: email, subject, html, includeUnsubscribe: true });
  await logNotification(userId, 'email', 'usage_limit_80', subject, result);
}

/**
 * Send welcome email to new newsletter subscribers.
 * Called from the pilot-interest endpoint for newsletter sign-ups.
 */
export async function sendNewsletterWelcome(email: string): Promise<SendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://decision-intel.com';
  const subject = 'Welcome to the Decision Intelligence Brief';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0f0f23; padding: 32px 24px; border-radius: 12px; color: #e2e8f0;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 20px; font-weight: 700; color: #fff;">Decision Intel</span>
          <span style="color: #16A34A; margin-left: 4px;">≫</span>
        </div>

        <h1 style="margin: 0 0 8px; font-size: 22px; color: #fff; font-weight: 700;">
          Welcome to the Decision Intelligence Brief
        </h1>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Every week, you'll receive one real-world business decision — broken down with the
          cognitive biases that were detectable <em>before</em> the outcome was known.
        </p>

        <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 13px; font-weight: 600; color: #16A34A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            What to expect
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px 8px 0; vertical-align: top; color: #16A34A; font-size: 16px;">&#x2713;</td>
              <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; line-height: 1.5;">
                <strong>Bias Breakdown</strong> — Which cognitive biases were present, how they compounded, and what made them dangerous
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 8px 0; vertical-align: top; color: #16A34A; font-size: 16px;">&#x2713;</td>
              <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; line-height: 1.5;">
                <strong>Pre-Decision Evidence</strong> — What was visible in the documents before the outcome was known, eliminating hindsight bias
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 8px 0; vertical-align: top; color: #16A34A; font-size: 16px;">&#x2713;</td>
              <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; line-height: 1.5;">
                <strong>Lessons for Your Decisions</strong> — Actionable patterns you can apply to your own strategic decisions and deal reviews
              </td>
            </tr>
          </table>
        </div>

        <a href="${appUrl}/case-studies"
           style="display: inline-block; padding: 12px 24px; background: #16A34A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Explore Case Studies
        </a>

        <p style="color: #64748b; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          You're receiving this because you subscribed to the Decision Intelligence Brief.
          If you didn't subscribe, you can safely ignore this email.
          <br /><br />
          Decision Intel &middot; The native reasoning layer for every boardroom strategic decision
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html, includeUnsubscribe: true });
}
