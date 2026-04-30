'use client';

/**
 * DealCalibrationChip — calibration evidence below the composite Deal
 * DQI on /dashboard/deals/[id]. Locked 2026-04-30 (B5 lock; Margaret +
 * James persona ask, External Attack Vector #1 Cloverpop defense).
 *
 * Cloverpop's #1 procurement-stage attack vector (CLAUDE.md External
 * Attack Vectors) is "we have years of historical decision data." The
 * deal-page composite DQI is the most procurement-visible M&A surface
 * but until 2026-04-30 it carried zero calibration evidence — meaning
 * a CSO comparing DI against Cloverpop saw a number with no trust
 * anchor. The chip surfaces (a) the org's per-deal-aggregate Brier when
 * the org has logged outcomes, OR (b) the platform seed baseline as the
 * honest fallback, with a delta-vs-seed when both exist.
 *
 * Does not block the hero render: the chip lazy-fetches via SWR; if the
 * org has no outcomes the chip shows the seed baseline; if the fetch
 * fails (e.g. transient DB), the chip silently hides rather than
 * surfacing a broken state.
 *
 * Sparkline (6-month per-org Brier trend) is intentionally deferred —
 * the persona ask was the NUMBER first; sparkline is a Tier 2 follow-up
 * and can mount inside this component without API changes.
 */

import useSWR from 'swr';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface OrgCalibration {
  source: 'org' | 'platform_seed';
  decisionsTracked: number;
  outcomesClosed: number;
  meanBrierScore: number | null;
  brierCategory: string | null;
  platformSeed?: {
    n: number;
    meanBrier: number;
    classificationAccuracy: number;
    methodologyVersion: string;
    brierCi95?: { lower: number; upper: number; halfWidth: number };
  };
  calibrationNote: string;
}

interface CalibrationResponse {
  calibration: OrgCalibration | undefined;
  deltaFromSeed: number | null;
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch calibration');
    return r.json() as Promise<CalibrationResponse>;
  });

export function DealCalibrationChip() {
  const { data, error } = useSWR<CalibrationResponse>(
    '/api/intelligence/org-calibration',
    fetcher,
    { revalidateOnFocus: false }
  );

  // Silent failure — never break the hero. The deal page is the
  // procurement-grade surface; a transient calibration miss should not
  // surface a broken-state UI to the buyer in the room.
  if (error || !data?.calibration) return null;

  const cal = data.calibration;
  const isOrg = cal.source === 'org';
  const seed = cal.platformSeed;

  // Org branch — render per-org Brier + delta-vs-seed.
  if (isOrg && cal.meanBrierScore !== null) {
    const trending = (data.deltaFromSeed ?? 0) > 0;
    const delta = data.deltaFromSeed;
    return (
      <div
        title={cal.calibrationNote}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 999,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <Activity size={11} style={{ color: 'var(--accent-primary)' }} />
        <span>
          {cal.outcomesClosed} outcome{cal.outcomesClosed !== 1 ? 's' : ''} logged · Brier{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {cal.meanBrierScore.toFixed(3)}
          </strong>{' '}
          ({cal.brierCategory ?? 'unscored'})
        </span>
        {delta !== null && Math.abs(delta) >= 0.001 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: trending ? 'var(--success)' : 'var(--warning)',
              fontWeight: 600,
            }}
          >
            {trending ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trending ? '+' : ''}
            {delta.toFixed(3)} vs seed
          </span>
        )}
      </div>
    );
  }

  // Platform-seed branch — cold-start org. Render the seed baseline so
  // the deal page never goes calibration-empty, and signal that per-org
  // calibration kicks in once outcomes accumulate.
  if (cal.source === 'platform_seed' && seed) {
    return (
      <div
        title={cal.calibrationNote}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 999,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <Activity size={11} style={{ color: 'var(--text-muted)' }} />
        <span>
          Platform calibration baseline · Brier{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{seed.meanBrier.toFixed(3)}</strong>
          {seed.brierCi95 && <> ± {seed.brierCi95.halfWidth.toFixed(3)}</>} ({seed.n} historical
          decisions)
        </span>
        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>
          per-org calibration sharpens with each logged outcome
        </span>
      </div>
    );
  }

  return null;
}
