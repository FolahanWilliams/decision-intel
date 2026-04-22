// DIAGNOSTIC: withSentryConfig import temporarily removed — see bottom of file
// for the Sentry bypass and the options block to restore when Sentry is re-enabled.
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    // Legacy dashboard URLs that used to be thin redirect shim pages.
    // Preserved at the Next layer so external bookmarks, shared links, and
    // stale browser history continue to work after the shim files are deleted.
    // Uses temporary (307) redirects rather than permanent (308) in case we
    // ever want to restore one of these routes as a standalone page.
    return [
      // M3.1 — Ask surface replaces the old AI Assistant tab page. All
      // three legacy URLs land on /dashboard/ask with the mode preserved.
      { source: '/dashboard/ai-assistant', destination: '/dashboard/ask', permanent: false },
      { source: '/dashboard/chat', destination: '/dashboard/ask', permanent: false },
      { source: '/dashboard/copilot', destination: '/dashboard/ask', permanent: false },
      {
        source: '/dashboard/cognitive-audits',
        destination: '/dashboard/decision-quality?tab=audits',
        permanent: false,
      },
      {
        source: '/dashboard/insights',
        destination: '/dashboard/analytics?view=trends',
        permanent: false,
      },
      {
        source: '/dashboard/explainability',
        destination: '/dashboard/analytics?view=explainability',
        permanent: false,
      },
      {
        source: '/dashboard/fingerprint',
        destination: '/dashboard/analytics?view=intelligence',
        permanent: false,
      },
      {
        source: '/dashboard/bias-library',
        destination: '/dashboard/analytics?view=library',
        permanent: false,
      },
    ];
  },
  async headers() {
    // Content Security Policy
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;
      worker-src 'self' blob:;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://cdn.jsdelivr.net https://fonts.gstatic.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `
      .replace(/\s+/g, ' ')
      .trim();

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: cspHeader },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
    ];

    // Only add HSTS in production (when ALLOWED_ORIGIN is set)
    if (process.env.ALLOWED_ORIGIN) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }

    return [
      {
        // Security headers on all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // CORS headers on API routes — never default to wildcard
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-extension-key, x-extension-user-id',
          },
        ],
      },
    ];
  },
  // Note: pdf-parse removed - not in dependencies
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

// DIAGNOSTIC: Sentry bypass to isolate whether Sentry's webpack plugin
// is hanging Vercel builds. Local fonts migrated, telemetry disabled,
// http patch installed — build still hangs at "Creating an optimized
// production build..." right after the 3 Sentry plugin hooks log. Let's
// pull Sentry out of the webpack chain entirely and see if the build
// completes. If yes → pin Sentry plugin version / file upstream issue.
// Restore original `export default withSentryConfig(nextConfig, {...});`
// once the diagnosis is complete.
export default nextConfig;

/* Sentry options preserved verbatim for one-line restore:
  withSentryConfig(nextConfig, {
    org: 'decision-intel-bu',
    project: 'decisionintelsentry',
    silent: !process.env.CI,
    telemetry: false,
    widenClientFileUpload: false,
    tunnelRoute: '/monitoring',
    webpack: {
      automaticVercelMonitors: true,
      treeshake: { removeDebugLogging: true },
    },
  });
*/
