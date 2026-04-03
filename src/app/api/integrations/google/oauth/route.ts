/**
 * GET /api/integrations/google/oauth — Initiate Google Drive OAuth flow
 *
 * Redirects the user to Google's OAuth consent screen.
 * After authorization, Google redirects back to /api/integrations/google/oauth/callback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';
import { createOAuth2Client } from '@/lib/integrations/google/drive';

const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export async function GET(req: NextRequest) {
  // Require authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 503 });
  }

  // Generate CSRF state token
  const state = crypto.randomBytes(16).toString('hex');

  const oauth2Client = createOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state,
  });

  // Store state in cookie for CSRF verification on callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
