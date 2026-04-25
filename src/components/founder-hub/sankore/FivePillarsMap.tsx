'use client';

import { useState } from 'react';
import { Building2, Heart, Landmark, Sparkles, Users2 } from 'lucide-react';
import { FIVE_PILLARS_FIT, type PillarFit } from './sankore-brief-data';
import { SectionHeader } from './HoleClosureMatrix';

const PILLAR_ICONS: Record<PillarFit['pillar'], typeof Building2> = {
  Capital: Building2,
  Culture: Sparkles,
  Credit: Landmark,
  City: Building2,
  Community: Heart,
};

const GRADE_COLOURS: Record<PillarFit['fitGrade'], { bg: string; fg: string }> = {
  A: { bg: 'rgba(22,163,74,0.12)', fg: '#16A34A' },
  B: { bg: 'rgba(37,99,235,0.12)', fg: '#2563EB' },
  C: { bg: 'rgba(217,119,6,0.12)', fg: '#D97706' },
  D: { bg: 'rgba(220,38,38,0.12)', fg: '#DC2626' },
};

export function FivePillarsMap() {
  const [activePillar, setActivePillar] = useState<PillarFit['pillar']>('Capital');
  const focused = FIVE_PILLARS_FIT.find(p => p.pillar === activePillar) ?? FIVE_PILLARS_FIT[0];

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="Sankore 5 Pillars · fit map"
        title="How each Sankore pillar maps to a Decision Intel capability today"
        body="Capital is the closest fit — every IC workflow has a shipped surface. Credit + City have strong indirect fits via the Dalio determinants and the regulatory mapping. Culture + Community are honestly marginal today; flag them in the conversation."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 360px) 1fr',
          gap: 18,
          marginTop: 18,
        }}
        className="five-pillars-grid"
      >
        {/* Pillar list */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {FIVE_PILLARS_FIT.map(p => {
            const isActive = p.pillar === activePillar;
            const Icon = PILLAR_ICONS[p.pillar] ?? Users2;
            const grade = GRADE_COLOURS[p.fitGrade];
            return (
              <button
                key={p.pillar}
                onClick={() => setActivePillar(p.pillar)}
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  border: '1px solid transparent',
                  borderColor: isActive ? grade.fg + '40' : 'transparent',
                  borderLeft: `3px solid ${isActive ? grade.fg : 'transparent'}`,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'background .15s, border-color .15s',
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: grade.bg,
                    color: grade.fg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p.pillar}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.oneLiner}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: grade.fg,
                    background: grade.bg,
                    padding: '2px 8px',
                    borderRadius: 999,
                    minWidth: 24,
                    textAlign: 'center',
                  }}
                >
                  {p.fitGrade}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <h3
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {focused.pillar}
            </h3>
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: GRADE_COLOURS[focused.fitGrade].fg,
                background: GRADE_COLOURS[focused.fitGrade].bg,
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${GRADE_COLOURS[focused.fitGrade].fg}40`,
              }}
            >
              Fit grade {focused.fitGrade}
            </span>
          </div>

          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {focused.fitNote}
          </p>

          <div>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Capabilities mapping to this pillar
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {focused.capabilities.map((c, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ color: GRADE_COLOURS[focused.fitGrade].fg, fontWeight: 700 }}>·</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .five-pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
