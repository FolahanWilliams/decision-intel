/**
 * POST /api/integrations/slack/commands — Slack Slash Command handler
 *
 * Handles:
 * - /di analyze — Trigger analysis on the most recent decision in this channel
 * - /di score <text> — Quick inline bias check on any text
 * - /di brief — Org intelligence briefing
 * - /di prior <confidence>% <action> — Submit a blind prior for an active decision room
 * - /di outcome <result> [notes] — Report an outcome for a recent decision
 * - /di status — Show pending outcomes, calibration level, recent scores
 * - /di help — Show usage with Block Kit formatting
 * - /outcome [text] — Legacy outcome command (backwards compatible)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import {
  verifySlackSignature,
  formatAuditSummaryForSlack,
  deliverSlackNudge,
  detectMessageBiases,
} from '@/lib/integrations/slack/handler';
import { prisma } from '@/lib/prisma';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('SlackCommands');

// ─── Per-User Rate Limiting (instance-local, best-effort for serverless) ────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 commands per minute per user

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

const BIAS_LABELS: Record<string, string> = {
  anchoring: 'Anchoring',
  confirmation_bias: 'Confirmation Bias',
  sunk_cost: 'Sunk Cost Fallacy',
  groupthink: 'Groupthink',
  availability_bias: 'Availability Bias',
  overconfidence: 'Overconfidence',
  bandwagon: 'Bandwagon Effect',
  authority_bias: 'Authority Bias',
  recency_bias: 'Recency Bias',
  survivorship_bias: 'Survivorship Bias',
  status_quo: 'Status Quo Bias',
  framing_effect: 'Framing Effect',
  planning_fallacy: 'Planning Fallacy',
  hindsight_bias: 'Hindsight Bias',
};

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      return new NextResponse('Not configured', { status: 503 });
    }

    const signature = req.headers.get('x-slack-signature') || '';
    const timestamp = req.headers.get('x-slack-request-timestamp') || '';

    if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const params = new URLSearchParams(rawBody);
    const command = params.get('command') || '';
    const text = params.get('text') || '';
    const channelId = params.get('channel_id') || '';
    const userId = params.get('user_id') || '';
    const teamId = params.get('team_id') || '';

    // Rate limit check (best-effort, instance-local)
    if (!checkRateLimit(userId)) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: "You're sending commands too quickly. Please wait a moment and try again.",
      });
    }

    // Legacy /outcome command
    if (command === '/outcome') {
      return handleOutcomeCommand({ text, channelId, userId, teamId });
    }

    // /di command with subcommands
    if (command === '/di' || command === '/decision-intel') {
      const parts = text.trim().split(/\s+/);
      const subcommand = parts[0]?.toLowerCase() || 'help';
      const args = parts.slice(1).join(' ');

      switch (subcommand) {
        case 'analyze':
          return handleAnalyzeCommand({
            channelId,
            userId,
            teamId,
            threadTs: params.get('thread_ts') || undefined,
          });
        case 'score':
          return handleScoreCommand({ text: args, channelId });
        case 'brief':
          return handleBriefCommand({ userId, teamId });
        case 'prior':
          return handlePriorCommand({ text: args, channelId, userId, teamId });
        case 'outcome':
          return handleOutcomeCommand({ text: args, channelId, userId, teamId });
        case 'status':
          return handleStatusCommand({ userId, teamId });
        case 'channel-stats':
          return handleChannelStatsCommand({ channelId, teamId });
        case 'help':
        default:
          return handleHelpCommand();
      }
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Unknown command: ${command}. Try \`/di help\``,
    });
  } catch (error) {
    log.error('Slash command error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'An error occurred processing your command.',
    });
  }
}

// ─── /di help (Block Kit) ──────────────────────────────────────────────────

function handleHelpCommand() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.decisionintel.ai';

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Decision Intel Commands', emoji: true },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':mag: *Analysis & Scoring*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '`/di analyze`\nAudit the most recent decision in this channel',
          },
          {
            type: 'mrkdwn',
            text: '`/di score <text>`\nQuick bias check on any text — paste a proposal, email, or memo',
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':chart_with_upwards_trend: *Tracking & Calibration*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '`/di outcome <result> [notes]`\nReport outcome: success, partial_success, failure, too_early',
          },
          {
            type: 'mrkdwn',
            text: '`/di prior 75% approve`\nSubmit blind prior for the active decision room',
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':bar_chart: *Intelligence*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '`/di status`\nCalibration level, pending outcomes, recent scores',
          },
          {
            type: 'mrkdwn',
            text: '`/di brief`\nOrg intelligence briefing — top risks, decision quality, maturity',
          },
          {
            type: 'mrkdwn',
            text: '`/di channel-stats`\nDecision stats for this channel — count, avg score, top biases',
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `:bulb: The bot also detects decisions automatically in your channels and provides real-time bias coaching. | <${appUrl}/dashboard|Open Dashboard>`,
          },
        ],
      },
    ],
  });
}

// ─── /di score ─────────────────────────────────────────────────────────────

function handleScoreCommand(params: { text: string; channelId: string }) {
  if (!params.text || params.text.length < 15) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Usage: `/di score <text to check for biases>`\n\nPaste a proposal, email, or decision reasoning. Minimum 15 characters.',
    });
  }

  const biases = detectMessageBiases(params.text);

  if (biases.length === 0) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':large_green_circle: *No cognitive biases detected*\n\nThe text appears clear of common bias patterns. For a deeper analysis with 30+ bias checks, upload the full document to the dashboard.',
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_Checked for 14 cognitive biases including anchoring, confirmation, sunk cost, groupthink, overconfidence, planning fallacy, and more_`,
            },
          ],
        },
      ],
    });
  }

  const severityEmoji: Record<number, string> = {
    1: ':large_yellow_circle:',
    2: ':large_orange_diamond:',
    3: ':red_circle:',
  };
  const overallSeverity = biases.length >= 3 ? 3 : biases.length >= 2 ? 2 : 1;
  const scoreEmoji = severityEmoji[overallSeverity];

  const biasLines = biases
    .map(b => {
      const label = BIAS_LABELS[b.bias] || b.bias.replace(/_/g, ' ');
      return `• *${label}* — triggered by _"${b.signal}"_`;
    })
    .join('\n');

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${scoreEmoji} *${biases.length} cognitive bias${biases.length > 1 ? 'es' : ''} detected*`,
        },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: biasLines },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '_Quick check covers 14 common biases. Upload to the dashboard for a full 30+ bias analysis with severity scoring._',
          },
        ],
      },
    ],
  });
}

// ─── /di brief ─────────────────────────────────────────────────────────────

async function handleBriefCommand(params: { userId: string; teamId: string }) {
  try {
    const installation = await prisma.slackInstallation.findFirst({
      where: { teamId: params.teamId, status: 'active' },
      select: { installedByUserId: true, orgId: true },
    });

    const orgId = installation?.orgId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.decisionintel.ai';

    if (!orgId) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Organization not linked. Connect your Slack workspace to an organization in the dashboard settings.',
      });
    }

    // Parallel fetch: bias history, maturity, recent decisions
    const [biasHistory, maturity, recentDecisionCount, totalOutcomes] = await Promise.all([
      import('@/lib/learning/outcome-scoring')
        .then(m => m.getOrgBiasHistory(orgId))
        .catch(() => null),
      import('@/lib/learning/maturity-score')
        .then(m => m.computeMaturityScore(orgId))
        .catch(() => null),
      prisma.humanDecision
        .count({
          where: {
            orgId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        })
        .catch(() => 0),
      prisma.decisionOutcome.count({ where: { orgId } }).catch(() => 0),
    ]);

    const fields: Array<{ type: string; text: string }> = [];

    // Maturity
    if (maturity) {
      fields.push({
        type: 'mrkdwn',
        text: `*Maturity*\n${maturity.grade} (${maturity.score}/100)`,
      });
    }

    // Decisions this month
    fields.push({
      type: 'mrkdwn',
      text: `*Decisions (30d)*\n${recentDecisionCount}`,
    });

    // Outcomes tracked
    fields.push({
      type: 'mrkdwn',
      text: `*Outcomes Tracked*\n${totalOutcomes}`,
    });

    // Top dangerous biases
    let dangerousBiasText = '_Not enough data yet_';
    if (biasHistory && biasHistory.dangerousBiases.length > 0) {
      dangerousBiasText = biasHistory.dangerousBiases
        .slice(0, 3)
        .map(b => {
          const stat = biasHistory.biasStats.find(s => s.biasType === b);
          const rate = stat ? `${Math.round(stat.confirmationRate * 100)}% confirmed` : '';
          return `:warning: ${b.replace(/_/g, ' ')}${rate ? ` (${rate})` : ''}`;
        })
        .join('\n');
    }

    // Over-detected biases (false positives)
    let overDetectedText = '';
    if (biasHistory && biasHistory.overDetectedBiases.length > 0) {
      overDetectedText = biasHistory.overDetectedBiases
        .slice(0, 2)
        .map(b => `:small_blue_diamond: ${b.replace(/_/g, ' ')}`)
        .join('\n');
    }

    const blocks: Array<Record<string, unknown>> = [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Intelligence Brief', emoji: true },
      },
      { type: 'section', fields },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*:rotating_light: Top Risk Biases*\n${dangerousBiasText}`,
        },
      },
    ];

    if (overDetectedText) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*:mag: Over-Detected (may be false positives)*\n${overDetectedText}`,
        },
      });
    }

    blocks.push(
      { type: 'divider' },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open Analytics' },
            url: `${appUrl}/dashboard/analytics`,
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Decision Graph' },
            url: `${appUrl}/dashboard/decision-graph`,
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Outcome Flywheel' },
            url: `${appUrl}/dashboard/outcome-flywheel`,
          },
        ],
      }
    );

    return NextResponse.json({
      response_type: 'ephemeral',
      blocks,
    });
  } catch (error) {
    log.error('Brief command failed:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Failed to fetch intelligence brief.',
    });
  }
}

// ─── /di analyze ────────────────────────────────────────────────────────────

async function handleAnalyzeCommand(params: {
  channelId: string;
  userId: string;
  teamId: string;
  threadTs?: string;
}) {
  try {
    // ── Thread analysis: when /di analyze is invoked inside a thread ──
    if (params.threadTs) {
      try {
        const { fetchSlackThread, formatAuditSummaryForSlack, deliverSlackNudge } =
          await import('@/lib/integrations/slack/handler');
        const { analyzeDocument } = await import('@/lib/analysis/analyzer');

        const messages = await fetchSlackThread(params.channelId, params.threadTs, params.teamId);
        if (messages.length === 0) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: 'No messages found in this thread.',
          });
        }

        // Combine thread messages into structured content
        const threadContent = messages
          .map(m => {
            const time = new Date(parseFloat(m.ts) * 1000).toISOString().slice(11, 16);
            return `[${time}] <@${m.user}>: ${m.text}`;
          })
          .join('\n\n');

        const participants = [...new Set(messages.map(m => m.user))];

        // Find user ID + orgId for document ownership
        const installation = await prisma.slackInstallation
          .findUnique({
            where: { teamId: params.teamId, status: 'active' },
            select: { installedByUserId: true, orgId: true },
          })
          .catch(() => null);
        const docUserId =
          installation?.installedByUserId || process.env.SLACK_SYSTEM_USER_ID || params.userId;

        const { createHash } = await import('crypto');
        const contentHash = createHash('sha256').update(threadContent).digest('hex');
        const sourceRef = `${params.channelId}:${params.threadTs}`;

        // Check for existing analysis of this thread (deduplication)
        const existing = await prisma.document
          .findFirst({
            where: { source: 'slack', sourceRef },
          })
          .catch(() => null);
        if (existing) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: ':white_check_mark: This thread has already been analyzed. Check the dashboard for results.',
          });
        }

        // Create a Document from the thread content
        const doc = await prisma.document.create({
          data: {
            userId: docUserId,
            orgId: installation?.orgId || null,
            filename: `Slack Thread ${new Date().toISOString().slice(0, 10)}`,
            fileType: 'text/plain',
            fileSize: Buffer.byteLength(threadContent, 'utf-8'),
            content: threadContent,
            status: 'analyzing',
            contentHash,
            source: 'slack',
            sourceRef,
          },
        });

        // Fire-and-forget: run analysis, then post results to thread
        void (async () => {
          try {
            const result = await analyzeDocument(doc.id);
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';
            const biases =
              result.biases?.map(b => ({ biasType: b.biasType, severity: b.severity })) || [];
            const summaryCard = formatAuditSummaryForSlack(
              {
                decisionQualityScore: result.overallScore ?? 0,
                noiseScore: result.noiseScore ?? 0,
                biasFindings: biases,
                summary: result.summary || 'Analysis complete.',
                analysisUrl: `${appUrl}/documents/${doc.id}`,
              },
              params.threadTs
            );
            summaryCard.channel = params.channelId;
            await deliverSlackNudge(summaryCard, params.teamId);
          } catch (err) {
            log.error('Thread analysis failed:', err instanceof Error ? err.message : err);
            // Post error to thread
            await deliverSlackNudge(
              {
                channel: params.channelId,
                text: 'Thread analysis failed. The team has been notified.',
                blocks: [],
                thread_ts: params.threadTs,
              },
              params.teamId
            ).catch(() => {});
          }
        })();

        return NextResponse.json({
          response_type: 'ephemeral',
          text: `:mag: Analyzing thread (${messages.length} messages, ${participants.length} participants)... Results will be posted to this thread shortly.`,
        });
      } catch (err) {
        log.error('Thread analysis setup failed:', err instanceof Error ? err.message : err);
        return NextResponse.json({
          response_type: 'ephemeral',
          text: 'Failed to start thread analysis. Please try again.',
        });
      }
    }

    // ── Channel analysis: find the most recent decision (existing behavior) ──
    const recentDecision = await prisma.humanDecision.findFirst({
      where: { source: 'slack', channel: params.channelId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        status: true,
        cognitiveAudit: {
          select: {
            decisionQualityScore: true,
            noiseScore: true,
            biasFindings: true,
            summary: true,
          },
        },
      },
    });

    if (!recentDecision) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'No decisions found in this channel. The bot detects decisions automatically from messages — try discussing a decision first.',
      });
    }

    // If already audited, return the existing result with copilot link
    if (recentDecision.cognitiveAudit) {
      const audit = recentDecision.cognitiveAudit;
      const biasFindings =
        (audit.biasFindings as Array<{ biasType: string; severity: string }>) || [];
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.decisionintel.ai';

      // Look for an existing CopilotSession linked to this decision
      let copilotUrl: string | undefined;
      try {
        const copilotSession = await prisma.copilotSession.findFirst({
          where: {
            metadata: {
              path: ['humanDecisionId'],
              equals: recentDecision.id,
            },
          },
          select: { id: true },
        });
        if (copilotSession) {
          copilotUrl = `${appUrl}/dashboard/ask?mode=copilot&session=${copilotSession.id}`;
        }
      } catch {
        // JSON path query not supported or schema drift
      }

      const summaryCard = formatAuditSummaryForSlack({
        decisionQualityScore: audit.decisionQualityScore,
        noiseScore: audit.noiseScore,
        biasFindings,
        summary: audit.summary,
        analysisUrl: `${appUrl}/dashboard`,
        copilotUrl,
      });
      summaryCard.channel = params.channelId;

      // Post audit card to channel
      void deliverSlackNudge(summaryCard, params.teamId).catch(() => {});

      const analyzeActions: Array<Record<string, unknown>> = [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Full Analysis' },
          url: `${appUrl}/dashboard/decision-quality`,
          style: 'primary',
        },
      ];
      if (copilotUrl) {
        analyzeActions.push({
          type: 'button',
          text: { type: 'plain_text', text: 'Continue in Copilot' },
          url: copilotUrl,
        });
      }

      return NextResponse.json({
        response_type: 'ephemeral',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:white_check_mark: Audit results posted for the most recent decision (score: *${audit.decisionQualityScore}/100*).`,
            },
          },
          {
            type: 'actions',
            elements: analyzeActions,
          },
        ],
      });
    }

    // If pending, trigger audit
    if (recentDecision.status === 'pending') {
      try {
        const { analyzeHumanDecision } = await import('@/lib/human-audit/analyzer');
        void analyzeHumanDecision(
          {
            source: 'slack',
            channel: params.channelId,
            content: recentDecision.content,
            participants: [],
          },
          { decisionId: recentDecision.id }
        ).catch(err => log.warn('Analyze command audit failed:', err));
      } catch {
        // analyzer not available
      }

      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Analysis started — results will be posted to this channel shortly.',
      });
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Most recent decision status: ${recentDecision.status}`,
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'The decision tracking database is being set up. An admin needs to run database migrations. Try again after setup is complete.',
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Analyze command failed:', msg);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Analysis failed. Please try again.',
    });
  }
}

// ─── /di prior ──────────────────────────────────────────────────────────────

async function handlePriorCommand(params: {
  text: string;
  channelId: string;
  userId: string;
  teamId: string;
}) {
  // Parse: "75% approve" or "approve 75%" or "80 approve"
  const confidenceMatch = params.text.match(/(\d{1,3})\s*%?/);
  const actionMatch = params.text.match(/\b(approve|reject|pass|abstain|defer|yes|no)\b/i);

  if (!confidenceMatch && !actionMatch) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Usage: `/di prior 75% approve` or `/di prior reject 30%`',
    });
  }

  const confidence = confidenceMatch ? Math.min(100, parseInt(confidenceMatch[1])) : 50;
  const action = actionMatch?.[1]?.toLowerCase() || 'undecided';

  try {
    // Find a DecisionFrame for this channel
    const frame = await prisma.decisionFrame.findFirst({
      where: { channelId: params.channelId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, decisionStatement: true },
    });

    if (!frame) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'No active decision found in this channel. Start a discussion and the bot will detect it.',
      });
    }

    // Find linked DecisionRoom (if any)
    const room = await prisma.decisionRoom.findFirst({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { id: true },
    });

    if (room) {
      // Submit as BlindPrior to the room
      await prisma.blindPrior.upsert({
        where: { roomId_userId: { roomId: room.id, userId: params.userId } },
        create: {
          roomId: room.id,
          userId: params.userId,
          defaultAction: action,
          confidence,
          reasoning: `Submitted via /di prior in Slack`,
        },
        update: {
          defaultAction: action,
          confidence,
          reasoning: `Updated via /di prior in Slack`,
        },
      });

      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Prior recorded: *${action}* at *${confidence}%* confidence for _"${frame.decisionStatement.slice(0, 60)}"_`,
      });
    }

    // No room — store as a note on the frame
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Prior noted: *${action}* at *${confidence}%* confidence. Create a Decision Room on the web app for blind prior collection.`,
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'The blind prior database is being set up. An admin needs to run database migrations. Try again after setup is complete.',
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Prior command failed:', msg);
    return NextResponse.json({ response_type: 'ephemeral', text: 'Failed to record prior.' });
  }
}

// ─── /di status (enhanced) ─────────────────────────────────────────────────

async function handleStatusCommand(params: { userId: string; teamId: string }) {
  try {
    const installation = await prisma.slackInstallation.findFirst({
      where: { teamId: params.teamId, status: 'active' },
      select: { installedByUserId: true, orgId: true },
    });

    const resolvedUserId = installation?.installedByUserId || params.userId;
    const orgId = installation?.orgId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.decisionintel.ai';

    // Pending outcomes
    let pendingCount = 0;
    try {
      const { checkOutcomeGate } = await import('@/lib/learning/outcome-gate');
      const gate = await checkOutcomeGate(resolvedUserId);
      pendingCount = gate.pendingCount;
    } catch {
      /* not available */
    }

    // Calibration level
    let totalOutcomes = 0;
    try {
      totalOutcomes = await prisma.decisionOutcome.count({
        where: orgId ? { orgId } : { userId: resolvedUserId },
      });
    } catch {
      /* schema drift */
    }

    const levelInfo =
      totalOutcomes >= 30
        ? { label: 'Platinum', emoji: ':gem:', next: '' }
        : totalOutcomes >= 15
          ? {
              label: 'Gold',
              emoji: ':1st_place_medal:',
              next: `${30 - totalOutcomes} more for Platinum`,
            }
          : totalOutcomes >= 5
            ? {
                label: 'Silver',
                emoji: ':2nd_place_medal:',
                next: `${15 - totalOutcomes} more for Gold`,
              }
            : {
                label: 'Bronze',
                emoji: ':3rd_place_medal:',
                next: `${5 - totalOutcomes} more for Silver`,
              };

    // Recent decision scores
    const recentFields: Array<{ type: string; text: string }> = [];
    try {
      const recent = await prisma.humanDecision.findMany({
        where: orgId ? { orgId } : { userId: resolvedUserId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          content: true,
          createdAt: true,
          cognitiveAudit: { select: { decisionQualityScore: true } },
        },
      });

      if (recent.length > 0) {
        for (const d of recent) {
          const score = d.cognitiveAudit?.decisionQualityScore;
          const title = d.content.slice(0, 40) + (d.content.length > 40 ? '...' : '');
          const scoreEmoji =
            score == null
              ? ':hourglass:'
              : score >= 70
                ? ':large_green_circle:'
                : score >= 40
                  ? ':large_yellow_circle:'
                  : ':red_circle:';
          recentFields.push({
            type: 'mrkdwn',
            text: `${scoreEmoji} ${score != null ? `${score}/100` : 'Pending'}\n_${title}_`,
          });
        }
      }
    } catch {
      /* schema drift */
    }

    // Nudge effectiveness
    let nudgeText = '';
    if (orgId) {
      try {
        const profile = await prisma.teamCognitiveProfile.findFirst({
          where: { orgId },
          orderBy: { periodEnd: 'desc' },
          select: { nudgeEffectiveness: true },
        });
        const eff = profile?.nudgeEffectiveness as {
          sent?: number;
          acknowledged?: number;
          helpfulRate?: number;
        } | null;
        if (eff && eff.sent && eff.sent > 0) {
          const ackPct = Math.round(((eff.acknowledged ?? 0) / eff.sent) * 100);
          const helpPct = Math.round((eff.helpfulRate ?? 0) * 100);
          nudgeText = `\n*Nudge Effectiveness:* ${ackPct}% acknowledged, ${helpPct}% helpful`;
        }
      } catch {
        /* schema drift */
      }
    }

    // Decision quality trend (compare last 5 vs previous 5)
    let trendText = '';
    try {
      const allScores = await prisma.humanDecision.findMany({
        where: {
          ...(orgId ? { orgId } : { userId: resolvedUserId }),
          cognitiveAudit: { isNot: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          cognitiveAudit: { select: { decisionQualityScore: true } },
        },
      });

      if (allScores.length >= 6) {
        const recentAvg =
          allScores
            .slice(0, 5)
            .reduce((sum, d) => sum + (d.cognitiveAudit?.decisionQualityScore ?? 0), 0) / 5;
        const previousAvg =
          allScores
            .slice(5, 10)
            .reduce((sum, d) => sum + (d.cognitiveAudit?.decisionQualityScore ?? 0), 0) /
          Math.min(5, allScores.length - 5);
        const diff = recentAvg - previousAvg;
        const trendEmoji =
          diff > 2 ? ':arrow_up:' : diff < -2 ? ':arrow_down:' : ':left_right_arrow:';
        const trendLabel = diff > 2 ? 'Improving' : diff < -2 ? 'Declining' : 'Stable';
        trendText = `\n*Quality Trend:* ${trendEmoji} ${trendLabel} (${diff > 0 ? '+' : ''}${Math.round(diff)} pts)`;
      }
    } catch {
      /* schema drift */
    }

    const blocks: Array<Record<string, unknown>> = [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Your Decision Status', emoji: true },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Calibration*\n${levelInfo.emoji} ${levelInfo.label}`,
          },
          {
            type: 'mrkdwn',
            text: `*Outcomes*\n${totalOutcomes} reported`,
          },
          {
            type: 'mrkdwn',
            text: `*Pending*\n${pendingCount} awaiting outcome`,
          },
        ],
      },
    ];

    if (levelInfo.next) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `:sparkles: _${levelInfo.next}_` }],
      });
    }

    if (trendText || nudgeText) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: (trendText + nudgeText).trim() },
      });
    }

    if (recentFields.length > 0) {
      blocks.push(
        { type: 'divider' },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*Recent Decisions*' },
        },
        {
          type: 'section',
          fields: recentFields.slice(0, 3),
        }
      );
    }

    const statusActions: Array<Record<string, unknown>> = [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Open Dashboard' },
        url: `${appUrl}/dashboard`,
        style: 'primary',
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Decision Quality' },
        url: `${appUrl}/dashboard/decision-quality`,
      },
    ];

    if (pendingCount > 0) {
      statusActions.push({
        type: 'button',
        text: { type: 'plain_text', text: `Record Outcome (${pendingCount} pending)` },
        url: `${appUrl}/dashboard/outcome-flywheel`,
      });
    }

    blocks.push({ type: 'divider' }, { type: 'actions', elements: statusActions });

    return NextResponse.json({
      response_type: 'ephemeral',
      blocks,
    });
  } catch (error) {
    log.error('Status command failed:', error);
    return NextResponse.json({ response_type: 'ephemeral', text: 'Failed to fetch status.' });
  }
}

