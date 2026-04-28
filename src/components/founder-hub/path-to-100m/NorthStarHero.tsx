'use client';

import { Target, TrendingUp, Map as MapIcon } from 'lucide-react';

const NORTH_STAR_BANDS = [
  {
    label: 'Q4 2026',
    metric: '£70-90K ARR',
    detail: '3 paid design partners · Sankore + 2 EM funds',
    cumulative: 0.5,
  },
  {
    label: 'Q4 2027',
    metric: '£950K-1.6M ARR',
    detail: '25-40 customers (3-5 F500 expansion)',
    cumulative: 0.175,
  },
  {
    label: 'Q4 2029',
    metric: '£16-32M ARR',
    detail: '200-300 customers · Series B',
    cumulative: 0.0525,
  },
  {
    label: 'Q4 2030',
    metric: '£80M+ ARR',
    detail: '500 enterprise teams · unicorn',
    cumulative: 0.0079,
  },
];

export function NorthStarHero() {
  return (
    <div
      style={{
        padding: 22,
        background:
          'linear-gradient(135deg, rgba(22,163,74,0.10), rgba(124,58,237,0.05) 60%, rgba(217,119,6,0.05))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#16A34A',
          marginBottom: 8,
        }}
      >
        North Star · path to $100M ARR · 2030
      </div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        500 enterprise strategy teams · £200K average ACV · £100M ARR by 2030.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 10,
          marginBottom: 0,
          lineHeight: 1.55,
          maxWidth: 820,
        }}
      >
        The math is concrete. The path is conditional. Phase 1 (50%) → Phase 2 (35%) → Phase 3 (30%)
        → Phase 4 (15%) multiplies to <strong>0.79% absolute IPO outcome</strong> — 4× the pre-seed
        B2B baseline. Most likely real outcome:{' '}
        <strong>Series-B-stage strategic acquisition at £400M-1B by Q4 2029</strong>. This page is
        the single source of truth for how to make that happen — positioning, role-by-role outreach,
        intellectual moat deepening, investor metrics, failure modes, network leverage, 90-day
        actions.
      </p>

      <div
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {NORTH_STAR_BANDS.map(band => (
          <div
            key={band.label}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 4,
              }}
            >
              {band.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              {band.metric}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {band.detail}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 6,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              cumulative P = {(band.cumulative * 100).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Target size={11} /> Sequenced moves: wedge references → F500 introduction → ceiling
          expansion
        </span>
        <span>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={11} /> Forced clock: EU AI Act Article 14 enforcement Aug 2, 2026
        </span>
        <span>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MapIcon size={11} /> Honest math, named tripwires
        </span>
      </div>
    </div>
  );
}
