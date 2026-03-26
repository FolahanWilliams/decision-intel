/**
 * GET /api/admin/usage — Aggregated API usage statistics
 * Protected by ADMIN_EMAILS check.
 * Query params: provider, days (default 30)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AdminUsage');

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS?.split(',') || []).map(e => e.trim().toLowerCase());
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const days = parseInt(searchParams.get('days') || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where = {
      createdAt: { gte: since },
      ...(provider ? { provider } : {}),
    };

    const [usage, totals] = await Promise.all([
      prisma.apiUsage.groupBy({
        by: ['provider', 'operation'],
        where,
        _count: { id: true },
        _sum: { tokens: true, cost: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.apiUsage.aggregate({
        where,
        _count: { id: true },
        _sum: { tokens: true, cost: true },
      }),
    ]);

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      totals: {
        calls: totals._count.id,
        tokens: totals._sum.tokens,
        estimatedCost: totals._sum.cost ? Math.round(totals._sum.cost * 10000) / 10000 : 0,
      },
      breakdown: usage.map(u => ({
        provider: u.provider,
        operation: u.operation,
        calls: u._count.id,
        tokens: u._sum.tokens,
        cost: u._sum.cost ? Math.round(u._sum.cost * 10000) / 10000 : 0,
      })),
    });
  } catch (err) {
    log.error('Failed to fetch usage stats:', err);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
