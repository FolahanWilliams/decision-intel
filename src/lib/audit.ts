import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
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
  | 'CHAT_MESSAGE'
  | 'DELETE_ACCOUNT_DATA'
  // Human Cognitive Auditing (Product B)
  | 'SUBMIT_HUMAN_DECISION'
  | 'VIEW_COGNITIVE_AUDIT'
  | 'ACKNOWLEDGE_NUDGE'
  | 'SLACK_DECISION_INGESTED'
  | 'MEETING_TRANSCRIPT_ANALYZED';

export interface AuditLogParams {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(params: AuditLogParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

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
      },
    });

    log.info(`${params.action} by ${userId}`);
  } catch (error) {
    log.error('Failed to log action:', error);
    // Fail open - don't block the user if logging fails
  }
}
