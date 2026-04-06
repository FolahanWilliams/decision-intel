/**
 * GET/POST/DELETE /api/integrations/google/config — Google Drive configuration
 *
 * GET:    Return current installation status + monitored folders
 * POST:   Update monitored folder IDs
 * DELETE: Disconnect (set status to 'revoked', clear tokens)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('GoogleDriveConfig');

const UpdateFoldersSchema = z.object({
  monitoredFolders: z.array(z.string().min(1).max(200)).max(50),
});

async function getInstallationForUser(userId: string) {
  return prisma.googleDriveInstallation.findUnique({
    where: { userId },
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
    if (!installation || installation.status !== 'active') {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      driveEmail: installation.driveEmail,
      monitoredFolders: installation.monitoredFolders,
      lastSyncAt: installation.lastSyncAt,
      scopes: installation.scopes,
      createdAt: installation.createdAt,
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return NextResponse.json({ connected: false });
    }
    log.error('Failed to fetch Google Drive config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = UpdateFoldersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const installation = await getInstallationForUser(user.id);
    if (!installation || installation.status !== 'active') {
      return NextResponse.json({ error: 'No active Google Drive installation' }, { status: 404 });
    }

    const updated = await prisma.googleDriveInstallation.update({
      where: { id: installation.id },
      data: { monitoredFolders: parsed.data.monitoredFolders },
      select: { monitoredFolders: true },
    });

    log.info(
      `Google Drive folders updated by ${user.id}: ${updated.monitoredFolders.length} folders`
    );

    return NextResponse.json(updated);
  } catch (error) {
    log.error('Failed to update Google Drive config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
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
      return NextResponse.json({ error: 'No Google Drive installation found' }, { status: 404 });
    }

    await prisma.googleDriveInstallation.update({
      where: { id: installation.id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        refreshTokenEncrypted: '',
        refreshTokenIv: '',
        refreshTokenTag: '',
        monitoredFolders: [],
        changesPageToken: null,
      },
    });

    log.info(`Google Drive disconnected by user ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to disconnect Google Drive:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
