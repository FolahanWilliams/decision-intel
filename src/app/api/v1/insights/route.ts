/**
 * Public API — GET /api/v1/insights
 *
 * Returns aggregated decision intelligence insights for the API key's org:
 * - Bias detection accuracy stats
 * - Top biases detected
 * - Decision quality trends
 * - Noise score trends
 *
 * Auth: API key (Bearer di_live_xxx) — requires "insights" scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, requireScope, type ValidateError } from '@/lib/api/auth';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PublicInsightsRoute');

export async function GET(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      const err = authResult as ValidateError;
      return NextResponse.json(
        { error: err.error },
        { status: err.status, headers: err.headers }
      );
    }
    const { context } = authResult;

    const scopeErr = requireScope(context, 'insights');
    if (scopeErr) {
      return NextResponse.json({ error: scopeErr.error }, { status: scopeErr.status });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '90d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d': startDate.setDate(endDate.getDate() - 7); break;
      case '30d': startDate.setDate(endDate.getDate() - 30); break;
      case '90d': startDate.setDate(endDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
      default: startDate.setDate(endDate.getDate() - 90);
    }

    const userFilter = context.orgId ? { orgId: context.orgId } : { userId: context.userId };

    // ── Bias detection stats ──────────────────────────────────────
    let topBiases: Array<{ biasType: string; count: number; avgSeverity: string }> = [];
    let totalBiasesDetected = 0;

    try {
      const analyses = await prisma.analysis.findMany({
        where: {
          document: userFilter,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { id: true },
      });

      const analysisIds = analyses.map(a => a.id);

      if (analysisIds.length > 0) {
        const biases = await prisma.biasInstance.findMany({
          where: { analysisId: { in: analysisIds } },
          select: { biasType: true, severity: true },
        });

        const biasCounts: Record<string, { count: number; severities: string[] }> = {};
        for (const b of biases) {
          if (!biasCounts[b.biasType]) biasCounts[b.biasType] = { count: 0, severities: [] };
          biasCounts[b.biasType].count++;
          biasCounts[b.biasType].severities.push(b.severity);
        }

        topBiases = Object.entries(biasCounts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([biasType, data]) => {
            const severityValues: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
            const avgVal = data.severities.reduce((s, sev) => s + (severityValues[sev] || 2), 0) / data.severities.length;
            const avgLabel = avgVal >= 3.5 ? 'critical' : avgVal >= 2.5 ? 'high' : avgVal >= 1.5 ? 'medium' : 'low';
            return { biasType, count: data.count, avgSeverity: avgLabel };
          });

        totalBiasesDetected = biases.length;
      }
    } catch {
      // Schema drift
    }

    // ── Quality and noise trends ──────────────────────────────────
    let qualityTrends: Array<{ month: string; avgScore: number; count: number }> = [];
    let noiseTrends: Array<{ month: string; avgNoise: number; count: number }> = [];

    try {
      const analyses = await prisma.analysis.findMany({
        where: {
          document: userFilter,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { overallScore: true, noiseScore: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const buckets: Record<string, { scores: number[]; noises: number[] }> = {};
      for (const a of analyses) {
        const month = a.createdAt.toISOString().slice(0, 7);
        if (!buckets[month]) buckets[month] = { scores: [], noises: [] };
        buckets[month].scores.push(a.overallScore);
        buckets[month].noises.push(a.noiseScore);
      }

      qualityTrends = Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
          count: data.scores.length,
        }));

      noiseTrends = Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          avgNoise: Math.round(data.noises.reduce((a, b) => a + b, 0) / data.noises.length * 10) / 10,
          count: data.noises.length,
        }));
    } catch {
      // Schema drift
    }

    // ── Outcome stats ─────────────────────────────────────────────
    let outcomeStats = { totalOutcomes: 0, successRate: 0, failureRate: 0, biasAccuracy: 0 };

    try {
      const outcomes = await prisma.decisionOutcome.findMany({
        where: {
          ...(context.orgId ? { orgId: context.orgId } : { userId: context.userId }),
          reportedAt: { gte: startDate },
        },
        select: { outcome: true, confirmedBiases: true, falsPositiveBiases: true },
      });

      if (outcomes.length > 0) {
        const successes = outcomes.filter(o => o.outcome === 'success' || o.outcome === 'partial_success').length;
        const failures = outcomes.filter(o => o.outcome === 'failure').length;
        const totalConfirmed = outcomes.reduce((s, o) => s + o.confirmedBiases.length, 0);
        const totalFP = outcomes.reduce((s, o) => s + o.falsPositiveBiases.length, 0);
        const totalRated = totalConfirmed + totalFP;

        outcomeStats = {
          totalOutcomes: outcomes.length,
          successRate: Math.round((successes / outcomes.length) * 100),
          failureRate: Math.round((failures / outcomes.length) * 100),
          biasAccuracy: totalRated > 0 ? Math.round((totalConfirmed / totalRated) * 100) : 0,
        };
      }
    } catch {
      // Schema drift
    }

    return NextResponse.json({
      timeRange,
      biasStats: { topBiases, totalBiasesDetected },
      qualityTrends,
      noiseTrends,
      outcomeStats,
    });
  } catch (error) {
    log.error('Public insights API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
