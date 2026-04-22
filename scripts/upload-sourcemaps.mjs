#!/usr/bin/env node
// Post-build Sentry source-map uploader.
//
// Why this script exists
// ----------------------
// The `@sentry/nextjs` webpack plugin's source-map upload path leaks
// undici sockets after `Successfully uploaded source maps to Sentry` is
// logged, so `runAfterProductionCompile` never resolves and Vercel kills
// the build at the 45-min ceiling — getsentry/sentry-javascript#17511.
//
// Fix in `next.config.ts`: `sourcemaps: { disable: true }` in
// `withSentryConfig` options. That stops the plugin from uploading.
// This script restores symbolication by running `@sentry/cli sourcemaps
// upload` AFTER `next build` finishes, in a fresh Node process. The
// Rust @sentry/cli binary uses its own HTTP stack — no undici, no
// socket leak — and exits cleanly.
//
// Behavior
// --------
// - SENTRY_AUTH_TOKEN unset: log `[sentry] skipped` and exit 0. Local
//   builds + preview deploys without the token still succeed.
// - SENTRY_AUTH_TOKEN set: spawn `npx @sentry/cli@2 sourcemaps upload`
//   with org/project/release args. Fail loud if the upload fails so
//   we don't silently ship un-symbolicated builds.
//
// Setup
// -----
// In Vercel project settings → Environment Variables, add
// SENTRY_AUTH_TOKEN with `project:releases` + `project:write` scopes
// from https://decision-intel-bu.sentry.io/settings/auth-tokens/.
// Apply to Production + Preview.

import { spawn } from 'node:child_process';

const TOKEN = process.env.SENTRY_AUTH_TOKEN;
if (!TOKEN) {
  console.log(
    '[sentry] sourcemap upload skipped — SENTRY_AUTH_TOKEN not set. ' +
      'Set it in Vercel env vars (Production + Preview) to enable post-build upload.'
  );
  process.exit(0);
}

const release =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  'local-' + new Date().toISOString().replace(/[:.]/g, '-');

console.log(`[sentry] uploading sourcemaps for release ${release.slice(0, 12)}…`);

const child = spawn(
  'npx',
  [
    '-y',
    '@sentry/cli@2',
    'sourcemaps',
    'upload',
    '--org=decision-intel-bu',
    '--project=decisionintelsentry',
    `--release=${release}`,
    '.next',
  ],
  { stdio: 'inherit', env: process.env }
);

child.on('exit', code => {
  if (code === 0) {
    console.log('[sentry] sourcemap upload OK');
  } else {
    console.error(
      `[sentry] sourcemap upload FAILED (exit ${code}). Build artifacts ` +
        `are still good — re-run with \`npm run sentry:upload-sourcemaps\` ` +
        `to retry, or accept un-symbolicated stack traces for this release.`
    );
  }
  process.exit(code ?? 1);
});
