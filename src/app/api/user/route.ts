import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

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
        const { data: { user } } = await supabase.auth.getUser();
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
                { status: 429, headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) } }
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
                }
            });
        } catch (auditErr) {
            log.warn('Could not write pre-deletion audit entry (non-fatal): ' +
                (auditErr instanceof Error ? auditErr.message : String(auditErr)));
        }

        // Delete all user data atomically.
        // Order matters: audit logs and rate limits are independent, then
        // documents (which cascade to analyses, bias instances, and embeddings),
        // then user settings.
        await prisma.$transaction(async (tx) => {
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
