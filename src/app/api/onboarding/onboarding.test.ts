import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared before imports
// ---------------------------------------------------------------------------

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status || 200,
      body,
    }),
  },
}));

const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
    }),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

const mockUpsert = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userSettings: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

// Import module under test AFTER all mocks
import { GET, PATCH } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } });
});

// ---------------------------------------------------------------------------
// GET /api/onboarding
// ---------------------------------------------------------------------------

describe('GET /api/onboarding', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns onboarding state when settings exist', async () => {
    mockUpsert.mockResolvedValue({ onboardingCompleted: true, onboardingStep: 3 });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboardingCompleted).toBe(true);
    expect(body.onboardingStep).toBe(3);
  });

  it('returns defaults on schema drift error P2021', async () => {
    const error = new Error('Table not found');
    (error as unknown as { code: string }).code = 'P2021';
    mockUpsert.mockRejectedValue(error);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboardingCompleted).toBe(false);
    expect(body.onboardingStep).toBe(0);
  });

  it('returns defaults on schema drift error P2022', async () => {
    const error = new Error('Column not found');
    (error as unknown as { code: string }).code = 'P2022';
    mockUpsert.mockRejectedValue(error);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboardingCompleted).toBe(false);
    expect(body.onboardingStep).toBe(0);
  });

  it('returns defaults on unexpected error (outer catch)', async () => {
    mockGetUser.mockRejectedValue(new Error('Unexpected failure'));

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboardingCompleted).toBe(false);
    expect(body.onboardingStep).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/onboarding
// ---------------------------------------------------------------------------

describe('PATCH /api/onboarding', () => {
  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/onboarding', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest({ onboardingCompleted: true });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 on invalid input (onboardingStep: -1)', async () => {
    const req = makeRequest({ onboardingStep: -1 });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 on invalid input (onboardingStep: 999)', async () => {
    const req = makeRequest({ onboardingStep: 999 });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 when body is empty object', async () => {
    const req = makeRequest({});
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No fields to update');
  });

  it('successfully updates onboardingCompleted', async () => {
    mockUpsert.mockResolvedValue({ onboardingCompleted: true, onboardingStep: 0 });

    const req = makeRequest({ onboardingCompleted: true });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboardingCompleted).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      create: { userId: 'user_123', onboardingCompleted: true },
      update: { onboardingCompleted: true },
      select: { onboardingCompleted: true, onboardingStep: true },
    });
  });

  it('successfully updates onboardingStep', async () => {
    mockUpsert.mockResolvedValue({ onboardingCompleted: false, onboardingStep: 5 });

    const req = makeRequest({ onboardingStep: 5 });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboardingStep).toBe(5);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      create: { userId: 'user_123', onboardingStep: 5 },
      update: { onboardingStep: 5 },
      select: { onboardingCompleted: true, onboardingStep: true },
    });
  });

  it('returns defaults on schema drift error P2021', async () => {
    const error = new Error('Table not found');
    (error as unknown as { code: string }).code = 'P2021';
    mockUpsert.mockRejectedValue(error);

    const req = makeRequest({ onboardingCompleted: true });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboardingCompleted).toBe(false);
    expect(body.onboardingStep).toBe(0);
  });

  it('returns 500 on unexpected error', async () => {
    mockUpsert.mockRejectedValue(new Error('DB connection lost'));

    const req = makeRequest({ onboardingCompleted: true });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });
});
