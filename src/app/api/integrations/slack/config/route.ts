/**
 * GET/PATCH /api/integrations/slack/config — Slack channel & nudge configuration
 *
 * Allows users to configure which channels the bot monitors and nudge frequency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('SlackConfig');

const VALID_NUDGE_FREQUENCIES = ['normal', 'quiet', 'off'] as const;

const PatchSchema = z.object({
  monitoredChannels: z.array(z.string().min(1).max(100)).max(50).optional(),
  nudgeFrequency: z.enum(VALID_NUDGE_FREQUENCIES).optional(),
});

async function getInstallationForUser(userId: string) {
  return prisma.slackInstallation.findFirst({
    where: {
      OR: [{ installedByUserId: userId }, { orgId: userId }],
      status: 'active',
    },
    select: {
      id: true,
      monitoredChannels: true,
      nudgeFrequency: true,
    },
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const installation = await getInstallationForUser(user.id);
    if (!installation) {
      return NextResponse.json({ error: 'No active Slack installation' }, { status: 404 });
    }

    return NextResponse.json({
      monitoredChannels: installation.monitoredChannels,
      nudgeFrequency: installation.nudgeFrequency,
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      // Schema drift — columns not yet migrated
      return NextResponse.json({ monitoredChannels: [], nudgeFrequency: 'normal' });
    }
    log.error('Failed to fetch Slack config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const installation = await getInstallationForUser(user.id);
    if (!installation) {
      return NextResponse.json({ error: 'No active Slack installation' }, { status: 404 });
    }

    const updated = await prisma.slackInstallation.update({
      where: { id: installation.id },
      data,
      select: { monitoredChannels: true, nudgeFrequency: true },
    });

    log.info(
      `Slack config updated by ${user.id}: channels=${updated.monitoredChannels.length}, frequency=${updated.nudgeFrequency}`
    );

    return NextResponse.json(updated);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Slack config columns not yet migrated');
      return NextResponse.json({ monitoredChannels: [], nudgeFrequency: 'normal' });
    }
    log.error('Failed to update Slack config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
