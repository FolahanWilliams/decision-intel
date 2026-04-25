/**
 * GET /api/cron/enforce-retention
 *
 * Two-phase retention enforcement:
 *   Phase 1 (soft-delete): rows whose `uploadedAt + tier.retentionDays` is past
 *     have `deletedAt` set and `deletionReason='retention_expired'`. They
 *     remain in the DB but are invisible to all user-facing queries.
 *   Phase 2 (hard-purge): rows soft-deleted more than SOFT_DELETE_GRACE_DAYS
 *     ago are fully removed — DB cascade (analyses, biases, embeddings) +
 *     Supabase storage cleanup. Past this point recovery is impossible.
 *
 * Tier windows (src/lib/stripe.ts):
 *   Free 30d · Individual 90d · Strategy 365d · Enterprise 360d (configurable)
 *
 * Caps a single run to RUN_CAP soft-deletes and RUN_CAP hard-purges so a
 * backlog can't stall the cron timer or burn unbounded storage API quota.
 *
 * Auth: Bearer CRON_SECRET, matching the daily-linkedin pattern.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { PLANS, PlanType } from '@/lib/stripe';
import { SOFT_DELETE_GRACE_DAYS } from '@/lib/utils/plan-limits';
import { isAdminUserId } from '@/lib/utils/admin';
import { deleteVisualizations } from '@/lib/utils/visualization-storage';

const log = createLogger('EnforceRetention');

const RUN_CAP = 200;

type RetentionPlan = {
  /** Map of plan → retentionDays for fast resolution. */
  byPlan: Record<PlanType, number>;
};

function buildRetentionPlan(): RetentionPlan {
  return {
    byPlan: {
      free: PLANS.free.retentionDays,
      pro: PLANS.pro.retentionDays,
      team: PLANS.team.retentionDays,
      enterprise: PLANS.enterprise.retentionDays,
    },
  };
}

/**
 * Resolve a userId / orgId pair to a retentionDays value WITHOUT pulling the
 * subscription per row — the cron may scan thousands of rows, we don't want
 * O(n) Subscription queries. We bulk-load all active subscriptions once and
 * resolve from a Map.
 */
async function resolveRetentionMap(): Promise<{
  userPlan: Map<string, PlanType>;
  orgPlan: Map<string, PlanType>;
  /** Per-org retention override (2.1 deep). Wins over plan default when set. */
  orgOverride: Map<string, number>;
  retention: RetentionPlan;
}> {
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ['active', 'trialing'] } },
    select: { userId: true, orgId: true, plan: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const userPlan = new Map<string, PlanType>();
  const orgPlan = new Map<string, PlanType>();
  for (const s of subs) {
    if (s.orgId && !orgPlan.has(s.orgId)) {
      orgPlan.set(s.orgId, s.plan as PlanType);
    }
    if (s.userId && !userPlan.has(s.userId)) {
      userPlan.set(s.userId, s.plan as PlanType);
    }
  }

  // 2.1 deep — bulk-load all org-level overrides so the cron resolves
  // retention without per-row Org queries.
  const orgOverride = new Map<string, number>();
  try {
    const orgs = await prisma.organization.findMany({
      where: { retentionDaysOverride: { not: null } },
      select: { id: true, retentionDaysOverride: true },
    });
    for (const o of orgs) {
      if (o.retentionDaysOverride != null) orgOverride.set(o.id, o.retentionDaysOverride);
    }
  } catch {
    // Schema drift — pre-2.1-deep environment. Continue with plan defaults only.
  }

  return { userPlan, orgPlan, orgOverride, retention: buildRetentionPlan() };
}

function resolveDocPlan(
  doc: { userId: string; orgId: string | null },
  maps: { userPlan: Map<string, PlanType>; orgPlan: Map<string, PlanType> }
): PlanType {
  // Admin / founder bypass: anything owned by an admin userId stays on
  // 'enterprise' retention regardless of subscription state. Matches the
  // getUserPlan() admin shortcut.
  if (isAdminUserId(doc.userId)) return 'enterprise';

  if (doc.orgId) {
    const fromOrg = maps.orgPlan.get(doc.orgId);
    if (fromOrg) return fromOrg;
  }
  return maps.userPlan.get(doc.userId) ?? 'free';
}

/**
 * Effective retention window for a doc — owner override wins if the
 * doc's org has one, else the plan default applies (2.1 deep).
 */
function resolveRetentionDays(
  doc: { userId: string; orgId: string | null },
  maps: {
    userPlan: Map<string, PlanType>;
    orgPlan: Map<string, PlanType>;
    orgOverride: Map<string, number>;
    retention: RetentionPlan;
  }
): number {
  if (doc.orgId) {
    const override = maps.orgOverride.get(doc.orgId);
    if (typeof override === 'number' && override >= 30) return override;
  }
  const plan = resolveDocPlan(doc, maps);
  return maps.retention.byPlan[plan];
}

