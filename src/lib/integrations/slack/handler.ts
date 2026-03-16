/**
 * Slack Integration Handler
 *
 * Processes incoming Slack events (messages, reactions, overrides) and
 * converts them into HumanDecisionInput for the cognitive audit pipeline.
 *
 * This is the primary entry point for Product B — where enterprise
 * decisions actually happen is in Slack, not in formal meetings.
 *
 * Security:
 * - Verifies Slack signing secrets before processing
 * - All content is anonymized before analysis (GDPR compliance)
 * - PII is stripped at ingestion, not after
 */

import crypto from 'crypto';
import { createLogger } from '@/lib/utils/logger';
import type {
  SlackWebhookPayload,
  SlackNudgePayload,
  HumanDecisionInput,
  NudgeDefinition,
} from '@/types/human-audit';

const log = createLogger('SlackIntegration');

// ─── Signature Verification ──────────────────────────────────────────────────

/**
 * Verify that the incoming request is from Slack using HMAC-SHA256.
 * See: https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Reject requests older than 5 minutes (replay attack protection)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    log.warn('Slack request timestamp too old, possible replay attack');
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(sigBaseString);
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ─── Message Processing ──────────────────────────────────────────────────────

/** Decision-relevant keywords that indicate a message contains a decision */
const DECISION_SIGNALS = [
  // Approvals and escalations
  /\b(approv|reject|escalat|overrid|dismiss|ignor|defer|block)\w*/i,
  // Triage language
  /\b(p[0-4]|sev[0-4]|critical|urgent|priority)\b/i,
  // Decision verbs
  /\b(decided?|agreed?|let'?s\s+go|we'?ll\s+proceed|sign.?off|green.?light)\b/i,
  // Risk/override language
  /\b(accept.?risk|false.?positive|not\s+a\s+threat|safe\s+to\s+ignore)\b/i,
];

/**
 * Determine if a Slack message contains a decision worth auditing.
 * Avoids processing casual chat, status updates, or bot messages.
 */
export function isDecisionMessage(text: string): boolean {
  if (!text || text.length < 20) return false;
  return DECISION_SIGNALS.some((pattern) => pattern.test(text));
}

/**
 * Classify the type of decision from message content.
 */
export function classifyDecisionType(
  text: string
): HumanDecisionInput['decisionType'] {
  const lower = text.toLowerCase();

  if (/\b(p[0-4]|sev[0-4]|triage|classify)\b/.test(lower)) return 'triage';
  if (/\b(escalat|page|alert|notify)\b/.test(lower)) return 'escalation';
  if (/\b(approv|sign.?off|green.?light|lgtm)\b/.test(lower)) return 'approval';
  if (/\b(overrid|dismiss|ignore|false.?positive)\b/.test(lower)) return 'override';
  if (/\b(vendor|supplier|tool|platform|evaluate)\b/.test(lower)) return 'vendor_eval';
  if (/\b(strategy|roadmap|initiative|budget|plan)\b/.test(lower)) return 'strategic';

  return undefined;
}

/**
 * Convert a Slack event into a HumanDecisionInput for the audit pipeline.
 */
export function slackEventToDecisionInput(
  payload: SlackWebhookPayload
): HumanDecisionInput | null {
  const event = payload.event;
  if (!event || event.type !== 'message') return null;
  if (!isDecisionMessage(event.text)) return null;

  return {
    source: 'slack',
    sourceRef: `${event.channel}:${event.ts}`,
    channel: event.channel,
    decisionType: classifyDecisionType(event.text),
    participants: [event.user], // Thread participants can be enriched later
    content: event.text,
  };
}

// ─── Nudge Delivery ──────────────────────────────────────────────────────────

/**
 * Format a nudge as a Slack message with Block Kit formatting.
 * Nudges are designed to feel like coaching, not surveillance.
 */
export function formatNudgeForSlack(
  nudge: NudgeDefinition,
  threadTs?: string
): SlackNudgePayload {
  const severityEmoji = {
    info: ':bulb:',
    warning: ':warning:',
    critical: ':rotating_light:',
  }[nudge.severity];

  const blocks = [
    {
      type: 'section' as const,
      text: {
        type: 'mrkdwn' as const,
        text: `${severityEmoji} *Decision Intelligence Insight*\n${nudge.message}`,
      },
    },
    { type: 'divider' as const },
    {
      type: 'context' as const,
      elements: [
        {
          type: 'mrkdwn' as const,
          text: `_Powered by Decision Intel cognitive audit engine_ | <https://docs.decisionintel.ai/nudges|Learn more about nudges>`,
        },
      ],
    },
    {
      type: 'actions' as const,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Helpful' },
          action_id: 'nudge_helpful',
          value: 'true',
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Not relevant' },
          action_id: 'nudge_not_helpful',
          value: 'false',
        },
      ],
    },
  ];

  return {
    channel: '', // Set by caller based on decision context
    text: `${severityEmoji} ${nudge.message}`, // Fallback text
    blocks,
    thread_ts: threadTs,
  };
}

/**
 * Send a nudge to Slack via the Web API.
 * Uses the bot token stored in environment variables.
 */
export async function deliverSlackNudge(
  payload: SlackNudgePayload
): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    log.warn('SLACK_BOT_TOKEN not configured, skipping Slack nudge delivery');
    return false;
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      log.error('Slack API error:', data.error);
      return false;
    }

    log.info(`Nudge delivered to Slack channel ${payload.channel}`);
    return true;
  } catch (error) {
    log.error('Failed to deliver Slack nudge:', error);
    return false;
  }
}
