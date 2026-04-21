// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://1b71e93367f4591b506e09ed0606c9ce@o4511117819379712.ingest.us.sentry.io/4511117821214720',

  // Sample 10% of traces in production to control costs; 100% in development for full visibility.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Disable sending user PII (Personally Identifiable Information) to comply with GDPR.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});
