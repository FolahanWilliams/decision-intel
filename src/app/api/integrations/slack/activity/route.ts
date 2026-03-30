/**
 * GET /api/integrations/slack/activity — Recent bot activity for the settings UI
 *
 * Returns recent decisions detected, nudges sent, and summary stats
 * for the authenticated user's organization via Slack.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SlackActivity');

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch recent Slack-sourced decisions
    let recentDecisions: Array<{
      id: string;
      content: string;
      decisionType: string | null;
      createdAt: Date;
      cognitiveAudit: { decisionQualityScore: number | null } | null;
    }> = [];

    try {
      recentDecisions = await prisma.humanDecision.findMany({
        where: {
          userId: user.id,
          source: 'slack',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          content: true,
          decisionType: true,
          createdAt: true,
          cognitiveAudit: {
            select: { decisionQualityScore: true },
          },
        },
      });
    } catch {
      // Schema drift — HumanDecision may not have source field
    }

    // Fetch recent nudges sent via Slack
    let recentNudges: Array<{
      id: string;
      nudgeType: string;
      severity: string;
      wasHelpful: boolean | null;
      createdAt: Date;
    }> = [];

    try {
      recentNudges = await prisma.nudge.findMany({
        where: {
          targetUserId: user.id,
          channel: 'slack',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          nudgeType: true,
          severity: true,
          wasHelpful: true,
          createdAt: true,
        },
      });
    } catch {
      // Schema drift
    }

    // Weekly summary stats
    let weeklyDecisionCount = 0;
    let weeklyNudgeCount = 0;
    let weeklyOutcomeCount = 0;
    let nudgeHelpfulRate: number | null = null;

    try {
      weeklyDecisionCount = await prisma.humanDecision.count({
        where: { userId: user.id, source: 'slack', createdAt: { gte: oneWeekAgo } },
      });
    } catch { /* schema drift */ }

    try {
      weeklyNudgeCount = await prisma.nudge.count({
        where: { targetUserId: user.id, channel: 'slack', createdAt: { gte: oneWeekAgo } },
      });
    } catch { /* schema drift */ }

    try {
      weeklyOutcomeCount = await prisma.decisionOutcome.count({
        where: { userId: user.id, reportedAt: { gte: oneWeekAgo } },
      });
    } catch { /* schema drift */ }

    try {
      const acknowledged = await prisma.nudge.count({
        where: { targetUserId: user.id, channel: 'slack', acknowledgedAt: { not: null } },
      });
      const helpful = await prisma.nudge.count({
        where: { targetUserId: user.id, channel: 'slack', wasHelpful: true },
      });
      if (acknowledged > 0) {
        nudgeHelpfulRate = Math.round((helpful / acknowledged) * 100);
      }
    } catch { /* schema drift */ }

    return NextResponse.json({
      recentDecisions: recentDecisions.map(d => ({
        id: d.id,
        content: d.content.slice(0, 80) + (d.content.length > 80 ? '...' : ''),
        type: d.decisionType,
        score: d.cognitiveAudit?.decisionQualityScore ?? null,
        createdAt: d.createdAt.toISOString(),
      })),
      recentNudges: recentNudges.map(n => ({
        id: n.id,
        biasType: n.nudgeType,
        severity: n.severity,
        wasHelpful: n.wasHelpful,
        createdAt: n.createdAt.toISOString(),
      })),
      summary: {
        decisionsThisWeek: weeklyDecisionCount,
        nudgesThisWeek: weeklyNudgeCount,
        outcomesThisWeek: weeklyOutcomeCount,
        nudgeHelpfulRate,
      },
    });
  } catch (error) {
    log.error('Failed to fetch Slack activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
