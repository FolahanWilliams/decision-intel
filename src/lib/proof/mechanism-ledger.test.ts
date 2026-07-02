import { describe, it, expect } from 'vitest';
import {
  computeMechanismHitRate,
  formatHitRate,
  MECHANISM_LEDGER_MIN_N,
  MECHANISM_LEDGER_SEED,
  type MechanismLedgerEntry,
} from './mechanism-ledger';

function entry(
  id: string,
  verdict: MechanismLedgerEntry['verdict'],
  mode: MechanismLedgerEntry['mode'] = 'retro'
): MechanismLedgerEntry {
  return {
    id,
    company: id,
    sector: 's',
    decisionYear: 2020,
    mode,
    blindAudit: true,
    mechanismNamed: 'm',
    outcome: verdict === 'pending' ? null : { summary: 'o', materialisedOn: '2021' },
    verdict,
    verdictNote: 'n',
  };
}

describe('computeMechanismHitRate — honest by construction', () => {
  it('empty ledger yields NO fabricated rate (null, not 0/100) and fails the N-floor', () => {
    const m = computeMechanismHitRate([]);
    expect(m.settled).toBe(0);
    expect(m.strictHitRate).toBeNull();
    expect(m.weightedHitRate).toBeNull();
    expect(m.meetsNFloor).toBe(false);
  });

  it('pending cases NEVER count in the denominator', () => {
    const m = computeMechanismHitRate([
      entry('a', 'hit'),
      entry('b', 'pending', 'forward'),
      entry('c', 'pending', 'forward'),
    ]);
    expect(m.settled).toBe(1);
    expect(m.pending).toBe(2);
    expect(m.strictHitRate).toBe(1); // 1 hit / 1 settled — pending excluded
  });

  it('a MISS lowers the rate (the un-cherry-pickable property)', () => {
    const clean = computeMechanismHitRate([entry('a', 'hit'), entry('b', 'hit')]);
    const withMiss = computeMechanismHitRate([
      entry('a', 'hit'),
      entry('b', 'hit'),
      entry('c', 'miss'),
    ]);
    expect(clean.strictHitRate).toBe(1);
    expect(withMiss.strictHitRate).toBeCloseTo(2 / 3, 5);
    expect(withMiss.strictHitRate!).toBeLessThan(clean.strictHitRate!);
  });

  it('weighted rate counts a partial as 0.5', () => {
    const m = computeMechanismHitRate([entry('a', 'hit'), entry('b', 'partial')]);
    expect(m.strictHitRate).toBe(0.5); // 1 hit / 2 settled
    expect(m.weightedHitRate).toBe(0.75); // (1 + 0.5) / 2
  });

  it('the N-floor gates headlining at exactly MECHANISM_LEDGER_MIN_N settled', () => {
    const below = Array.from({ length: MECHANISM_LEDGER_MIN_N - 1 }, (_, i) =>
      entry(`x${i}`, 'hit')
    );
    const atFloor = Array.from({ length: MECHANISM_LEDGER_MIN_N }, (_, i) => entry(`y${i}`, 'hit'));
    expect(computeMechanismHitRate(below).meetsNFloor).toBe(false);
    expect(computeMechanismHitRate(atFloor).meetsNFloor).toBe(true);
  });

  it('counts each verdict class correctly', () => {
    const m = computeMechanismHitRate([
      entry('a', 'hit'),
      entry('b', 'hit'),
      entry('c', 'partial'),
      entry('d', 'miss'),
      entry('e', 'pending'),
    ]);
    expect(m).toMatchObject({ hits: 2, partials: 1, misses: 1, pending: 1, settled: 4 });
  });
});

describe('formatHitRate', () => {
  it('renders whole percents and an em-dash-free placeholder', () => {
    expect(formatHitRate(0.8)).toBe('80%');
    expect(formatHitRate(2 / 3)).toBe('67%');
    expect(formatHitRate(null)).toBe('not yet settled');
    expect(formatHitRate(null)).not.toContain('—');
  });
});

describe('MECHANISM_LEDGER_SEED — honest seed discipline', () => {
  it('seeds only defensible cases; every graded (non-pending) entry has an outcome', () => {
    for (const e of MECHANISM_LEDGER_SEED) {
      if (e.verdict !== 'pending') {
        expect(e.outcome).not.toBeNull();
        expect(e.outcome!.summary.length).toBeGreaterThan(20);
        expect(e.mechanismNamed.length).toBeGreaterThan(20);
      }
    }
  });

  it('stays honestly BELOW the N-floor at seed time (3 confirmed < 5)', () => {
    // The seed is deliberately thin + honest — the founder's grading run fills
    // it to the floor. If this flips true, someone padded the seed; verify the
    // added cases are real, defensible, blind-run hits before headlining a rate.
    const m = computeMechanismHitRate(MECHANISM_LEDGER_SEED);
    expect(m.meetsNFloor).toBe(false);
    expect(m.settled).toBeLessThan(MECHANISM_LEDGER_MIN_N);
  });

  it('all seeded cases are blind retro hits (the strongest evidence class)', () => {
    for (const e of MECHANISM_LEDGER_SEED) {
      expect(e.mode).toBe('retro');
      expect(e.blindAudit).toBe(true);
      expect(e.verdict).toBe('hit');
    }
  });
});
