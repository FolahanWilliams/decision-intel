/**
 * CSRF Protection Utilities
 *
 * Validates Origin/Referer headers for mutation requests to prevent
 * Cross-Site Request Forgery attacks.
 */

import { NextRequest } from 'next/server';
import { createLogger } from './logger';

const log = createLogger('CSRF');

// Mutation methods that require CSRF protection
const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Endpoints that are exempt from CSRF checks
const EXEMPT_PATHS = [
  '/api/integrations/slack/events', // Slack sends its own signature
  '/api/cron/', // Uses Bearer token authentication
  '/api/health', // Read-only health check
];

/**
 * Validates the origin of a request to prevent CSRF attacks
 * @param request The incoming request
 * @returns true if the request is valid, false if it should be rejected
 */
export function validateOrigin(request: NextRequest): boolean {
  // Skip validation for non-mutation methods
  if (!MUTATION_METHODS.includes(request.method)) {
    return true;
  }

  // Skip validation for exempt paths
  const path = request.nextUrl.pathname;
  if (EXEMPT_PATHS.some(exempt => path.startsWith(exempt))) {
    log.debug(`Skipping CSRF check for exempt path: ${path}`);
    return true;
  }

  // Special case: GET /api/share is public and doesn't need CSRF
  if (path === '/api/share' && request.method === 'GET') {
    return true;
  }

  // Get Origin or Referer header
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // At least one must be present for mutation requests
  if (!origin && !referer) {
    log.warn(`CSRF: No Origin or Referer header for ${request.method} ${path}`);
    return false;
  }

  // Parse the header to get the host
  let requestHost: string;
  try {
    if (origin) {
      requestHost = new URL(origin).host;
    } else if (referer) {
      requestHost = new URL(referer).host;
    } else {
      return false;
    }
  } catch (error) {
    log.warn(`CSRF: Invalid Origin/Referer URL: ${origin || referer}`);
    return false;
  }

  // Get allowed hosts
  const allowedHosts = getAllowedHosts();

  // Check if the request host is in our allowed list
  const isAllowed = allowedHosts.some(allowed => {
    // Exact match
    if (requestHost === allowed) return true;

    // Subdomain match for production (*.vercel.app)
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return requestHost.endsWith(domain);
    }

    return false;
  });

  if (!isAllowed) {
    log.warn(`CSRF: Rejected request from ${requestHost} to ${path}`);
    return false;
  }

  return true;
}

/**
 * Get the list of allowed hosts based on environment
 */
function getAllowedHosts(): string[] {
  const hosts: string[] = [];

  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    hosts.push('localhost:3000', 'localhost:3001', '127.0.0.1:3000');
  }

  // Add production URL if set
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const url = new URL(appUrl);
      hosts.push(url.host);

      // Also allow Vercel preview deployments
      if (url.host.includes('vercel.app')) {
        hosts.push('*.vercel.app');
      }
    } catch (error) {
      log.error('Invalid NEXT_PUBLIC_APP_URL:', error);
    }
  }

  // Add Vercel URL if available (for preview deployments)
  if (process.env.VERCEL_URL) {
    hosts.push(process.env.VERCEL_URL);
  }

  return hosts;
}

/**
 * Create a CSRF error response
 */
export function createCSRFErrorResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'CSRF validation failed' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}