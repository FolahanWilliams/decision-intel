import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // TypeScript is validated in the build script via an explicit
  // `npx tsc --noEmit` invocation that runs BEFORE `next build`. Running
  // both the external tsc + Next.js's in-process type check stacks
  // heap usage and OOM'd the 8 GB Vercel Hobby container on 2026-04-23
  // (deploy 4Sz9sqTpr, exit 137 after 6 min in "Running TypeScript..."
  // with ~93 files typechecked). Gating to the external check keeps the
  // memory envelope phased — ~3 GB tsc, then ~5 GB webpack, never
  // overlapping. Do NOT flip this off without also removing the
  // `npx tsc --noEmit` step from package.json :: scripts.build, or the
  // type check gets silently skipped in CI.
  typescript: { ignoreBuildErrors: true },
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
  // 2026-04-22: Next.js 16.2.x SWC hits an infinite-loop bug when
  // processing inline `<style>{`@media ...`}</style>` blocks via the
  // styled-jsx transform. Our app uses plain <style> tags with static
  // CSS (no scoped selectors, no dynamic interpolation) — disabling
  // the styled-jsx compile path bypasses the hang without affecting
  // runtime behavior. If we ever need scoped styled-jsx, re-enable
  // and fix the source files instead.
  compiler: {
    styledJsx: false,
  },
};

export default withSentryConfig(nextConfig, {
  org: 'decision-intel-bu',
  project: 'decisionintelsentry',
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  // Plugin-level telemetry off — Sentry v10+ uses undici which our Node
  // http monkey-patch can't intercept; if Sentry's telemetry endpoint is
  // slow, the build can hang after "Creating an optimized production build".
  telemetry: false,
  // Reduce source-map upload scope to speed the build.
  widenClientFileUpload: false,
  // 2026-04-22: Disable source-map upload during Vercel build to work
  // around getsentry/sentry-javascript#17511 — on the `--webpack` path
  // the plugin leaks undici sockets after "Successfully uploaded source
  // maps to Sentry" is logged, so `runAfterProductionCompile` never
  // resolves and Vercel kills the build at 45 min. Matches our symptom
  // exactly. Follow-up: upload source maps via a post-deploy
  // `sentry-cli sourcemaps upload` step so prod error traces stay
  // resolvable. Until then, Sentry events will point at minified code.
  sourcemaps: { disable: true },
  tunnelRoute: '/monitoring',
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
});
