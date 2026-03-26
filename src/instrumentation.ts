export async function register() {
  // Only validate on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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
}
