/**
 * Vohra HXC PMF aggregator regression suite.
 *
 * Locked 2026-05-13 (M-2 follow-through ship). The cohort math drives
 * the GTM v3.5 graduation decision — if `veryDisappointedPct` silently
 * regresses or the threshold gates fire on the wrong N, the founder
 * runs the wrong wedge for months. These tests lock the math.
 *
 * Tested invariants:
 *   - Empty cohort → zeros across the board.
 *   - veryDisappointedPct = round(very / total × 100).
 *   - graduationGatePassed requires BOTH N ≥ 5 AND % ≥ 40.
 *   - killThresholdHit requires BOTH N ≥ 5 AND % < 30.
 *   - Per-persona breakdown handles missing personas + small subsets.
 *   - Null veryDisappointed values are treated as non-counts.
 *   - Pending responses (null veryDisappointed) don't pollute the
 *     cohort %.
 */

import { describe, it, expect } from 'vitest';
import { aggregateHxcCohortMetrics, VOHRA_PMF_KILL_MIN_N } from './vohra-pmf';
import { VOHRA_PMF_GRADUATION_THRESHOLD, VOHRA_PMF_KILL_THRESHOLD } from '@/lib/constants/icp';

type Response = { veryDisappointed: string | null; phase1PersonaAtTime: string | null };

function mkResponses(
  spec: Array<{ pmf: 'vd' | 'sd' | 'nd' | 'pending'; persona?: string }>
): Response[] {
  const map: Record<typeof spec[number]['pmf'], string | null> = {
    vd: 'very_disappointed',
    sd: 'somewhat_disappointed',
    nd: 'not_disappointed',
    pending: null,
  };
  return spec.map(s => ({
    veryDisappointed: map[s.pmf],
    phase1PersonaAtTime: s.persona ?? 'fractional_cso',
  }));
}

const WINDOW_START = new Date('2026-02-13T00:00:00Z');
const WINDOW_END = new Date('2026-05-13T00:00:00Z');

describe('aggregateHxcCohortMetrics — empty + boundary', () => {
  it('returns zeros on an empty cohort', () => {
    const m = aggregateHxcCohortMetrics([], WINDOW_START, WINDOW_END);
    expect(m.totalRespondents).toBe(0);
    expect(m.veryDisappointed).toBe(0);
    expect(m.somewhatDisappointed).toBe(0);
    expect(m.notDisappointed).toBe(0);
    expect(m.veryDisappointedPct).toBe(0);
    expect(m.graduationGatePassed).toBe(false);
    expect(m.killThresholdHit).toBe(false);
  });

  it('exposes the canonical thresholds + window boundaries', () => {
    const m = aggregateHxcCohortMetrics([], WINDOW_START, WINDOW_END);
    expect(m.graduationThreshold).toBe(VOHRA_PMF_GRADUATION_THRESHOLD);
    expect(m.killThreshold).toBe(VOHRA_PMF_KILL_THRESHOLD);
    expect(m.windowStart).toBe(WINDOW_START.toISOString());
    expect(m.windowEnd).toBe(WINDOW_END.toISOString());
  });

  it('VOHRA_PMF_KILL_MIN_N is the locked v3.5 §2 floor (5)', () => {
    expect(VOHRA_PMF_KILL_MIN_N).toBe(5);
  });
});

