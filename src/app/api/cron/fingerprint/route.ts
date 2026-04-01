/**
 * Fingerprint Pattern Computation Cron Job
 *
 * GET /api/cron/fingerprint — Compute contextual bias patterns for all active orgs.
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { computeContextualPatterns } from '@/lib/learning/fingerprint-engine';
import { safeCompare } from '@/lib/utils/safe-compare';

const log = createLogger('FingerprintCron');

export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET?.trim();

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !safeCompare(token, CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;

  try {
    // Find all unique orgIds with at least 1 analysis
    const orgsWithAnalyses = await prisma.document.groupBy({
      by: ['orgId'],
      where: {
        orgId: { not: null },
        analyses: { some: {} },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 1 } },
      },
    });

    const orgIds = orgsWithAnalyses.map(o => o.orgId).filter((id): id is string => id != null);

    if (orgIds.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No orgs with analyses found',
      });
    }

    for (const orgId of orgIds) {
      try {
        const count = await computeContextualPatterns(orgId);
        log.info(`Computed ${count} patterns for org ${orgId}`);
        processed++;
      } catch (err) {
        log.error(`Failed to compute patterns for org ${orgId}:`, err);
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
    log.error('Fingerprint cron failed:', error);
    return NextResponse.json({ error: 'Fingerprint cron failed' }, { status: 500 });
  }
}
