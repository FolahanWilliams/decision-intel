/**
 * Team Cognitive Profile Cron Job
 *
 * GET /api/cron/team-profiles — Compute and upsert TeamCognitiveProfile
 * for every org with 3+ analyses in the last 30 days.
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { timingSafeEqual } from 'crypto';

const log = createLogger('TeamProfilesCron');

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
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let processed = 0;
  let failed = 0;

  try {
    // Find all unique orgIds with 3+ analyses in the last 30 days
    const orgsWithAnalyses = await prisma.document.groupBy({
      by: ['orgId'],
      where: {
        orgId: { not: null },
        analyses: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 3 } },
      },
    });

    const orgIds = orgsWithAnalyses
      .map((o) => o.orgId)
      .filter((id): id is string => id != null);

    if (orgIds.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No orgs with 3+ analyses in the last 30 days',
      });
    }

    for (const orgId of orgIds) {
      try {
        // Fetch all analyses for this org in the period
        const analyses = await prisma.analysis.findMany({
          where: {
            document: {
              orgId,
            },
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            id: true,
            overallScore: true,
            noiseScore: true,
            createdAt: true,
          },
        });

        if (analyses.length < 3) continue;

        // avgDecisionQuality
        const avgDecisionQuality =
          analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length;

        // avgNoiseScore
        const avgNoiseScore =
          analyses.reduce((sum, a) => sum + a.noiseScore, 0) / analyses.length;

        // totalDecisions
        const totalDecisions = analyses.length;

        // topBiases: frequency count of bias types across all analyses
        const analysisIds = analyses.map((a) => a.id);
        const biasInstances = await prisma.biasInstance.findMany({
          where: { analysisId: { in: analysisIds } },
          select: { biasType: true, severity: true },
        });

        const biasMap = new Map<string, { count: number; severities: string[] }>();
        for (const bi of biasInstances) {
          const existing = biasMap.get(bi.biasType);
          if (existing) {
            existing.count++;
            existing.severities.push(bi.severity);
          } else {
            biasMap.set(bi.biasType, { count: 1, severities: [bi.severity] });
          }
        }

        const topBiases = [...biasMap.entries()]
          .sort((a, b) => b[1].count - a[1].count)
          .map(([biasType, { count, severities }]) => {
            // Most frequent severity as avgSeverity
            const freq = new Map<string, number>();
            for (const s of severities) {
              freq.set(s, (freq.get(s) || 0) + 1);
            }
            const avgSeverity = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
            return { biasType, count, avgSeverity };
          });

        // nudgeEffectiveness
        const [nudgeSent, nudgeAcknowledged, nudgeHelpful] = await Promise.all([
          prisma.nudge.count({
            where: { orgId, createdAt: { gte: thirtyDaysAgo } },
          }),
          prisma.nudge.count({
            where: {
              orgId,
              createdAt: { gte: thirtyDaysAgo },
              acknowledgedAt: { not: null },
            },
          }),
          prisma.nudge.count({
            where: {
              orgId,
              createdAt: { gte: thirtyDaysAgo },
              wasHelpful: true,
            },
          }),
        ]);

        const nudgeEffectiveness = {
          sent: nudgeSent,
          acknowledged: nudgeAcknowledged,
          helpfulRate: nudgeSent > 0 ? nudgeHelpful / nudgeSent : 0,
        };

        // consistencyTrend: last 4 weekly average scores
        const consistencyTrend: { date: string; score: number }[] = [];
        for (let i = 3; i >= 0; i--) {
          const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weekAnalyses = analyses.filter(
            (a) => a.createdAt >= weekStart && a.createdAt < weekEnd
          );
          if (weekAnalyses.length > 0) {
            const avgScore =
              weekAnalyses.reduce((sum, a) => sum + a.overallScore, 0) /
              weekAnalyses.length;
            consistencyTrend.push({
              date: weekStart.toISOString().split('T')[0],
              score: Math.round(avgScore * 100) / 100,
            });
          }
        }

        // Upsert into TeamCognitiveProfile
        await prisma.teamCognitiveProfile.upsert({
          where: {
            orgId_periodStart_periodEnd: {
              orgId,
              periodStart: thirtyDaysAgo,
              periodEnd: now,
            },
          },
          update: {
            avgDecisionQuality: Math.round(avgDecisionQuality * 100) / 100,
            avgNoiseScore: Math.round(avgNoiseScore * 100) / 100,
            topBiases: toPrismaJson(topBiases) as Prisma.InputJsonValue,
            totalDecisions,
            nudgeEffectiveness: toPrismaJson(nudgeEffectiveness),
            consistencyTrend: toPrismaJson(
              consistencyTrend.length > 0 ? consistencyTrend : null
            ),
          },
          create: {
            orgId,
            periodStart: thirtyDaysAgo,
            periodEnd: now,
            avgDecisionQuality: Math.round(avgDecisionQuality * 100) / 100,
            avgNoiseScore: Math.round(avgNoiseScore * 100) / 100,
            topBiases: toPrismaJson(topBiases) as Prisma.InputJsonValue,
            totalDecisions,
            nudgeEffectiveness: toPrismaJson(nudgeEffectiveness),
            consistencyTrend: toPrismaJson(
              consistencyTrend.length > 0 ? consistencyTrend : null
            ),
          },
        });

        processed++;
        log.info(`Upserted TeamCognitiveProfile for org ${orgId} (${totalDecisions} decisions)`);
      } catch (err) {
        log.error(`Failed to compute profile for org ${orgId}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      totalOrgs: orgIds.length,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    log.error('Team profiles cron failed:', error);
    return NextResponse.json({ error: 'Team profiles cron failed' }, { status: 500 });
  }
}
