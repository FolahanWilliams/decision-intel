/**
 * POST /api/integrations/slack/commands — Slack Slash Command handler
 *
 * Handles:
 * - /outcome [text] — Report an outcome for a recent decision
 */
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { verifySlackSignature } from '@/lib/integrations/slack/handler';
import { prisma } from '@/lib/prisma';

const log = createLogger('SlackCommands');

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Slack signature
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      return new NextResponse('Not configured', { status: 503 });
    }

    const signature = req.headers.get('x-slack-signature') || '';
    const timestamp = req.headers.get('x-slack-request-timestamp') || '';

    if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // Parse URL-encoded body
    const params = new URLSearchParams(rawBody);
    const command = params.get('command') || '';
    const text = params.get('text') || '';
    const channelId = params.get('channel_id') || '';
    const userId = params.get('user_id') || '';
    const teamId = params.get('team_id') || '';

    if (command === '/outcome') {
      return handleOutcomeCommand({ text, channelId, userId, teamId });
    }

    // Unknown command
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Unknown command: ${command}`,
    });
  } catch (error) {
    log.error('Slash command error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'An error occurred processing your command.',
    });
  }
}

async function handleOutcomeCommand(params: {
  text: string;
  channelId: string;
  userId: string;
  teamId: string;
}) {
  // Parse outcome from text: /outcome success|partial|failure|too_early [notes]
  const VALID = ['success', 'partial_success', 'failure', 'too_early'];
  const parts = params.text.trim().split(/\s+/);
  const outcome = parts[0]?.toLowerCase();
  const notes = parts.slice(1).join(' ');

  if (!outcome || !VALID.includes(outcome)) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Usage: \`/outcome <success|partial_success|failure|too_early> [notes]\`\n\nExample: \`/outcome success Deal closed at 15% above target\``,
    });
  }

  try {
    // Find the most recent overdue analysis for decisions from this Slack channel
    const installation = await prisma.slackInstallation.findUnique({
      where: { teamId: params.teamId, status: 'active' },
      select: { installedByUserId: true, orgId: true },
    });

    const resolvedUserId = installation?.installedByUserId || params.userId;

    // Find analyses with pending/overdue outcomes linked to decisions from this channel
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

    // Create/update the outcome
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
      update: {
        outcome,
        notes: notes || null,
      },
    });

    // Mark analysis as outcome_logged (schema drift safe)
    prisma.analysis.update({
      where: { id: recentDecision.linkedAnalysisId },
      data: { outcomeStatus: 'outcome_logged' },
    }).catch(() => {});

    log.info(`Outcome reported via Slack /outcome: ${outcome} for analysis ${recentDecision.linkedAnalysisId}`);

    return NextResponse.json({
      response_type: 'in_channel',
      text: `Outcome recorded: *${outcome.replace('_', ' ')}*${notes ? ` — ${notes}` : ''}. Your calibration data has been updated.`,
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
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Failed to record outcome. Please try again.',
    });
  }
}
