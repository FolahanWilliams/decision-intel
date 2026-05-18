import { describe, it, expect } from 'vitest';
import {
  FUNNEL_STAGES,
  FUNNEL_STAGE_IDS,
  isFunnelStageId,
  isProspectSource,
  isValidStageTransition,
  stageTimestampField,
  computeFunnelMetrics,
  PHASE1_KILL_FLOOR,
  STALL_DAYS,
} from './conversion-ledger';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 4, 18, 12, 0, 0); // fixed for deterministic stall tests

describe('FUNNEL_STAGES SSOT', () => {
  it('has exactly the 6 GTM v3.5 motion stages, ordered', () => {
    expect(FUNNEL_STAGE_IDS).toEqual([
      'dm_sent',
      'replied',
      'audit_booked',
      'audit_completed',
      'converted',
      'lost',
    ]);
    expect(FUNNEL_STAGES.map(s => s.order)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('every stage maps to a distinct WedgeProspect timestamp column', () => {
    const fields = FUNNEL_STAGES.map(s => s.timestampField);
    expect(new Set(fields).size).toBe(fields.length);
    expect(stageTimestampField('converted')).toBe('convertedAt');
    expect(stageTimestampField('lost')).toBe('lostAt');
  });

  it('type guards reject unknown values', () => {
    expect(isFunnelStageId('dm_sent')).toBe(true);
    expect(isFunnelStageId('nope')).toBe(false);
    expect(isFunnelStageId(null)).toBe(false);
    expect(isProspectSource('linkedin_dm')).toBe(true);
    expect(isProspectSource('carrier_pigeon')).toBe(false);
  });
});

describe('isValidStageTransition', () => {
  it('allows strictly forward moves', () => {
    expect(isValidStageTransition('dm_sent', 'replied')).toBe(true);
    expect(isValidStageTransition('replied', 'audit_booked')).toBe(true);
    expect(isValidStageTransition('audit_completed', 'converted')).toBe(true);
  });

  it('allows forward JUMPS skipping intermediate stages (warm intro books an audit, no reply step)', () => {
    expect(isValidStageTransition('dm_sent', 'audit_booked')).toBe(true);
    expect(isValidStageTransition('dm_sent', 'converted')).toBe(true);
  });

  it('allows lost from any active stage', () => {
    expect(isValidStageTransition('dm_sent', 'lost')).toBe(true);
    expect(isValidStageTransition('replied', 'lost')).toBe(true);
    expect(isValidStageTransition('audit_completed', 'lost')).toBe(true);
  });

  it('blocks backward moves (you do not un-reply)', () => {
    expect(isValidStageTransition('replied', 'dm_sent')).toBe(false);
    expect(isValidStageTransition('audit_completed', 'replied')).toBe(false);
  });

  it('terminal stages are terminal — converted/lost never transition out', () => {
    expect(isValidStageTransition('converted', 'lost')).toBe(false);
    expect(isValidStageTransition('converted', 'audit_completed')).toBe(false);
    expect(isValidStageTransition('lost', 'dm_sent')).toBe(false);
    expect(isValidStageTransition('lost', 'converted')).toBe(false);
  });

  it('same stage is a no-op (allows notes-only edits)', () => {
    expect(isValidStageTransition('replied', 'replied')).toBe(true);
    expect(isValidStageTransition('converted', 'converted')).toBe(true);
  });

  it('rejects invalid stage ids on either side', () => {
    // @ts-expect-error — runtime guard must reject a bad `to` value
    expect(isValidStageTransition('dm_sent', 'bogus')).toBe(false);
    // @ts-expect-error — runtime guard must reject a bad `from` value
    expect(isValidStageTransition('bogus', 'replied')).toBe(false);
  });
});

describe('computeFunnelMetrics', () => {
  const p = (stage: string, daysAgo = 0) => ({
    stage,
    updatedAt: new Date(NOW - daysAgo * DAY),
  });

  it('counts every stage (all present, zeros where empty) + active/converted/lost', () => {
    const m = computeFunnelMetrics(
      [p('dm_sent'), p('dm_sent'), p('replied'), p('converted'), p('lost')],
      NOW
    );
    expect(m.total).toBe(5);
    expect(m.byStage.dm_sent).toBe(2);
    expect(m.byStage.replied).toBe(1);
    expect(m.byStage.audit_booked).toBe(0);
    expect(m.converted).toBe(1);
    expect(m.lost).toBe(1);
    expect(m.active).toBe(3);
  });

  it('conversionRatePct = converted / (converted + lost); 0 when nothing resolved', () => {
    expect(computeFunnelMetrics([p('dm_sent'), p('replied')], NOW).conversionRatePct).toBe(0);
    const m = computeFunnelMetrics(
      [p('converted'), p('converted'), p('converted'), p('lost')],
      NOW
    );
    expect(m.conversionRatePct).toBe(75); // 3 / (3+1)
  });

  it('killBand tracks converted vs the v3.5 month-4 floor', () => {
    expect(computeFunnelMetrics([], NOW).killBand).toBe('at_risk');
    expect(
      computeFunnelMetrics([p('converted'), p('converted')], NOW).killBand
    ).toBe('at_risk'); // 2 < ceil(5/2)=3
    expect(
      computeFunnelMetrics(
        [p('converted'), p('converted'), p('converted')],
        NOW
      ).killBand
    ).toBe('approaching'); // 3 ∈ [3,5)
    const five = Array.from({ length: 5 }, () => p('converted'));
    const m = computeFunnelMetrics(five, NOW);
    expect(m.killBand).toBe('on_track');
    expect(m.killFloor).toBe(PHASE1_KILL_FLOOR);
  });

  it('stalled = active prospects untouched for > STALL_DAYS (deterministic via now)', () => {
    const m = computeFunnelMetrics(
      [
        p('dm_sent', STALL_DAYS + 1), // stalled
        p('replied', STALL_DAYS + 10), // stalled
        p('audit_booked', 2), // fresh, not stalled
        p('converted', 999), // terminal — never "stalled" even if old
        p('lost', 999), // terminal — never "stalled"
      ],
      NOW
    );
    expect(m.stalled).toBe(2);
    expect(m.active).toBe(3);
  });

  it('ignores unknown stages defensively (never throws, never miscounts)', () => {
    const m = computeFunnelMetrics(
      [p('dm_sent'), { stage: 'garbage', updatedAt: new Date(NOW) }],
      NOW
    );
    expect(m.total).toBe(2); // total is the raw input length (honest)
    expect(m.byStage.dm_sent).toBe(1);
    expect(m.active).toBe(1); // the garbage row contributes to no stage bucket
  });
});
