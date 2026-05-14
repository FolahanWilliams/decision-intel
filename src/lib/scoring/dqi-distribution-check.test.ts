/**
 * Vitest invariants for the DQI distribution check (P4 ship 2026-05-11).
 *
 * Locks the procurement-grade regression guarantee: when a buyer asks
 * "how do I know your score is accurate?", the answer is documented +
 * the invariants below run on every CI pass. If any of these break, the
 * methodology 2.3.0 ship is NOT production-safe.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock dependencies that pull in heavy data (case-correlations, logger).
vi.mock('@/lib/data/case-correlations', () => ({
  computeCorrelationMultiplier: vi.fn().mockReturnValue({
    multiplier: 1.0,
    matchedPairs: [],
    matchedSuccessPatterns: [],
    beneficialDamping: 1.0,
  }),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import {
  runDistributionCheck,
  formatDistributionReportMarkdown,
  SAMPLE_MEMOS,
  WEIGHT_CONFIGS,
} from './dqi-distribution-check';

describe('runDistributionCheck — held-out regression infrastructure', () => {
  it('produces 1 cell per (memo × config) — 5 × 4 = 20 cells', () => {
    const report = runDistributionCheck();
    expect(report.cells).toHaveLength(SAMPLE_MEMOS.length * WEIGHT_CONFIGS.length);
    expect(report.summary.cellCount).toBe(20);
  });

  it('produces ZERO invariant violations under methodology 2.3.0', () => {
    const report = runDistributionCheck();
    if (report.summary.invariantViolations.length > 0) {
      console.error(
        'Invariant violations:\n' +
          report.summary.invariantViolations
            .map(v => `  - ${v.cell.memoId} / ${v.cell.configId}: ${v.rule}`)
            .join('\n')
      );
    }
    expect(report.summary.invariantViolations).toEqual([]);
  });

  it('every computed DQI is in [0, 100]', () => {
    const report = runDistributionCheck();
    for (const cell of report.cells) {
      expect(cell.score).toBeGreaterThanOrEqual(0);
      expect(cell.score).toBeLessThanOrEqual(100);
    }
  });

  it('user-adjustable configs stamp methodology 2.3.0', () => {
    const report = runDistributionCheck();
    const userAdjustable = report.cells.filter(c => c.configId !== 'canonical');
    expect(userAdjustable.length).toBeGreaterThan(0);
    for (const c of userAdjustable) {
      expect(c.methodologyVersion).toBe('2.3.0');
      expect(c.weightsSource).toBe('user_adjustable');
    }
  });

  it('canonical config stamps 2.4.0 when compoundPatterns supplied', () => {
    // Bumped from 2.2.0 to 2.4.0 on 2026-05-13 (M-1 ship — engine
    // epoch advanced when DI-B-021 + DI-B-022 gained matrix coverage).
    const report = runDistributionCheck();
    const canonical = report.cells.filter(c => c.configId === 'canonical');
    const withCompound = canonical.filter(c => {
      const memo = SAMPLE_MEMOS.find(m => m.id === c.memoId)!;
      return memo.input.compoundPatterns !== undefined;
    });
    expect(withCompound.length).toBeGreaterThan(0);
    for (const c of withCompound) {
      // compoundPatterns wins over validityClass for the methodology stamp
      expect(c.methodologyVersion).toBe('2.4.0');
      // weightsSource can be 'canonical' OR 'validity_shifted' depending on
      // whether the memo's validityClass produces a non-trivial weight shift
      expect(['canonical', 'validity_shifted']).toContain(c.weightsSource);
    }
  });

  it('every weightsHash is a stable 12-char hex', () => {
    const report = runDistributionCheck();
    for (const cell of report.cells) {
      expect(cell.weightsHash).toMatch(/^[a-f0-9]{12}$/);
    }
  });

  it('hash is stable across runs for the same (config × memo) cell', () => {
    const a = runDistributionCheck();
    const b = runDistributionCheck();
    for (let i = 0; i < a.cells.length; i++) {
      expect(a.cells[i].weightsHash).toBe(b.cells[i].weightsHash);
      expect(a.cells[i].score).toBe(b.cells[i].score);
    }
  });

  it('grade is monotonic with score (A > B > C > D > F by min threshold)', () => {
    const report = runDistributionCheck();
    const gradeOrder = { A: 5, B: 4, C: 3, D: 2, F: 1 };
    for (const cell of report.cells) {
      expect(gradeOrder[cell.grade as keyof typeof gradeOrder]).toBeGreaterThanOrEqual(1);
      // A = ≥85, B = ≥70, C = ≥55, D = ≥40, F = anything below
      if (cell.score >= 85) expect(cell.grade).toBe('A');
      else if (cell.score >= 70) expect(cell.grade).toBe('B');
      else if (cell.score >= 55) expect(cell.grade).toBe('C');
      else if (cell.score >= 40) expect(cell.grade).toBe('D');
      else expect(cell.grade).toBe('F');
    }
  });

  it('persona-tuned configs produce DIFFERENT scores from canonical (on at least 1 memo)', () => {
    const report = runDistributionCheck();
    // Group cells by memo
    const memoCells = new Map<string, typeof report.cells>();
    for (const c of report.cells) {
      if (!memoCells.has(c.memoId)) memoCells.set(c.memoId, []);
      memoCells.get(c.memoId)!.push(c);
    }
    let foundDivergence = false;
    for (const cells of memoCells.values()) {
      const canon = cells.find(c => c.configId === 'canonical');
      const others = cells.filter(c => c.configId !== 'canonical');
      for (const o of others) {
        if (canon && o.score !== canon.score) {
          foundDivergence = true;
          break;
        }
      }
      if (foundDivergence) break;
    }
    expect(foundDivergence).toBe(true);
  });
});

describe('formatDistributionReportMarkdown', () => {
  it('produces a non-empty Markdown string with headings + table', () => {
    const report = runDistributionCheck();
    const md = formatDistributionReportMarkdown(report);
    expect(md).toContain('# DQI Distribution Check');
    expect(md).toContain('| Memo | Config | Score | Grade | Methodology | Hash |');
    expect(md.length).toBeGreaterThan(500);
  });

  it('flags "NONE ✓" when all invariants pass', () => {
    const report = runDistributionCheck();
    if (report.summary.invariantViolations.length === 0) {
      const md = formatDistributionReportMarkdown(report);
      expect(md).toContain('NONE ✓');
    }
  });
});
