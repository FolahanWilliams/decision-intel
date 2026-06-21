/**
 * Per-request correlation context (server-only).
 *
 * Institutional logging requires tracing a single request across every log line
 * it produces — a SIEM query like `requestId:abc123` should return the whole
 * story of one request. This provides that without threading an id through 400+
 * logger call sites: an AsyncLocalStorage store holds { requestId, userId, orgId }
 * for the duration of a request, and the logger reads it automatically.
 *
 * DECOUPLING NOTE: logger.ts is also imported by client components (for
 * createClientLogger), so it must not statically import node:async_hooks. We
 * bridge through globalThis: this module (server-only — only ever imported by
 * request handlers / wrappers) registers a getter on globalThis that the logger
 * reads with optional chaining. On the client / edge the getter is simply
 * undefined and the logger no-ops the correlation fields.
 *
 * USAGE (wrap a handler):
 *   export const GET = withRequestContext(async (req) => { ... });
 * or set fields once auth resolves:
 *   setRequestContext({ userId, orgId });
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface RequestContext {
  requestId: string;
  userId?: string;
  orgId?: string;
  route?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

const BRIDGE_KEY = '__getDIRequestContext';

// Register the bridge the logger reads. Idempotent across hot-reloads.
(globalThis as Record<string, unknown>)[BRIDGE_KEY] = () => storage.getStore();

/** Generate a correlation id. Prefers an inbound trace header when present. */
export function newRequestId(headerValue?: string | null): string {
  const trimmed = headerValue?.trim();
  if (trimmed && trimmed.length <= 200) return trimmed;
  return randomUUID();
}

/** Run `fn` with a fresh request context active for everything it awaits. */
export function runWithRequestContext<T>(
  ctx: RequestContext,
  fn: () => Promise<T> | T
): Promise<T> | T {
  return storage.run(ctx, fn);
}

/** Read the active request context, if any (undefined outside a request). */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Merge fields (e.g. userId/orgId once auth resolves) into the active context. */
export function setRequestContext(fields: Partial<Omit<RequestContext, 'requestId'>>): void {
  const cur = storage.getStore();
  if (cur) Object.assign(cur, fields);
}

/**
 * Wrap a Next.js route handler so every log line it emits carries a requestId.
 * Echoes the id back as the `x-request-id` response header for client-side
 * correlation. Reads an inbound `x-request-id` / `x-correlation-id` if present
 * (so an upstream gateway's trace id is preserved end-to-end).
 */
export function withRequestContext<Args extends unknown[]>(
  handler: (req: Request, ...rest: Args) => Promise<Response> | Response
): (req: Request, ...rest: Args) => Promise<Response> {
  return async (req: Request, ...rest: Args): Promise<Response> => {
    const inbound = req.headers.get('x-request-id') || req.headers.get('x-correlation-id');
    const ctx: RequestContext = {
      requestId: newRequestId(inbound),
      route: (() => {
        try {
          return new URL(req.url).pathname;
        } catch {
          return undefined;
        }
      })(),
    };
    const res = await (runWithRequestContext(ctx, () =>
      handler(req, ...rest)
    ) as Promise<Response>);
    try {
      res.headers.set('x-request-id', ctx.requestId);
    } catch {
      // Some Response objects have immutable headers; correlation still works
      // in the logs even if the echo header can't be set.
    }
    return res;
  };
}
