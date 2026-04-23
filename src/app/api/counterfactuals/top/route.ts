/**
 * GET /api/counterfactuals/top
 *
 * Aggregates the highest-impact counterfactual scenarios across a
 * rolling window of recent analyses. Powers the "Top Counterfactuals
 * This Quarter" card on /dashboard/analytics?view=intelligence — the
 * surface that turns the Intelligence tab from a chart page into a
 * board-ready digest.
 *
 * Scope: org when the user has a team; personal otherwise.
 * Window: last 90 days, capped at 15 most recent completed analyses to
 *         keep the fan-out bounded.
 * Cache:  per-scope in memory, 15 minutes. Counterfactual math reads the
 *         causal-edges + historical-outcomes tables, which do not change
 *         within that window.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { computeCounterfactuals } from '@/lib/analysis/counterfactual';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('TopCounterfactualsAPI');

const WINDOW_DAYS = 90;
const MAX_ANALYSES = 15;
const TOP_N = 5;
const CACHE_TTL_MS = 15 * 60 * 1000;

const cache = new Map<string, { result: unknown; expiresAt: number }>();

interface TopScenario {
  analysisId: string;
  documentId: string;
  filename: string;
  analysisCreatedAt: string;
  biasRemoved: string;
  historicalSampleSize: number;
  expectedImprovement: number;
  confidence: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — personal scope fallback.
    }

    const cacheKey = orgId ? `org:${orgId}` : `user:${user.id}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.result);
    }

    const since = new Date(now - WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const analyses = await prisma.analysis.findMany({
      where: {
        createdAt: { gte: since },
        document: orgId ? { orgId } : { userId: user.id },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_ANALYSES,
      select: {
        id: true,
        createdAt: true,
        document: { select: { id: true, filename: true } },
      },
    });

    if (analyses.length === 0) {
      const empty = { scenarios: [], windowDays: WINDOW_DAYS, sampleAnalyses: 0 };
      cache.set(cacheKey, { result: empty, expiresAt: now + CACHE_TTL_MS });
      return NextResponse.json(empty);
    }

    // Fan out counterfactual computation. Each call is already cached
    // upstream by analysisId + 5 min TTL in /api/counterfactual, so the
    // blast radius for a cache miss is small.
    const settled = await Promise.allSettled(
      analyses.map(a =>
        computeCounterfactuals(a.id, orgId ?? undefined).then(result => ({
          analysis: a,
          result,
        }))
      )
    );

    const flat: TopScenario[] = [];
    for (const s of settled) {
      if (s.status !== 'fulfilled' || !s.value.result) continue;
      for (const sc of s.value.result.scenarios) {
        if (sc.expectedImprovement <= 0) continue;
        flat.push({
          analysisId: s.value.analysis.id,
          documentId: s.value.analysis.document.id,
          filename: s.value.analysis.document.filename,
          analysisCreatedAt: s.value.analysis.createdAt.toISOString(),
          biasRemoved: sc.biasRemoved,
          historicalSampleSize: sc.historicalSampleSize,
          expectedImprovement: sc.expectedImprovement,
          confidence: sc.confidence,
          estimatedMonetaryImpact: sc.estimatedMonetaryImpact,
          currency: sc.currency,
        });
      }
    }

    // Rank: monetary impact first when present, else expected improvement.
    flat.sort((a, b) => {
      const aM = a.estimatedMonetaryImpact ?? 0;
      const bM = b.estimatedMonetaryImpact ?? 0;
      if (aM !== bM) return bM - aM;
      return b.expectedImprovement - a.expectedImprovement;
    });

    // De-dupe by (biasRemoved, documentId) so a single memo doesn't dominate.
    const seen = new Set<string>();
    const top: TopScenario[] = [];
    for (const sc of flat) {
      const key = `${sc.biasRemoved}:${sc.documentId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      top.push(sc);
      if (top.length >= TOP_N) break;
    }

    const result = {
      scenarios: top,
      windowDays: WINDOW_DAYS,
      sampleAnalyses: analyses.length,
    };
    cache.set(cacheKey, { result, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift on top-counterfactuals:', code);
      return NextResponse.json({ scenarios: [], windowDays: WINDOW_DAYS, sampleAnalyses: 0 });
    }
    log.error('GET /api/counterfactuals/top failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
