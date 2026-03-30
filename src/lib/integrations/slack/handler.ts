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
  if (/\b(resource.?alloc|allocate.?resources|budget.?size|commit.?resources|allocate.?budget|deploy.?capital)\b/.test(lower))
    return 'resource_allocation';
  if (/\b(business.?case|proposal.?review|strategic.?memo|project.?proposal|strategic.?plan)\b/.test(lower))
    return 'strategic_proposal';
  if (/\b(wind.?down|discontinue|sunset|close.?out|decommission|realiz|liquidat)\b/.test(lower)) return 'initiative_closure';
  if (/\b(m&a|merger|acqui|takeover|partnership|joint.?venture|strategic.?alliance)\b/.test(lower)) return 'm_and_a';

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
export async function resolveToken(teamId?: string): Promise<string | null> {
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
      // Handle expired / revoked tokens
      if (
        data.error === 'token_revoked' ||
        data.error === 'token_expired' ||
        data.error === 'invalid_auth' ||
        data.error === 'account_inactive' ||
        response.status === 401
      ) {
        log.warn(
          `Slack token invalid (${data.error}) for team ${teamId ?? 'legacy'}, marking installation inactive`
        );
        await markInstallationInactive(teamId);
        return false;
      }
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

// ─── Token Expiry Recovery ──────────────────────────────────────────────────

/**
 * Mark a Slack installation as inactive when the bot token is expired or revoked.
 * This prevents repeated failed API calls and surfaces the issue in the settings UI.
 */
async function markInstallationInactive(teamId?: string): Promise<void> {
  if (!teamId) return;
  try {
    await prisma.slackInstallation.update({
      where: { teamId },
      data: {
        status: 'token_expired',
        revokedAt: new Date(),
      },
    });
    log.info(`Marked Slack installation for team ${teamId} as token_expired`);
  } catch (err) {
    log.error(`Failed to mark installation inactive for team ${teamId}:`, err);
  }
}

// ─── Safe Event Processing ──────────────────────────────────────────────────

/**
 * Safely process a Slack webhook event with full error recovery.
 * Wraps slackEventToDecisionInput + pre-decision + outcome detection in try/catch,
 * handling token expiry by marking the installation inactive.
 */
export async function processSlackEvent(
  payload: SlackWebhookPayload,
  orgId?: string | null
): Promise<{
  decision: HumanDecisionInput | null;
  preDecision: Awaited<ReturnType<typeof slackEventToPreDecisionInput>>;
  outcome: { detected: boolean; draftCount: number };
}> {
  const result: {
    decision: HumanDecisionInput | null;
    preDecision: Awaited<ReturnType<typeof slackEventToPreDecisionInput>>;
    outcome: { detected: boolean; draftCount: number };
  } = {
    decision: null,
    preDecision: null,
    outcome: { detected: false, draftCount: 0 },
  };

  try {
    // 1. Check for committed decisions
    result.decision = slackEventToDecisionInput(payload);

    // 2. Check for pre-decision deliberation
    result.preDecision = await slackEventToPreDecisionInput(payload, orgId);

    // 3. Check for outcome signals
    result.outcome = await processSlackOutcomeSignal(payload);
  } catch (error: unknown) {
    const teamId = payload.team_id;

    // Detect Slack API auth failures embedded in processing errors
    if (
      error instanceof Error &&
      (error.message?.includes('token_revoked') ||
        error.message?.includes('invalid_auth') ||
        error.message?.includes('token_expired'))
    ) {
      log.warn(`Token error during event processing for team ${teamId}, marking inactive`);
      await markInstallationInactive(teamId);
    } else {
      log.error(`Slack event processing failed for team ${teamId}:`, error);
    }
  }

  return result;
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
    message: 'This thread shows anchoring signals. Want a 2-minute counterfactual before deciding?',
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
    message: 'Groupthink detected — consider assigning a formal dissenter before voting.',
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

/** Action prompt per bias type for org-calibrated messages */
const BIAS_ACTION_PROMPTS: Record<string, string> = {
  anchoring: "What would a fair assessment look like if you hadn't seen the initial number?",
  confirmation_bias: 'Actively seek disconfirming evidence before committing.',
  sunk_cost: 'If you were starting fresh today, would you still choose this path?',
  groupthink: 'Assign a formal dissenter before voting.',
  availability_bias: 'Check base-rate data — recent events may be overweighted.',
  overconfidence: 'What would need to be true for this to fail?',
};

/**
 * Human-readable labels for bias types
 */
const BIAS_LABELS: Record<string, string> = {
  anchoring: 'Anchoring bias',
  confirmation_bias: 'Confirmation bias',
  sunk_cost: 'Sunk cost fallacy',
  groupthink: 'Groupthink',
  availability_bias: 'Availability bias',
  overconfidence: 'Overconfidence',
};

/**
 * Generate a coaching nudge for a pre-decision message based on detected biases.
 * When orgId is provided, enriches the message with org-specific calibration data
 * (confirmation rates, failure correlations) from outcome history.
 */
export async function generatePreDecisionNudge(
  text: string,
  biases: { bias: string; signal: string }[],
  orgId?: string | null
): Promise<{ message: string; severity: 'info' | 'warning' | 'critical' } | null> {
  if (!text || biases.length === 0) return null;

  const severityRank = { info: 0, warning: 1, critical: 2 };
  let highestNudge: { message: string; severity: 'info' | 'warning' | 'critical' } | null = null;

  // Try to load org calibration data for richer messages
  let orgBiasStats: Map<string, { confirmationRate: number; failureCorrelation: number }> | null =
    null;
  if (orgId) {
    try {
      const { getOrgBiasHistory } = await import('@/lib/learning/outcome-scoring');
      const history = await getOrgBiasHistory(orgId);
      if (history.totalOutcomes >= 3) {
        orgBiasStats = new Map(
          history.biasStats.map(s => [
            s.biasType,
            { confirmationRate: s.confirmationRate, failureCorrelation: s.avgFailureImpact },
          ])
        );
      }
    } catch {
      // Outcome scoring not available — fall back to static templates
    }
  }

  for (const { bias, signal } of biases) {
    const template = PRE_DECISION_NUDGE_TEMPLATES[bias];
    if (!template) continue;

    let message: string;
    const orgStats = orgBiasStats?.get(bias);
    const label = BIAS_LABELS[bias] || bias.replace(/_/g, ' ');
    const action = BIAS_ACTION_PROMPTS[bias] || template.message;

    if (orgStats && orgStats.confirmationRate > 0) {
      // Org-calibrated message with real data
      const confPct = Math.round(orgStats.confirmationRate * 100);
      const failRate = orgStats.failureCorrelation.toFixed(1);
      message = `You mentioned _"${signal}"_ — *${label}* detected. In your org, this bias was confirmed ${confPct}% of the time and correlated with ${failRate}x higher failure rate. ${action}`;
    } else {
      // Fall back to static template
      message = template.message;
    }

    if (!highestNudge || severityRank[template.severity] > severityRank[highestNudge.severity]) {
      highestNudge = { message, severity: template.severity };
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
export async function slackEventToPreDecisionInput(
  payload: SlackWebhookPayload,
  orgId?: string | null
): Promise<{
  input: HumanDecisionInput;
  biases: { bias: string; signal: string }[];
  nudge: { message: string; severity: 'info' | 'warning' | 'critical' } | null;
  frame: { decisionStatement: string; stakeholders: string[] } | null;
} | null> {
  const event = payload.event;
  if (!event || event.type !== 'message') return null;
  if (!isPreDecisionMessage(event.text)) return null;

  const biases = detectMessageBiases(event.text);
  const nudge = await generatePreDecisionNudge(event.text, biases, orgId);
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

// ─── Escalation Severity ─────────────────────────────────────────────────

const SEVERITY_ORDER = ['none', 'info', 'warning', 'critical'] as const;

/**
 * Determine if new biases warrant escalating the nudge severity.
 * Returns the new severity level, or null if no escalation needed.
 */
export function getEscalatedSeverity(
  currentLevel: string,
  newBiases: { bias: string; signal: string }[]
): 'info' | 'warning' | 'critical' | null {
  if (newBiases.length === 0) return null;

  let targetSeverity: (typeof SEVERITY_ORDER)[number];
  if (newBiases.length >= 3) {
    targetSeverity = 'critical';
  } else if (newBiases.length >= 2) {
    targetSeverity = 'warning';
  } else {
    targetSeverity = 'info';
  }

  const currentIdx = SEVERITY_ORDER.indexOf(currentLevel as (typeof SEVERITY_ORDER)[number]);
  const targetIdx = SEVERITY_ORDER.indexOf(targetSeverity);

  // Only escalate upward
  if (targetIdx > currentIdx) {
    return targetSeverity;
  }

  return null;
}

// ─── Outcome Detection ────────────────────────────────────────────────────

/**
 * Process a Slack event for potential outcome signals.
 *
 * Checks if the message contains outcome language (success/failure indicators)
 * and if it's in a channel where prior decisions were captured. If both conditions
 * are met, creates a DraftOutcome for user review.
 *
 * Call this alongside isDecisionMessage/isPreDecisionMessage in the Slack
 * event handler to cover all three message types.
 */
export async function processSlackOutcomeSignal(payload: SlackWebhookPayload): Promise<{
  detected: boolean;
  draftCount: number;
}> {
  const event = payload.event;
  if (!event || event.type !== 'message') return { detected: false, draftCount: 0 };

  try {
    const { isOutcomeMessage, detectOutcomeFromSlack } =
      await import('@/lib/learning/outcome-inference');

    if (!isOutcomeMessage(event.text)) return { detected: false, draftCount: 0 };

    const results = await detectOutcomeFromSlack(
      event.text,
      event.channel,
      event.thread_ts,
      payload.team_id ?? ''
    );

    return { detected: results.length > 0, draftCount: results.length };
  } catch (err) {
    log.warn('Slack outcome detection failed (non-critical):', err);
    return { detected: false, draftCount: 0 };
  }
}

// ─── Audit Summary Card ─────────────────────────────────────────────────────

/**
 * Format a cognitive audit result as a rich Block Kit summary card for Slack.
 * Posted to threads when a decision commitment is detected.
 */
export function formatAuditSummaryForSlack(
  audit: {
    decisionQualityScore: number;
    noiseScore: number;
    biasFindings: Array<{ biasType: string; severity: string }>;
    summary: string;
    analysisUrl?: string;
    copilotUrl?: string;
  },
  threadTs?: string
): SlackNudgePayload {
  const scoreEmoji =
    audit.decisionQualityScore >= 70
      ? ':large_green_circle:'
      : audit.decisionQualityScore >= 40
        ? ':large_yellow_circle:'
        : ':red_circle:';

  const severityEmoji: Record<string, string> = {
    critical: ':rotating_light:',
    high: ':warning:',
    medium: ':large_orange_diamond:',
    low: ':small_blue_diamond:',
  };

  const topBiases = audit.biasFindings.slice(0, 3);
  const biasLines = topBiases
    .map(
      b =>
        `${severityEmoji[b.severity] || ':white_small_square:'} ${b.biasType.replace(/_/g, ' ')} _(${b.severity})_`
    )
    .join('\n');

  const summaryText =
    audit.summary.length > 200 ? audit.summary.slice(0, 197) + '...' : audit.summary;

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Decision Audit Complete', emoji: true },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Decision Score*\n${scoreEmoji} ${audit.decisionQualityScore}/100`,
        },
        { type: 'mrkdwn', text: `*Noise Score*\n${audit.noiseScore}/100` },
        { type: 'mrkdwn', text: `*Biases Detected*\n${audit.biasFindings.length}` },
      ],
    },
  ];

  if (topBiases.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Top Biases*\n${biasLines}` },
    });
  }

  blocks.push(
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `_${summaryText}_` },
    },
    { type: 'divider' }
  );

  const actionButtons: Array<Record<string, unknown>> = [];

  if (audit.analysisUrl) {
    actionButtons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'View Full Analysis' },
      url: audit.analysisUrl,
      style: 'primary',
    });
  }

  if (audit.copilotUrl) {
    actionButtons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'Continue in Copilot' },
      url: audit.copilotUrl,
    });
  }

  if (actionButtons.length > 0) {
    blocks.push({ type: 'actions', elements: actionButtons });
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: '_Powered by Decision Intel cognitive audit engine_' }],
  });

  return {
    channel: '',
    text: `Decision Audit: Score ${audit.decisionQualityScore}/100, ${audit.biasFindings.length} biases detected`,
    blocks: blocks as unknown as SlackNudgePayload['blocks'],
    thread_ts: threadTs,
  };
}

// ─── App Home ───────────────────────────────────────────────────────────────

/**
 * Publish the App Home tab for a Slack user.
 * Shows calibration level, recent decisions, pending outcomes, and twin effectiveness.
 */
export async function publishAppHome(slackUserId: string, teamId?: string): Promise<void> {
  const token = await resolveToken(teamId);
  if (!token) {
    log.warn('Cannot publish App Home: no bot token available');
    return;
  }

  // Resolve org context
  let orgId: string | null = null;
  let userId: string | null = null;
  if (teamId) {
    try {
      const installation = await prisma.slackInstallation.findFirst({
        where: { teamId, status: 'active' },
        select: { orgId: true, installedByUserId: true },
      });
      orgId = installation?.orgId ?? null;
      userId = installation?.installedByUserId ?? null;
    } catch {
      // Schema drift
    }
  }

  // Fetch data for App Home
  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Decision Intelligence Dashboard', emoji: true },
    },
  ];

  // Calibration & pending outcomes
  let pendingCount = 0;
  let calibrationLevel = 'Bronze';
  try {
    const { checkOutcomeGate } = await import('@/lib/learning/outcome-gate');
    const gate = await checkOutcomeGate(userId || 'system');
    pendingCount = gate.pendingCount;

    // Determine level from milestone count
    try {
      const totalOutcomes = await prisma.decisionOutcome.count({
        where: orgId ? { orgId } : { userId: userId || '' },
      });
      calibrationLevel =
        totalOutcomes >= 30
          ? 'Platinum'
          : totalOutcomes >= 15
            ? 'Gold'
            : totalOutcomes >= 5
              ? 'Silver'
              : 'Bronze';
    } catch {
      /* schema drift */
    }
  } catch {
    /* outcome gate not available */
  }

  const levelEmoji: Record<string, string> = {
    Bronze: ':3rd_place_medal:',
    Silver: ':2nd_place_medal:',
    Gold: ':1st_place_medal:',
    Platinum: ':gem:',
  };

  blocks.push(
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Calibration Level*\n${levelEmoji[calibrationLevel] || ''} ${calibrationLevel}`,
        },
        { type: 'mrkdwn', text: `*Pending Outcomes*\n${pendingCount} awaiting review` },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*Recent Decisions*' },
    }
  );

  // Recent decisions with scores
  try {
    const recentDecisions = await prisma.humanDecision.findMany({
      where: orgId ? { orgId } : { userId: userId || '' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        decisionType: true,
        createdAt: true,
        cognitiveAudit: {
          select: { decisionQualityScore: true },
        },
      },
    });

    if (recentDecisions.length === 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_No decisions captured yet. Start discussing decisions in channels where the bot is invited._',
        },
      });
    } else {
      for (const d of recentDecisions) {
        const score = d.cognitiveAudit?.decisionQualityScore;
        const scoreStr = score != null ? `${score}/100` : 'Pending';
        const title = d.content.slice(0, 60) + (d.content.length > 60 ? '...' : '');
        const type = d.decisionType ? ` · ${d.decisionType.replace(/_/g, ' ')}` : '';
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${scoreStr}* — ${title}${type}`,
          },
        });
      }
    }
  } catch {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '_Unable to load recent decisions._' },
    });
  }

  // Twin effectiveness
  blocks.push({ type: 'divider' });
  try {
    const { computeTwinEffectiveness } = await import('@/lib/learning/twin-effectiveness');
    const twins = await computeTwinEffectiveness(orgId, userId || undefined);
    if (twins.length > 0) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: '*Top Decision Twins*' },
      });
      for (const t of twins.slice(0, 3)) {
        const rate = Math.round(t.effectivenessRate * 100);
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${t.twinName}* — ${rate}% dissent accuracy (${t.dissentCount} dissents, ${t.sampleSize} decisions)`,
          },
        });
      }
    }
  } catch {
    /* twin effectiveness not available */
  }

  // Open Dashboard button
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';
  blocks.push(
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Open Dashboard' },
          url: `${appUrl}/dashboard`,
          style: 'primary',
        },
      ],
    }
  );

  // Publish to Slack
  try {
    const res = await fetch('https://slack.com/api/views.publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: slackUserId,
        view: {
          type: 'home',
          blocks,
        },
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      if (data.error === 'missing_scope' || data.error === 'not_allowed_token_type') {
        log.debug('App Home requires views:write scope — not available for this installation');
      } else {
        log.warn('Failed to publish App Home:', data.error);
      }
    } else {
      log.debug(`App Home published for user ${slackUserId}`);
    }
  } catch (err) {
    log.warn('App Home publish request failed:', err);
  }
}
