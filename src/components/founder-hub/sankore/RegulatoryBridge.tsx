'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, FileText, MapPin } from 'lucide-react';
import { FRAMEWORKS_BRIEF, type FrameworkBrief } from './sankore-brief-data';
import { SectionHeader } from './HoleClosureMatrix';

const STATUS_STYLE: Record<
  FrameworkBrief['status'],
  { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  live: { label: 'Live', color: '#16A34A', bg: 'rgba(22,163,74,0.10)', Icon: CheckCircle2 },
  enforceable_2026: {
    label: 'Aug 2 2026',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.10)',
    Icon: Clock,
  },
  draft: { label: 'Draft 2024', color: '#2563EB', bg: 'rgba(37,99,235,0.10)', Icon: FileText },
};

export function RegulatoryBridge() {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const g7 = FRAMEWORKS_BRIEF.filter(f => f.region === 'g7');
  const africa = FRAMEWORKS_BRIEF.filter(f => f.region === 'africa');
  const focused = hoveredCode ? FRAMEWORKS_BRIEF.find(f => f.code === hoveredCode) : null;

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="Regulatory bridge"
        title="From 7 G7 frameworks to 10 — including NDPR, CBN, WAEMU"
        body="Titi flagged that every regulatory framework on /security was a G7 export with zero African coverage. The frameworks list is now extended; the DPR field set covers each one."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginTop: 20,
        }}
        className="reg-bridge-grid"
      >
        <RegionColumn
          label="Existing · G7"
          subLabel="7 frameworks · already mapped"
          frameworks={g7}
          accent="#64748B"
          hoveredCode={hoveredCode}
          onHover={setHoveredCode}
        />
        <RegionColumn
          label="New · Africa"
          subLabel="3 frameworks · added in this sprint"
          frameworks={africa}
          accent="#16A34A"
          hoveredCode={hoveredCode}
          onHover={setHoveredCode}
          highlight
        />
      </div>

      {/* Detail strip */}
      <div
        style={{
          marginTop: 16,
          padding: '14px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: focused
            ? `3px solid ${STATUS_STYLE[focused.status].color}`
            : '3px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          minHeight: 84,
        }}
      >
        {focused ? (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.02em',
                }}
              >
                {focused.code}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{focused.name}</span>
              <span
                style={{
                  fontSize: 9.5,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: STATUS_STYLE[focused.status].bg,
                  color: STATUS_STYLE[focused.status].color,
                  border: `1px solid ${STATUS_STYLE[focused.status].color}40`,
                  marginLeft: 6,
                }}
              >
                {STATUS_STYLE[focused.status].label}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--text-primary)' }}>DPR coverage: </strong>
              {focused.dprCoverage}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MapPin size={12} />
            Hover any framework to see how the Decision Provenance Record covers its provisions.
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 760px) {
          .reg-bridge-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function RegionColumn({
  label,
  subLabel,
  frameworks,
  accent,
  hoveredCode,
  onHover,
  highlight = false,
}: {
  label: string;
  subLabel: string;
  frameworks: FrameworkBrief[];
  accent: string;
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: 16,
        boxShadow: highlight ? '0 0 0 4px rgba(22,163,74,0.04)' : undefined,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 800,
          color: accent,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 14,
        }}
      >
        {subLabel}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {frameworks.map(f => {
          const isHovered = hoveredCode === f.code;
          const Icon = STATUS_STYLE[f.status].Icon;
          return (
            <div
              key={f.code}
              onMouseEnter={() => onHover(f.code)}
              onMouseLeave={() => onHover(null)}
              style={{
                padding: '10px 12px',
                background: isHovered ? 'var(--bg-elevated)' : 'transparent',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${STATUS_STYLE[f.status].color}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background .15s, transform .15s',
                transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
              }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {f.code}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: STATUS_STYLE[f.status].color,
                  }}
                >
                  <Icon size={11} /> {STATUS_STYLE[f.status].label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {f.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
