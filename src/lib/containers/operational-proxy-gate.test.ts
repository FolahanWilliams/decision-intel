import { describe, it, expect } from 'vitest';
import {
  parsePriorsForProxies,
  isFalsifiable90DayProxy,
  hasFalsifiable90DayProxy,
  requiresOperationalProxyGate,
  checkOperationalProxyGate,
  proxyDueAtMs,
  isProxyDue,
  dueUnresolvedProxies,
  observedValue,
  computeProxyBrier,
  scoreResolvedProxies,
  applyProxyResolution,
  MIN_PROXY_PREDICTION_CHARS,
  type OperationalProxy,
} from './operational-proxy-gate';

const CAPTURED = '2026-05-01T00:00:00.000Z';
const CAPTURED_MS = Date.parse(CAPTURED);
const DAY = 86_400_000;

function proxy(over: Partial<OperationalProxy> = {}): OperationalProxy {
  return {
    prediction: 'CTO is retained through day 90 post-close',
    horizonDays: 90,
    confidence: 0.7,
    ...over,
  };
}

function priors(microPredictions: OperationalProxy[], capturedAt: string | null = CAPTURED) {
  return { microPredictions, capturedAt, convictionLevel: 'high', killCriteria: [] };
}

describe('parsePriorsForProxies', () => {
  it('parses a well-formed blob', () => {
    const p = parsePriorsForProxies(priors([proxy()]));
    expect(p?.microPredictions).toHaveLength(1);
    expect(p?.capturedAt).toBe(CAPTURED);
  });
  it('returns null on malformed input', () => {
    expect(parsePriorsForProxies(null)).toBeNull();
    expect(parsePriorsForProxies({})).toBeNull();
    expect(parsePriorsForProxies({ microPredictions: 'nope' })).toBeNull();
  });
  it('drops malformed entries but keeps valid ones', () => {
    const p = parsePriorsForProxies(
      priors([proxy(), { prediction: 'x' } as unknown as OperationalProxy])
    );
    expect(p?.microPredictions).toHaveLength(1);
  });
  it('preserves resolution + brierScore when present', () => {
    const p = parsePriorsForProxies(
      priors([proxy({ resolvedAt: CAPTURED, resolution: 'true', brierScore: 0.09 })])
    );
    expect(p?.microPredictions[0].resolution).toBe('true');
    expect(p?.microPredictions[0].brierScore).toBe(0.09);
  });
});

describe('isFalsifiable90DayProxy', () => {
  it('accepts a substantive ≤90-day proxy', () => {
    expect(isFalsifiable90DayProxy(proxy())).toBe(true);
  });
  it('rejects a stub prediction', () => {
    expect(isFalsifiable90DayProxy(proxy({ prediction: 'ok' }))).toBe(false);
    expect(MIN_PROXY_PREDICTION_CHARS).toBeGreaterThan(2);
  });
  it('rejects a horizon beyond 90 days (not a 90-day commitment)', () => {
    expect(isFalsifiable90DayProxy(proxy({ horizonDays: 180 }))).toBe(false);
  });
  it('rejects out-of-range confidence', () => {
    expect(isFalsifiable90DayProxy(proxy({ confidence: 1.4 }))).toBe(false);
  });
});

describe('requiresOperationalProxyGate / checkOperationalProxyGate', () => {
  it('does not fire on an empty container (no analyzed docs)', () => {
    expect(requiresOperationalProxyGate({ analyzedDocCount: 0 })).toBe(false);
    expect(checkOperationalProxyGate({ analyzedDocCount: 0, priors: null }).allowed).toBe(true);
  });
  it('fires for ALL kinds once a decision exists, and blocks with no proxy', () => {
    const v = checkOperationalProxyGate({ analyzedDocCount: 2, priors: null });
    expect(v.allowed).toBe(false);
    expect(v.code).toBe('OPERATIONAL_PROXY_REQUIRED');
    expect(v.reason).toContain('falsifiable 90-day operational proxy');
  });
  it('passes once a falsifiable ≤90-day proxy is on record', () => {
    expect(
      checkOperationalProxyGate({ analyzedDocCount: 2, priors: priors([proxy()]) }).allowed
    ).toBe(true);
  });
  it('still blocks when the only proxy is a >90-day stub', () => {
    expect(
      checkOperationalProxyGate({
        analyzedDocCount: 1,
        priors: priors([proxy({ horizonDays: 365, prediction: 'IRR hits 3x by 2031' })]),
      }).allowed
    ).toBe(false);
  });
  it('hasFalsifiable90DayProxy is false on a corrupt blob', () => {
    expect(hasFalsifiable90DayProxy({ microPredictions: null })).toBe(false);
  });
});

