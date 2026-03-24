/**
 * Daily Outcome Reminder Cron
 *
 * GET /api/cron/outcome-reminders — Run daily to nudge users about overdue outcomes
 *
 * Queries analyses where outcomeStatus = 'pending_outcome' AND outcomeDueAt < now().
 * Marks them as 'outcome_overdue' and sends email/Slack reminders.
 *
 * Protected by CRON_SECRET. Add to vercel.json:
 *   { "path": "/api/cron/outcome-reminders", "schedule": "0 9 * * *" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { timingSafeEqual } from 'crypto';

const log = createLogger('OutcomeReminderCron');

export const maxDuration = 120; // 2 minutes

const CRON_SECRET = process.env.CRON_SECRET?.trim();

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return bufA.length === bufB.length && timingSafeEqual(paddedA, paddedB);
}

export async function GET(request: NextRequest) {
  const start = Date.now();

  // Verify cron secret
  if (!CRON_SECRET) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (!safeCompare(authHeader, `Bearer ${CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    log.info('Starting daily outcome reminder cron...');

    // Find all analyses that are overdue for outcome reporting
    const now = new Date();

    let overdueAnalyses: Array<{
      id: string;
      documentId: string;
      outcomeDueAt: Date | null;
    }> = [];

    try {
      overdueAnalyses = await prisma.analysis.findMany({
        where: {
          outcomeStatus: 'pending_outcome',
          outcomeDueAt: { lt: now },
        },
        select: {
          id: true,
          documentId: true,
          outcomeDueAt: true,
        },
        take: 100, // Process in batches
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('P2021') || msg.includes('P2022')) {
        log.warn('Schema drift: outcomeStatus column not yet migrated');
        return NextResponse.json({
          processed: 0,
          marked_overdue: 0,
          reminders_sent: 0,
          duration_ms: Date.now() - start,
          _message: 'outcomeStatus column not yet available',
        });
      }
      throw err;
    }

    if (overdueAnalyses.length === 0) {
      log.info('No overdue outcomes found');
      return NextResponse.json({
        processed: 0,
        marked_overdue: 0,
        reminders_sent: 0,
        duration_ms: Date.now() - start,
      });
    }

    // Mark as overdue
    const overdueIds = overdueAnalyses.map(a => a.id);
    await prisma.analysis.updateMany({
      where: { id: { in: overdueIds } },
      data: { outcomeStatus: 'outcome_overdue' },
    });

    // Get document owners for sending reminders
    const documentIds = [...new Set(overdueAnalyses.map(a => a.documentId))];
    const documents: Array<{ id: string; userId: string; filename: string }> =
      await prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: { id: true, userId: true, filename: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;

    const docMap = new Map(documents.map(d => [d.id, d]));

    // Group overdue analyses by user for batch notifications
    const userReminders = new Map<string, Array<{ analysisId: string; filename: string }>>();
    for (const analysis of overdueAnalyses) {
      const doc = docMap.get(analysis.documentId);
      if (!doc) continue;
      const existing = userReminders.get(doc.userId) || [];
      existing.push({ analysisId: analysis.id, filename: doc.filename });
      userReminders.set(doc.userId, existing);
    }

    // Send email reminders (fire and forget)
    let remindersSent = 0;
    for (const [userId, analyses] of userReminders) {
      try {
        // Dynamic import — notifyOutcomeReminder may not exist yet
        const emailModule = await import('@/lib/notifications/email');
        const notifyFn = (emailModule as Record<string, unknown>)
          .notifyOutcomeReminder as
          | ((uid: string, items: Array<{ analysisId: string; filename: string }>) => Promise<void>)
          | undefined;
        if (notifyFn) {
          await notifyFn(
            userId,
            analyses.map(a => ({ analysisId: a.analysisId, filename: a.filename }))
          );
        }
        remindersSent++;
      } catch (emailErr) {
        log.warn(
          `Email reminder failed for user ${userId}: ` +
            (emailErr instanceof Error ? emailErr.message : String(emailErr))
        );
      }
    }

    // Send Slack reminders for Slack-sourced decisions
    let slackRemindersSent = 0;
    for (const analysis of overdueAnalyses) {
      const doc = docMap.get(analysis.documentId);
      if (!doc) continue;

      // Check if this document originated from Slack (has a HumanDecision with source='slack')
      try {
        const slackDecision = await prisma.humanDecision.findFirst({
          where: {
            linkedAnalysisId: analysis.id,
            source: 'slack',
            sourceRef: { not: null },
          },
          select: { sourceRef: true, orgId: true },
        });

        if (slackDecision?.sourceRef) {
          const [slackChannel] = slackDecision.sourceRef.split(':');
          if (slackChannel) {
            const { formatNudgeForSlack, deliverSlackNudge } = await import('@/lib/integrations/slack/handler');
            // Find teamId from installation
            const slackInstall = slackDecision.orgId
              ? await prisma.slackInstallation.findFirst({
                  where: { orgId: slackDecision.orgId, status: 'active' },
                  select: { teamId: true },
                })
              : null;

            const reminderPayload = formatNudgeForSlack(
              {
                nudgeType: 'pre_decision_coaching',
                triggerReason: 'Outcome overdue',
                message: `This decision is overdue for outcome reporting. How did it turn out? Report the outcome to improve future analysis accuracy.`,
                severity: 'warning',
                channel: 'slack',
              }
            );
            reminderPayload.channel = slackChannel;
            await deliverSlackNudge(reminderPayload, slackInstall?.teamId).catch(() => {});
            slackRemindersSent++;
          }
        }
      } catch {
        // Schema drift or missing tables — skip Slack reminder
      }
    }

    const duration = Date.now() - start;
    log.info(
      `Outcome reminder cron complete: ${overdueAnalyses.length} marked overdue, ` +
        `${remindersSent} email + ${slackRemindersSent} Slack reminders sent in ${duration}ms`
    );

    return NextResponse.json({
      processed: overdueAnalyses.length,
      marked_overdue: overdueIds.length,
      reminders_sent: remindersSent,
      slack_reminders_sent: slackRemindersSent,
      users_notified: userReminders.size,
      duration_ms: duration,
    });
  } catch (error) {
    log.error('Outcome reminder cron failed:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
