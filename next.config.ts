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
      // Phase A consolidation (2026-05-09 evening) — three sidebar surfaces
      // deleted as part of the platform-page refactor:
      //   - /dashboard/playbooks: orphaned feature, zero integration with
      //     the analyze pipeline (DecisionScorecard + ActOnThisPanel were
      //     never mounted anywhere in production). DPR archive scope is
      //     covered by per-document export on /documents/[id] + per-
      //     container export on /dashboard/decisions/[id].
      //   - /dashboard/provenance: read-only DPR archive duplicate of the
      //     per-document + per-container export buttons. No new insights.
      //   - /dashboard/cognitive-audits/effectiveness: nudge-effectiveness
      //     metrics duplicated /decision-log summary cards + Analytics
      //     Performance tab. Folded into Analytics → Performance.
      // 308 (permanent) so external links + bookmarks resolve to the
      // closest semantic neighbour.
      {
        source: '/dashboard/playbooks',
        destination: '/dashboard/decisions',
        permanent: true,
      },
      {
        source: '/dashboard/playbooks/:path*',
        destination: '/dashboard/decisions',
        permanent: true,
      },
      {
        source: '/dashboard/provenance',
        destination: '/dashboard/decisions',
        permanent: true,
      },
      {
        source: '/dashboard/cognitive-audits/effectiveness',
        destination: '/dashboard/analytics?view=performance',
        permanent: true,
      },
      // Decision DNA folded into Analytics → Intelligence (Phase B). The
      // `#dna` fragment is load-bearing — section anchor in
      // src/app/(platform)/dashboard/analytics/page.tsx (id="dna",
      // scrollMarginTop: 80) so a returning user with the old bookmark
      // lands directly on the DNA section, not the top of the Intelligence
      // tab. CommandPalette + DecisionDNAPreviewCard already deep-link
      // with the fragment; this redirect now matches.
      {
        source: '/dashboard/decision-dna',
        destination: '/dashboard/analytics?view=intelligence#dna',
        permanent: true,
      },
      // Decision Log folded into Decisions as a view (Phase G fold
      // 2026-05-10) — "is the Decision Log really a necessary
      // standalone page, can't we just incorporate elements from it
      // into the Decisions page" (founder audit). Sub-routes
      // (/cognitive-audits/[id], /cognitive-audits/submit) stay live
      // as their own surfaces; only the umbrella /decision-log
      // collapses.
      {
        source: '/dashboard/decision-log',
        destination: '/dashboard/decisions?view=log',
        permanent: true,
      },
      // Constellation SVG viz retired 2026-05-11 (founder feedback — the
      // visualization was structurally hard to read; the cognitive-lineage
      // value lives in the per-decision ContainerLinksPanel anyway).
      // Bookmarks redirect to the canonical decisions kanban + log surface.
      {
        source: '/dashboard/decisions/constellation',
        destination: '/dashboard/decisions',
        permanent: true,
      },
      // Outcome Flywheel folded into Analytics → Intelligence as a section
      // 2026-05-10 streamlining batch (founder ask: "wouldn't it just be
      // best to almost merge or incorporate some elements from that into
      // the intelligence page?"). The flywheel IS decision intelligence —
      // which calls paid off, which didn't, how detection accuracy
      // improves. Standalone route + sub-nav entry retired.
      {
        source: '/dashboard/outcome-flywheel',
        destination: '/dashboard/analytics?view=intelligence#flywheel',
        permanent: true,
      },
      // Meetings → blended into Decisions as document types (locked
      // 2026-05-10 second streamlining batch, founder ask: "what if you
      // can just upload your minutes as a document, for example, and
      // then it enters your big dynamic constellation"). Meeting
      // transcripts + minutes are now first-class documentTypes
      // (meeting_transcript / meeting_minutes) that flow into the
      // Decision Container alongside memos, models, DPRs. Decision Rooms
      // (separate concept — collaborative blind-prior voting) restored
      // to its own /dashboard/decision-rooms route. /dashboard/meetings
      // and /meetings/command-center are retired UI surfaces.
      {
        source: '/dashboard/meetings',
        destination: '/dashboard/decisions',
        permanent: true,
      },
      {
        source: '/dashboard/meetings/:path*',
        destination: '/dashboard/decisions',
        permanent: true,
      },
      {
        source: '/meetings/command-center',
        destination: '/dashboard/decisions',
        permanent: true,
      },
      // Decision Alpha page deleted 2026-05-07 — the "Published Q2 2026"
      // claim was a recurring-publication promise without a workflow,
      // and the synthetic SECTOR_INDEX data carried "30+ biases" count
      // drift vs the canonical 22-bias taxonomy. Redirect to /proof
      // (the closest semantic neighbour: actual case-study evidence).
      // Permanent (308) so search engines drop the URL — we don't plan
      // to restore it.
      {
        source: '/decision-alpha',
        destination: '/proof',
        permanent: true,
      },
      // Legacy static-site index path. Google Search Console (2026-05-18)
      // reported `/index.html` 404ing on both www + apex http variants
      // (old links / pre-Next static-deploy crawl artefacts). A Next.js
      // app serves the homepage at `/`, never `/index.html`, so the path
      // can only ever mean "the homepage" — 308 consolidates the legacy
      // path's signal into the canonical root. `source` matches on path
      // regardless of scheme/host, so this one rule covers every variant.
      // NOTE: the GSC "/100" 404 is deliberately NOT redirected — it has
      // zero intended route + zero inbound value; a clean 404 is the
      // correct response, and a soft-404 redirect would dilute relevance
      // (and any $100M-coded destination would violate the CLAUDE.md
      // exit-arc-containment lock).
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
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
      media-src 'self' data: blob:;
      connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://cdn.jsdelivr.net https://fonts.gstatic.com https://*.livekit.cloud wss://*.livekit.cloud;
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
      // microphone=(self) is required for the founder-hub voice mode
      // (LiveKit/livekit-client calls navigator.mediaDevices.getUserMedia
      // for the audio track). microphone=() would block the mic for ALL
      // origins including same-origin, which prevents voice mode entirely.
      // Geolocation + camera stay disabled — DI doesn't use either.
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(self), camera=()' },
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
    // 2026-04-25: Vercel build OOM (exit 137) during `next build --webpack`
    // at 6 GB heap. Next.js 16's webpackMemoryOptimizations flag drops a
    // few non-essential webpack passes (unused-variable analysis tuning,
    // some source-map auxiliary work) to keep peak memory under the 8 GB
    // container ceiling. No runtime impact; it only changes how webpack
    // does its bookkeeping during compile.
    webpackMemoryOptimizations: true,
    // 2026-04-29: Vercel build OOM AGAIN (exit 137) after the heap was
    // already at 7168 + webpackMemoryOptimizations was on. The codebase
    // grew enough across the last ~7 days (Sparring Room v3, Education
    // Room ~120 cards, Path-to-100M tab + ~3000-line data file, Closing
    // Lab + Brinkmanship + Strategic Thinking sales-toolkit additions,
    // founder-school lesson + visualization growth, the case-count
    // refactor touching ~30 files) to push webpack peak memory over
    // the 8 GB container ceiling again.
    //
    // Per CLAUDE.md "Webpack OOM" lock the next move is
    // `webpackBuildWorker: false`. Next 16+ runs webpack in a worker
    // by default; disabling it can PARADOXICALLY reduce peak memory
    // because the worker duplicates internal state that already lives
    // in the parent process.
    //
    // Do NOT raise NODE_OPTIONS heap above 7168 — that pushes into the
    // parent-Node + container-overhead window and SIGKILL fires
    // immediately. Stay at 7168 + this flag. Also NOT switching to
    // Turbopack despite improved Next 16 support — Turbopack stalled
    // in this codebase on 2026-04-22 ("Creating an optimized
    // production build ..." never recovered). Treat Turbopack as
    // experimental fallback ONLY if this commit's fix also OOMs.
    webpackBuildWorker: false,
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
  // 2026-05-06: Vercel build OOM (exit 137) AGAIN even with heap at
  // 7168 + webpackBuildWorker: false + webpackMemoryOptimizations: true.
  // The build log named the culprit — webpack's PackFileCacheStrategy
  // was serialising 700+ MB cache packs (.next/cache/webpack/
  // server-production/1.pack at 702MB, 43.pack at 428MB, etc.) and
  // holding them in memory during serialisation, pushing peak heap
  // past the 8 GB container ceiling.
  //
  // Fix: disable webpack's filesystem cache for production builds.
  // Vercel runs each deploy on a fresh container, so the cache hit
  // rate is near-zero anyway — the disk packs are compute that never
  // pays back. Trade-off: cold first-build locally on every restart
  // (~3 min addition) but no impact on Vercel CI behaviour.
  //
  // Why not memory cache: webpack's memory cache also holds modules
  // for the duration of the build — at the codebase's current size,
  // that path also OOMs. The only stable option is no cache.
  //
  // Do NOT replace this with experimental.optimizeCss or other
  // alternative caching schemes without re-running the deploy and
  // confirming the build stays under 8 GB. Per the build-hang
  // diagnostic chain in CLAUDE.md: bisect, don't theorise.
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
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
