/**
 * Counterfactual Replay API
 *
 * GET /api/counterfactual?analysisId=xxx
 *
 * Returns analytical counterfactual scenarios for a given analysis:
 * "If bias X were removed, based on historical data, expected improvement is Y%"
 *
 * Auth required. Verifies analysis belongs to user. Cached for 5 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { computeCounterfactuals } from '@/lib/analysis/counterfactual';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CounterfactualAPI');

// Simple in-memory cache: analysisId → { result, expiresAt }
const cache = new Map<string, { result: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const analysisId = searchParams.get('analysisId');

  if (!analysisId) {
    return NextResponse.json(
      { error: 'analysisId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Verify the analysis belongs to the user
    let analysis: { id: string; documentId: string } | null = null;

    try {
      analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        select: { id: true, documentId: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      const msg = error instanceof Error ? error.message : String(error);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift fetching Analysis — table not available');
        return NextResponse.json(
          { error: 'Counterfactual analysis not available' },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Verify ownership: analysis → document → userId
    let document: { userId: string; orgId: string | null } | null = null;

    try {
      document = await prisma.document.findUnique({
        where: { id: analysis.documentId },
        select: { userId: true, orgId: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      const msg = error instanceof Error ? error.message : String(error);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Counterfactual analysis not available' },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!document || document.userId !== user.id) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Check cache
    const cacheKey = `${analysisId}:${document.orgId || ''}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.result);
    }

    // Compute counterfactuals
    const result = await computeCounterfactuals(analysisId, document.orgId);

    // Cache the result
    cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Evict stale cache entries periodically
    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, entry] of cache) {
        if (entry.expiresAt <= now) cache.delete(key);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in counterfactual API — returning empty result');
      return NextResponse.json({
        analysisId,
        biasCount: 0,
        scenarios: [],
        aggregateImprovement: 0,
        weightedImprovement: 0,
        dataAsOf: new Date().toISOString(),
      });
    }

    log.error('Counterfactual API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute counterfactual analysis' },
      { status: 500 }
    );
  }
}