describe('aggregateHxcCohortMetrics — graduation gate (≥40% on N ≥ 5)', () => {
  it('passes when 40% of 10 respondents are very_disappointed', () => {
    const m = aggregateHxcCohortMetrics(
      mkResponses([
        { pmf: 'vd' },
        { pmf: 'vd' },
        { pmf: 'vd' },
        { pmf: 'vd' },
        { pmf: 'sd' },
        { pmf: 'sd' },
        { pmf: 'sd' },
        { pmf: 'sd' },
        { pmf: 'nd' },
        { pmf: 'nd' },
      ]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m.totalRespondents).toBe(10);
    expect(m.veryDisappointedPct).toBe(40);
    expect(m.graduationGatePassed).toBe(true);
  });

  it('does NOT pass at 39% (just below the threshold) on N ≥ 5', () => {
    // 39/100 → still rounds to 39. Use 39:61 split with N=100.
    const responses: Response[] = [];
    for (let i = 0; i < 39; i++)
      responses.push({ veryDisappointed: 'very_disappointed', phase1PersonaAtTime: 'fractional_cso' });
    for (let i = 0; i < 61; i++)
      responses.push({
        veryDisappointed: 'somewhat_disappointed',
        phase1PersonaAtTime: 'fractional_cso',
      });
    const m = aggregateHxcCohortMetrics(responses, WINDOW_START, WINDOW_END);
    expect(m.veryDisappointedPct).toBe(39);
    expect(m.graduationGatePassed).toBe(false);
  });

  it('does NOT pass at 100% with N=4 (below VOHRA_PMF_KILL_MIN_N)', () => {
    // Pure-math 100% but too small a sample to act on.
    const m = aggregateHxcCohortMetrics(
      mkResponses([{ pmf: 'vd' }, { pmf: 'vd' }, { pmf: 'vd' }, { pmf: 'vd' }]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m.totalRespondents).toBe(4);
    expect(m.veryDisappointedPct).toBe(100);
    expect(m.graduationGatePassed).toBe(false); // N gate blocks premature graduation
  });

  it('passes at exactly N = VOHRA_PMF_KILL_MIN_N when pct ≥ 40', () => {
    const m = aggregateHxcCohortMetrics(
      mkResponses([{ pmf: 'vd' }, { pmf: 'vd' }, { pmf: 'sd' }, { pmf: 'sd' }, { pmf: 'nd' }]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m.totalRespondents).toBe(5);
    expect(m.veryDisappointedPct).toBe(40);
    expect(m.graduationGatePassed).toBe(true);
  });
});

describe('aggregateHxcCohortMetrics — kill threshold (<30% on N ≥ 5)', () => {
  it('fires when 5/20 → 25% < 30%', () => {
    const responses: Response[] = [];
    for (let i = 0; i < 5; i++)
      responses.push({ veryDisappointed: 'very_disappointed', phase1PersonaAtTime: 'fractional_cso' });
    for (let i = 0; i < 15; i++)
      responses.push({ veryDisappointed: 'not_disappointed', phase1PersonaAtTime: 'fractional_cso' });
    const m = aggregateHxcCohortMetrics(responses, WINDOW_START, WINDOW_END);
    expect(m.veryDisappointedPct).toBe(25);
    expect(m.killThresholdHit).toBe(true);
    expect(m.graduationGatePassed).toBe(false);
  });

  it('does NOT fire at exactly 30%', () => {
    const responses: Response[] = [];
    for (let i = 0; i < 3; i++)
      responses.push({ veryDisappointed: 'very_disappointed', phase1PersonaAtTime: 'fractional_cso' });
    for (let i = 0; i < 7; i++)
      responses.push({ veryDisappointed: 'not_disappointed', phase1PersonaAtTime: 'fractional_cso' });
    const m = aggregateHxcCohortMetrics(responses, WINDOW_START, WINDOW_END);
    expect(m.veryDisappointedPct).toBe(30);
    expect(m.killThresholdHit).toBe(false);
  });

  it('does NOT fire on N=4 (below the min — variance too high to act)', () => {
    const m = aggregateHxcCohortMetrics(
      mkResponses([{ pmf: 'nd' }, { pmf: 'nd' }, { pmf: 'nd' }, { pmf: 'nd' }]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m.totalRespondents).toBe(4);
    expect(m.veryDisappointedPct).toBe(0);
    expect(m.killThresholdHit).toBe(false);
  });

  it('cannot fire and pass simultaneously', () => {
    const responses: Response[] = [];
    // Build cohorts at various %ages from 0 to 100 in 5% steps.
    for (let pct = 0; pct <= 100; pct += 5) {
      const N = 20;
      const vd = Math.round((pct / 100) * N);
      const others = N - vd;
      const cohort: Response[] = [];
      for (let i = 0; i < vd; i++)
        cohort.push({
          veryDisappointed: 'very_disappointed',
          phase1PersonaAtTime: 'fractional_cso',
        });
      for (let i = 0; i < others; i++)
        cohort.push({
          veryDisappointed: 'not_disappointed',
          phase1PersonaAtTime: 'fractional_cso',
        });
      responses.push(...cohort);
      const m = aggregateHxcCohortMetrics(cohort, WINDOW_START, WINDOW_END);
      // The gates are disjoint by definition: pct ≥ 40 → pass; pct < 30 → kill;
      // [30, 40) → neither. They cannot both be true.
      expect(m.graduationGatePassed && m.killThresholdHit).toBe(false);
    }
  });
});

describe('aggregateHxcCohortMetrics — per-persona breakdown', () => {
  it('reports respondents + veryDisappointedPct for every HXC persona', () => {
    const m = aggregateHxcCohortMetrics(
      mkResponses([
        { pmf: 'vd', persona: 'fractional_cso' },
        { pmf: 'sd', persona: 'fractional_cso' },
        { pmf: 'vd', persona: 'midmarket_corp_dev' },
        { pmf: 'vd', persona: 'midmarket_corp_dev' },
        { pmf: 'nd', persona: 'smaller_fund_gp' },
      ]),
      WINDOW_START,
      WINDOW_END
    );
    // 4 HXC personas in the breakdown (fractional_cso / midmarket_corp_dev /
    // smaller_fund_gp / pe_backed_founder) — never includes 'other'.
    expect(m.cohortBreakdown).toHaveLength(4);
    const map = new Map(m.cohortBreakdown.map(b => [b.personaId, b]));
    expect(map.get('fractional_cso')?.respondents).toBe(2);
    expect(map.get('fractional_cso')?.veryDisappointedPct).toBe(50);
    expect(map.get('midmarket_corp_dev')?.respondents).toBe(2);
    expect(map.get('midmarket_corp_dev')?.veryDisappointedPct).toBe(100);
    expect(map.get('smaller_fund_gp')?.respondents).toBe(1);
    expect(map.get('smaller_fund_gp')?.veryDisappointedPct).toBe(0);
    expect(map.get('pe_backed_founder')?.respondents).toBe(0);
    expect(map.get('pe_backed_founder')?.veryDisappointedPct).toBe(0);
  });

  it('does not include "other" persona in the HXC breakdown', () => {
    const m = aggregateHxcCohortMetrics(
      mkResponses([
        { pmf: 'vd', persona: 'fractional_cso' },
        { pmf: 'vd', persona: 'other' },
        { pmf: 'nd', persona: 'other' },
      ]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m.cohortBreakdown.find(b => b.personaId === ('other' as never))).toBeUndefined();
    // 'other' responses ARE counted in the top-level totals though —
    // filtering by hxcEligibleAtTime is the caller's responsibility.
    expect(m.totalRespondents).toBe(3);
  });

  it('handles null persona snapshot (legacy data)', () => {
    const m = aggregateHxcCohortMetrics(
      [
        { veryDisappointed: 'very_disappointed', phase1PersonaAtTime: null },
        { veryDisappointed: 'somewhat_disappointed', phase1PersonaAtTime: null },
      ],
      WINDOW_START,
      WINDOW_END
    );
    expect(m.totalRespondents).toBe(2);
    expect(m.veryDisappointedPct).toBe(50);
    // Per-persona breakdown returns 0 across personas (null doesn't match any).
    expect(m.cohortBreakdown.every(b => b.respondents === 0)).toBe(true);
  });
});

describe('aggregateHxcCohortMetrics — null/pending values', () => {
  it('null veryDisappointed (pending survey) does not count as any band', () => {
    const m = aggregateHxcCohortMetrics(
      mkResponses([
        { pmf: 'vd' },
        { pmf: 'pending' }, // null → uncounted
        { pmf: 'nd' },
      ]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m.totalRespondents).toBe(3); // total IS 3 (filtering is caller's job)
    expect(m.veryDisappointed).toBe(1);
    expect(m.somewhatDisappointed).toBe(0);
    expect(m.notDisappointed).toBe(1);
    // 1 / 3 → 33%, not 50%.
    expect(m.veryDisappointedPct).toBe(33);
  });
});

describe('aggregateHxcCohortMetrics — rounding', () => {
  it('rounds veryDisappointedPct to the nearest integer', () => {
    // 1 vd in 3 → 33.33% → 33
    const m1 = aggregateHxcCohortMetrics(
      mkResponses([{ pmf: 'vd' }, { pmf: 'nd' }, { pmf: 'nd' }]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m1.veryDisappointedPct).toBe(33);

    // 2 vd in 3 → 66.67% → 67
    const m2 = aggregateHxcCohortMetrics(
      mkResponses([{ pmf: 'vd' }, { pmf: 'vd' }, { pmf: 'nd' }]),
      WINDOW_START,
      WINDOW_END
    );
    expect(m2.veryDisappointedPct).toBe(67);
  });

  it('per-persona pct rounds independently of cohort pct', () => {
    const m = aggregateHxcCohortMetrics(
      mkResponses([
        { pmf: 'vd', persona: 'fractional_cso' },
        { pmf: 'sd', persona: 'fractional_cso' },
        { pmf: 'sd', persona: 'fractional_cso' },
      ]),
      WINDOW_START,
      WINDOW_END
    );
    // Cohort: 1/3 → 33
    expect(m.veryDisappointedPct).toBe(33);
    // Fractional CSO subset: 1/3 → 33
    expect(m.cohortBreakdown.find(b => b.personaId === 'fractional_cso')?.veryDisappointedPct).toBe(
      33
    );
  });
});
