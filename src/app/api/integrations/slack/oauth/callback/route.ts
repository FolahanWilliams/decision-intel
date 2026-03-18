/**
 * GET /api/integrations/slack/oauth/callback — Slack OAuth callback
 *
 * Exchanges the temporary authorization code for a bot access token,
 * encrypts it, and stores the SlackInstallation record.
 *
 * Flow:
 * 1. Verify CSRF state token matches cookie
 * 2. Exchange code for access token via Slack's oauth.v2.access
 * 3. Encrypt the bot token with AES-256-GCM
 * 4. Upsert SlackInstallation (supports re-installation)
 * 5. Redirect to settings page with success/error status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { encryptToken } from '@/lib/utils/encryption';
import { createLogger } from '@/lib/utils/logger';
import type { SlackOAuthResponse } from '@/types/human-audit';

const log = createLogger('SlackOAuthCallback');

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const settingsUrl = new URL('/dashboard/settings', req.url);

  // Handle user denial
  if (error) {
    log.warn(`Slack OAuth denied: ${error}`);
    settingsUrl.searchParams.set('slack', 'denied');
    return NextResponse.redirect(settingsUrl.toString());
  }

  // Validate required params
  if (!code || !state) {
    settingsUrl.searchParams.set('slack', 'error');
    return NextResponse.redirect(settingsUrl.toString());
  }

  // CSRF check
  const storedState = req.cookies.get('slack_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    log.warn('Slack OAuth state mismatch — possible CSRF');
    settingsUrl.searchParams.set('slack', 'error');
    return NextResponse.redirect(settingsUrl.toString());
  }

  // Require authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Exchange code for token
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    log.error('Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET');
    settingsUrl.searchParams.set('slack', 'error');
    return NextResponse.redirect(settingsUrl.toString());
  }

  try {
    const callbackUrl = new URL('/api/integrations/slack/oauth/callback', req.url);

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl.toString(),
      }),
    });

    const data: SlackOAuthResponse = await tokenResponse.json();

    if (!data.ok || !data.access_token || !data.team) {
      log.error('Slack token exchange failed:', data.error);
      settingsUrl.searchParams.set('slack', 'error');
      return NextResponse.redirect(settingsUrl.toString());
    }

    // Encrypt bot token before storage
    const encrypted = encryptToken(data.access_token);
    const scopes = data.scope?.split(',') || [];

    // Upsert — allows re-installation without duplicates
    await prisma.slackInstallation.upsert({
      where: { teamId: data.team.id },
      create: {
        teamId: data.team.id,
        teamName: data.team.name,
        orgId: user.id, // Map to the installing user's org; can be updated later
        installedByUserId: user.id,
        botTokenEncrypted: encrypted.botTokenEncrypted,
        botTokenIv: encrypted.botTokenIv,
        botTokenTag: encrypted.botTokenTag,
        botUserId: data.bot_user_id,
        scopes,
        status: 'active',
      },
      update: {
        teamName: data.team.name,
        installedByUserId: user.id,
        botTokenEncrypted: encrypted.botTokenEncrypted,
        botTokenIv: encrypted.botTokenIv,
        botTokenTag: encrypted.botTokenTag,
        botUserId: data.bot_user_id,
        scopes,
        status: 'active',
        revokedAt: null,
      },
    });

    log.info(`Slack workspace ${data.team.name} (${data.team.id}) installed by user ${user.id}`);
    settingsUrl.searchParams.set('slack', 'connected');

    // Clear the CSRF cookie
    const response = NextResponse.redirect(settingsUrl.toString());
    response.cookies.delete('slack_oauth_state');
    return response;
  } catch (err) {
    log.error('Slack OAuth callback error:', err);
    settingsUrl.searchParams.set('slack', 'error');
    return NextResponse.redirect(settingsUrl.toString());
  }
}
