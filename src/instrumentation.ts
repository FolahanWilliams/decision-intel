import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');

    // Import env validation
    const { assertEnvValid } = await import('./lib/env');
    try {
      assertEnvValid();
      console.log('[Instrumentation] ✓ Environment variables validated');
    } catch (err) {
      console.error(
        '[Instrumentation] ✗ Environment validation failed:',
        err instanceof Error ? err.message : err
      );
      // Don't crash the server — just warn loudly
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
