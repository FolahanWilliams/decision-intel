/**
 * Outcome-driven DQI recalibration regression suite.
 *
 * recalibration.ts is the shared engine behind BOTH outcome POST routes —
 * the "compounds quarter over quarter" data-moat math. CLAUDE.md
 * consolidated it here precisely so the scoring rule "can't drift between
 * entry points"; until now nothing locked the formula. These tests pin
 * the recalibration arithmetic, the recalibratedDqi write shape, the
 * optional Brier stamping, and the skipped/failed states.
 *
 * `prisma` is injected as a parameter (not imported) so a plain fake is
 * sufficient — no module mock needed beyond the logger.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { recalibrateFromOutcome } from './recalibration';

function fakePrisma(opts: {
  analysis?: { overallScore: number; biases: { id: string }[] } | null;
  findThrows?: boolean;
}) {
  const analysisUpdate = vi.fn().mockResolvedValue({});
  const outcomeUpdate = vi.fn().mockResolvedValue({});
  return {
    prisma: {
      analysis: {
        findUnique: opts.findThrows
          ? vi.fn().mockRejectedValue(new Error('db down'))
          : vi.fn().mockResolvedValue(opts.analysis ?? null),
        update: analysisUpdate,
      },
      decisionOutcome: { update: outcomeUpdate },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    analysisUpdate,
    outcomeUpdate,
  };
}

describe('recalibrateFromOutcome — guard states', () => {
  it('returns skipped when the analysis does not exist', async () => {
    const { prisma } = fakePrisma({ analysis: null });
    const r = await recalibrateFromOutcome({
      prisma,
      analysisId: 'missing',
      outcome: 'success',
      confirmedBiases: [],
      falsePositiveBiases: [],
    });
    expect(r.status).toBe('skipped');
    expect(r.payload).toBeNull();
    expect(r.brier).toBeNull();
  });

  it('returns failed (not throwing) when the DB read errors', async () => {
    const { prisma } = fakePrisma({ findThrows: true });
    const r = await recalibrateFromOutcome({
      prisma,
      analysisId: 'a1',
      outcome: 'failure',
      confirmedBiases: [],
      falsePositiveBiases: [],
    });
    expect(r.status).toBe('failed');
    expect(r.payload).toBeNull();
  });
});

describe('recalibrateFromOutcome — scoring arithmetic', () => {
  it('applies the documented recalibration formula and clamps/rounds', async () => {
    // original score 70 · totalBiases=4 · 1 confirmed · 2 false-positive · success.
    //   70 + (2/4)*12 = 76 ; -1*1.5 = 74.5 ; +3 = 77.5 ; +4 (success) = 81.5
    //   → round → 82 ; delta = 82 - 70 = 12
    const { prisma, analysisUpdate } = fakePrisma({
      analysis: { overallScore: 70, biases: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }] },
    });
    const r = await recalibrateFromOutcome({
      prisma,
      analysisId: 'a1',
      outcome: 'success',
      confirmedBiases: ['confirmation_bias'],
      falsePositiveBiases: ['anchoring_bias', 'halo_effect'],
    });
    expect(r.status).toBe('ok');
    expect(r.payload).toEqual({
      originalScore: 70,
      recalibratedScore: 82,
      delta: 12,
      grade: expect.any(String),
    });
    expect(r.brier).not.toBeNull();
    const writeArg = analysisUpdate.mock.calls[0][0];
    expect(writeArg.where).toEqual({ id: 'a1' });
    expect(writeArg.data.recalibratedDqi.recalibratedScore).toBe(82);
    expect(writeArg.data.recalibratedDqi.originalScore).toBe(70);
    expect(writeArg.data.recalibratedDqi.delta).toBe(12);
    expect(typeof writeArg.data.recalibratedDqi.brierScore).toBe('number');
  });

  it('penalises a failure outcome relative to a success outcome on the same memo', async () => {
    const mk = () =>
      fakePrisma({ analysis: { overallScore: 60, biases: [{ id: '1' }, { id: '2' }] } }).prisma;
    const success = await recalibrateFromOutcome({
      prisma: mk(),
      analysisId: 'a1',
      outcome: 'success',
      confirmedBiases: [],
      falsePositiveBiases: [],
    });
    const failure = await recalibrateFromOutcome({
      prisma: mk(),
      analysisId: 'a1',
      outcome: 'failure',
      confirmedBiases: [],
      falsePositiveBiases: [],
    });
    expect(failure.payload!.recalibratedScore).toBeLessThan(success.payload!.recalibratedScore);
  });

  it('clamps the recalibrated score into [0, 100]', async () => {
    const { prisma } = fakePrisma({
      analysis: { overallScore: 99, biases: [{ id: '1' }] },
    });
    const r = await recalibrateFromOutcome({
      prisma,
      analysisId: 'a1',
      outcome: 'success', // pushes well over 100 before clamp
      confirmedBiases: [],
      falsePositiveBiases: [],
    });
    expect(r.payload!.recalibratedScore).toBeLessThanOrEqual(100);
    expect(r.payload!.recalibratedScore).toBeGreaterThanOrEqual(0);
  });
});

describe('recalibrateFromOutcome — optional Brier stamping', () => {
  it('stamps Brier onto the DecisionOutcome row only when decisionOutcomeId is supplied', async () => {
    const withId = fakePrisma({
      analysis: { overallScore: 70, biases: [{ id: '1' }] },
    });
    await recalibrateFromOutcome({
      prisma: withId.prisma,
      analysisId: 'a1',
      outcome: 'success',
      confirmedBiases: [],
      falsePositiveBiases: [],
      decisionOutcomeId: 'do1',
    });
    expect(withId.outcomeUpdate).toHaveBeenCalledTimes(1);
    expect(withId.outcomeUpdate.mock.calls[0][0].where).toEqual({ id: 'do1' });

    const withoutId = fakePrisma({
      analysis: { overallScore: 70, biases: [{ id: '1' }] },
    });
    await recalibrateFromOutcome({
      prisma: withoutId.prisma,
      analysisId: 'a1',
      outcome: 'success',
      confirmedBiases: [],
      falsePositiveBiases: [],
    });
    expect(withoutId.outcomeUpdate).not.toHaveBeenCalled();
  });
});
