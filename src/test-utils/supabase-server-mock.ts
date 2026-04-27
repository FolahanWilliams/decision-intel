/**
 * Shared Supabase server-client mock factory. Most API-route tests want
 * a stub `createClient` that returns a fake auth shape with a configurable
 * `getUser` mock. Pattern:
 *
 *   import { vi } from 'vitest';
 *   import { supabaseServerMockFactory } from '@/test-utils/supabase-server-mock';
 *   const mockGetUser = vi.fn();
 *   vi.mock('@/utils/supabase/server', () => supabaseServerMockFactory(() => mockGetUser));
 *
 * The accessor (`() => mockGetUser`) is required because vi.mock factories
 * are hoisted above the `const mockGetUser = vi.fn()` line. The accessor
 * defers the variable lookup until `createClient()` is actually invoked,
 * which happens at test-run time after the temporal-dead-zone has lifted.
 */
type GetUserFn = () => unknown;
type GetUserAccessor = () => GetUserFn;

export function supabaseServerMockFactory(getUserAccessor: GetUserAccessor) {
  return {
    createClient: () =>
      Promise.resolve({
        auth: { getUser: () => getUserAccessor()() },
      }),
  };
}
