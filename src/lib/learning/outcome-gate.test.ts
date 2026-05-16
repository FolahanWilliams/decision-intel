/**
 * Outcome Gate regression suite.
 *
 * outcome-gate.ts is the 409 enforcement gate that turns the data
 * flywheel from aspirational to contractual (the Cloverpop-defense moat
 * per CLAUDE.md External Attack Vectors). The blocking semantics are
 * revenue + flywheel critical and the failure mode must be permissive
 * (never lock a user out on a DB error). Until now nothing locked the
 * threshold ladder or the enforce-vs-soft distinction.
 *
 * Locks: SOFT/HARD thresholds, enforce-only blocking, permissive
 * error/schema-drift fallback, pendingAnalyses ISO mapping,
 * formatOutcomeReminder shaping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: vi.fn() },
}));
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { prisma } from '@/lib/prisma';
import { checkOutcomeGate, formatOutcomeReminder, OUTCOME_GATE } from './outcome-gate';

const queryRaw = prisma.$queryRaw as unknown as ReturnType<typeof vi.fn>;

function pendingRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `a${i}`,
    documentId: `d${i}`,
    filename: `Memo ${i}.pdf`,
    decisionStatement: i % 2 === 0 ? `Call ${i}` : null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }));
}

beforeEach(() => queryRaw.mockReset());

describe('checkOutcomeGate — threshold ladder', () => {
  it('is none/allowed below the soft threshold', async () => {
    queryRaw.mockResolvedValue(pendingRows(OUTCOME_GATE.SOFT_THRESHOLD - 1));
    const g = await checkOutcomeGate('u1');
    expect(g.level).toBe('none');
    expect(g.allowed).toBe(true);
  });

  it('is soft (but still allowed) at the soft threshold', async () => {
    queryRaw.mockResolvedValue(pendingRows(OUTCOME_GATE.SOFT_THRESHOLD));
    const g = await checkOutcomeGate('u1', true /* enforce */);
    expect(g.level).toBe('soft');
    expect(g.allowed).toBe(true); // soft never blocks, even when enforced
  });

  it('maps pending rows to ISO-stamped pendingAnalyses metadata', async () => {
    queryRaw.mockResolvedValue(pendingRows(OUTCOME_GATE.SOFT_THRESHOLD));
    const g = await checkOutcomeGate('u1');
    expect(g.pendingAnalyses).toHaveLength(OUTCOME_GATE.SOFT_THRESHOLD);
    expect(g.pendingAnalyses[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(g.pendingAnalysisIds).toContain('a0');
  });
});

describe('checkOutcomeGate — HARD threshold enforce semantics', () => {
  it('HARD + not enforced: still allowed, with reminder copy', async () => {
    queryRaw.mockResolvedValue(pendingRows(OUTCOME_GATE.HARD_THRESHOLD));
    const g = await checkOutcomeGate('u1', false);
    expect(g.level).toBe('hard');
    expect(g.allowed).toBe(true);
    expect(g.message).not.toContain('blocked');
  });

  it('HARD + enforced: blocks the new audit', async () => {
    queryRaw.mockResolvedValue(pendingRows(OUTCOME_GATE.HARD_THRESHOLD + 2));
    const g = await checkOutcomeGate('u1', true);
    expect(g.level).toBe('hard');
    expect(g.allowed).toBe(false);
    expect(g.message).toContain('blocked');
  });
});

describe('checkOutcomeGate — permissive failure mode', () => {
  // The load-bearing contract: a DB-layer failure must NEVER lock a user
  // out of running an audit (allowed stays true, level 'none'). We drive
  // the catch via an unusable resolved shape so the throw originates in
  // checkOutcomeGate's own code rather than the mock — exercising the
  // exact same catch → permissive path the route depends on, without
  // Vitest v4's mock-error tracking flagging a caught mock throw.
  it('returns a permissive result (never locks the user out) when the pending query yields an unusable shape', async () => {
    queryRaw.mockResolvedValue(null as unknown as unknown[]);
    const g = await checkOutcomeGate('u1', true /* enforce */);
    expect(g.allowed).toBe(true);
    expect(g.level).toBe('none');
    expect(g.pendingCount).toBe(0);
    expect(g.pendingAnalyses).toEqual([]);
  });

  it('still resolves permissively even with enforcement on (the gate fails open, not closed)', async () => {
    queryRaw.mockResolvedValue(undefined as unknown as unknown[]);
    const g = await checkOutcomeGate('u1', true);
    expect(g.allowed).toBe(true);
    expect(g.level).toBe('none');
  });
});

describe('formatOutcomeReminder', () => {
  it('returns null when the gate level is none', async () => {
    queryRaw.mockResolvedValue(pendingRows(0));
    const g = await checkOutcomeGate('u1');
    expect(formatOutcomeReminder(g)).toBeNull();
  });

  it('returns a compact reminder capped at 5 analysis ids for soft/hard', async () => {
    queryRaw.mockResolvedValue(pendingRows(8));
    const g = await checkOutcomeGate('u1', false);
    const reminder = formatOutcomeReminder(g);
    expect(reminder).not.toBeNull();
    expect(reminder!.type).toBe('outcome_reminder');
    expect(reminder!.analysisIds.length).toBeLessThanOrEqual(5);
  });
});
