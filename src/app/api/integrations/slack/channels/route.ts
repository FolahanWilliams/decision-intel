/**
 * GET /api/integrations/slack/channels — List Slack channels the bot can access
 *
 * Proxies Slack's conversations.list API to power the channel picker UI.
 * Returns channels the bot is a member of (requires channels:read scope).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { decryptToken } from '@/lib/utils/encryption';

const log = createLogger('SlackChannels');

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const installation = await prisma.slackInstallation.findFirst({
      where: {
        OR: [{ installedByUserId: user.id }, { orgId: user.id }],
        status: 'active',
      },
      select: {
        botTokenEncrypted: true,
        botTokenIv: true,
        botTokenTag: true,
      },
    });

    if (!installation) {
      return NextResponse.json({ error: 'No active Slack installation' }, { status: 404 });
    }

    // Decrypt bot token
    let token: string;
    try {
      token = decryptToken({
        botTokenEncrypted: installation.botTokenEncrypted,
        botTokenIv: installation.botTokenIv,
        botTokenTag: installation.botTokenTag,
      });
    } catch {
      return NextResponse.json(
        { error: 'Token decryption failed — try reconnecting Slack' },
        { status: 500 }
      );
    }

    // Fetch channels from Slack API (bot must be a member)
    const slackRes = await fetch(
      'https://slack.com/api/conversations.list?' +
        new URLSearchParams({
          types: 'public_channel,private_channel',
          exclude_archived: 'true',
          limit: '200',
        }),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const slackData = await slackRes.json();

    if (!slackData.ok) {
      log.error('Slack conversations.list failed:', slackData.error);

      if (
        slackData.error === 'token_revoked' ||
        slackData.error === 'token_expired' ||
        slackData.error === 'invalid_auth'
      ) {
        return NextResponse.json(
          { error: 'Slack token expired — please reconnect' },
          { status: 401 }
        );
      }

      return NextResponse.json({ error: 'Failed to fetch channels from Slack' }, { status: 502 });
    }

    const channels = (slackData.channels || []).map(
      (ch: {
        id: string;
        name: string;
        is_private: boolean;
        num_members: number;
        is_member: boolean;
      }) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private,
        numMembers: ch.num_members,
        isMember: ch.is_member,
      })
    );

    return NextResponse.json({ channels });
  } catch (error) {
    log.error('Failed to list Slack channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
