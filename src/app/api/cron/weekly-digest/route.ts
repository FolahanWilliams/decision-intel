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
import { timingSafeEqual } from 'crypto';

const log = createLogger('WeeklyDigestCron');

export const maxDuration = 300;

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
            where: { userId: settings.userId, status: 'analyzed', updatedAt: { gte: oneWeekAgo } },
            include: { analyses: { take: 1, orderBy: { createdAt: 'desc' }, select: { overallScore: true } } },
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

        // We need the user's email — query from Supabase via a membership or
        // team member record, or fall back to a best-effort approach
        const member = await prisma.teamMember.findFirst({
          where: { userId: settings.userId },
          select: { email: true },
        });

        // If we can't find email, skip
        if (!member?.email) {
          log.warn(`No email found for user ${settings.userId}, skipping digest`);
          continue;
        }

        await sendWeeklyDigest(settings.userId, member.email, {
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

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscribers.length,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    log.error('Weekly digest cron failed:', error);
    return NextResponse.json({ error: 'Digest cron failed' }, { status: 500 });
  }
}
