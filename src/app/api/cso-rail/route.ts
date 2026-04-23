/**
 * GET /api/cso-rail
 *
 * Thin aggregator for the CsoDashboardRail widget on /dashboard. Returns
 * the three counts the rail surfaces — audit backlog, outcomes awaiting
 * report, decision rooms still open — plus the effective plan so the
 * client can hide itself on Free/Pro.
 *
 * Plan gate: the rail only renders for team + enterprise plans (the
 * "Strategy" positioning tier in CLAUDE.md). Free + Pro get `{ gated: true }`
 * with zero counts so the client can short-circuit without a second fetch.
 *
 * All three count queries are fire-and-forget-safe — schema drift on any
 * table collapses that column to zero, the others keep rendering.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getUserPlan, getOrgPlan } from '@/lib/utils/plan-limits';

const log = createLogger('CsoRailAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org scope + effective plan.
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — personal scope only.
    }
    const plan = orgId ? await getOrgPlan(orgId) : await getUserPlan(user.id);
    const gated = plan !== 'team' && plan !== 'enterprise';

    if (gated) {
      return NextResponse.json({
        gated: true,
        plan,
        backlog: 0,
        outcomesPending: 0,
        roomsActive: 0,
      });
    }

    const analysisScope = orgId
      ? { document: { orgId } }
      : { document: { userId: user.id } };
    const documentScope = orgId ? { orgId } : { userId: user.id };

    const [backlog, outcomesPending, outcomesOverdue, roomsActive] = await Promise.all([
      // In-flight audits — Document.status tracks the upload + analysis
      // lifecycle (pending → analyzing → complete). We count anything
      // that's started but not yet complete.
      prisma.document
        .count({
          where: {
            ...documentScope,
            status: { in: ['pending', 'analyzing'] },
          },
        })
        .catch(() => 0),

      // Pending outcomes waiting on a CSO to report.
      prisma.analysis
        .count({ where: { ...analysisScope, outcomeStatus: 'pending_outcome' } })
        .catch(() => 0),

      // Overdue outcomes — distinct signal, colored separately on the rail.
      prisma.analysis
        .count({ where: { ...analysisScope, outcomeStatus: 'outcome_overdue' } })
        .catch(() => 0),

      // Open decision rooms where the current user is a participant.
      prisma.decisionRoom
        .count({
          where: {
            status: 'open',
            ...(orgId
              ? { orgId }
              : { participants: { some: { userId: user.id } } }),
          },
        })
        .catch(() => 0),
    ]);

    return NextResponse.json({
      gated: false,
      plan,
      backlog,
      outcomesPending,
      outcomesOverdue,
      outcomesTotal: outcomesPending + outcomesOverdue,
      roomsActive,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift on CSO rail:', code);
      return NextResponse.json({
        gated: true,
        plan: 'free',
        backlog: 0,
        outcomesPending: 0,
        outcomesOverdue: 0,
        outcomesTotal: 0,
        roomsActive: 0,
      });
    }
    log.error('GET /api/cso-rail failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
