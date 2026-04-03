/**
 * GET /api/integrations/google/folders — List Google Drive folders for the folder picker UI
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createAuthenticatedClient, listUserFolders } from '@/lib/integrations/google/drive';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GoogleDriveFolders');

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const installation = await prisma.googleDriveInstallation.findUnique({
      where: { userId: user.id },
    });

    if (!installation || installation.status !== 'active') {
      return NextResponse.json({ error: 'No active Google Drive installation' }, { status: 404 });
    }

    const drive = await createAuthenticatedClient(installation);
    const folders = await listUserFolders(drive);

    return NextResponse.json({
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        parents: f.parents,
      })),
    });
  } catch (error) {
    log.error('Failed to list Google Drive folders:', error);
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 });
  }
}
