import { prisma } from '@/lib/prisma';
import { PLANS, PlanType } from '@/lib/stripe';
import { isAdminUserId } from './admin';
import { createLogger } from './logger';

const log = createLogger('PlanLimits');

export async function getUserPlan(userId: string): Promise<PlanType> {
  // Founder / admin bypass — users listed in ADMIN_USER_IDS always resolve
  // to the enterprise plan so they can exercise gated features end-to-end
  // (full bias taxonomy, unlimited audits, team features) without burning
  // real money. Safe because the env var is server-only and explicit.
  if (isAdminUserId(userId)) return 'enterprise';

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
  } catch (_driftErr) {
    // Schema drift — default to free
    void _driftErr;
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
  } catch (_driftErr) {
    // Schema drift — default to free
    void _driftErr;
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
  containerId?: string | null
): Promise<{ allowed: boolean; plan: PlanType; used: number; limit: number }> {
  // If a per-container audit has been purchased, bypass subscription limits.
  if (containerId) {
    try {
      const containerAudit = await prisma.decisionContainerAuditPurchase.findFirst({
        where: { containerId, status: 'active' },
      });
      if (containerAudit) {
        return { allowed: true, plan: 'enterprise' as PlanType, used: 0, limit: -1 };
      }
    } catch (_driftErr) {
      // @schema-drift-tolerant — DecisionContainerAuditPurchase may not be migrated in older deployments.
      void _driftErr;
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
  } catch (_countErr) {
    // On error, deny (fail closed to prevent limit bypass)
    log.error('Analysis count check failed, denying by default:', _countErr);
    return { allowed: false, plan, used: 0, limit: limits.analysesPerMonth };
  }
}

/**
 * Get the maximum number of bias types allowed for a user's plan.
 *
 * Per the 2026-05-26 soft-limit pass: every plan now sees the FULL
 * 22-bias R²F taxonomy (the deceptive Free=5 gate was the audit
 * pipeline running all 22 and then HIDING results in the UI — which
 * was both confusing and a credibility hit). The function still
 * exists because some consumers truncate the bias list for display,
 * but the value is now BIAS_COUNT across every plan. When the
 * taxonomy grows beyond 22, edit PLANS in stripe.ts.
 *
 * Biases should be kept in severity order: critical > high > medium > low.
 */
export async function getBiasTypeLimit(
  userId: string
): Promise<{ plan: PlanType; maxBiasTypes: number }> {
  const plan = await getUserPlan(userId);
  return { plan, maxBiasTypes: PLANS[plan].biasTypes };
}

/**
 * Days from upload before the enforce-retention cron soft-deletes a
 * document for the given user. Org-scoped documents resolve via the
 * Org's plan, falling back to the user's plan only when the document
 * has no orgId.
 */
export async function getRetentionDaysForUser(userId: string): Promise<number> {
  const plan = await getUserPlan(userId);
  return PLANS[plan].retentionDays;
}

export async function getRetentionDaysForOrg(orgId: string): Promise<number> {
  const plan = await getOrgPlan(orgId);
  return PLANS[plan].retentionDays;
}

/**
 * Resolve the retention window for a single document based on its
 * org / user ownership. Used by the enforce-retention cron.
 */
export async function getRetentionDaysForDocument(doc: {
  userId: string;
  orgId?: string | null;
}): Promise<number> {
  return doc.orgId ? getRetentionDaysForOrg(doc.orgId) : getRetentionDaysForUser(doc.userId);
}

/** Days a soft-deleted document stays recoverable before hard-purge. */
export const SOFT_DELETE_GRACE_DAYS = 30;
