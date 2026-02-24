import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Audit');

export type AuditAction =
    | 'VIEW_DOCUMENT'
    | 'SCAN_DOCUMENT'
    | 'EXPORT_PDF'
    | 'EXPORT_CSV'
    | 'SIMULATE_SCENARIO'
    | 'SEARCH_MARKET_TRENDS'
    | 'DELETE_ACCOUNT_DATA';

export interface AuditLogParams {
    action: AuditAction;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
}

export async function logAudit(params: AuditLogParams) {
    try {
        const { userId } = await auth();

        if (!userId) {
            log.warn(`Unauthenticated action: ${params.action}`);
            return;
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action: params.action,
                resource: params.resource,
                resourceId: params.resourceId,
                details: toPrismaJson(params.details || {}),
                userAgent: 'server-action', // Can be enhanced with headers() if needed
            }
        });

        log.info(`${params.action} by ${userId}`);
    } catch (error) {
        log.error('Failed to log action:', error);
        // Fail open - don't block the user if logging fails
    }
}
