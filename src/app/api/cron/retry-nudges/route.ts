/**
 * Slack Nudge Retry Cron
 * GET /api/cron/retry-nudges
 * Processes failed Slack nudges with exponential backoff.
 * Protected by CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';

const log = createLogger('RetryNudges');
const MAX_RETRIES = 5;

const CRON_SECRET = process.env.CRON_SECRET?.trim();

export async function GET(request: NextRequest) {
  // Auth check
  if (!CRON_SECRET) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (!safeCompare(authHeader, `Bearer ${CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find nudges eligible for retry
    const pendingNudges = await prisma.nudge.findMany({
      where: {
        channel: 'slack',
        deliveredAt: null,
        failureCount: { lt: MAX_RETRIES },
        OR: [{ nextRetryAt: null, failureCount: { gt: 0 } }, { nextRetryAt: { lte: now } }],
      },
      take: 20,
      orderBy: { createdAt: 'asc' },
    });

    if (pendingNudges.length === 0) {
      return NextResponse.json({ message: 'No nudges to retry', retried: 0 });
    }

    let succeeded = 0;
    let failed = 0;

    const { deliverSlackNudge, formatNudgeForSlack } =
      await import('@/lib/integrations/slack/handler');

    for (const nudge of pendingNudges) {
      try {
        // Build Slack payload from nudge data
        const payload = formatNudgeForSlack(
          {
            nudgeType: nudge.nudgeType as import('@/types/human-audit').NudgeType,
            triggerReason: nudge.triggerReason,
            message: nudge.message,
            severity: (nudge.severity as 'info' | 'warning' | 'critical') || 'info',
            channel: 'slack',
          },
          undefined,
          nudge.id
        );

        // Look up Slack channel from org installation or env fallback
        let teamId: string | undefined;
        if (nudge.orgId) {
          const install = await prisma.slackInstallation.findFirst({
            where: { orgId: nudge.orgId, status: 'active' },
            select: { teamId: true },
          });
          teamId = install?.teamId;
        }
        const channel = process.env.SLACK_ALERT_CHANNEL;
        if (!channel) {
          log.warn(`Nudge ${nudge.id} has no channel configured, skipping`);
          continue;
        }
        payload.channel = channel;
        const delivered = await deliverSlackNudge(payload, teamId);

        if (delivered) {
          await prisma.nudge.update({
            where: { id: nudge.id },
            data: { deliveredAt: now, lastAttemptAt: now },
          });
          succeeded++;
        } else {
          throw new Error('deliverSlackNudge returned false');
        }
      } catch (err) {
        const newFailureCount = nudge.failureCount + 1;
        // Exponential backoff: 30s, 60s, 120s, 240s, 480s
        const backoffMs = 30_000 * Math.pow(2, newFailureCount - 1);
        const nextRetry = new Date(now.getTime() + backoffMs);

        await prisma.nudge
          .update({
            where: { id: nudge.id },
            data: {
              failureCount: newFailureCount,
              lastAttemptAt: now,
              nextRetryAt: newFailureCount < MAX_RETRIES ? nextRetry : null,
            },
          })
          .catch(err => log.warn('Failed to update Nudge failure counters on retry:', err));

        log.warn(
          `Nudge ${nudge.id} retry failed (attempt ${newFailureCount}/${MAX_RETRIES}):`,
          err instanceof Error ? err.message : String(err)
        );
        failed++;
      }
    }

    return NextResponse.json({
      message: `Processed ${pendingNudges.length} nudges`,
      succeeded,
      failed,
      remaining: pendingNudges.length - succeeded - failed,
    });
  } catch (err) {
    log.error('Retry nudges cron failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
