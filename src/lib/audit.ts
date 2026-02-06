import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export type AuditAction =
    | 'VIEW_DOCUMENT'
    | 'SCAN_DOCUMENT'
    | 'EXPORT_PDF'
    | 'EXPORT_CSV'
    | 'SIMULATE_SCENARIO'
    | 'SEARCH_MARKET_TRENDS';

export interface AuditLogParams {
    action: AuditAction;
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
}

export async function logAudit(params: AuditLogParams) {
    try {
        const { userId } = await auth();

        if (!userId) {
            console.warn(`[Audit] Unauthenticated action: ${params.action}`);
            return;
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action: params.action,
                resource: params.resource,
                resourceId: params.resourceId,
                details: params.details || {},
                userAgent: 'server-action', // Can be enhanced with headers() if needed
            }
        });

        console.log(`[Audit] ${params.action} by ${userId}`);
    } catch (error) {
        console.error('[Audit] Failed to log action:', error);
        // Fail open - don't block the user if logging fails
    }
}
