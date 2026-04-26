'use client';

import { useState } from 'react';
import { ArrowRight, Globe2 } from 'lucide-react';
import { CASE_GEOGRAPHY } from './sankore-brief-data';
import { SectionHeader } from './HoleClosureMatrix';

const MAX_BAR_WIDTH = 100; // percentage of grid width

export function CaseLibraryGeography() {
  const [activeRegion, setActiveRegion] = useState<string | null>('Sub-Saharan Africa');
  const max = Math.max(...CASE_GEOGRAPHY.map(b => Math.max(b.before, b.after)));

  const focused = activeRegion ? CASE_GEOGRAPHY.find(b => b.region === activeRegion) : null;

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="Case-library geography"
        title="From 0 African case studies to 3 — with full pre-decision evidence"
        body="Click a region to see what case studies live there. The Sub-Saharan Africa cohort is what closes Titi's geographic-distribution finding."
      />

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          marginTop: 18,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 90px',
            columnGap: 14,
            rowGap: 16,
            alignItems: 'center',
          }}
        >
          {/* Header */}
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: 'var(--text-muted)',
            }}
          >
            Region
          </div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: 'var(--text-muted)',
              display: 'flex',
              gap: 16,
            }}
          >
            <span>Before · pre-Sankore</span>
            <ArrowRight size={11} style={{ alignSelf: 'center' }} />
            <span style={{ color: 'var(--accent-primary)' }}>After · current main</span>
          </div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textAlign: 'right',
            }}
          >
            Δ
          </div>

          {/* Rows */}
          {CASE_GEOGRAPHY.map(b => {
            const isAfrica = b.region === 'Sub-Saharan Africa';
            const isFocused = activeRegion === b.region;
            const beforePct = max > 0 ? (b.before / max) * MAX_BAR_WIDTH : 0;
            const afterPct = max > 0 ? (b.after / max) * MAX_BAR_WIDTH : 0;
            const delta = b.after - b.before;
            return (
              <RowGroup
                key={b.region}
                region={b.region}
                isAfrica={isAfrica}
                isFocused={isFocused}
                onClick={() => setActiveRegion(isFocused ? null : b.region)}
                before={b.before}
                after={b.after}
                beforePct={beforePct}
                afterPct={afterPct}
                delta={delta}
              />
            );
          })}
        </div>
      </div>

      {/* Detail */}
      {focused && (
        <div
          style={{
            marginTop: 16,
            padding: '14px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe2 size={13} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {focused.region} · {focused.after} cases
            </span>
            {focused.region === 'Sub-Saharan Africa' && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#16A34A',
                  background: 'rgba(22,163,74,0.10)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(22,163,74,0.30)',
                }}
              >
                +3 in this sprint
              </span>
            )}
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {focused.examples.map((ex, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>·</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RowGroup({
  region,
  isAfrica,
  isFocused,
  onClick,
  before,
  after,
  beforePct,
  afterPct,
  delta,
}: {
  region: string;
  isAfrica: boolean;
  isFocused: boolean;
  onClick: () => void;
  before: number;
  after: number;
  beforePct: number;
  afterPct: number;
  delta: number;
}) {
  const accent = isAfrica ? '#16A34A' : '#94A3B8';
  return (
    <>
      <button
        onClick={onClick}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: isFocused ? 800 : 600,
          color: isFocused ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {region}
      </button>
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <BarRow value={before} pct={beforePct} colour="#94A3B8" muted />
        <BarRow value={after} pct={afterPct} colour={accent} muted={!isAfrica} />
      </div>
      <div
        style={{
          textAlign: 'right',
          fontSize: 13,
          fontWeight: 800,
          color: delta > 0 ? '#16A34A' : 'var(--text-muted)',
        }}
      >
        {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
      </div>
    </>
  );
}

function BarRow({
  value,
  pct,
  colour,
  muted = false,
}: {
  value: number;
  pct: number;
  colour: string;
  muted?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 14,
          background: 'var(--bg-elevated)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${Math.max(2, pct)}%`,
            height: '100%',
            background: colour,
            opacity: muted ? 0.55 : 0.95,
            transition: 'width .25s',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
          minWidth: 26,
          textAlign: 'right',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
