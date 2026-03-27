/**
 * Notifications API
 *
 * GET /api/notifications — Returns recent notification log entries
 * for the authenticated user (last 20, newest first).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('NotificationsAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notificationLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        channel: true,
        type: true,
        subject: true,
        status: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      return NextResponse.json({ notifications: [] });
    }
    log.error('Notifications API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
