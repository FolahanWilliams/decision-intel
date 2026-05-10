/**
 * GET /api/integrations/ambient-consent — caller's ambient-capture
 *   consent state across Slack + Drive installations.
 * PATCH /api/integrations/ambient-consent — toggle ambient-capture for
 *   the caller's Slack and/or Drive installation.
 *
 * Locked 2026-05-10 per Tier 2.2. Privacy posture: every consent flip
 * lands as an AMBIENT_CONSENT_TOGGLED audit-log entry so the trail is
 * visible to procurement reviewers + the user themselves.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('AmbientConsent');

interface SlackConsent {
  installed: boolean;
  ambientCaptureEnabled: boolean;
  monitoredChannels: string[];
  ambientCaptureChannels: string[];
}
interface DriveConsent {
  installed: boolean;
  ambientCaptureEnabled: boolean;
  monitoredFolders: string[];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [slackRow, driveRow] = await Promise.all([
      prisma.slackInstallation
        .findFirst({
          where: { installedByUserId: user.id, status: 'active' },
          select: {
            ambientCaptureEnabled: true,
            monitoredChannels: true,
            ambientCaptureChannels: true,
          },
        })
        .catch(() => null),
      prisma.googleDriveInstallation
        .findUnique({
          where: { userId: user.id },
          select: {
            ambientCaptureEnabled: true,
            monitoredFolders: true,
            status: true,
          },
        })
        .catch(() => null),
    ]);

    const slack: SlackConsent = {
      installed: Boolean(slackRow),
      ambientCaptureEnabled: slackRow?.ambientCaptureEnabled ?? false,
      monitoredChannels: slackRow?.monitoredChannels ?? [],
      ambientCaptureChannels: slackRow?.ambientCaptureChannels ?? [],
    };
    const drive: DriveConsent = {
      installed: Boolean(driveRow && driveRow.status === 'active'),
      ambientCaptureEnabled: driveRow?.ambientCaptureEnabled ?? false,
      monitoredFolders: driveRow?.monitoredFolders ?? [],
    };

    return NextResponse.json({ slack, drive });
  } catch (error) {
    log.error('GET /api/integrations/ambient-consent failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface PatchBody {
  slack?: {
    ambientCaptureEnabled?: boolean;
    ambientCaptureChannels?: string[];
  };
  drive?: {
    ambientCaptureEnabled?: boolean;
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as PatchBody | null;
    if (!body) {
      return NextResponse.json({ error: 'Missing body' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.slack) {
      const slackInstall = await prisma.slackInstallation.findFirst({
        where: { installedByUserId: user.id, status: 'active' },
        select: { id: true, monitoredChannels: true },
      });
      if (!slackInstall) {
        if (body.slack.ambientCaptureEnabled === true) {
          return NextResponse.json(
            { error: 'No active Slack installation — connect Slack first' },
            { status: 400 }
          );
        }
      } else {
        const data: Record<string, unknown> = {};
        if (typeof body.slack.ambientCaptureEnabled === 'boolean') {
          data.ambientCaptureEnabled = body.slack.ambientCaptureEnabled;
        }
        if (Array.isArray(body.slack.ambientCaptureChannels)) {
          // Restrict to channels the user already opted into for monitoring.
          const allowed = new Set(slackInstall.monitoredChannels);
          data.ambientCaptureChannels = body.slack.ambientCaptureChannels.filter(c =>
            allowed.has(c)
          );
        }
        if (Object.keys(data).length > 0) {
          const updated = await prisma.slackInstallation.update({
            where: { id: slackInstall.id },
            data,
          });
          updates.slack = {
            ambientCaptureEnabled: updated.ambientCaptureEnabled,
            ambientCaptureChannels: updated.ambientCaptureChannels,
          };
          await logAudit({
            action: 'AMBIENT_CONSENT_TOGGLED',
            resource: 'SlackInstallation',
            resourceId: slackInstall.id,
            details: { source: 'slack', data },
          });
        }
      }
    }

    if (body.drive) {
      const driveInstall = await prisma.googleDriveInstallation.findUnique({
        where: { userId: user.id },
        select: { id: true, status: true },
      });
      if (!driveInstall || driveInstall.status !== 'active') {
        if (body.drive.ambientCaptureEnabled === true) {
          return NextResponse.json(
            { error: 'No active Drive installation — connect Drive first' },
            { status: 400 }
          );
        }
      } else if (typeof body.drive.ambientCaptureEnabled === 'boolean') {
        const updated = await prisma.googleDriveInstallation.update({
          where: { id: driveInstall.id },
          data: { ambientCaptureEnabled: body.drive.ambientCaptureEnabled },
        });
        updates.drive = { ambientCaptureEnabled: updated.ambientCaptureEnabled };
        await logAudit({
          action: 'AMBIENT_CONSENT_TOGGLED',
          resource: 'GoogleDriveInstallation',
          resourceId: driveInstall.id,
          details: {
            source: 'drive',
            ambientCaptureEnabled: body.drive.ambientCaptureEnabled,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, updates });
  } catch (error) {
    log.error('PATCH /api/integrations/ambient-consent failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
