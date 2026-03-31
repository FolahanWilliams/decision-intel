import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks — declared before imports

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status || 200,
      body,
    }),
    redirect: (url: string) => ({
      url,
      status: 307,
    }),
  },
}));

const mockExchangeCode = vi.fn();
const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: (...args: unknown[]) => mockExchangeCode(...args),
        getUser: () => mockGetUser(),
      },
    }),
}));

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userSettings: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

import { GET } from './route';

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to /login?error=true when no code param in URL', async () => {
    const req = new Request('http://localhost/api/auth/callback');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/login?error=true');
  });

  it('redirects to /login?error=true when exchangeCodeForSession fails', async () => {
    mockExchangeCode.mockResolvedValue({ error: new Error('invalid code') });
    const req = new Request('http://localhost/api/auth/callback?code=bad-code');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/login?error=true');
  });

  it('redirects to custom redirect path when redirect param provided', async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    const req = new Request('http://localhost/api/auth/callback?code=test-code&redirect=/settings');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/settings');
  });

  it('redirects to /dashboard?welcome=true for first-time user (no UserSettings)', async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});

    const req = new Request('http://localhost/api/auth/callback?code=test-code');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/dashboard?welcome=true');
  });

  it('creates UserSettings for first-time user', async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});

    const req = new Request('http://localhost/api/auth/callback?code=test-code');
    await GET(req);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1' },
      update: {},
    });
  });

  it('redirects to /dashboard?welcome=true for user with incomplete onboarding', async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-2' } } });
    mockFindUnique.mockResolvedValue({ onboardingCompleted: false });

    const req = new Request('http://localhost/api/auth/callback?code=test-code');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/dashboard?welcome=true');
  });

  it('redirects to /dashboard for returning user with completed onboarding', async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-3' } } });
    mockFindUnique.mockResolvedValue({ onboardingCompleted: true });

    const req = new Request('http://localhost/api/auth/callback?code=test-code');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/dashboard');
  });

  it('falls back to /dashboard if prisma throws', async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockRejectedValue(new Error('db down'));

    const req = new Request('http://localhost/api/auth/callback?code=test-code');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/dashboard');
  });

  it('redirects to /dashboard if getUser returns no user', async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new Request('http://localhost/api/auth/callback?code=test-code');
    const res = await GET(req);
    expect(res.url).toBe('http://localhost/dashboard');
  });
});
