import { prisma } from '@/lib/prisma';
import { PLANS, PlanType } from '@/lib/stripe';
import { isAdminUserId } from './admin';
import { isSchemaDrift } from './error';
import { createLogger } from './logger';

const log = createLogger('PlanLimits');

/**
 * How long a quota reservation holds an analysis slot before it's swept as
 * orphaned. Comfortably longer than the ~60s pipeline so a slow audit is never
 * swept mid-flight, short enough that a crashed reservation frees the slot
 * quickly. Sweep happens lazily on the next reserveAnalysisSlot for the user.
 */
export const ANALYSIS_RESERVATION_TTL_MS = 15 * 60 * 1000;

/**
 * Hard infrastructure ceiling on upload size, in MB — the Supabase project's
 * Storage upload limit, which sits BELOW the higher plan caps until the project
 * is upgraded. The plan `maxUploadMB` ladder (25 / 250 / 250 / 500) is the
 * marketing/pricing intent; this is what the storage layer can ACTUALLY accept
 * today, so the effective cap is the lower of the two.
 *
 * Currently 50 (Supabase free tier). When the project is upgraded (e.g. to Pro
 * after the first paying customer), bump the `STORAGE_MAX_UPLOAD_MB` env var in
 * Vercel (e.g. 500) and the cap + every "up to N MB" copy follows automatically.
 */
export const STORAGE_MAX_UPLOAD_MB = Number(process.env.STORAGE_MAX_UPLOAD_MB) || 50;

/** Effective upload cap = the lower of the plan cap and the storage ceiling. */
export function effectiveUploadMaxMB(plan: PlanType): number {
  return Math.min(PLANS[plan].maxUploadMB, STORAGE_MAX_UPLOAD_MB);
}

/**
 * First instant of the current month in UTC. Quota windows MUST be UTC so the
 * month boundary doesn't drift on a non-UTC runtime (Vercel is UTC, but a
 * local-time `new Date()` + setDate/setHours would mis-count audits in the
 * timezone-offset window around month rollover on any other host).
 */
function startOfCurrentMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

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

  const startOfMonth = startOfCurrentMonthUtc();

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

export interface ReservationResult {
  allowed: boolean;
  plan: PlanType;
  used: number;
  limit: number;
  /** Non-null when a slot was reserved; the caller MUST releaseAnalysisSlot(it)
   *  in a finally. Null when the plan is unlimited (nothing to release) or when
   *  the reservation table isn't migrated (legacy fallback). */
  reservationId: string | null;
}

/**
 * Atomically reserve a monthly-analysis slot BEFORE the expensive pipeline runs.
 *
 * A bare checkAnalysisLimit()-then-create is racy: two concurrent requests both
 * read used = limit-1, both pass, and both run the ~£0.40 / ~17-LLM-call
 * pipeline (the row is only created AFTER the pipeline, so a lock there can't
 * un-spend the money). Here, under a per-user advisory lock, we sweep stale
 * reservations, count this-month analyses PLUS live reservations, then either
 * insert a reservation (consuming the slot for the duration of the audit) or
 * deny. The caller MUST releaseAnalysisSlot(reservationId) in a finally.
 *
 * Unlimited plans (Team/Enterprise/admin/container-purchase) bypass entirely —
 * no slot, reservationId null. On schema drift (table not migrated) we fall
 * back to the legacy non-atomic check so the analysis path keeps working.
 */
export async function reserveAnalysisSlot(
  userId: string,
  containerId?: string | null
): Promise<ReservationResult> {
  // Reuse checkAnalysisLimit for plan/limit resolution + the container-purchase
  // and admin/unlimited bypasses (its monthly count is advisory here; the
  // authoritative count happens inside the lock below).
  const base = await checkAnalysisLimit(userId, containerId);
  if (!Number.isFinite(base.limit) || base.limit < 0) {
    return {
      allowed: true,
      plan: base.plan,
      used: base.used,
      limit: base.limit,
      reservationId: null,
    };
  }

  const startOfMonth = startOfCurrentMonthUtc();
  const staleCutoff = new Date(Date.now() - ANALYSIS_RESERVATION_TTL_MS);

  try {
    return await prisma.$transaction(async tx => {
      // Serialize quota mutations for this user (mirrors the webhook-cap lock).
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('analysis_quota'), hashtext(${userId}))`;

      // Sweep orphaned reservations (crash between reserve and release) so a
      // stale row can't permanently consume a slot.
      await tx.analysisReservation.deleteMany({
        where: { userId, createdAt: { lt: staleCutoff } },
      });

      const [monthlyUsed, liveReservations] = await Promise.all([
        tx.analysis.count({ where: { document: { userId }, createdAt: { gte: startOfMonth } } }),
        tx.analysisReservation.count({ where: { userId } }), // all non-stale post-sweep
      ]);
      const used = monthlyUsed + liveReservations;

      if (used >= base.limit) {
        return { allowed: false, plan: base.plan, used, limit: base.limit, reservationId: null };
      }

      const reservation = await tx.analysisReservation.create({ data: { userId } });
      return {
        allowed: true,
        plan: base.plan,
        used: used + 1,
        limit: base.limit,
        reservationId: reservation.id,
      };
    });
  } catch (err) {
    // Additive table not yet migrated → behave exactly as before this fix
    // (legacy non-atomic check). Fail OPEN is correct: the worst case is the
    // pre-existing race, never a blocked legitimate audit.
    if (isSchemaDrift(err)) {
      log.warn('AnalysisReservation not migrated — falling back to non-atomic limit check');
      return {
        allowed: base.allowed,
        plan: base.plan,
        used: base.used,
        limit: base.limit,
        reservationId: null,
      };
    }
    throw err;
  }
}

/**
 * Release a reserved analysis slot. Idempotent + non-fatal: a missing row
 * (already swept by TTL, or never created on an unlimited plan) is fine — the
 * TTL sweep is the backstop for any release that doesn't run (crash/cancel).
 */
export async function releaseAnalysisSlot(reservationId: string | null): Promise<void> {
  if (!reservationId) return;
  try {
    await prisma.analysisReservation.delete({ where: { id: reservationId } });
  } catch (err) {
    log.warn('releaseAnalysisSlot: reservation already gone (non-fatal)', err);
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
