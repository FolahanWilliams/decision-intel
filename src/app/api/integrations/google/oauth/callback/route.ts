/**
 * GET /api/integrations/google/oauth/callback — Google OAuth callback
 *
 * Exchanges the temporary authorization code for tokens,
 * encrypts the refresh token, and stores the GoogleDriveInstallation record.
 *
 * Flow:
 * 1. Verify CSRF state token matches cookie
 * 2. Exchange code for tokens via Google OAuth2
 * 3. Encrypt the refresh token with AES-256-GCM
 * 4. Fetch user email from Google userinfo
 * 5. Get start page token for Changes API
 * 6. Upsert GoogleDriveInstallation
 * 7. Redirect to settings page with success/error status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/encryption';
import { createLogger } from '@/lib/utils/logger';
import { createOAuth2Client, getStartPageToken } from '@/lib/integrations/google/drive';
import { google } from 'googleapis';

const log = createLogger('GoogleOAuthCallback');

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const settingsUrl = new URL('/dashboard/settings/integrations', req.url);

  // Handle user denial
  if (error) {
    log.warn(`Google OAuth denied: ${error}`);
    settingsUrl.searchParams.set('google', 'denied');
    return NextResponse.redirect(settingsUrl.toString());
  }

  // Validate required params
  if (!code || !state) {
    settingsUrl.searchParams.set('google', 'error');
    const response = NextResponse.redirect(settingsUrl.toString());
    response.cookies.delete('google_oauth_state');
    return response;
  }

  // CSRF check
  const storedState = req.cookies.get('google_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    log.warn('Google OAuth state mismatch — possible CSRF');
    settingsUrl.searchParams.set('google', 'error');
    const response = NextResponse.redirect(settingsUrl.toString());
    response.cookies.delete('google_oauth_state');
    return response;
  }

  // Require authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const oauth2Client = createOAuth2Client();

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      log.error('No refresh token received from Google — ensure prompt=consent and access_type=offline');
      settingsUrl.searchParams.set('google', 'error');
      return NextResponse.redirect(settingsUrl.toString());
    }

    // Encrypt refresh token before storage
    const encrypted = encrypt(tokens.refresh_token);

    // Get user email from Google userinfo API
    oauth2Client.setCredentials(tokens);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client as any });
    const userInfo = await oauth2.userinfo.get();
    const driveEmail = userInfo.data.email || 'unknown';

    // Get start page token for the Changes API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drive = google.drive({ version: 'v3', auth: oauth2Client as any });
    const startPageToken = await getStartPageToken(drive);

    const scopes = tokens.scope?.split(' ') || [];

    // Verify required scope was granted
    const REQUIRED_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
    if (!scopes.includes(REQUIRED_SCOPE)) {
      log.error(`Missing required scope: ${REQUIRED_SCOPE}. Received: ${scopes.join(', ')}`);
      settingsUrl.searchParams.set('google', 'error');
      return NextResponse.redirect(settingsUrl.toString());
    }

    // Resolve org membership
    let userOrgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      userOrgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — TeamMember table may not exist yet
    }

    // Upsert — allows re-installation without duplicates
    await prisma.googleDriveInstallation.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        orgId: userOrgId,
        driveEmail,
        refreshTokenEncrypted: encrypted.ciphertext,
        refreshTokenIv: encrypted.iv,
        refreshTokenTag: encrypted.tag,
        scopes,
        changesPageToken: startPageToken,
        status: 'active',
      },
      update: {
        driveEmail,
        refreshTokenEncrypted: encrypted.ciphertext,
        refreshTokenIv: encrypted.iv,
        refreshTokenTag: encrypted.tag,
        scopes,
        changesPageToken: startPageToken,
        status: 'active',
        revokedAt: null,
      },
    });

    log.info(`Google Drive connected for user ${user.id} (${driveEmail})`);
    settingsUrl.searchParams.set('google', 'success');

    // Clear the CSRF cookie
    const response = NextResponse.redirect(settingsUrl.toString());
    response.cookies.delete('google_oauth_state');
    return response;
  } catch (err) {
    log.error('Google OAuth callback error:', err);
    settingsUrl.searchParams.set('google', 'error');
    const response = NextResponse.redirect(settingsUrl.toString());
    response.cookies.delete('google_oauth_state');
    return response;
  }
}