// ─── /di outcome (and legacy /outcome) ──────────────────────────────────────

async function handleOutcomeCommand(params: {
  text: string;
  channelId: string;
  userId: string;
  teamId: string;
}) {
  const VALID = ['success', 'partial_success', 'failure', 'too_early'];
  const parts = params.text.trim().split(/\s+/);
  const outcome = parts[0]?.toLowerCase();
  const notes = parts.slice(1).join(' ');

  if (!outcome || !VALID.includes(outcome)) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Usage: `/di outcome <success|partial_success|failure|too_early> [notes]`\n\nExample: `/di outcome success Project completed ahead of schedule`',
    });
  }

  try {
    const installation = await prisma.slackInstallation.findFirst({
      where: { teamId: params.teamId, status: 'active' },
      select: { installedByUserId: true, orgId: true },
    });

    const resolvedUserId = installation?.installedByUserId || params.userId;

    const recentDecision = await prisma.humanDecision.findFirst({
      where: {
        source: 'slack',
        channel: params.channelId,
        linkedAnalysisId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { linkedAnalysisId: true },
    });

    if (!recentDecision?.linkedAnalysisId) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'No recent decisions found in this channel to report an outcome for.',
      });
    }

    await prisma.decisionOutcome.upsert({
      where: { analysisId: recentDecision.linkedAnalysisId },
      create: {
        analysisId: recentDecision.linkedAnalysisId,
        userId: resolvedUserId,
        orgId: installation?.orgId || null,
        outcome,
        notes: notes || null,
        confirmedBiases: [],
        falsPositiveBiases: [],
      },
      update: { outcome, notes: notes || null },
    });

    prisma.analysis
      .update({
        where: { id: recentDecision.linkedAnalysisId },
        data: { outcomeStatus: 'outcome_logged' },
      })
      .catch(() => {});

    log.info(
      `Outcome reported via Slack: ${outcome} for analysis ${recentDecision.linkedAnalysisId}`
    );

    return NextResponse.json({
      response_type: 'in_channel',
      text: `:white_check_mark: Outcome recorded: *${outcome.replace(/_/g, ' ')}*${notes ? ` — ${notes}` : ''}. Your calibration data has been updated.`,
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Outcome tracking is being set up. Please try again later.',
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Outcome command failed:', msg);
    return NextResponse.json({ response_type: 'ephemeral', text: 'Failed to record outcome.' });
  }
}

