/**
 * GET/POST /api/integrations/email/token
 *
 * GET — Returns the current email forwarding token for the authenticated user.
 * POST — Generates (or regenerates) the email forwarding token.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateEmailToken, getForwardingAddress } from '@/lib/integrations/email/token';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('EmailToken');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { emailForwardToken: true },
    });

    if (!settings?.emailForwardToken) {
      return NextResponse.json({ token: null, address: null });
    }

    return NextResponse.json({
      token: settings.emailForwardToken,
      address: getForwardingAddress(settings.emailForwardToken),
    });
  } catch (error) {
    log.error('Failed to fetch email token:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await generateEmailToken(user.id);

    log.info(`Email forwarding token generated for user ${user.id}`);
    return NextResponse.json({
      token,
      address: getForwardingAddress(token),
    });
  } catch (error) {
    log.error('Failed to generate email token:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
