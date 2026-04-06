/**
 * Weekly Digest Cron Job
 *
 * GET /api/cron/weekly-digest — Send weekly digest emails to opted-in users
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyDigest } from '@/lib/notifications/email';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';

const log = createLogger('WeeklyDigestCron');

export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET?.trim();

export async function GET(req: NextRequest) {
  // Auth check
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !safeCompare(token, CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  let sent = 0;
  let failed = 0;

  try {
    // Find users who have weeklyDigest enabled
    const subscribers = await prisma.userSettings.findMany({
      where: { weeklyDigest: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscribers' });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const settings of subscribers) {
      try {
        // Gather stats for this user
        const [documents, nudges, biasInstances] = await Promise.all([
          prisma.document.findMany({
            where: { userId: settings.userId, status: 'complete', updatedAt: { gte: oneWeekAgo } },
            include: {
              analyses: { take: 1, orderBy: { createdAt: 'desc' }, select: { overallScore: true } },
            },
          }),
          prisma.nudge.count({
            where: { targetUserId: settings.userId, createdAt: { gte: oneWeekAgo } },
          }),
          prisma.biasInstance.findMany({
            where: {
              analysis: {
                document: { userId: settings.userId },
                createdAt: { gte: oneWeekAgo },
              },
            },
            select: { biasType: true },
          }),
        ]);

        // Calculate stats
        const scores = documents
          .map(d => d.analyses[0]?.overallScore)
          .filter((s): s is number => s != null);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        // Count bias occurrences
        const biasCounts = new Map<string, number>();
        for (const bi of biasInstances) {
          biasCounts.set(bi.biasType, (biasCounts.get(bi.biasType) || 0) + 1);
        }
        const topBiases = [...biasCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type]) => type.replace(/_/g, ' '));

        // Resolve user email — try TeamMember first, then Supabase auth
        let userEmail: string | null = null;
        const member = await prisma.teamMember.findFirst({
          where: { userId: settings.userId },
          select: { email: true },
        });
        userEmail = member?.email || null;

        // Fallback: query Supabase auth for solo users without team membership
        if (!userEmail) {
          try {
            const { createClient: createAdminClient } = await import('@/utils/supabase/server');
            const adminSupabase = await createAdminClient();
            const { data } = await adminSupabase.auth.admin.getUserById(settings.userId);
            userEmail = data?.user?.email || null;
          } catch {
            // Admin API not available or user not found
          }
        }

        if (!userEmail) {
          log.warn(`No email found for user ${settings.userId}, skipping digest`);
          continue;
        }

        await sendWeeklyDigest(settings.userId, userEmail, {
          documentsAnalyzed: documents.length,
          avgScore,
          topBiases,
          nudgesReceived: nudges,
        });

        sent++;
      } catch (err) {
        log.error(`Digest failed for user ${settings.userId}:`, err);
        failed++;
      }
    }

    // ─── Slack Digest: post to active Slack installations ───────────────
    let slackSent = 0;
    try {
      const installations = await prisma.slackInstallation.findMany({
        where: { status: 'active' },
        select: { teamId: true, orgId: true, monitoredChannels: true },
      });

      for (const install of installations) {
        try {
          const orgId = install.orgId;
          if (!orgId) continue;

          // Gather org-wide stats for the week
          const [decisionCount, orgBiasInstances, orgOutcomes] = await Promise.all([
            prisma.humanDecision
              .count({
                where: { orgId, createdAt: { gte: oneWeekAgo } },
              })
              .catch(() => 0),
            prisma.biasInstance
              .findMany({
                where: {
                  analysis: { document: { orgId }, createdAt: { gte: oneWeekAgo } },
                },
                select: { biasType: true },
              })
              .catch(() => []),
            prisma.decisionOutcome
              .count({
                where: { orgId },
              })
              .catch(() => 0),
          ]);

          // Also count document analyses
          const orgDocCount = await prisma.document
            .count({
              where: { orgId, status: 'complete', updatedAt: { gte: oneWeekAgo } },
            })
            .catch(() => 0);

          // Avg DQI for the week
          const orgScores = await prisma.analysis
            .findMany({
              where: { document: { orgId }, createdAt: { gte: oneWeekAgo } },
              select: { overallScore: true },
            })
            .catch(() => []);
          const avgOrgScore =
            orgScores.length > 0
              ? orgScores.reduce((sum, a) => sum + (a.overallScore ?? 0), 0) / orgScores.length
              : 0;

          // Top biases
          const orgBiasCounts = new Map<string, number>();
          for (const bi of orgBiasInstances) {
            orgBiasCounts.set(bi.biasType, (orgBiasCounts.get(bi.biasType) || 0) + 1);
          }
          const topOrgBiases = [...orgBiasCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

          // Pending outcomes
          const pendingOutcomes = await prisma.analysis
            .count({
              where: {
                document: { orgId },
                outcomeStatus: { in: ['pending_outcome', 'outcome_overdue'] },
              },
            })
            .catch(() => 0);

          // Skip if no activity
          if (decisionCount === 0 && orgDocCount === 0) continue;

          // Build Block Kit digest
          const { deliverSlackNudge, resolveToken } =
            await import('@/lib/integrations/slack/handler');

          const token = await resolveToken(install.teamId);
          if (!token) continue;

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.decisionintel.ai';
          const scoreEmoji =
            avgOrgScore >= 70
              ? ':large_green_circle:'
              : avgOrgScore >= 40
                ? ':large_yellow_circle:'
                : ':red_circle:';

          const biasText =
            topOrgBiases.length > 0
              ? topOrgBiases
                  .map(([type, count]) => `:warning: ${type.replace(/_/g, ' ')} (${count}x)`)
                  .join('\n')
              : '_None detected this week_';

          const blocks: Array<Record<string, unknown>> = [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Weekly Decision Intelligence Digest',
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Documents Analyzed*\n${orgDocCount}` },
                { type: 'mrkdwn', text: `*Decisions Captured*\n${decisionCount}` },
                {
                  type: 'mrkdwn',
                  text: `*Avg DQI Score*\n${scoreEmoji} ${Math.round(avgOrgScore)}/100`,
                },
                { type: 'mrkdwn', text: `*Outcomes Logged*\n${orgOutcomes}` },
              ],
            },
            { type: 'divider' },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Top Biases This Week*\n${biasText}` },
            },
          ];

          if (pendingOutcomes > 0) {
            blocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:hourglass: *${pendingOutcomes} outcome${pendingOutcomes > 1 ? 's' : ''} pending* — reporting outcomes improves future analysis accuracy.`,
              },
            });
          }

          blocks.push(
            { type: 'divider' },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Open Analytics' },
                  url: `${appUrl}/dashboard/analytics`,
                  style: 'primary',
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Outcome Flywheel' },
                  url: `${appUrl}/dashboard/outcome-flywheel`,
                },
              ],
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `_Weekly digest for ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}_ | Manage in <${appUrl}/dashboard/settings|Settings>`,
                },
              ],
            }
          );

          // Post to first monitored channel, or skip if none configured
          const targetChannel = install.monitoredChannels?.[0];
          if (targetChannel) {
            await deliverSlackNudge(
              {
                channel: targetChannel,
                text: `Weekly Digest: ${orgDocCount} documents analyzed, avg DQI ${Math.round(avgOrgScore)}/100`,
                blocks: blocks as unknown as import('@/types/human-audit').SlackBlock[],
              },
              install.teamId
            );
            slackSent++;
          }
        } catch (installErr) {
          log.warn(`Slack digest failed for team ${install.teamId}:`, installErr);
        }
      }
    } catch (slackErr) {
      log.warn('Slack digest delivery skipped:', slackErr);
    }

    return NextResponse.json({
      success: true,
      sent,
      slackSent,
      failed,
      total: subscribers.length,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    log.error('Weekly digest cron failed:', error);
    return NextResponse.json({ error: 'Digest cron failed' }, { status: 500 });
  }
}
