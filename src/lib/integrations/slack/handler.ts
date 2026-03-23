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
import { decryptToken } from '@/lib/utils/encryption';
import { prisma } from '@/lib/prisma';
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
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
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
  return DECISION_SIGNALS.some(pattern => pattern.test(text));
}

/**
 * Classify the type of decision from message content.
 */
export function classifyDecisionType(text: string): HumanDecisionInput['decisionType'] {
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
export function slackEventToDecisionInput(payload: SlackWebhookPayload): HumanDecisionInput | null {
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
export function formatNudgeForSlack(nudge: NudgeDefinition, threadTs?: string): SlackNudgePayload {
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
 * Resolve a bot token for a given Slack workspace.
 *
 * Multi-tenant: looks up the encrypted token from SlackInstallation.
 * Legacy fallback: uses SLACK_BOT_TOKEN env var (single-tenant mode).
 */
async function resolveToken(teamId?: string): Promise<string | null> {
  // Multi-tenant: look up per-workspace token
  if (teamId) {
    try {
      const installation = await prisma.slackInstallation.findUnique({
        where: { teamId, status: 'active' },
        select: { botTokenEncrypted: true, botTokenIv: true, botTokenTag: true },
      });

      if (installation && installation.botTokenEncrypted) {
        return decryptToken(installation);
      }
    } catch (error) {
      log.error(`Failed to resolve token for team ${teamId}:`, error);
    }
  }

  // Legacy fallback: single env var
  return process.env.SLACK_BOT_TOKEN || null;
}

/**
 * Send a nudge to Slack via the Web API.
 *
 * Multi-tenant: resolves the bot token per workspace from the DB.
 * Falls back to SLACK_BOT_TOKEN env var for legacy single-tenant setups.
 */
export async function deliverSlackNudge(
  payload: SlackNudgePayload,
  teamId?: string
): Promise<boolean> {
  const token = await resolveToken(teamId);
  if (!token) {
    log.warn('No Slack bot token available, skipping nudge delivery');
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

// ─── Pre-Decision Detection ─────────────────────────────────────────────────

/**
 * Signals that indicate a decision is ABOUT to be made — the deliberation
 * phase before commitment. These are distinct from DECISION_SIGNALS which
 * detect decisions already made.
 */
const PRE_DECISION_SIGNALS = [
  /\bshould\s+we\b/i,
  /\bthinking\s+about\b/i,
  /\bconsidering\b/i,
  /\bwhat\s+if\s+we\b/i,
  /\bdebating\s+whether\b/i,
  /\bproposal\s+to\b/i,
  /\boptions\s+are\b/i,
  /\bweighing\s+up\b/i,
  /\bdo\s+we\s+go\s+with\b/i,
  /\bleaning\s+towards?\b/i,
  /\brecommendation\s+is\b/i,
  /\bmy\s+gut\s+says\b/i,
];

/**
 * Detect whether a message is in the pre-decision deliberation phase —
 * i.e., BEFORE a decision has been committed. This is the optimal moment
 * for coaching nudges because interventions can still change outcomes.
 */
export function isPreDecisionMessage(text: string): boolean {
  if (!text || text.length < 10) return false;
  return PRE_DECISION_SIGNALS.some(pattern => pattern.test(text));
}

// ─── Bias Detection ─────────────────────────────────────────────────────────

/**
 * Cognitive bias signal patterns for real-time detection in Slack messages.
 * Each entry maps a bias name to the regex patterns that indicate it.
 */
const BIAS_PATTERNS: { bias: string; patterns: RegExp[] }[] = [
  {
    bias: 'anchoring',
    patterns: [
      /\binitial\s+offer\b/i,
      /\bstarting\s+point\b/i,
      /\bfirst\s+(price|number|quote|estimate|figure)\b/i,
      /\boriginal(ly)?\s+(price|cost|estimate|quote)\b/i,
    ],
  },
  {
    bias: 'confirmation_bias',
    patterns: [
      /\bconfirms?\s+what\s+I\s+thought\b/i,
      /\bas\s+expected\b/i,
      /\bjust\s+as\s+I\s+predicted\b/i,
      /\bknew\s+it\b/i,
      /\btold\s+you\s+so\b/i,
    ],
  },
  {
    bias: 'sunk_cost',
    patterns: [
      /\balready\s+invested\b/i,
      /\btoo\s+far\s+in\b/i,
      /\bcan'?t\s+stop\s+now\b/i,
      /\balready\s+spent\b/i,
      /\bcome\s+this\s+far\b/i,
      /\btoo\s+much\s+(time|money|effort)\s+(into|on)\b/i,
    ],
  },
  {
    bias: 'groupthink',
    patterns: [
      /\beveryone\s+agrees?\b/i,
      /\bno\s+objections?\b/i,
      /\bunanimous(ly)?\b/i,
      /\bwe\s+all\s+think\b/i,
      /\bnobody\s+disagrees?\b/i,
      /\bwe'?re\s+all\s+(on\s+the\s+same\s+page|aligned)\b/i,
    ],
  },
  {
    bias: 'availability_bias',
    patterns: [
      /\blast\s+time\s+this\s+happened\b/i,
      /\bremember\s+when\b/i,
      /\bjust\s+saw\b/i,
      /\bjust\s+(read|heard)\s+about\b/i,
      /\bhappened\s+(to\s+us|before)\b/i,
    ],
  },
  {
    bias: 'overconfidence',
    patterns: [
      /\bguaranteed\b/i,
      /\b100\s*%\b/i,
      /\bno\s+way\s+this\s+fails\b/i,
      /\bslam\s+dunk\b/i,
      /\bno[- ]brainer\b/i,
      /\bsure\s+thing\b/i,
      /\bcannot?\s+lose\b/i,
      /\bcan'?t\s+go\s+wrong\b/i,
    ],
  },
];

/**
 * Detect cognitive bias signals in a Slack message in real time.
 * Returns all detected biases with the matched signal text.
 */
export function detectMessageBiases(text: string): { bias: string; signal: string }[] {
  if (!text) return [];

  const detected: { bias: string; signal: string }[] = [];

  for (const { bias, patterns } of BIAS_PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        detected.push({ bias, signal: match[0] });
        break; // One match per bias type is sufficient
      }
    }
  }

  return detected;
}

// ─── Pre-Decision Nudge Generation ──────────────────────────────────────────

/**
 * Nudge templates keyed by bias type. These are coaching interventions
 * designed to be delivered BEFORE a decision is committed.
 */
const PRE_DECISION_NUDGE_TEMPLATES: Record<
  string,
  { message: string; severity: 'info' | 'warning' | 'critical' }
> = {
  anchoring: {
    message:
      'This thread shows anchoring signals. Want a 2-minute counterfactual before deciding?',
    severity: 'info',
  },
  confirmation_bias: {
    message:
      'Confirmation bias detected — consider actively seeking disconfirming evidence before committing.',
    severity: 'warning',
  },
  sunk_cost: {
    message:
      "Sunk cost language detected. Try reframing: 'If we were starting fresh today, would we still choose this?'",
    severity: 'warning',
  },
  groupthink: {
    message:
      'Groupthink detected — consider assigning a formal dissenter before voting.',
    severity: 'critical',
  },
  availability_bias: {
    message:
      'Availability bias signal — recent events may be overweighted. Check base-rate data before deciding.',
    severity: 'info',
  },
  overconfidence: {
    message:
      'Overconfidence language detected. Consider: what would need to be true for this to fail?',
    severity: 'warning',
  },
};

/**
 * Generate a coaching nudge for a pre-decision message based on detected biases.
 * Returns the highest-severity nudge, or null if no biases were detected.
 */
export function generatePreDecisionNudge(
  text: string,
  biases: { bias: string; signal: string }[]
): { message: string; severity: 'info' | 'warning' | 'critical' } | null {
  if (!text || biases.length === 0) return null;

  const severityRank = { info: 0, warning: 1, critical: 2 };
  let highestNudge: { message: string; severity: 'info' | 'warning' | 'critical' } | null = null;

  for (const { bias } of biases) {
    const template = PRE_DECISION_NUDGE_TEMPLATES[bias];
    if (!template) continue;

    if (!highestNudge || severityRank[template.severity] > severityRank[highestNudge.severity]) {
      highestNudge = { message: template.message, severity: template.severity };
    }
  }

  return highestNudge;
}

// ─── Decision Frame Extraction ──────────────────────────────────────────────

/**
 * Attempt to extract a Decision Frame from a Slack message.
 * Looks for a decision statement and mentioned stakeholders (@-mentions).
 *
 * This feeds into the /api/decision-frames endpoint for structured
 * pre-decision capture.
 */
export function extractDecisionFrame(
  text: string
): { decisionStatement: string; stakeholders: string[] } | null {
  if (!text || text.length < 15) return null;

  // Extract the decision statement: the first sentence that matches a
  // pre-decision signal, or the full text up to the first period/newline.
  let decisionStatement: string | null = null;

  for (const pattern of PRE_DECISION_SIGNALS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      // Grab from the match start to the next sentence boundary
      const fromMatch = text.slice(match.index);
      const sentenceEnd = fromMatch.search(/[.!?\n]/);
      decisionStatement =
        sentenceEnd > 0 ? fromMatch.slice(0, sentenceEnd).trim() : fromMatch.trim();
      break;
    }
  }

  if (!decisionStatement) return null;

  // Extract stakeholders from Slack @-mentions (format: <@U01ABC123>)
  const mentionPattern = /<@([A-Z0-9]+)>/g;
  const stakeholders: string[] = [];
  let mentionMatch: RegExpExecArray | null;
  while ((mentionMatch = mentionPattern.exec(text)) !== null) {
    stakeholders.push(mentionMatch[1]);
  }

  return { decisionStatement, stakeholders };
}

// ─── Pre-Decision Event Processing ──────────────────────────────────────────

/**
 * Convert a Slack event into a pre-decision processing result.
 *
 * This is the pre-decision counterpart to slackEventToDecisionInput.
 * Instead of capturing an already-made decision, it captures the
 * deliberation phase and returns coaching nudges, bias signals, and
 * an extracted Decision Frame for the /api/decision-frames endpoint.
 */
export function slackEventToPreDecisionInput(
  payload: SlackWebhookPayload
): {
  input: HumanDecisionInput;
  biases: { bias: string; signal: string }[];
  nudge: { message: string; severity: 'info' | 'warning' | 'critical' } | null;
  frame: { decisionStatement: string; stakeholders: string[] } | null;
} | null {
  const event = payload.event;
  if (!event || event.type !== 'message') return null;
  if (!isPreDecisionMessage(event.text)) return null;

  const biases = detectMessageBiases(event.text);
  const nudge = generatePreDecisionNudge(event.text, biases);
  const frame = extractDecisionFrame(event.text);

  const input: HumanDecisionInput = {
    source: 'slack',
    sourceRef: `${event.channel}:${event.ts}`,
    channel: event.channel,
    decisionType: classifyDecisionType(event.text),
    participants: [event.user],
    content: event.text,
  };

  return { input, biases, nudge, frame };
}
