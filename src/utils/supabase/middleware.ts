import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: _options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/shared/') ||
    request.nextUrl.pathname.startsWith('/invite/');

  if (isPublicRoute) {
    return supabaseResponse;
  }

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/documents') ||
    (request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/api/analyze') &&
      !request.nextUrl.pathname.startsWith('/api/auth') &&
      !request.nextUrl.pathname.startsWith('/api/share') &&
      !request.nextUrl.pathname.startsWith('/api/stripe') &&
      !request.nextUrl.pathname.startsWith('/api/cron') &&
      !request.nextUrl.pathname.startsWith('/api/health') &&
      !request.nextUrl.pathname.startsWith('/api/integrations/slack') &&
      !request.nextUrl.pathname.startsWith('/api/pilot-interest') &&
      // Public demo audit endpoint — POST /api/demo/run is the highest-leverage
      // acquisition surface (a stranger pasting a memo). Auth-redirecting to
      // /login turned the POST into a 307 → 405 on the cold conversion door.
      // Owns its own IP+global rate limit (1/IP/24h + 50/day global) inside the
      // route handler; same server-to-server-style exemption as the slack/cron
      // routes above but with IP-bound rate-limit as the abuse guard.
      !request.nextUrl.pathname.startsWith('/api/demo') &&
      // Voice mode worker calls /api/founder-hub/voice-context with its own
      // shared-secret bearer (VOICE_WORKER_SECRET, validated inside the
      // route). The Railway worker has no Supabase session — auth-redirecting
      // it to /login made the worker JSON.parse the login page HTML and
      // crash silently with "failed to load voice context". Server-to-server
      // pattern, same as the slack/stripe/cron exemptions above.
      !request.nextUrl.pathname.startsWith('/api/founder-hub/voice-context') &&
      // Voice tool dispatch endpoint — same shared-secret bearer pattern.
      // The agent calls this when LLM tool use fires (add_todo,
      // track_demo_conversion, lookup_decision_log, etc).
      !request.nextUrl.pathname.startsWith('/api/founder-hub/voice-tools') &&
      // Public-by-design routes — each handles its own auth (none, or
      // x-extension-key, or IP rate-limit) and was being silently
      // redirected to /login. Same drift-class as /api/demo (2026-05-19
      // fix). Each handler carries its own abuse guard (rate-limit /
      // header bearer / static cache).
      //
      // sso/initiate: pre-login domain probe; runs BEFORE the user is
      //   authenticated, so an auth check here is a logical impossibility.
      //   sso/admin/* deliberately NOT exempted — admin endpoints need
      //   the Supabase session.
      !request.nextUrl.pathname.startsWith('/api/sso/initiate') &&
      // simulate-ceo: public anonymous CEO-question generator, 3/IP/24h.
      !request.nextUrl.pathname.startsWith('/api/simulate-ceo') &&
      // public/*: explicit public-namespace (sample-dpr, case-studies,
      //   outcome-stats) — every handler says "No auth required".
      !request.nextUrl.pathname.startsWith('/api/public/') &&
      // og-case-study/*: OpenGraph social-unfurl card generator. Called
      //   by Twitter/LinkedIn/Slack crawlers — never authenticated.
      !request.nextUrl.pathname.startsWith('/api/og-case-study/') &&
      // extension/*: browser extension calls its own dedicated routes
      //   with x-extension-key (validated in authenticateApiRequest).
      //   The legacy /api/analyze + x-extension-key path stays handled
      //   by isExtensionAnalyzeRequest below for back-compat.
      !request.nextUrl.pathname.startsWith('/api/extension/') &&
      // intelligence/calibration-baseline: force-static public endpoint
      //   (platform Brier 0.258 baseline). The rest of /api/intelligence/*
      //   is per-user/per-org and stays protected.
      !request.nextUrl.pathname.startsWith('/api/intelligence/calibration-baseline'));

  // Allow extension requests to bypass middleware protection so the route handler
  // can authenticate them using the custom x-extension-key.
  const isExtensionAnalyzeRequest =
    request.nextUrl.pathname.startsWith('/api/analyze') && request.headers.has('x-extension-key');

  if (isProtectedRoute && !user && !isExtensionAnalyzeRequest) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is signed in and lands on /login, bounce to /dashboard.
  // The landing page (/) stays accessible so returning visitors can revisit
  // marketing copy, share links, or check the demo without being kicked out.
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
