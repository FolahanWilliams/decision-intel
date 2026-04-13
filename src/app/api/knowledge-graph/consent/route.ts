import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getUserPlan } from '@/lib/utils/plan-limits';
import { createLogger } from '@/lib/utils/logger';
import { apiError, apiSuccess } from '@/lib/utils/api-response';

const log = createLogger('KGMergeConsent');

type ConsentStatus = 'pending' | 'merged' | 'private' | 'not_applicable';

interface ConsentResponse {
  status: ConsentStatus;
  memoCount: number;
  orgId: string | null;
  decidedAt: string | null;
}

/**
 * GET: Returns the current user's KG merge consent state plus their
 * personal memo count. Used by the dashboard to decide whether to
 * show the KGMergeConsentModal.
 *
 * Status semantics:
 *   - "pending": user is on a team plan AND has personal memos AND has
 *     not made a decision yet. Show the modal.
 *   - "merged": user opted in. Merge has happened (or will happen in
 *     the background). Do not show the modal.
 *   - "private": user opted out. Personal history stays private. Do
 *     not show the modal.
 *   - "not_applicable": user is not on a team plan, or has no personal
 *     memos to merge. Do not show the modal.
 */
export async function GET(): Promise<NextResponse<ConsentResponse | { error: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    const plan = await getUserPlan(user.id);
    const onTeamPlan = plan === 'team' || plan === 'enterprise';

    // Find the user's team membership (if any) so we can read/write
    // the consent fields scoped to that org.
    const membership = await prisma.teamMember
      .findFirst({
        where: { userId: user.id },
        select: { id: true, orgId: true, kgMergeConsent: true, kgMergeDecidedAt: true },
        orderBy: { joinedAt: 'desc' },
      })
      .catch(() => null);

    // Count the user's personal memos (analyses on documents they uploaded).
    const memoCount = await prisma.analysis
      .count({ where: { document: { userId: user.id } } })
      .catch(() => 0);

    // Resolve status.
    let status: ConsentStatus;
    if (!onTeamPlan || memoCount === 0 || !membership) {
      status = 'not_applicable';
    } else if (membership.kgMergeConsent === 'merged') {
      status = 'merged';
    } else if (membership.kgMergeConsent === 'private') {
      status = 'private';
    } else {
      status = 'pending';
    }

    return NextResponse.json({
      status,
      memoCount,
      orgId: membership?.orgId ?? null,
      decidedAt: membership?.kgMergeDecidedAt?.toISOString() ?? null,
    });
  } catch (err) {
    log.error('Failed to read KG merge consent', err);
    return apiError({ error: 'Failed to read consent', status: 500 });
  }
}

/**
 * POST: Records the user's decision on merging their Personal Decision
 * History into the team Knowledge Graph. Idempotent on the decision
 * field but records a new decidedAt timestamp each time it's called.
 *
 * Body: { decision: "merged" | "private" }
 *
 * Future work: when decision === "merged", kick off the actual merge
 * job (background worker that relinks memo nodes into the team graph).
 * For now we just record the decision; the merge job can be wired in
 * when the first real Pro-to-Team upgrade happens.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { decision?: string };
    const decision = body.decision;

    if (decision !== 'merged' && decision !== 'private') {
      return apiError({
        error: 'Invalid decision. Expected "merged" or "private".',
        status: 400,
      });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { id: true, orgId: true },
      orderBy: { joinedAt: 'desc' },
    });

    if (!membership) {
      return apiError({ error: 'No team membership found for this user.', status: 404 });
    }

    await prisma.teamMember.update({
      where: { id: membership.id },
      data: {
        kgMergeConsent: decision,
        kgMergeDecidedAt: new Date(),
      },
    });

    log.info(`User ${user.id} recorded KG merge consent: ${decision}`, {
      orgId: membership.orgId,
    });

    // TODO (post-first-customer): if decision === "merged", enqueue a
    // background job that links this user's analyses into the org-scoped
    // Knowledge Graph. For now, the decision is recorded and will be
    // honored when the merge worker ships.

    return apiSuccess({ data: { decision, decidedAt: new Date().toISOString() } });
  } catch (err) {
    log.error('Failed to record KG merge consent', err);
    return apiError({ error: 'Failed to record consent', status: 500 });
  }
}
