/**
 * GET /api/integrations/slack/status — Check Slack integration status
 *
 * Returns the current user's Slack installation status for the settings UI.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import type { SlackInstallationStatus } from '@/types/human-audit';

const log = createLogger('SlackStatus');

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find installation linked to this user (either as installer or org member)
    const installation = await prisma.slackInstallation.findFirst({
      where: {
        OR: [{ installedByUserId: user.id }, { orgId: user.id }],
        status: 'active',
      },
      select: {
        teamId: true,
        teamName: true,
        scopes: true,
        status: true,
        createdAt: true,
      },
    });

    const status: SlackInstallationStatus = installation
      ? {
          connected: true,
          teamName: installation.teamName,
          teamId: installation.teamId,
          installedAt: installation.createdAt.toISOString(),
          scopes: installation.scopes,
          status: installation.status,
        }
      : { connected: false };

    return NextResponse.json(status);
  } catch (error) {
    log.error('Failed to fetch Slack status:', error);
    return NextResponse.json({ connected: false });
  }
}
