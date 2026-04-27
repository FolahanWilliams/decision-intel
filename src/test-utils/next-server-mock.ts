/**
 * Shared `next/server` mock factory for vitest. Replaces the ~38-line
 * MockNextResponse + NextRequest mock class that was duplicated across
 * ~10 API-route test files. Pass as the second arg to `vi.mock`:
 *
 *   import { nextServerMockFactory } from '@/test-utils/next-server-mock';
 *   vi.mock('next/server', nextServerMockFactory);
 *
 * vi.mock factories are hoisted; passing a top-level imported function
 * works because the import is also hoisted.
 */
export function nextServerMockFactory() {
  class MockNextResponse {
    status: number;
    body: unknown;
    headers: Map<string, string>;
    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    async json() {
      return this.body;
    }
    async text() {
      return String(this.body);
    }
    static json(body: unknown, init?: { status?: number }) {
      return new MockNextResponse(body, init);
    }
  }
  return {
    NextRequest: class {
      public url: string;
      private _body: unknown;
      constructor(
        url: string,
        init?: { method?: string; body?: string; headers?: Record<string, string> }
      ) {
        this.url = url;
        this._body = init?.body ? JSON.parse(init.body) : null;
      }
      async json() {
        return this._body;
      }
    },
    NextResponse: MockNextResponse,
  };
}
