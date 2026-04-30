'use client';

import { Target, TrendingUp, Map as MapIcon } from 'lucide-react';

// v3.2 lock 2026-04-30 · the goal is founder cash $30M+ at strategic
// acquisition exit, NOT unicorn ARR. Bootstrap-leaning + ONE strategic seed
// round Q4 2026 / Q1 2027. Exit at 8-12× ARR multiple = £30-95M EV; founder
// retains 60-78% post-seed → personal cash $25-70M. Probability range 35-55%
// per NotebookLM v3.2 critique-adjusted estimate.
const NORTH_STAR_BANDS = [
  {
    label: 'Q3 2026',
    metric: 'Graduation rule fires',
    detail: '5 paid Individual £249/mo · 10 raving advocates · 1 verifiable referral via DPR',
    cumulative: 0.5,
  },
  {
    label: 'Q4 2026 / Q1 2027',
    metric: 'Seed raised',
    detail: '£1.5-2.5M @ £8-15M post · founder retains 60-78% · Sankore Design Foundation pilot live',
    cumulative: 0.4,
  },
  {
    label: 'Q4 2027',
    metric: '£500K-1M ARR',
    detail: '1-2 published reference DPRs · F500 corp dev procurement conversations open',
    cumulative: 0.3,
  },
  {
    label: 'Q4 2029',
    metric: '£3-8M ARR',
    detail: 'F500 ceiling unlocking · strategic-acquisition discussions',
    cumulative: 0.2,
  },
  {
    label: '2031-2033',
    metric: '£30-95M EV exit',
    detail: 'Founder cash $30M+ · likely acquirers: LRQA / IBM watsonx.gov / Big-4',
    cumulative: 0.45,
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
        North Star · path to £100M Exits · 2031-2033
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
        £30M+ founder cash exit · most equity retained · 5-7 years.
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
        Bootstrap-leaning + ONE strategic seed round Q4 2026 / Q1 2027 (£1.5-2.5M @ £8-15M post,
        founder dilution 12-20%). Bootstrap to £3-8M ARR over 3-5 years post-seed. Strategic
        acquisition exit at 8-12× ARR multiple = <strong>£30-95M EV</strong>; founder retains 60-78%
        → personal cash <strong>$25-70M</strong>, comfortably clearing the $30M floor. Probability
        of $30M+ outcome: <strong>35-55%</strong> if next 90 days execute tightly and the Individual
        → Sankore graduation fires (NotebookLM v3.2-critique-adjusted estimate). Likely acquirers:
        LRQA, IBM watsonx.governance arm, Big-4 governance practice, or a strategic AI-governance
        player TBD. This page is the single source of truth for how to make that happen.
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
              conditional P = {(band.cumulative * 100).toFixed(0)}%
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
