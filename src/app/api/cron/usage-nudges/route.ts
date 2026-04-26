/**
 * Daily Usage Nudge Cron
 *
 * GET /api/cron/usage-nudges — Run daily. For any user on a metered plan
 * whose month-to-date analysis usage has crossed 80% of their plan limit,
 * send exactly one email nudge per billing period with a Stripe-preselected
 * upgrade CTA.
 *
 * Idempotency: checks NotificationLog for an existing `usage_limit_80`
 * entry this calendar month before sending.
 *
 * Protected by CRON_SECRET. Add to vercel.json:
 *   { "path": "/api/cron/usage-nudges", "schedule": "0 14 * * *" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PLANS, type PlanType } from '@/lib/stripe';
import { notifyUsageLimit } from '@/lib/notifications/email';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('UsageNudgeCron');

export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET?.trim();

const METERED_PLANS: PlanType[] = ['free', 'pro', 'team'];

/** The next plan up the ladder — used to preselect a Stripe checkout session. */
const UPGRADE_TARGET: Record<PlanType, PlanType | null> = {
  free: 'pro',
  pro: 'team',
  team: 'enterprise',
  enterprise: null,
};

export async function GET(request: NextRequest) {
  const start = Date.now();

  if (!CRON_SECRET) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization') ?? '';
  if (!safeCompare(authHeader, `Bearer ${CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let scanned = 0;
  let nudged = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // Pull candidates: all users with any analysis this month. We need the
    // per-user count anyway, so grouping in Prisma is the cheapest path.
    let usageRows: Array<{ userId: string; count: number }> = [];
    try {
      const grouped = await prisma.analysis.groupBy({
        by: ['documentId'],
        where: { createdAt: { gte: startOfMonth } },
        _count: { _all: true },
      });
      // documentId → userId resolution (batch)
      const docIds = grouped.map(g => g.documentId);
      const docs = await prisma.document.findMany({
        where: { id: { in: docIds } },
        select: { id: true, userId: true },
      });
      const docToUser = new Map(docs.map(d => [d.id, d.userId]));
      const userCounts = new Map<string, number>();
      for (const row of grouped) {
        const uid = docToUser.get(row.documentId);
        if (!uid) continue;
        userCounts.set(uid, (userCounts.get(uid) ?? 0) + row._count._all);
      }
      usageRows = Array.from(userCounts.entries()).map(([userId, count]) => ({ userId, count }));
    } catch (err) {
      if (isSchemaDrift(err)) {
        log.warn('Analysis/Document schema drift — aborting cron cleanly');
        return NextResponse.json({ ok: true, scanned: 0, nudged: 0 });
      }
      throw err;
    }

    scanned = usageRows.length;

    for (const { userId, count } of usageRows) {
      try {
        // Resolve plan. If the lookup itself fails, skip this user this run
        // rather than defaulting to 'free' (which can mis-nudge a paying user).
        const sub = await prisma.subscription
          .findFirst({
            where: { userId, status: { in: ['active', 'trialing'] } },
            orderBy: { createdAt: 'desc' },
            select: { plan: true },
          })
          .catch(err => {
            log.warn('subscription lookup failed for usage nudge:', err);
            return undefined;
          });
        if (sub === undefined) {
          skipped++;
          continue;
        }
        const plan: PlanType = (sub?.plan as PlanType) || 'free';
        if (!METERED_PLANS.includes(plan)) {
          skipped++;
          continue;
        }
        const limit = PLANS[plan].analysesPerMonth;
        if (!Number.isFinite(limit)) {
          skipped++;
          continue;
        }
        const percent = Math.round((count / limit) * 100);
        if (percent < 80) {
          skipped++;
          continue;
        }

        // Idempotency: has a usage_limit_80 notification already fired this month?
        // If the dedup query itself fails, skip rather than risk a duplicate send —
        // a missed nudge is recoverable; a duplicate erodes trust.
        let already: { id: string } | null = null;
        try {
          already = await prisma.notificationLog.findFirst({
            where: {
              userId,
              type: 'usage_limit_80',
              createdAt: { gte: startOfMonth },
            },
            select: { id: true },
          });
        } catch (err) {
          log.warn('idempotency check failed; skipping to avoid duplicate nudge:', err);
          skipped++;
          continue;
        }
        if (already) {
          skipped++;
          continue;
        }

        const target = UPGRADE_TARGET[plan];
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        const checkoutUrl = target
          ? `${appUrl}/pricing?plan=${target}&from=usage_nudge`
          : `${appUrl}/pricing`;

        await notifyUsageLimit(userId, {
          planName: PLANS[plan].name,
          used: count,
          limit: limit,
          percentUsed: percent,
          nextPlanName: target ? PLANS[target].name : 'the next tier',
          nextPlanCheckoutUrl: checkoutUrl,
        });
        nudged++;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    log.info(
      `Usage nudge cron complete: scanned=${scanned} nudged=${nudged} skipped=${skipped} duration=${Date.now() - start}ms`
    );
    return NextResponse.json({ ok: true, scanned, nudged, skipped, errors: errors.slice(0, 5) });
  } catch (err) {
    log.error('Usage nudge cron failed', { error: err });
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