/** Days before hard-purge that the warning email is dispatched (2.1 deep). */
const RETENTION_WARNING_DAYS = 7;

export async function GET() {
  const headerList = await headers();
  const authHeader = headerList.get('authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (!safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const maps = await resolveRetentionMap();
    const now = new Date();

    // ── Phase 1: soft-delete past-retention documents ──────────────────────
    //
    // We pull a candidate slice (oldest uploadedAt first), filter against the
    // tier-resolved retention window, and update in batch. The query is
    // scoped to NOT-already-soft-deleted to keep idempotency.
    const longestWindow = Math.max(...Object.values(maps.retention.byPlan));
    const oldestRelevant = new Date(
      now.getTime() - 24 * 3600 * 1000 // anything older than 1 day
    );
    // Pull candidates older than the SHORTEST retention window — anything
    // newer can't possibly be expired on any tier yet.
    const shortestWindow = Math.min(...Object.values(maps.retention.byPlan));
    const eligibleBefore = new Date(now.getTime() - shortestWindow * 24 * 3600 * 1000);

    const candidates = await prisma.document.findMany({
      where: {
        deletedAt: null,
        uploadedAt: { lte: eligibleBefore },
        // Exclude isSample — synthetic docs are managed by the demo cleanup.
        isSample: false,
        // 2.1 deep — never soft-delete legally-held docs. The hold's
        // releasedAt being non-null means the hold has been lifted.
        OR: [
          { legalHoldId: null },
          { legalHold: { releasedAt: { not: null } } },
        ],
      },
      orderBy: { uploadedAt: 'asc' },
      take: RUN_CAP * 4, // pull more than we'll soft-delete to filter
      select: { id: true, userId: true, orgId: true, uploadedAt: true },
    });

    const toSoftDelete: string[] = [];
    for (const doc of candidates) {
      const retentionDays = resolveRetentionDays(doc, maps);
      const retentionMs = retentionDays * 24 * 3600 * 1000;
      const expiry = new Date(doc.uploadedAt.getTime() + retentionMs);
      if (expiry <= now) {
        toSoftDelete.push(doc.id);
        if (toSoftDelete.length >= RUN_CAP) break;
      }
    }

    let softDeleted = 0;
    if (toSoftDelete.length > 0) {
      const result = await prisma.document.updateMany({
        where: { id: { in: toSoftDelete }, deletedAt: null },
        data: {
          deletedAt: now,
          deletionReason: 'retention_expired',
        },
      });
      softDeleted = result.count;
    }

    // ── Phase 1.5: pre-deletion warning email (2.1 deep) ───────────────────
    //
    // Doc has been soft-deleted long enough that hard-purge is within the
    // warning window AND we haven't sent a warning yet. Fire-and-forget
    // email; stamp `deletionWarningSentAt` so we don't double-send.
    let warningsSent = 0;
    try {
      const warnAfter = new Date(
        now.getTime() - (SOFT_DELETE_GRACE_DAYS - RETENTION_WARNING_DAYS) * 24 * 3600 * 1000
      );
      const toWarn = await prisma.document.findMany({
        where: {
          deletedAt: { lte: warnAfter, not: null },
          deletionWarningSentAt: null,
          OR: [{ legalHoldId: null }, { legalHold: { releasedAt: { not: null } } }],
        },
        orderBy: { deletedAt: 'asc' },
        take: RUN_CAP,
        select: { id: true, filename: true, userId: true, deletedAt: true },
      });
      if (toWarn.length > 0) {
        // Resolve recipient emails via TeamMember (carries the auth-side email).
        const owners = new Set(toWarn.map(d => d.userId));
        const memberships = await prisma.teamMember
          .findMany({
            where: { userId: { in: Array.from(owners) } },
            select: { userId: true, email: true },
          })
          .catch(() => []);
        const emailByUser = new Map<string, string>();
        for (const m of memberships) {
          if (!emailByUser.has(m.userId)) emailByUser.set(m.userId, m.email);
        }
        const { sendEmail } = await import('@/lib/notifications/email');
        for (const d of toWarn) {
          const to = emailByUser.get(d.userId);
          if (!to) continue;
          const purgeAt = new Date(
            (d.deletedAt!.getTime() ?? now.getTime()) +
              SOFT_DELETE_GRACE_DAYS * 24 * 3600 * 1000
          );
          const purgeStr = purgeAt.toLocaleDateString();
          const deletedStr = d.deletedAt!.toLocaleDateString();
          await sendEmail({
            to,
            subject: `Decision Intel — ${d.filename} will be permanently deleted on ${purgeStr}`,
            text: `The document "${d.filename}" was soft-deleted on ${deletedStr} and is scheduled for permanent purge on ${purgeStr} (~${RETENTION_WARNING_DAYS} days from now). If you need to keep it, restore from the document detail page or place it on legal hold. This warning is sent once per document.`,
            html: `<p>The document <strong>${d.filename}</strong> was soft-deleted on ${deletedStr} and is scheduled for permanent purge on <strong>${purgeStr}</strong> (~${RETENTION_WARNING_DAYS} days from now).</p><p>If you need to keep it, <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/documents/${d.id}">restore</a> it from the document detail page or place it on legal hold.</p><p style="font-size:12px;color:#666">This warning is sent once per document.</p>`,
          }).catch((err: unknown) =>
            log.warn('retention warning email failed:', err instanceof Error ? err.message : String(err))
          );
        }
        const warned = await prisma.document.updateMany({
          where: { id: { in: toWarn.map(d => d.id) }, deletionWarningSentAt: null },
          data: { deletionWarningSentAt: now },
        });
        warningsSent = warned.count;
      }
    } catch (warnErr) {
      log.warn(
        'retention warning pass failed (non-critical):',
        warnErr instanceof Error ? warnErr.message : String(warnErr)
      );
    }

    // ── Phase 2: hard-purge documents soft-deleted past the grace window ──
    const purgeBefore = new Date(
      now.getTime() - SOFT_DELETE_GRACE_DAYS * 24 * 3600 * 1000
    );
    const toPurge = await prisma.document.findMany({
      where: {
        deletedAt: { lte: purgeBefore },
        // 2.1 deep — never hard-purge legally-held docs.
        OR: [{ legalHoldId: null }, { legalHold: { releasedAt: { not: null } } }],
      },
      orderBy: { deletedAt: 'asc' },
      take: RUN_CAP,
      select: {
        id: true,
        filename: true,
        userId: true,
        analyses: { select: { id: true } },
      },
    });

    let hardPurged = 0;
    let storageFailures = 0;
    for (const doc of toPurge) {
      try {
        // DB cascade handles Analysis, BiasInstance, DecisionEmbedding, etc.
        // Same retry-on-FK-violation guard as the user-triggered delete.
        try {
          await prisma.document.delete({ where: { id: doc.id } });
        } catch (deleteErr: unknown) {
          const code = (deleteErr as { code?: string }).code;
          if (code === 'P2003') {
            await prisma.$executeRaw`DELETE FROM "HumanDecisionAudit" WHERE "documentId" = ${doc.id}`.catch(
              () => {}
            );
            await prisma.document.delete({ where: { id: doc.id } });
          } else {
            throw deleteErr;
          }
        }

        // Visualizations + storage cleanup (fire-and-forget per analysis).
        for (const analysis of doc.analyses) {
          deleteVisualizations('analysis', analysis.id).catch(err =>
            log.warn(`viz cleanup failed for analysis ${analysis.id}:`, err)
          );
        }

        // Supabase storage cleanup.
        try {
          const { getServiceSupabase } = await import('@/lib/supabase');
          const supabase = getServiceSupabase();
          const ext = path.extname(doc.filename);
          const storagePath = `${doc.userId}/${doc.id}${ext}`;
          const bucket = process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf';
          const { error: rmErr } = await supabase.storage.from(bucket).remove([storagePath]);
          if (rmErr) {
            storageFailures++;
            log.warn(`storage cleanup failed for ${storagePath}: ${rmErr.message}`);
          }
        } catch (storageErr) {
          storageFailures++;
          log.warn('storage cleanup error:', storageErr);
        }

        hardPurged++;
      } catch (err) {
        log.error(`hard-purge failed for document ${doc.id}:`, err as Error);
      }
    }

    log.info('retention pass complete', {
      candidatesScanned: candidates.length,
      softDeleted,
      warningsSent,
      hardPurged,
      storageFailures,
      windowsByPlan: maps.retention.byPlan,
      orgOverrides: maps.orgOverride.size,
      hint:
        candidates.length === RUN_CAP * 4
          ? `cap reached for soft-delete pass (${RUN_CAP * 4} candidates) — backlog`
          : undefined,
    });
    // longestWindow + oldestRelevant kept for log shape parity if needed
    void longestWindow;
    void oldestRelevant;

    return NextResponse.json({
      ok: true,
      softDeleted,
      warningsSent,
      hardPurged,
      storageFailures,
      candidatesScanned: candidates.length,
      windowsByPlan: maps.retention.byPlan,
      orgOverrides: maps.orgOverride.size,
      graceDays: SOFT_DELETE_GRACE_DAYS,
      warningWindow: RETENTION_WARNING_DAYS,
    });
  } catch (err) {
    log.error('enforce-retention failed', err as Error);
    return NextResponse.json({ error: 'Retention enforcement failed' }, { status: 500 });
  }
}
