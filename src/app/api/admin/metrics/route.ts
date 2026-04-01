/**
 * Admin Metrics API — Aggregated performance and cost metrics
 *
 * Returns: API latency per route, AI costs, error rates, circuit breaker states
 */

import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';
import { getRouteSummaries, computePercentiles, getTotalRecorded } from '@/lib/utils/api-metrics';
import { verifyAdmin, ADMIN_DENIED } from '@/lib/utils/admin';

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Verify admin access
  const admin = await verifyAdmin();
  if (!admin) return ADMIN_DENIED;

  const url = new URL(request.url);
  const windowMinutes = Math.max(1, Math.min(parseInt(url.searchParams.get('window') || '5', 10) || 5, 60));
  const windowMs = windowMinutes * 60_000;

  // 1. API latency metrics from in-memory buffer
  const routeSummaries = getRouteSummaries(windowMs);
  const overallPercentiles = computePercentiles(undefined, windowMs);

  // 2. AI cost metrics from database
  let aiCosts: Array<{ provider: string; operation: string; calls: number; totalCost: number }> =
    [];
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    const usage = await prisma.apiUsage.groupBy({
      by: ['provider', 'operation'],
      _count: { id: true },
      _sum: { cost: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    aiCosts = usage.map(u => ({
      provider: u.provider,
      operation: u.operation,
      calls: u._count.id,
      totalCost: u._sum.cost ?? 0,
    }));
  } catch {
    // ApiUsage table may not exist in schema-drift scenario
  }

  // 3. Recent error count
  let recentErrors = 0;
  try {
    const since = new Date(Date.now() - windowMs);
    recentErrors = await prisma.auditLog.count({
      where: {
        action: 'SYSTEM_ERROR',
        createdAt: { gte: since },
      },
    });
  } catch {
    // AuditLog may not have SYSTEM_ERROR entries
  }

  return NextResponse.json(
    {
      window: {
        minutes: windowMinutes,
        since: new Date(Date.now() - windowMs).toISOString(),
      },
      api: {
        totalRequestsRecorded: getTotalRecorded(),
        routeSummaries,
        overallPercentiles,
      },
      ai: {
        period: 'last_24h',
        costs: aiCosts,
        totalCost: aiCosts.reduce((s, c) => s + c.totalCost, 0),
      },
      errors: {
        recentCount: recentErrors,
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=15',
      },
    }
  );
}
