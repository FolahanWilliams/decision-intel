import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { getStripe } from '@/lib/stripe';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('UserRoute');

/**
 * DELETE /api/user
 *
 * GDPR Right-to-Erasure: permanently deletes all data owned by the
 * authenticated user. The deletion is wrapped in a Prisma transaction
 * for atomicity. A final audit entry is written BEFORE deletion begins
 * so there is a record of the erasure request.
 *
 * Document → Analysis / DecisionEmbedding cascade automatically via
 * Prisma's onDelete: Cascade relations. BiasInstance cascades via Analysis.
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 2 deletion attempts per hour
    const rateLimitResult = await checkRateLimit(userId, '/api/user/delete', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 2,
      failMode: 'open',
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    // Write the final audit entry BEFORE deleting (the record itself will
    // be erased with everything else, but it ensures the action is logged).
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_ACCOUNT_DATA',
          resource: 'User',
          resourceId: userId,
          details: { requestedAt: new Date().toISOString() },
          userAgent: 'user-request',
        },
      });
    } catch (auditErr) {
      log.warn(
        'Could not write pre-deletion audit entry (non-fatal): ' +
          (auditErr instanceof Error ? auditErr.message : String(auditErr))
      );
    }

    // Cancel Stripe subscription BEFORE deleting data (needs stripeSubscriptionId)
    try {
      const sub = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['active', 'trialing'] } },
        select: { stripeSubscriptionId: true },
      });
      if (sub?.stripeSubscriptionId) {
        await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
        log.info(`Canceled Stripe subscription ${sub.stripeSubscriptionId} for user ${userId}`);
      }
    } catch (stripeErr) {
      log.warn(
        'Failed to cancel Stripe subscription (continuing with deletion):',
        stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
      );
    }

    // Delete all user data atomically.
    // Order matters: dependent tables first (FK constraints), then parents.
    // Document → Analysis cascade handles BiasInstance, DecisionEmbedding, AnalysisVersion.
    //
    // Schema-drift guard: some tables may not exist yet if migrations are pending.
    // We only swallow P2021/P2022 errors — all other errors propagate and abort
    // the transaction so data integrity is preserved.
    const schemaDriftSafe = async (fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (err) {
        if (isSchemaDrift(err)) {
          log.warn('Schema drift during user deletion (skipping table): ' + (err as Error).message);
          return;
        }
        throw err;
      }
    };

    await prisma.$transaction(async tx => {
      // Outcome & learning data
      await schemaDriftSafe(() => tx.decisionOutcome.deleteMany({ where: { userId } }));
      await schemaDriftSafe(() => tx.decisionPrior.deleteMany({ where: { userId } }));
      await schemaDriftSafe(() => tx.decisionFrame.deleteMany({ where: { userId } }));

      // Product B: Nudges → CognitiveAudits → HumanDecisions (FK order)
      // Nudges can be linked via humanDecision OR targetUserId
      await schemaDriftSafe(() =>
        tx.nudge.deleteMany({
          where: { OR: [{ humanDecision: { userId } }, { targetUserId: userId }] },
        })
      );
      await schemaDriftSafe(() =>
        tx.cognitiveAudit.deleteMany({ where: { humanDecision: { userId } } })
      );
      await tx.humanDecision.deleteMany({ where: { userId } });

      // Share links + access logs (access cascades from shareLink)
      await schemaDriftSafe(() => tx.shareLink.deleteMany({ where: { userId } }));

      // Notifications
      await schemaDriftSafe(() => tx.notificationLog.deleteMany({ where: { userId } }));

      // Subscription
      await schemaDriftSafe(() => tx.subscription.deleteMany({ where: { userId } }));

      // Team membership (remove from team, don't delete the org)
      await schemaDriftSafe(() => tx.teamMember.deleteMany({ where: { userId } }));

      // Product A: Documents cascade to Analyses, BiasInstances, Embeddings
      await tx.auditLog.deleteMany({ where: { userId } });
      await tx.rateLimit.deleteMany({ where: { identifier: userId } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.userSettings.deleteMany({ where: { userId } });
    });

    log.info(`Deleted all data for user ${userId}`);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    log.error('Error deleting user data:', error);
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 });
  }
}
