/**
 * DPR external-share alert (locked 2026-04-26 — under-leveraged-move #2 from
 * NotebookLM strategic synthesis).
 *
 * Fires a one-line email to FOUNDER_EMAIL the moment a Decision Provenance
 * Record (DPR) is downloaded by anyone OTHER than the user who created the
 * underlying analysis. This is the highest-value conversion signal in the
 * product — a non-original-auditor opening the DPR means the artefact has
 * crossed an organisational boundary (board member, co-investor, GC,
 * regulator, counterparty), proving board-grade value.
 *
 * Per founder-school lesson es_8 (Design Partner Health Metrics, ranked by
 * differentiation), the "first external DPR share" is metric #3 — the
 * highest-value SINGLE conversion signal. Per es_10 (Specimen Audit Live),
 * the moment a partner is ready to send DI artefacts externally is the
 * moment the upgrade conversation closes itself.
 *
 * Fail-open by design (per CLAUDE.md fire-and-forget rule for notifications):
 * any failure here is logged at warn level but never blocks the DPR
 * download response. The audit log row is still created upstream regardless
 * of whether the alert email fires.
 */

import { sendEmail } from './email';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DprShareAlert');

export type DprResourceType = 'document' | 'deal';

export interface DprShareAlertParams {
  resourceType: DprResourceType;
  /** Document ID or Deal ID. */
  resourceId: string;
  /** Analysis or Deal-level identifier the DPR was rooted on. */
  rootId: string;
  /** The user who just downloaded the DPR. */
  downloaderUserId: string;
  /** The user who created the original analysis (or the deal owner). */
  originalAuditorUserId: string | null;
  /** Filename the user received (for the alert subject line). */
  filename: string;
  /** Optional: brief context for the alert body (org name, deal sector, etc). */
  context?: string;
  /** Optional: input hash for cross-reference with the audit log. */
  inputHash?: string;
}

/**
 * Determine if this download counts as an "external share" event and, if so,
 * fire the alert email to the founder. Returns the action taken so callers
 * can log it; never throws.
 */
export async function notifyExternalDprDownload(
  params: DprShareAlertParams
): Promise<'fired' | 'skipped_self_download' | 'skipped_no_founder_email' | 'failed'> {
  // Skip if the downloader IS the original auditor — this is just the user
  // re-downloading their own artefact, not an external share.
  if (
    params.originalAuditorUserId &&
    params.downloaderUserId === params.originalAuditorUserId
  ) {
    return 'skipped_self_download';
  }

  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) {
    log.warn('FOUNDER_EMAIL not configured — DPR external-share alert skipped');
    return 'skipped_no_founder_email';
  }

  const subject = `DPR shared externally · ${params.resourceType} · ${params.filename}`;

  // Plain HTML — this is a one-shot internal notification, not a customer email.
  // Optimised for mobile inbox read in 5 seconds.
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; max-width: 580px;">
      <h2 style="font-size: 16px; color: #16A34A; margin: 0 0 12px;">External DPR share — high-value signal</h2>
      <p style="font-size: 13px; color: #334155; line-height: 1.55; margin: 0 0 14px;">
        A Decision Provenance Record was just downloaded by a user OTHER than
        the original auditor. Per the design-partner health metric framework,
        this is the strongest single conversion signal the product produces.
      </p>
      <table style="font-size: 12px; color: #334155; line-height: 1.5; border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 4px 8px 4px 0; color: #64748B;">Resource</td><td style="padding: 4px 0;">${escapeHtml(params.resourceType)} <code>${escapeHtml(params.resourceId)}</code></td></tr>
        <tr><td style="padding: 4px 8px 4px 0; color: #64748B;">Root ID</td><td style="padding: 4px 0;"><code>${escapeHtml(params.rootId)}</code></td></tr>
        <tr><td style="padding: 4px 8px 4px 0; color: #64748B;">Filename</td><td style="padding: 4px 0;"><code>${escapeHtml(params.filename)}</code></td></tr>
        <tr><td style="padding: 4px 8px 4px 0; color: #64748B;">Original auditor</td><td style="padding: 4px 0;"><code>${escapeHtml(params.originalAuditorUserId ?? 'unknown')}</code></td></tr>
        <tr><td style="padding: 4px 8px 4px 0; color: #64748B;">Downloader</td><td style="padding: 4px 0;"><code>${escapeHtml(params.downloaderUserId)}</code></td></tr>
        ${params.context ? `<tr><td style="padding: 4px 8px 4px 0; color: #64748B;">Context</td><td style="padding: 4px 0;">${escapeHtml(params.context)}</td></tr>` : ''}
        ${params.inputHash ? `<tr><td style="padding: 4px 8px 4px 0; color: #64748B;">Input hash</td><td style="padding: 4px 0;"><code>${escapeHtml(params.inputHash.slice(0, 16))}...</code></td></tr>` : ''}
      </table>
      <p style="font-size: 12px; color: #64748B; line-height: 1.55; margin: 14px 0 0;">
        Recommended next action: reach out to the design-partner contact within
        24h while the artefact is still in the recipient's inbox. The conversation
        opener: "I noticed your DPR was opened externally — was that the IC review
        or a co-investor briefing?" That question converts to upgrade
        meaningfully more often than waiting for the partner to surface the
        share themselves.
      </p>
    </div>
  `;

  try {
    const result = await sendEmail({ to: founderEmail, subject, html });
    if (result === 'sent' || result === 'dry_run') {
      log.info(`DPR external-share alert ${result} for ${params.resourceType}/${params.resourceId}`);
      return 'fired';
    }
    log.warn(`DPR external-share alert send failed (sendEmail returned ${result})`);
    return 'failed';
  } catch (err) {
    log.warn(
      'DPR external-share alert failed:',
      err instanceof Error ? err.message : String(err)
    );
    return 'failed';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
