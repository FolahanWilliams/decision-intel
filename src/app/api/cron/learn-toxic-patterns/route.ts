/**
 * Cron: Learn Toxic Patterns
 *
 * GET /api/cron/learn-toxic-patterns — Discover toxic bias combinations from outcome data
 *
 * Runs periodically to analyze historical outcomes and identify which bias
 * co-occurrence patterns correlate with failures. Updates ToxicPattern records
 * used for future toxic combination detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { learnToxicPatterns } from '@/lib/learning/toxic-combinations';
import { createLogger } from '@/lib/utils/logger';
import { timingSafeEqual } from 'crypto';

const log = createLogger('CronLearnToxicPatterns');

/** Constant-time comparison to prevent timing attacks on the cron secret. */
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
  // Verify cron secret — required, not optional
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization') ?? '';
  if (!safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all orgs with sufficient outcome data (10+ outcomes)
    const orgs = await prisma.decisionOutcome.groupBy({
      by: ['orgId'],
      _count: { id: true },
      having: { id: { _count: { gte: 10 } } },
    });

    const results: Array<{ orgId: string; patternsLearned: number }> = [];

    for (const org of orgs) {
      if (!org.orgId) continue;
      const patternsLearned = await learnToxicPatterns(org.orgId);
      results.push({ orgId: org.orgId, patternsLearned });
    }

    const totalPatterns = results.reduce((sum, r) => sum + r.patternsLearned, 0);
    log.info(
      `Toxic pattern learning complete: ${totalPatterns} patterns across ${results.length} orgs`
    );

    return NextResponse.json({
      success: true,
      orgsProcessed: results.length,
      totalPatternsLearned: totalPatterns,
      details: results,
    });
  } catch (error) {
    log.error('Toxic pattern learning cron failed:', error);
    return NextResponse.json({ error: 'Toxic pattern learning failed' }, { status: 500 });
  }
}
