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
import { Prisma } from '@prisma/client';
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

    let twinRecalibratedCount = 0;

    const results: Array<{
      orgId: string | null;
      biasSeverity: { updated: boolean; sampleSize: number };
      nudgeThresholds: { updated: boolean; sampleSize: number };
      twinWeights: { updated: boolean; sampleSize: number };
    }> = [];

    for (const orgId of orgIds) {
      const result = await runFullRecalibration(orgId);
      results.push({ orgId, ...result });

      // Persist learned causal edges and org causal model (Moat 1)
      if (orgId) {
        try {
          const { learnCausalEdges, updateCausalModel, buildCausalDAG } =
            await import('@/lib/learning/causal-learning');
          const causalWeights = await learnCausalEdges(orgId);

          // Update the OrgCausalModel (aggregated weights + insights)
          await updateCausalModel(orgId).catch(err => {
            log.debug(
              `OrgCausalModel update skipped for org ${orgId}: ${err instanceof Error ? err.message : String(err)}`
            );
          });

          // Rebuild causal DAG if sufficient data (20+ outcomes)
          await buildCausalDAG(orgId).catch(err => {
            log.debug(
              `CausalDAG rebuild skipped for org ${orgId}: ${err instanceof Error ? err.message : String(err)}`
            );
          });
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

      // Twin effectiveness recalibration
      try {
        const { computeTwinEffectiveness } = await import('@/lib/learning/twin-effectiveness');
        const effectiveness = await computeTwinEffectiveness(orgId);
        if (effectiveness.length > 0) {
          await prisma.calibrationProfile.upsert({
            where: {
              orgId_userId_profileType: {
                orgId: orgId ?? '',
                userId: '',
                profileType: 'twin_effectiveness',
              },
            },
            create: {
              orgId: orgId,
              profileType: 'twin_effectiveness',
              calibrationData: JSON.parse(JSON.stringify(effectiveness)) as Prisma.InputJsonValue,
              sampleSize: effectiveness.reduce((s, t) => s + t.sampleSize, 0),
              lastCalibratedAt: new Date(),
            },
            update: {
              calibrationData: JSON.parse(JSON.stringify(effectiveness)) as Prisma.InputJsonValue,
              sampleSize: effectiveness.reduce((s, t) => s + t.sampleSize, 0),
              lastCalibratedAt: new Date(),
            },
          });
          twinRecalibratedCount++;
        }
      } catch (twinErr) {
        const msg = twinErr instanceof Error ? twinErr.message : String(twinErr);
        if (msg.includes('P2021') || msg.includes('P2022')) {
          log.debug('Twin effectiveness tables not available (schema drift)');
        } else {
          log.warn(`Twin effectiveness recalibration failed for org ${orgId}:`, msg);
        }
      }
    }

    const durationMs = Date.now() - start;
    const updatedCount = results.filter(
      r => r.biasSeverity.updated || r.nudgeThresholds.updated || r.twinWeights.updated
    ).length;

    log.info(
      `Recalibration cron complete in ${durationMs}ms: ` +
        `${orgIds.length} orgs processed, ${updatedCount} updated, ` +
        `${twinRecalibratedCount} twin effectiveness profiles updated`
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
