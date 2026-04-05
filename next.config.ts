import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Legacy dashboard URLs that used to be thin redirect shim pages.
    // Preserved at the Next layer so external bookmarks, shared links, and
    // stale browser history continue to work after the shim files are deleted.
    // Uses temporary (307) redirects rather than permanent (308) in case we
    // ever want to restore one of these routes as a standalone page.
    return [
      { source: '/dashboard/chat', destination: '/dashboard/ai-assistant?mode=chat', permanent: false },
      { source: '/dashboard/copilot', destination: '/dashboard/ai-assistant?mode=copilot', permanent: false },
      { source: '/dashboard/cognitive-audits', destination: '/dashboard/decision-quality?tab=audits', permanent: false },
      { source: '/dashboard/insights', destination: '/dashboard/analytics?view=trends', permanent: false },
      { source: '/dashboard/explainability', destination: '/dashboard/analytics?view=explainability', permanent: false },
      { source: '/dashboard/fingerprint', destination: '/dashboard/analytics?view=fingerprint', permanent: false },
      { source: '/dashboard/bias-library', destination: '/dashboard/analytics?view=library', permanent: false },
    ];
  },
  async headers() {
    // Content Security Policy
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();

    const securityHeaders = [
      { key: "Content-Security-Policy", value: cspHeader },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
    ];

    // Only add HSTS in production (when ALLOWED_ORIGIN is set)
    if (process.env.ALLOWED_ORIGIN) {
      securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }

    return [
      {
        // Security headers on all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // CORS headers on API routes — never default to wildcard
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGIN || "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-extension-key, x-extension-user-id" },
        ]
      }
    ];
  },
  // Note: pdf-parse removed - not in dependencies
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "decision-intel-bu",

  project: "decisionintelsentry",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
