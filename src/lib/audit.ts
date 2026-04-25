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
  | 'MEETING_TRANSCRIPT_ANALYZED'
  | 'SIMULATE_COGNITIVE_AUDIT'
  // Meeting Intelligence
  | 'UPLOAD_MEETING'
  | 'MEETING_TRANSCRIBED'
  // Decision Copilot
  | 'COPILOT_MESSAGE'
  // Document Uploads
  | 'UPLOAD_DOCUMENT'
  | 'BULK_UPLOAD'
  // SSO / SAML configuration
  | 'SSO_CONFIGURATION_CREATED'
  | 'SSO_CONFIGURATION_UPDATED'
  | 'SSO_CONFIGURATION_DELETED'
  // Bias-level collaboration
  | 'BIAS_COMMENT_CREATED'
  | 'BIAS_COMMENT_UPDATED'
  | 'BIAS_COMMENT_RESOLVED'
  | 'BIAS_COMMENT_DELETED'
  | 'BIAS_TASK_CREATED'
  | 'BIAS_TASK_UPDATED'
  | 'BIAS_TASK_REASSIGNED'
  | 'BIAS_TASK_RESOLVED'
  | 'BIAS_TASK_DELETED'
  // Document RBAC (3.5 deep)
  | 'DOCUMENT_VISIBILITY_CHANGED'
  | 'DOCUMENT_ACCESS_GRANTED'
  | 'DOCUMENT_ACCESS_REVOKED'
  // Redaction trail (3.2 deep)
  | 'REDACTION_APPLIED'
  | 'REDACTION_SKIPPED'
  // Share-link revocation (3.3 deep)
  | 'SHARE_LINK_CREATED'
  | 'SHARE_LINK_REVOKED'
  | 'SHARE_LINK_VIEWED'
  // Decision Rooms · pre-IC blind-prior platform (4.1 deep)
  | 'BLIND_PRIOR_INVITES_DISTRIBUTED'
  | 'BLIND_PRIOR_SUBMITTED'
  | 'BLIND_PRIOR_REVEAL_FIRED'
  | 'BLIND_PRIOR_REMINDER_SENT'
  // Decision Package (4.4 deep)
  | 'DECISION_PACKAGE_CREATED'
  | 'DECISION_PACKAGE_UPDATED'
  | 'DECISION_PACKAGE_DELETED'
  | 'DECISION_PACKAGE_DOCUMENT_ADDED'
  | 'DECISION_PACKAGE_DOCUMENT_REMOVED'
  | 'DECISION_PACKAGE_CROSS_REFERENCE_RUN'
  | 'DECISION_PACKAGE_OUTCOME_LOGGED';

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
