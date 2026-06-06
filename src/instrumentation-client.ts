// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

/**
 * Browser-extension noise filter (locked 2026-06-06).
 *
 * Production Sentry was capturing `UnhandledRejection: Non-Error promise
 * rejection captured with value: Object Not Found Matching Id:N,
 * MethodName:update, ParamCount:4` on marketing pages (e.g. /how-it-works).
 * This "Object Not Found Matching Id … MethodName … ParamCount" signature is
 * the well-documented fingerprint of a browser-extension message-channel
 * bridge (password managers / translation / accessibility extensions probing
 * the page over postMessage) — NOT a first-party app bug. Grep-confirmed: no
 * `MethodName:update` / `ParamCount` / `Object Not Found Matching Id` source
 * exists anywhere in `src/`. These filters drop the class so the production
 * error feed stays signal. Forward-looking rule: any new extension-injected
 * Non-Error rejection class gets added to IGNORE_ERROR_PATTERNS, never to a
 * per-route try/catch (the noise originates outside our code).
 */
const IGNORE_ERROR_PATTERNS: (string | RegExp)[] = [
  // The exact extension message-channel bridge signature seen in production.
  /Object Not Found Matching Id/i,
  /MethodName:\s*\w+,\s*ParamCount/i,
  // Generic extension/postMessage-bridge noise that surfaces as Non-Error rejections.
  'Non-Error promise rejection captured',
  // Common benign browser/extension chatter.
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
];

// Extension origins never carry first-party stack frames worth keeping.
const DENY_URLS: RegExp[] = [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-(web-)?extension:\/\//i,
  /^webkit-masked-url:\/\//i,
];

Sentry.init({
  dsn: 'https://1b71e93367f4591b506e09ed0606c9ce@o4511117819379712.ingest.us.sentry.io/4511117821214720',

  // Drop browser-extension-injected noise before it hits the production feed.
  ignoreErrors: IGNORE_ERROR_PATTERNS,
  denyUrls: DENY_URLS,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
