/**
 * POST /api/integrations/slack/test-nudge
 *
 * Sends a test nudge to the connected Slack workspace to verify
 * the integration is working. Used by the "Send Test Nudge" button
 * in IntegrationMarketplace settings.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { formatNudgeForSlack, deliverSlackNudge } from '@/lib/integrations/slack/handler';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SlackTestNudge');

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find active Slack installation for this user
    const membership = await prisma.teamMember
      .findFirst({ where: { userId: user.id }, select: { orgId: true } })
      .catch(() => null);

    const installation = await prisma.slackInstallation.findFirst({
      where: {
        status: 'active',
        OR: [
          { installedByUserId: user.id },
          ...(membership?.orgId ? [{ orgId: membership.orgId }] : []),
        ],
      },
      select: { teamId: true, teamName: true, monitoredChannels: true },
    });

    if (!installation) {
      return NextResponse.json({ error: 'No active Slack installation found' }, { status: 404 });
    }

    const payload = formatNudgeForSlack({
      nudgeType: 'pre_decision_coaching',
      triggerReason: 'Test nudge',
      message:
        'This is a test nudge from Decision Intel. If you can see this message, your Slack integration is working correctly. Cognitive bias detection and real-time coaching are active for this workspace.',
      severity: 'info',
      channel: 'slack',
    });

    const success = await deliverSlackNudge(payload, installation.teamId);

    if (success) {
      log.info(`Test nudge sent to workspace ${installation.teamName} by user ${user.id}`);
      return NextResponse.json({ success: true, workspace: installation.teamName });
    } else {
      return NextResponse.json({ error: 'Failed to deliver nudge — check Slack token' }, { status: 502 });
    }
  } catch (error) {
    log.error('Test nudge failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
