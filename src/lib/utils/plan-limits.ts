import { prisma } from '@/lib/prisma';
import { PLANS, PlanType } from '@/lib/stripe';
import { createLogger } from './logger';

const log = createLogger('PlanLimits');

export async function getUserPlan(userId: string): Promise<PlanType> {
  try {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { plan: true },
    });
    return (sub?.plan as PlanType) || 'free';
  } catch {
    // Schema drift — default to free
    return 'free';
  }
}

/**
 * Resolve the plan for an entire organization. Checks for an org-scoped
 * subscription first, then falls back to the org owner's personal plan,
 * then to 'free' on any error.
 */
export async function getOrgPlan(orgId: string): Promise<PlanType> {
  try {
    // Prefer an org-scoped subscription if one exists.
    const orgSub = await prisma.subscription.findFirst({
      where: { orgId, status: { in: ['active', 'trialing'] } },
      orderBy: { createdAt: 'desc' },
      select: { plan: true },
    });
    if (orgSub?.plan) return orgSub.plan as PlanType;

    // Fall back to the owner's personal plan.
    const owner = await prisma.teamMember.findFirst({
      where: { orgId, role: 'owner' },
      select: { userId: true },
    });
    if (owner?.userId) return getUserPlan(owner.userId);
  } catch {
    // Schema drift — default to free
  }
  return 'free';
}

/**
 * Check whether an organization can add another team member given its plan.
 * Returns the current count, the plan-allowed limit, and whether another
 * seat is available. Uses `maxTeamMembers` from `PLANS`.
 */
export async function checkTeamSizeLimit(
  orgId: string
): Promise<{ allowed: boolean; plan: PlanType; used: number; limit: number }> {
  const plan = await getOrgPlan(orgId);
  const limit = PLANS[plan].maxTeamMembers;

  try {
    const [memberCount, pendingInvites] = await Promise.all([
      prisma.teamMember.count({ where: { orgId } }),
      prisma.teamInvite.count({ where: { orgId, status: 'pending' } }),
    ]);
    // Count pending invites against the limit so the cap cannot be bypassed
    // by spamming invites.
    const used = memberCount + pendingInvites;
    return {
      allowed: used < limit,
      plan,
      used,
      limit: Number.isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER,
    };
  } catch {
    log.error('Team size check failed, denying by default');
    return {
      allowed: false,
      plan,
      used: 0,
      limit: Number.isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER,
    };
  }
}

export async function checkAnalysisLimit(
  userId: string,
  dealId?: string | null
): Promise<{ allowed: boolean; plan: PlanType; used: number; limit: number }> {
  // If a deal audit has been purchased, bypass subscription limits for that deal
  if (dealId) {
    try {
      const dealAudit = await prisma.dealAuditPurchase.findFirst({
        where: { dealId, status: 'active' },
      });
      if (dealAudit) {
        return { allowed: true, plan: 'enterprise' as PlanType, used: 0, limit: -1 };
      }
    } catch {
      // Schema drift — DealAuditPurchase table may not exist
    }
  }

  const plan = await getUserPlan(userId);
  const limits = PLANS[plan];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const used = await prisma.analysis.count({
      where: {
        document: { userId },
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      allowed: used < limits.analysesPerMonth,
      plan,
      used,
      limit: limits.analysesPerMonth,
    };
  } catch {
    // On error, deny (fail closed to prevent limit bypass)
    log.error('Analysis count check failed, denying by default');
    return { allowed: false, plan, used: 0, limit: limits.analysesPerMonth };
  }
}

/**
 * Get the maximum number of bias types allowed for a user's plan.
 * Used to truncate bias results to plan limits (Free=5, Pro/Team/Enterprise=30).
 * Biases should be kept in severity order: critical > high > medium > low.
 */
export async function getBiasTypeLimit(userId: string): Promise<{ plan: PlanType; maxBiasTypes: number }> {
  const plan = await getUserPlan(userId);
  return { plan, maxBiasTypes: PLANS[plan].biasTypes };
}
