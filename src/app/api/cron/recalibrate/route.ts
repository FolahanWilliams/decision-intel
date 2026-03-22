/**
 * Weekly Recalibration Cron — Behavioral Data Flywheel
 *
 * GET /api/cron/recalibrate — Run weekly recalibration for all orgs
 *
 * Recalibrates bias severity weights, nudge thresholds, and twin accuracy
 * across all organizations with sufficient outcome data.
 *
 * Protected by CRON_SECRET. Add to vercel.json:
 *   { "path": "/api/cron/recalibrate", "schedule": "0 3 * * 0" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { runFullRecalibration } from '@/lib/learning/feedback-loop';
import { timingSafeEqual } from 'crypto';

const log = createLogger('RecalibrationCron');

export const maxDuration = 300; // 5 minutes

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
    log.info('Starting weekly recalibration cron...');

    // Find all orgs with outcome data
    let orgIds: (string | null)[] = [null]; // Always include global

    try {
      const orgsWithOutcomes = await prisma.decisionOutcome.findMany({
        where: { orgId: { not: null } },
        select: { orgId: true },
        distinct: ['orgId'],
      });
      orgIds = [null, ...orgsWithOutcomes.map(o => o.orgId)];
    } catch {
      // Schema drift — proceed with global only
      log.warn('Could not query org-specific outcomes (schema drift)');
    }

    const results: Array<{
      orgId: string | null;
      biasSeverity: { updated: boolean; sampleSize: number };
      nudgeThresholds: { updated: boolean; sampleSize: number };
      twinWeights: { updated: boolean; sampleSize: number };
    }> = [];

    for (const orgId of orgIds) {
      const result = await runFullRecalibration(orgId);
      results.push({ orgId, ...result });

      // Persist learned causal edges to CausalEdge table (Moat 1)
      if (orgId) {
        try {
          const { learnCausalEdges } = await import('@/lib/learning/causal-learning');
          const causalWeights = await learnCausalEdges(orgId);
          for (const w of causalWeights) {
            await prisma.causalEdge.upsert({
              where: {
                orgId_fromVar_toVar: {
                  orgId: orgId,
                  fromVar: w.biasType,
                  toVar: 'decision_quality',
                },
              },
              create: {
                orgId,
                fromVar: w.biasType,
                toVar: 'decision_quality',
                strength: w.outcomeCorrelation,
                confidence: Math.min(1, w.sampleSize / 20),
                sampleSize: w.sampleSize,
              },
              update: {
                strength: w.outcomeCorrelation,
                confidence: Math.min(1, w.sampleSize / 20),
                sampleSize: w.sampleSize,
              },
            });
          }
          if (causalWeights.length > 0) {
            log.info(`Persisted ${causalWeights.length} causal edges for org ${orgId}`);
          }
        } catch (causalError) {
          const msg = causalError instanceof Error ? causalError.message : String(causalError);
          if (msg.includes('P2021') || msg.includes('P2022')) {
            log.debug('CausalEdge table not available (schema drift)');
          } else {
            log.warn(`Causal edge persistence failed for org ${orgId}:`, msg);
          }
        }
      }
    }

    const durationMs = Date.now() - start;
    const updatedCount = results.filter(
      r => r.biasSeverity.updated || r.nudgeThresholds.updated || r.twinWeights.updated
    ).length;

    log.info(
      `Recalibration cron complete in ${durationMs}ms: ` +
        `${orgIds.length} orgs processed, ${updatedCount} updated`
    );

    return NextResponse.json({
      success: true,
      orgsProcessed: orgIds.length,
      orgsUpdated: updatedCount,
      durationMs,
      results,
    });
  } catch (error) {
    log.error('Recalibration cron failed:', error);
    return NextResponse.json({ error: 'Recalibration cron failed' }, { status: 500 });
  }
}
