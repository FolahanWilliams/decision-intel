/**
 * POST /api/integrations/slack/uninstall — Handle Slack app uninstall
 *
 * Two modes:
 * 1. Slack-initiated: Slack sends tokens_revoked or app_uninstalled events
 * 2. User-initiated: Authenticated user disconnects from settings page
 *
 * For Slack-initiated events, we verify the signing secret.
 * For user-initiated, we verify the Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { verifySlackSignature } from '@/lib/integrations/slack/handler';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SlackUninstall');

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Check if this is a Slack-initiated event (has signature headers)
  const slackSignature = req.headers.get('x-slack-signature');
  const slackTimestamp = req.headers.get('x-slack-request-timestamp');

  if (slackSignature && slackTimestamp) {
    return handleSlackInitiated(rawBody, slackSignature, slackTimestamp);
  }

  // Otherwise treat as user-initiated disconnect
  return handleUserInitiated(rawBody);
}

async function handleSlackInitiated(
  rawBody: string,
  signature: string,
  timestamp: string
): Promise<NextResponse> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);

    // Handle app_uninstalled or tokens_revoked events
    if (
      payload.type === 'event_callback' &&
      (payload.event?.type === 'app_uninstalled' || payload.event?.type === 'tokens_revoked')
    ) {
      const teamId = payload.team_id;
      if (teamId) {
        await revokeInstallation(teamId, 'slack_event');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Slack uninstall event error:', error);
    return NextResponse.json({ ok: true }); // Always 200 to Slack
  }
}

async function handleUserInitiated(rawBody: string): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const teamId = body.teamId;

    if (!teamId) {
      return NextResponse.json({ error: 'teamId required' }, { status: 400 });
    }

    // Verify the user owns this installation
    const installation = await prisma.slackInstallation.findUnique({
      where: { teamId },
      select: { installedByUserId: true, orgId: true },
    });

    if (!installation) {
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }

    if (installation.installedByUserId !== user.id && installation.orgId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to disconnect this workspace' },
        { status: 403 }
      );
    }

    await revokeInstallation(teamId, 'user');
    log.info(`User ${user.id} disconnected Slack workspace ${teamId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('User-initiated Slack disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}

async function revokeInstallation(teamId: string, source: string): Promise<void> {
  try {
    await prisma.slackInstallation.update({
      where: { teamId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        // Zero out the encrypted token fields for security
        botTokenEncrypted: '',
        botTokenIv: '',
        botTokenTag: '',
      },
    });
    log.info(`Slack installation revoked for team ${teamId} (source: ${source})`);
  } catch (error) {
    log.error(`Failed to revoke Slack installation for ${teamId}:`, error);
  }
}
