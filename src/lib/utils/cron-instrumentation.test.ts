import { describe, expect, it, vi, beforeEach } from 'vitest';
import { instrumentCronJob, truncateCronError } from './cron-instrumentation';
import type { CronJobResult } from './cron-instrumentation';

// Mock prisma — the wrapper's PERSISTENCE shouldn't be visible in unit
// tests; we verify the wrapper's BEHAVIOR (returns the result, fail-soft
// on persistence errors).
vi.mock('@/lib/prisma', () => ({
  prisma: {
    cronRun: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');

describe('instrumentCronJob', () => {
  beforeEach(() => {
    vi.mocked(prisma.cronRun.create).mockReset();
    vi.mocked(prisma.cronRun.update).mockReset();
    vi.mocked(prisma.cronRun.create).mockResolvedValue({ id: 'test-id' } as never);
    vi.mocked(prisma.cronRun.update).mockResolvedValue({} as never);
  });

  it('returns the runJob result unchanged on success', async () => {
    const expected: CronJobResult = {
      job: '/api/cron/test',
      status: 'ok',
      ms: 123,
      httpStatus: 200,
    };
    const result = await instrumentCronJob('/api/cron/test', async () => expected);
    expect(result).toEqual(expected);
  });

  it('returns the runJob result unchanged on error status', async () => {
    const expected: CronJobResult = {
      job: '/api/cron/test',
      status: 'error',
      ms: 45,
      error: 'HTTP 500: db down',
      httpStatus: 500,
    };
    const result = await instrumentCronJob('/api/cron/test', async () => expected);
    expect(result).toEqual(expected);
  });

  it('opens a CronRun row at start with status="running"', async () => {
    await instrumentCronJob('/api/cron/test', async () => ({ job: '/x', status: 'ok' }));
    expect(prisma.cronRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ route: '/api/cron/test', status: 'running' }),
      })
    );
  });

  it('closes the CronRun row with the result status + duration + error', async () => {
    await instrumentCronJob('/api/cron/test', async () => ({
      job: '/api/cron/test',
      status: 'error',
      ms: 99,
      error: 'boom',
      httpStatus: 503,
    }));
    expect(prisma.cronRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-id' },
        data: expect.objectContaining({
          status: 'error',
          durationMs: 99,
          error: 'boom',
          httpStatus: 503,
        }),
      })
    );
  });

  it('truncates long error messages to 500 chars before persisting', async () => {
    const longError = 'x'.repeat(2000);
    await instrumentCronJob('/api/cron/test', async () => ({
      job: '/api/cron/test',
      status: 'error',
      ms: 1,
      error: longError,
    }));
    const updateCall = vi.mocked(prisma.cronRun.update).mock.calls[0];
    const persistedError = (updateCall![0].data as { error: string }).error;
    expect(persistedError).toHaveLength(500);
    expect(persistedError).toBe('x'.repeat(500));
  });

  it('catches thrown errors and records them as status="error"', async () => {
    const result = await instrumentCronJob('/api/cron/test', async () => {
      throw new Error('uncaught failure');
    });
    expect(result.status).toBe('error');
    expect(result.error).toBe('uncaught failure');
    expect(result.job).toBe('/api/cron/test');
  });

  it('proceeds without persistence when CronRun.create fails (fail-soft start)', async () => {
    vi.mocked(prisma.cronRun.create).mockRejectedValueOnce(new Error('db unreachable') as never);
    const result = await instrumentCronJob('/api/cron/test', async () => ({
      job: '/api/cron/test',
      status: 'ok',
      ms: 50,
    }));
    expect(result.status).toBe('ok');
    // Update should NOT be called when create failed (no cronRunId).
    expect(prisma.cronRun.update).not.toHaveBeenCalled();
  });

  it('returns the result even when CronRun.update fails (fail-soft close)', async () => {
    vi.mocked(prisma.cronRun.update).mockRejectedValueOnce(new Error('write conflict') as never);
    const result = await instrumentCronJob('/api/cron/test', async () => ({
      job: '/api/cron/test',
      status: 'ok',
      ms: 50,
    }));
    expect(result.status).toBe('ok');
    expect(result.ms).toBe(50);
  });

  it('never breaks the cron itself when both create AND update fail', async () => {
    vi.mocked(prisma.cronRun.create).mockRejectedValueOnce(new Error('start fail') as never);
    vi.mocked(prisma.cronRun.update).mockRejectedValueOnce(new Error('end fail') as never);
    const result = await instrumentCronJob('/api/cron/test', async () => ({
      job: '/api/cron/test',
      status: 'ok',
      ms: 10,
    }));
    expect(result.status).toBe('ok');
  });
});

describe('truncateCronError', () => {
  it('returns short messages unchanged', () => {
    expect(truncateCronError('short')).toBe('short');
  });

  it('caps at 500 chars', () => {
    expect(truncateCronError('a'.repeat(1000))).toHaveLength(500);
  });

  it('handles exactly-500-char input', () => {
    const input = 'b'.repeat(500);
    expect(truncateCronError(input)).toBe(input);
  });
});
