import { afterEach, vi } from 'vitest';

/**
 * Selective per-test mock reset.
 *
 * Some test files use vi.clearAllMocks() in their beforeEach, which only
 * clears call records but NOT mock implementations. This causes implementation
 * bleedover between tests in those files.
 *
 * We only apply vi.resetAllMocks() for specific test files where bleedover
 * is known to cause incorrect test behaviour, leaving other test files that
 * rely on describe-level mock initialisation untouched.
 */
afterEach(context => {
  const testFile: string = (context.task as { file?: { name?: string } })?.file?.name ?? '';

  if (testFile.includes('v1/analyze/route.test')) {
    vi.resetAllMocks();
  }
});
