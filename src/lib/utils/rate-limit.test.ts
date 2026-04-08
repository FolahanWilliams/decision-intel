import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, getRateLimitStatus, _resetDenyCache } from './rate-limit';

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const mockQueryRaw = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    rateLimit: {
      deleteMany: (...args: unknown[]) => {
        mockDeleteMany(...args);
        return mockDeleteMany();
      },
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  _resetDenyCache();
});

// ---------------------------------------------------------------------------
// checkRateLimit
// ---------------------------------------------------------------------------

describe('checkRateLimit', () => {
  it('allows requests under the limit', async () => {
    const resetAt = new Date(Date.now() + 3600_000);
    mockQueryRaw.mockResolvedValue([{ count: 1, reset_at: resetAt }]);

    const result = await checkRateLimit('127.0.0.1', '/api/upload');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4); // 5 max - 1 used
    expect(result.limit).toBe(5);
  });

  it('blocks requests over the limit', async () => {
    const resetAt = new Date(Date.now() + 3600_000);
    mockQueryRaw.mockResolvedValue([{ count: 6, reset_at: resetAt }]);

    const result = await checkRateLimit('127.0.0.1', '/api/upload');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('respects custom config', async () => {
    const resetAt = new Date(Date.now() + 60_000);
    mockQueryRaw.mockResolvedValue([{ count: 3, reset_at: resetAt }]);

    const result = await checkRateLimit('127.0.0.1', '/api/upload', {
      windowMs: 60_000,
      maxRequests: 10,
    });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(7); // 10 - 3
    expect(result.limit).toBe(10);
  });

  it('fails closed by default when DB errors', async () => {
    mockQueryRaw.mockRejectedValue(new Error('DB connection lost'));

    const result = await checkRateLimit('127.0.0.1', '/api/upload');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('fails closed when configured', async () => {
    mockQueryRaw.mockRejectedValue(new Error('DB connection lost'));

    const result = await checkRateLimit('127.0.0.1', '/api/upload', {
      windowMs: 3600_000,
      maxRequests: 5,
      failMode: 'closed',
    });

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('handles empty query result gracefully', async () => {
    mockQueryRaw.mockResolvedValue([]);

    const result = await checkRateLimit('127.0.0.1', '/api/upload');

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getRateLimitStatus
// ---------------------------------------------------------------------------

describe('getRateLimitStatus', () => {
  it('returns full remaining when no record exists', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await getRateLimitStatus('127.0.0.1', '/api/upload');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it('returns full remaining when window has expired', async () => {
    mockFindUnique.mockResolvedValue({
      count: 5,
      resetAt: new Date(Date.now() - 1000), // expired
    });

    const result = await getRateLimitStatus('127.0.0.1', '/api/upload');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it('returns correct remaining for active window', async () => {
    mockFindUnique.mockResolvedValue({
      count: 3,
      resetAt: new Date(Date.now() + 3600_000),
    });

    const result = await getRateLimitStatus('127.0.0.1', '/api/upload');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2); // 5 - 3
  });

  it('reports not successful when limit reached', async () => {
    mockFindUnique.mockResolvedValue({
      count: 5,
      resetAt: new Date(Date.now() + 3600_000),
    });

    const result = await getRateLimitStatus('127.0.0.1', '/api/upload');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('fails closed on DB error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'));

    const result = await getRateLimitStatus('127.0.0.1', '/api/upload');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
