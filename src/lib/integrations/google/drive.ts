import { google, drive_v3 } from 'googleapis';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GoogleDrive');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createOAuth2Client(): any {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com'}/api/integrations/google/oauth/callback`
  );
}

export async function createAuthenticatedClient(installation: {
  refreshTokenEncrypted: string;
  refreshTokenIv: string;
  refreshTokenTag: string;
}): Promise<drive_v3.Drive> {
  const refreshToken = decryptRefreshToken(installation);
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth: oauth2Client as any }); // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function encryptRefreshToken(token: string): {
  refreshTokenEncrypted: string;
  refreshTokenIv: string;
  refreshTokenTag: string;
} {
  // Use the same encrypt() utility (AES-256-GCM) but map to Google Drive field names
  const result = encrypt(token);
  return {
    refreshTokenEncrypted: result.ciphertext,
    refreshTokenIv: result.iv,
    refreshTokenTag: result.tag,
  };
}

export function decryptRefreshToken(record: {
  refreshTokenEncrypted: string;
  refreshTokenIv: string;
  refreshTokenTag: string;
}): string {
  try {
    return decrypt({
      ciphertext: record.refreshTokenEncrypted,
      iv: record.refreshTokenIv,
      tag: record.refreshTokenTag,
    });
  } catch {
    log.error('Failed to decrypt Google Drive refresh token — possible key rotation or data corruption');
    throw new Error('Token decryption failed');
  }
}

export async function listUserFolders(drive: drive_v3.Drive) {
  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name, parents)',
    pageSize: 100,
    orderBy: 'name',
  });
  return res.data.files || [];
}

export async function getChangedFiles(
  drive: drive_v3.Drive,
  pageToken: string,
  folderIds: string[]
) {
  const res = await drive.changes.list({
    pageToken,
    fields: 'nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, mimeType, parents, size, modifiedTime))',
    pageSize: 100,
    includeRemoved: false,
  });

  const changes = res.data.changes || [];
  const relevantFiles = changes
    .filter(c => !c.removed && c.file && c.file.parents?.some(p => folderIds.includes(p)))
    .map(c => c.file!);

  return {
    files: relevantFiles,
    nextPageToken: res.data.newStartPageToken || res.data.nextPageToken || pageToken,
  };
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit for Vercel memory safety

export async function downloadFileContent(drive: drive_v3.Drive, fileId: string, mimeType: string): Promise<Buffer> {
  // Google Docs/Sheets/Slides need to be exported (they don't have a size field)
  const googleTypes: Record<string, string> = {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'application/pdf',
  };

  if (googleTypes[mimeType]) {
    const res = await drive.files.export(
      { fileId, mimeType: googleTypes[mimeType] },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(res.data as ArrayBuffer);
  }

  // Check file size before downloading to avoid OOM on Vercel
  const metadata = await drive.files.get({ fileId, fields: 'size' });
  const fileSize = parseInt(metadata.data.size || '0', 10);
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export async function getStartPageToken(drive: drive_v3.Drive): Promise<string> {
  const res = await drive.changes.getStartPageToken({});
  return res.data.startPageToken || '';
}
