/**
 * GET /api/cron/google-drive-sync — Sync new documents from Google Drive
 *
 * Runs as a Vercel cron job. For each active GoogleDriveInstallation:
 * 1. Checks for new/changed files in monitored folders
 * 2. Downloads and parses new documents
 * 3. Creates Document records and triggers analysis
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import {
  createAuthenticatedClient,
  getChangedFiles,
  downloadFileContent,
} from '@/lib/integrations/google/drive';
import { parseFile } from '@/lib/utils/file-parser';
import { analyzeDocument } from '@/lib/analysis/analyzer';

const log = createLogger('GoogleDriveSync');

export const maxDuration = 300; // 5 minutes

// Map Google MIME types to file-parser compatible types
const MIME_MAP: Record<string, string> = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/pdf': 'application/pdf',
  'text/plain': 'text/plain',
  'text/csv': 'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export async function GET() {
  const headerList = await headers();
  const authHeader = headerList.get('authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (!safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const installations = await prisma.googleDriveInstallation.findMany({
      where: { status: 'active' },
    });

    log.info(`Processing ${installations.length} active Google Drive installations`);

    let totalFilesProcessed = 0;
    let totalErrors = 0;

    for (const installation of installations) {
      if (!installation.changesPageToken || installation.monitoredFolders.length === 0) {
        continue;
      }

      try {
        const drive = await createAuthenticatedClient(installation);

        const { files, nextPageToken } = await getChangedFiles(
          drive,
          installation.changesPageToken,
          installation.monitoredFolders
        );

        for (const file of files) {
          if (!file.id || !file.name || !file.mimeType) continue;

          // Check supported MIME type
          const parsableMimeType = MIME_MAP[file.mimeType];
          if (!parsableMimeType) continue;

          // Check if already processed — if file updated, create new version
          const existing = await prisma.document.findFirst({
            where: { sourceRef: file.id, source: 'google_drive' },
            orderBy: { uploadedAt: 'desc' },
            select: { id: true, contentHash: true, uploadedAt: true },
          });

          // Cooldown: skip if existing was uploaded within the last 24 hours
          if (existing && existing.uploadedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            continue;
          }

          try {
            const buffer = await downloadFileContent(drive, file.id, file.mimeType);
            const content = await parseFile(buffer, parsableMimeType, file.name);

            if (!content.trim()) {
              log.warn(`Empty content from Google Drive file ${file.name} (${file.id})`);
              continue;
            }

            // Always compute the content hash. Previously the hash was only
            // computed inside `if (existing)` and never persisted on create,
            // so subsequent syncs would compare against `null` and re-ingest
            // the same file forever.
            const { createHash } = await import('crypto');
            const newHash = createHash('sha256').update(content).digest('hex');

            // If a prior version exists and the hash matches, the file hasn't
            // actually changed — skip.
            if (existing?.contentHash && newHash === existing.contentHash) {
              continue;
            }
            if (existing) {
              log.info(
                `Detected updated version of ${file.name} (${file.id}), creating new analysis`
              );
            }

            // Resolve org for the installation owner
            let userOrgId: string | null = installation.orgId;
            if (!userOrgId) {
              try {
                const membership = await prisma.teamMember.findFirst({
                  where: { userId: installation.userId },
                  select: { orgId: true },
                });
                userOrgId = membership?.orgId ?? null;
              } catch {
                // Schema drift
              }
            }

            const versionLabel = existing
              ? ` (updated ${new Date().toISOString().slice(0, 10)})`
              : '';
            // Keep sourceRef stable at file.id so the next sync's lookup
            // (`findFirst({ sourceRef: file.id, orderBy: uploadedAt desc })`)
            // still finds the most recent version and the 24h cooldown below
            // can compare against a timestamp that actually advances when the
            // file updates. Previously we appended `:${Date.now()}` which
            // orphaned every update and silently broke the cooldown.
            let document;
            try {
              document = await prisma.document.create({
                data: {
                  userId: installation.userId,
                  orgId: userOrgId,
                  filename: `${file.name}${versionLabel}`,
                  fileType: parsableMimeType,
                  fileSize: parseInt(file.size || '0', 10),
                  content,
                  contentHash: newHash,
                  status: 'pending',
                  source: 'google_drive',
                  sourceRef: file.id,
                },
              });
            } catch (createErr) {
              // Document.contentHash is `@unique` across the whole table.
              // A cross-org collision is rare but possible; log and skip so a
              // single collision doesn't abort the whole sync run.
              const code = (createErr as { code?: string }).code;
              if (code === 'P2002') {
                log.warn(
                  `Skipping ${file.name} (${file.id}) — contentHash collides with an existing document`
                );
                continue;
              }
              throw createErr;
            }

            log.info(
              existing
                ? `Created updated version ${document.id} of ${file.name} (previous: ${existing.id})`
                : `Created document ${document.id} from Google Drive file ${file.name}`
            );
            totalFilesProcessed++;

            // Fire-and-forget analysis
            analyzeDocument(document.id).catch(err =>
              log.error(`Analysis failed for document ${document.id}:`, err)
            );
          } catch (fileErr) {
            log.error(`Failed to process Google Drive file ${file.name} (${file.id}):`, fileErr);
            totalErrors++;
          }
        }

        // Update the page token and last sync time
        await prisma.googleDriveInstallation.update({
          where: { id: installation.id },
          data: {
            changesPageToken: nextPageToken,
            lastSyncAt: new Date(),
          },
        });
      } catch (installErr) {
        log.error(`Failed to sync Google Drive for user ${installation.userId}:`, installErr);
        totalErrors++;
      }
    }

    log.info(
      `Google Drive sync complete: ${totalFilesProcessed} files processed, ${totalErrors} errors`
    );

    return NextResponse.json({
      installations: installations.length,
      filesProcessed: totalFilesProcessed,
      errors: totalErrors,
    });
  } catch (error) {
    log.error('Google Drive sync cron error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
