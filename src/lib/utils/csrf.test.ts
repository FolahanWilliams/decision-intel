import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock logger
vi.mock('./logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

import { validateOrigin, createCSRFErrorResponse } from './csrf';

const originalEnv = process.env;

function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {}
): NextRequest {
  const url = `http://localhost:3000${path}`;
  return new NextRequest(new URL(url), { method, headers });
}

describe('validateOrigin', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://app.example.com' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows GET requests without origin', () => {
    const req = makeRequest('GET', '/api/documents');
    expect(validateOrigin(req)).toBe(true);
  });

  it('allows POST from same origin', () => {
    const req = makeRequest('POST', '/api/upload', { origin: 'https://app.example.com' });
    expect(validateOrigin(req)).toBe(true);
  });

  it('rejects POST without origin or referer', () => {
    const req = makeRequest('POST', '/api/upload');
    expect(validateOrigin(req)).toBe(false);
  });

  it('rejects POST from different origin', () => {
    const req = makeRequest('POST', '/api/upload', { origin: 'https://evil.com' });
    expect(validateOrigin(req)).toBe(false);
  });

  it('allows referer when origin is absent', () => {
    const req = makeRequest('POST', '/api/upload', { referer: 'https://app.example.com/dashboard' });
    expect(validateOrigin(req)).toBe(true);
  });

  it('exempts Slack integration paths', () => {
    const req = makeRequest('POST', '/api/integrations/slack/events');
    expect(validateOrigin(req)).toBe(true);
  });

  it('exempts cron paths', () => {
    const req = makeRequest('GET', '/api/cron/dispatch');
    expect(validateOrigin(req)).toBe(true);
  });

  it('exempts Stripe webhook', () => {
    const req = makeRequest('POST', '/api/stripe/webhook');
    expect(validateOrigin(req)).toBe(true);
  });

  it('exempts health check', () => {
    const req = makeRequest('POST', '/api/health');
    expect(validateOrigin(req)).toBe(true);
  });

  it('allows PUT from same origin', () => {
    const req = makeRequest('PUT', '/api/settings', { origin: 'https://app.example.com' });
    expect(validateOrigin(req)).toBe(true);
  });

  it('allows DELETE from same origin', () => {
    const req = makeRequest('DELETE', '/api/documents/123', { origin: 'https://app.example.com' });
    expect(validateOrigin(req)).toBe(true);
  });

  it('allows PATCH from same origin', () => {
    const req = makeRequest('PATCH', '/api/deals', { origin: 'https://app.example.com' });
    expect(validateOrigin(req)).toBe(true);
  });

  it('handles Vercel preview deployments with wildcard', () => {
    process.env.NEXT_PUBLIC_APP_URL = '';
    process.env.VERCEL = '1';
    process.env.VERCEL_URL = 'my-app-abc123.vercel.app';
    const req = makeRequest('POST', '/api/upload', { origin: 'https://my-app-abc123.vercel.app' });
    expect(validateOrigin(req)).toBe(true);
  });

  it('rejects invalid origin URL', () => {
    const req = makeRequest('POST', '/api/upload', { origin: 'not-a-url' });
    expect(validateOrigin(req)).toBe(false);
  });
});

describe('createCSRFErrorResponse', () => {
  it('returns 403 with JSON body', async () => {
    const res = createCSRFErrorResponse();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('CSRF validation failed');
  });
});
