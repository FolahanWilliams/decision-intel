/**
 * POST /api/integrations/slack/commands — Slack Slash Command handler
 *
 * Handles:
 * - /di analyze — Trigger analysis on the most recent decision in this channel
 * - /di prior <confidence>% <action> — Submit a blind prior for an active decision room
 * - /di outcome <result> [notes] — Report an outcome for a recent decision
 * - /di status — Show pending outcomes, calibration level, recent scores
 * - /di help — Show usage
 * - /outcome [text] — Legacy outcome command (backwards compatible)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import {
  verifySlackSignature,
  formatAuditSummaryForSlack,
  deliverSlackNudge,
} from '@/lib/integrations/slack/handler';
import { prisma } from '@/lib/prisma';

const log = createLogger('SlackCommands');

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
          return handleAnalyzeCommand({ channelId, userId, teamId });
        case 'prior':
          return handlePriorCommand({ text: args, channelId, userId, teamId });
        case 'outcome':
          return handleOutcomeCommand({ text: args, channelId, userId, teamId });
        case 'status':
          return handleStatusCommand({ userId, teamId });
        case 'help':
        default:
          return NextResponse.json({
            response_type: 'ephemeral',
            text: [
              '*Decision Intel Commands*',
              '`/di analyze` — Audit the most recent decision in this channel',
              '`/di prior 75% approve` — Submit your blind prior for the active decision room',
              '`/di outcome success [notes]` — Report outcome (success, partial_success, failure, too_early)',
              '`/di status` — Show your calibration level and pending outcomes',
            ].join('\n'),
          });
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

// ─── /di analyze ────────────────────────────────────────────────────────────

async function handleAnalyzeCommand(params: { channelId: string; userId: string; teamId: string }) {
  try {
    // Find the most recent decision in this channel
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

    // If already audited, return the existing result
    if (recentDecision.cognitiveAudit) {
      const audit = recentDecision.cognitiveAudit;
      const biasFindings =
        (audit.biasFindings as Array<{ biasType: string; severity: string }>) || [];
      const summaryCard = formatAuditSummaryForSlack({
        decisionQualityScore: audit.decisionQualityScore,
        noiseScore: audit.noiseScore,
        biasFindings,
        summary: audit.summary,
        analysisUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com'}/dashboard`,
      });
      summaryCard.channel = params.channelId;

      // Post audit card to channel
      void deliverSlackNudge(summaryCard, params.teamId).catch(() => {});

      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Audit results posted for the most recent decision (score: ${audit.decisionQualityScore}/100).`,
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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'The decision tracking database is being set up. An admin needs to run database migrations. Try again after setup is complete.',
      });
    }
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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'The blind prior database is being set up. An admin needs to run database migrations. Try again after setup is complete.',
      });
    }
    log.error('Prior command failed:', msg);
    return NextResponse.json({ response_type: 'ephemeral', text: 'Failed to record prior.' });
  }
}

// ─── /di status ─────────────────────────────────────────────────────────────

async function handleStatusCommand(params: { userId: string; teamId: string }) {
  try {
    const installation = await prisma.slackInstallation.findFirst({
      where: { teamId: params.teamId, status: 'active' },
      select: { installedByUserId: true, orgId: true },
    });

    const resolvedUserId = installation?.installedByUserId || params.userId;
    const orgId = installation?.orgId;

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

    const level =
      totalOutcomes >= 30
        ? 'Platinum :gem:'
        : totalOutcomes >= 15
          ? 'Gold :1st_place_medal:'
          : totalOutcomes >= 5
            ? 'Silver :2nd_place_medal:'
            : 'Bronze :3rd_place_medal:';

    // Recent decision scores
    let recentScores = '';
    try {
      const recent = await prisma.humanDecision.findMany({
        where: orgId ? { orgId } : { userId: resolvedUserId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          content: true,
          cognitiveAudit: { select: { decisionQualityScore: true } },
        },
      });

      if (recent.length > 0) {
        recentScores =
          '\n\n*Recent Decisions*\n' +
          recent
            .map(d => {
              const score = d.cognitiveAudit?.decisionQualityScore;
              const title = d.content.slice(0, 50) + (d.content.length > 50 ? '...' : '');
              return `• ${score != null ? `${score}/100` : 'Pending'} — ${title}`;
            })
            .join('\n');
      }
    } catch {
      /* schema drift */
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text: [
        `*Calibration Level:* ${level}`,
        `*Outcomes Reported:* ${totalOutcomes}`,
        `*Pending Outcomes:* ${pendingCount}`,
        recentScores,
      ].join('\n'),
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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Outcome tracking is being set up. Please try again later.',
      });
    }
    log.error('Outcome command failed:', msg);
    return NextResponse.json({ response_type: 'ephemeral', text: 'Failed to record outcome.' });
  }
}
