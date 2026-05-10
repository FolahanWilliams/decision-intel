import { describe, it, expect } from 'vitest';
import {
  inferOutcomeFromPmiSignals,
  pmiDirectionToAcquisitionVerdict,
  type PmiSignalsBlob,
} from './pmi-outcome-inference';

function buildBlob(
  signals: Array<
    Partial<PmiSignalsBlob['signals'][number]> & { key: PmiSignalsBlob['signals'][number]['key'] }
  >
): PmiSignalsBlob {
  return {
    capturedAt: '2026-05-10T00:00:00Z',
    capturedByUserId: 'u1',
    signals: signals.map(s => ({
      key: s.key,
      proxy: s.proxy ?? 'test proxy',
      horizonDays: s.horizonDays ?? 180,
      predictedConfidence: s.predictedConfidence ?? 0.7,
      observedValue: s.observedValue,
      observedAt: s.observedAt,
      brierScore: s.brierScore,
      resolution: s.resolution ?? 'unmeasured',
    })),
  };
}

describe('inferOutcomeFromPmiSignals', () => {
  it('returns too_early when blob is null', () => {
    const r = inferOutcomeFromPmiSignals(null);
    expect(r.direction).toBe('too_early');
    expect(r.confidence).toBe(0);
  });

  it('returns too_early when no signals tracked', () => {
    const r = inferOutcomeFromPmiSignals(buildBlob([]));
    expect(r.direction).toBe('too_early');
    expect(r.summary).toMatch(/No PMI signals/);
  });

  it('returns too_early when coverage < 40%', () => {
    const r = inferOutcomeFromPmiSignals(
      buildBlob([
        { key: 'synergy_realisation_pct', observedValue: 0.9, brierScore: 0.04, resolution: 'hit' },
        { key: 'talent_retention_pct' },
        { key: 'integration_cost_vs_forecast' },
      ])
    );
    expect(r.direction).toBe('too_early');
    expect(r.summary).toMatch(/Too early/);
  });

  it('returns positive when ≥60% of observed signals hit', () => {
    const r = inferOutcomeFromPmiSignals(
      buildBlob([
        { key: 'synergy_realisation_pct', observedValue: 0.9, brierScore: 0.04, resolution: 'hit' },
        { key: 'talent_retention_pct', observedValue: 0.95, brierScore: 0.0625, resolution: 'hit' },
        {
          key: 'integration_cost_vs_forecast',
          observedValue: 0.7,
          brierScore: 0.0,
          resolution: 'partial',
        },
      ])
    );
    expect(r.direction).toBe('positive');
    expect(r.observed.hits).toBe(2);
    expect(r.summary).toMatch(/Delivering as promised/);
  });

  it('returns negative when ≥40% of observed signals miss', () => {
    const r = inferOutcomeFromPmiSignals(
      buildBlob([
        {
          key: 'synergy_realisation_pct',
          observedValue: 0.3,
          brierScore: 0.16,
          resolution: 'miss',
        },
        { key: 'talent_retention_pct', observedValue: 0.4, brierScore: 0.09, resolution: 'miss' },
        {
          key: 'integration_cost_vs_forecast',
          observedValue: 0.95,
          brierScore: 0.0625,
          resolution: 'hit',
        },
      ])
    );
    expect(r.direction).toBe('negative');
    expect(r.observed.misses).toBe(2);
    expect(r.summary).toMatch(/Missing forecast/);
  });

  it('returns mixed when neither threshold is hit', () => {
    const r = inferOutcomeFromPmiSignals(
      buildBlob([
        {
          key: 'synergy_realisation_pct',
          observedValue: 0.7,
          brierScore: 0.0,
          resolution: 'partial',
        },
        { key: 'talent_retention_pct', observedValue: 0.7, brierScore: 0.0, resolution: 'partial' },
        {
          key: 'integration_cost_vs_forecast',
          observedValue: 0.7,
          brierScore: 0.0,
          resolution: 'partial',
        },
      ])
    );
    expect(r.direction).toBe('mixed');
    expect(r.observed.partials).toBe(3);
  });

  it('confidence is high when coverage AND consistency are both high', () => {
    const r = inferOutcomeFromPmiSignals(
      buildBlob([
        { key: 'synergy_realisation_pct', observedValue: 0.9, brierScore: 0.04, resolution: 'hit' },
        { key: 'talent_retention_pct', observedValue: 0.9, brierScore: 0.04, resolution: 'hit' },
        {
          key: 'integration_cost_vs_forecast',
          observedValue: 0.9,
          brierScore: 0.04,
          resolution: 'hit',
        },
      ])
    );
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('confidence is low when signals oscillate', () => {
    const r = inferOutcomeFromPmiSignals(
      buildBlob([
        {
          key: 'synergy_realisation_pct',
          observedValue: 0.95,
          brierScore: 0.0625,
          resolution: 'hit',
        },
        { key: 'talent_retention_pct', observedValue: 0.3, brierScore: 0.16, resolution: 'miss' },
        {
          key: 'integration_cost_vs_forecast',
          observedValue: 0.7,
          brierScore: 0.0,
          resolution: 'partial',
        },
        {
          key: 'day_one_milestone_hit_rate',
          observedValue: 0.4,
          brierScore: 0.09,
          resolution: 'miss',
        },
        {
          key: 'customer_retention_pct',
          observedValue: 0.95,
          brierScore: 0.0625,
          resolution: 'hit',
        },
      ])
    );
    // 5/5 observed (full coverage) but resolutions split across bands.
    expect(r.confidence).toBeLessThan(0.5);
  });

  it('meanBrier averages observed signals only', () => {
    const r = inferOutcomeFromPmiSignals(
      buildBlob([
        { key: 'synergy_realisation_pct', observedValue: 0.9, brierScore: 0.04, resolution: 'hit' },
        { key: 'talent_retention_pct', observedValue: 0.9, brierScore: 0.04, resolution: 'hit' },
        { key: 'integration_cost_vs_forecast' }, // unobserved
      ])
    );
    expect(r.meanBrier).toBeCloseTo(0.04);
  });
});

describe('pmiDirectionToAcquisitionVerdict', () => {
  it('maps positive → value_created', () => {
    expect(pmiDirectionToAcquisitionVerdict('positive')).toBe('value_created');
  });
  it('maps negative → value_destroyed', () => {
    expect(pmiDirectionToAcquisitionVerdict('negative')).toBe('value_destroyed');
  });
  it('maps mixed → value_neutral', () => {
    expect(pmiDirectionToAcquisitionVerdict('mixed')).toBe('value_neutral');
  });
  it('maps too_early → too_early_to_tell', () => {
    expect(pmiDirectionToAcquisitionVerdict('too_early')).toBe('too_early_to_tell');
  });
});