describe('day-90 due detection', () => {
  it('proxyDueAtMs = capturedAt + horizon', () => {
    expect(proxyDueAtMs(proxy({ horizonDays: 90 }), CAPTURED)).toBe(CAPTURED_MS + 90 * DAY);
  });
  it('proxyDueAtMs is null when capturedAt is unusable', () => {
    expect(proxyDueAtMs(proxy(), null)).toBeNull();
    expect(proxyDueAtMs(proxy(), 'not-a-date')).toBeNull();
  });
  it('isProxyDue true only after horizon AND unresolved', () => {
    const p = proxy({ horizonDays: 90 });
    expect(isProxyDue(p, CAPTURED, CAPTURED_MS + 89 * DAY)).toBe(false);
    expect(isProxyDue(p, CAPTURED, CAPTURED_MS + 91 * DAY)).toBe(true);
    expect(isProxyDue({ ...p, resolvedAt: CAPTURED }, CAPTURED, CAPTURED_MS + 91 * DAY)).toBe(
      false
    );
  });
  it('dueUnresolvedProxies filters to only the elapsed-unresolved set', () => {
    const parsed = {
      capturedAt: CAPTURED,
      microPredictions: [
        proxy({ horizonDays: 30 }),
        proxy({ horizonDays: 180 }),
        proxy({ horizonDays: 30, resolvedAt: CAPTURED }),
      ],
    };
    const due = dueUnresolvedProxies(parsed, CAPTURED_MS + 60 * DAY);
    expect(due).toHaveLength(1);
    expect(due[0].horizonDays).toBe(30);
  });
});

describe('Brier scoring (mirrors PMI per-signal shape)', () => {
  it('observedValue maps the 3 resolutions', () => {
    expect(observedValue('true')).toBe(1);
    expect(observedValue('false')).toBe(0);
    expect(observedValue('partial')).toBe(0.5);
  });
  it('computeProxyBrier = (confidence − observed)² clamped', () => {
    expect(computeProxyBrier(0.7, 'true')).toBeCloseTo(0.09, 6);
    expect(computeProxyBrier(0.7, 'false')).toBeCloseTo(0.49, 6);
    expect(computeProxyBrier(0.5, 'partial')).toBe(0);
  });
  it('scoreResolvedProxies backfills only resolved-unscored entries idempotently', () => {
    const parsed = {
      capturedAt: CAPTURED,
      microPredictions: [
        proxy({ resolution: 'true' }),
        proxy({ resolution: 'false', brierScore: 0.49 }),
        proxy(),
      ],
    };
    const out = scoreResolvedProxies(parsed);
    expect(out.changed).toBe(true);
    expect(out.microPredictions[0].brierScore).toBeCloseTo(0.09, 6);
    expect(out.microPredictions[1].brierScore).toBe(0.49); // untouched
    expect(out.microPredictions[2].brierScore).toBeUndefined(); // unresolved
    // idempotent: second pass changes nothing
    expect(
      scoreResolvedProxies({ capturedAt: CAPTURED, microPredictions: out.microPredictions }).changed
    ).toBe(false);
  });
});

describe('applyProxyResolution', () => {
  it('stamps resolvedAt + resolution + brierScore', () => {
    const parsed = { capturedAt: CAPTURED, microPredictions: [proxy({ confidence: 0.8 })] };
    const next = applyProxyResolution(parsed, 0, 'true', CAPTURED_MS + 91 * DAY);
    expect(next).not.toBeNull();
    expect(next![0].resolution).toBe('true');
    expect(next![0].resolvedAt).toBe(new Date(CAPTURED_MS + 91 * DAY).toISOString());
    expect(next![0].brierScore).toBeCloseTo(0.04, 6);
  });
  it('returns null on out-of-range index', () => {
    expect(
      applyProxyResolution({ capturedAt: CAPTURED, microPredictions: [proxy()] }, 5, 'true', 0)
    ).toBeNull();
  });
  it('returns null when already resolved (no double-resolve)', () => {
    const parsed = { capturedAt: CAPTURED, microPredictions: [proxy({ resolvedAt: CAPTURED })] };
    expect(applyProxyResolution(parsed, 0, 'false', 0)).toBeNull();
  });
  it('does not mutate the input array', () => {
    const arr = [proxy()];
    applyProxyResolution({ capturedAt: CAPTURED, microPredictions: arr }, 0, 'true', 0);
    expect(arr[0].resolvedAt).toBeUndefined();
  });
});
