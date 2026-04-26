import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SsoInitiate');

// Given an email address, check whether the email domain has an active SAML
// configuration; if so, start the Supabase SAML sign-in flow and return the
// redirect URL for the client to follow. If no match, return null so the
// login page falls back to password / Google OAuth.
//
// Public endpoint: no auth required (this runs BEFORE login). Rate-limited
// per client IP to prevent probing of which domains are SSO-enabled.

function extractDomain(email: string): string | null {
  const match = email
    .trim()
    .toLowerCase()
    .match(/^[^@\s]+@([a-z0-9.-]+\.[a-z]{2,})$/);
  return match?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    // Per-IP rate limit keeps this endpoint from becoming a domain-enumeration
    // oracle (which-companies-use-DI discovery attacks).
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const rate = await checkRateLimit(clientIp, 'sso-initiate', {
      windowMs: 60 * 1000,
      maxRequests: 12,
      failMode: 'closed',
    });
    if (!rate.success) {
      return apiError({ error: 'Too many SSO lookups. Try again shortly.', status: 429 });
    }

    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    if (!body?.email || typeof body.email !== 'string') {
      return apiError({ error: 'email (string) is required', status: 400 });
    }
    const domain = extractDomain(body.email);
    if (!domain) {
      return apiError({ error: 'Invalid email address', status: 400 });
    }

    // Look up an ACTIVE SSO configuration for this domain. Pending/disabled
    // rows are ignored — status === 'active' is the gate.
    const config = await prisma.ssoConfiguration
      .findUnique({
        where: { domain },
        select: {
          id: true,
          domain: true,
          providerId: true,
          status: true,
          protocol: true,
        },
      })
      .catch(err => {
        log.warn('SSO config lookup failed, falling through to password:', err);
        return null;
      });

    if (!config || config.status !== 'active') {
      // Do NOT leak whether a domain has a row at all. Treat pending/disabled
      // the same as "no SSO" from the caller's perspective.
      return apiSuccess({ data: { ssoEnabled: false } });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
      options: {
        redirectTo: new URL('/auth/callback', req.nextUrl.origin).toString(),
      },
    });

    if (error || !data?.url) {
      log.error('signInWithSSO failed', error ?? new Error('No url returned'));
      return apiError({ error: 'SSO initiation failed — please try password login', status: 502 });
    }

    return NextResponse.json({
      ssoEnabled: true,
      redirectUrl: data.url,
      providerLabel: domain,
    });
  } catch (err) {
    log.error('sso-initiate handler failed', err as Error);
    return apiError({ error: 'SSO initiation failed', status: 500 });
  }
}
