// Node.js `--import` preload that forces a global timeout on every http/https
// request made during `next build`.
//
// Why this exists
// ----------------
// Next.js 16's Google Fonts fetcher (`next/dist/compiled/@next/font/dist/
// google/fetch-resource.js`) sets the request timeout to `undefined` in
// production builds:
//
//   const timeout = isDev ? 3000 : undefined;
//
// When Google Fonts is slow or unreachable from Vercel's build network, the
// socket hangs forever. The `async-retry` wrapper around the fetch only
// catches thrown errors — it never fires on an indefinite hang — so the
// build silently waits until Vercel kills it at the 45-minute ceiling.
//
// The same failure mode exists for `@sentry/nextjs` telemetry, any plugin
// that makes a build-time HTTP call, and anything that uses the default
// http/https agent without its own timeout.
//
// What this does
// --------------
// Wraps `http.request` and `https.request` so every outgoing request gets
// a default socket-level timeout of HTTP_REQUEST_TIMEOUT_MS (15 s). If the
// caller already set a timeout (e.g. Next's dev-only 3 s), this leaves it
// alone. Timed-out requests reject with a normal error, which means any
// retry wrapper around them will see the error and do its job.
//
// Usage
// -----
// Via `NODE_OPTIONS='--import ./scripts/patch-http-timeout.mjs'` in the
// build script. Runs before Next.js starts, so it's in place for every
// HTTP call `next build` makes.

import http from 'node:http';
import https from 'node:https';

const TIMEOUT_MS = Number(process.env.HTTP_REQUEST_TIMEOUT_MS) || 15_000;

function wrapRequest(original) {
  return function patchedRequest(...args) {
    const req = original.apply(this, args);
    // Only apply our default if the caller didn't set one themselves.
    // `req.timeout` is populated via `req.setTimeout(ms, ...)`.
    if (!req.timeout) {
      req.setTimeout(TIMEOUT_MS, () => {
        req.destroy(
          new Error(
            `[patch-http-timeout] Request exceeded ${TIMEOUT_MS}ms — destroyed to prevent build hang.`
          )
        );
      });
    }
    return req;
  };
}

http.request = wrapRequest(http.request);
https.request = wrapRequest(https.request);

console.log(`[patch-http-timeout] Installed ${TIMEOUT_MS}ms global timeout on http/https requests`);
