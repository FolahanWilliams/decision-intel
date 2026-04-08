/**
 * Standardized API response helpers.
 *
 * Ensures all API endpoints return a consistent envelope:
 *   { success: boolean, data?, error?, requestId? }
 */

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { trackError } from './error-tracker';

interface SuccessOptions<T> {
  data: T;
  status?: number;
  /** Extra top-level fields (e.g., pagination) merged into the response. */
  meta?: Record<string, unknown>;
}

interface ErrorOptions {
  error: string;
  status: number;
  headers?: Record<string, string>;
  /** Original error — auto-tracked for 5xx responses. */
  cause?: Error;
}

function generateRequestId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Return a successful JSON response.
 *
 * @example
 *   return apiSuccess({ data: deal, status: 201 });
 *   return apiSuccess({ data: docs, meta: { pagination: { page, total } } });
 */
export function apiSuccess<T>({ data, status = 200, meta }: SuccessOptions<T>) {
  return NextResponse.json(
    {
      success: true,
      data,
      requestId: generateRequestId(),
      ...meta,
    },
    { status }
  );
}

/**
 * Return an error JSON response.
 *
 * @example
 *   return apiError({ error: 'Unauthorized', status: 401 });
 *   return apiError({ error: 'Rate limit exceeded', status: 429, headers: { 'Retry-After': '60' } });
 */
export function apiError({ error, status, headers, cause }: ErrorOptions) {
  // Auto-track server errors for monitoring
  if (status >= 500 && cause) {
    void trackError(cause, { statusCode: status });
  }

  return NextResponse.json(
    {
      success: false,
      error,
      requestId: generateRequestId(),
    },
    { status, headers }
  );
}