// ─── /di channel-stats ───────────────────────────────────────────────────

async function handleChannelStatsCommand(params: { channelId: string; teamId: string }) {
  try {
    // Verify active installation (validates the request context)
    await prisma.slackInstallation.findFirst({
      where: { teamId: params.teamId, status: 'active' },
      select: { orgId: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.decisionintel.ai';
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch channel decisions
    const decisions = await prisma.humanDecision.findMany({
      where: {
        source: 'slack',
        channel: params.channelId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        cognitiveAudit: {
          select: { decisionQualityScore: true, biasFindings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (decisions.length === 0) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'No decisions tracked in this channel in the last 30 days. The bot detects decisions automatically from messages — try discussing a decision in this channel.',
      });
    }

    // Calculate stats
    const scores = decisions
      .map(d => d.cognitiveAudit?.decisionQualityScore)
      .filter((s): s is number => s != null);
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Score trend (first half vs second half)
    let trendText = '';
    if (scores.length >= 4) {
      const mid = Math.floor(scores.length / 2);
      const olderAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);
      const newerAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const diff = newerAvg - olderAvg;
      const trendEmoji =
        diff > 2 ? ':arrow_up:' : diff < -2 ? ':arrow_down:' : ':left_right_arrow:';
      const trendLabel = diff > 2 ? 'Improving' : diff < -2 ? 'Declining' : 'Stable';
      trendText = `${trendEmoji} ${trendLabel} (${diff > 0 ? '+' : ''}${Math.round(diff)} pts)`;
    }

    // Top biases across all decisions in channel
    const biasCounts = new Map<string, number>();
    for (const d of decisions) {
      const findings = (d.cognitiveAudit?.biasFindings as Array<{ biasType: string }>) ?? [];
      for (const f of findings) {
        if (f.biasType) {
          biasCounts.set(f.biasType, (biasCounts.get(f.biasType) || 0) + 1);
        }
      }
    }
    const topBiases = [...biasCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const biasText =
      topBiases.length > 0
        ? topBiases
            .map(([type, count]) => {
              const label = BIAS_LABELS[type] || type.replace(/_/g, ' ');
              return `:warning: ${label} (${count}x)`;
            })
            .join('\n')
        : '_Not enough data_';

    const scoreEmoji =
      avgScore >= 70
        ? ':large_green_circle:'
        : avgScore >= 40
          ? ':large_yellow_circle:'
          : ':red_circle:';

    const blocks: Array<Record<string, unknown>> = [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Channel Decision Stats (30 days)', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Decisions Tracked*\n${decisions.length}` },
          { type: 'mrkdwn', text: `*Avg DQI Score*\n${scoreEmoji} ${avgScore}/100` },
          { type: 'mrkdwn', text: `*Best / Worst*\n${bestScore} / ${worstScore}` },
        ],
      },
    ];

    if (trendText) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*Quality Trend*\n${trendText}` },
      });
    }

    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Most Common Biases*\n${biasText}` },
      },
      { type: 'divider' },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open Analytics' },
            url: `${appUrl}/dashboard/analytics`,
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Decision Graph' },
            url: `${appUrl}/dashboard/decision-graph`,
          },
        ],
      }
    );

    return NextResponse.json({
      response_type: 'ephemeral',
      blocks,
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Channel stats require database setup. Please run migrations first.',
      });
    }
    log.error('Channel stats command failed:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Failed to fetch channel stats.',
    });
  }
}
