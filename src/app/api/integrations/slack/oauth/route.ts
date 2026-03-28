/**
 * GET /api/integrations/slack/oauth — Initiate Slack OAuth flow
 *
 * Redirects the user to Slack's OAuth consent screen.
 * After authorization, Slack redirects back to /api/integrations/slack/oauth/callback.
 *
 * Query params:
 * - state (optional): CSRF token — if omitted, one is generated and stored in a cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

const SLACK_SCOPES = [
  'channels:history', // Read messages in public channels
  'channels:read', // List channels and metadata
  'chat:write', // Post nudges back to channels
  'groups:history', // Read messages in private channels (if invited)
  'groups:read', // List private channels
  'users:read', // Resolve user display names for anonymization
  'commands', // Slash commands (/di)
].join(',');

export async function GET(req: NextRequest) {
  // Require authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'SLACK_CLIENT_ID not configured' }, { status: 503 });
  }

  // Generate CSRF state token
  const state = crypto.randomBytes(16).toString('hex');

  // Build callback URL
  const callbackUrl = new URL('/api/integrations/slack/oauth/callback', req.url);

  const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackUrl.searchParams.set('client_id', clientId);
  slackUrl.searchParams.set('scope', SLACK_SCOPES);
  slackUrl.searchParams.set('redirect_uri', callbackUrl.toString());
  slackUrl.searchParams.set('state', state);

  // Store state in cookie for CSRF verification on callback
  const response = NextResponse.redirect(slackUrl.toString());
  response.cookies.set('slack_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
