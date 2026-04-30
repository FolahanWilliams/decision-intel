'use client';

import { Building2, Calendar, ChevronRight, Sparkle } from 'lucide-react';
import { THREE_SHIFTS, STATUS_DISPLAY } from './sankore-brief-data';

const TONE_COLOURS: Record<
  'success' | 'amber' | 'info' | 'muted',
  { bg: string; text: string; border: string }
> = {
  success: { bg: 'rgba(22,163,74,0.10)', text: '#16A34A', border: 'rgba(22,163,74,0.30)' },
  amber: { bg: 'rgba(217,119,6,0.10)', text: '#D97706', border: 'rgba(217,119,6,0.30)' },
  info: { bg: 'rgba(37,99,235,0.10)', text: '#2563EB', border: 'rgba(37,99,235,0.30)' },
  muted: { bg: 'rgba(100,116,139,0.10)', text: '#64748B', border: 'rgba(100,116,139,0.30)' },
};

export function HeroPanel() {
  return (
    <section style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            padding: '4px 10px',
            background: 'rgba(22,163,74,0.10)',
            borderRadius: 999,
            border: '1px solid rgba(22,163,74,0.30)',
          }}
        >
          <Sparkle size={11} /> Founder reference brief
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <Calendar size={11} /> Last refreshed at deploy time · maintained alongside the codebase
        </span>
      </div>

      <h1
        style={{
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: '6px 0 8px',
          lineHeight: 1.1,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Building2 size={28} style={{ color: 'var(--accent-primary)' }} />
        Sankore Investments · Capability Brief
      </h1>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          maxWidth: 880,
          marginBottom: 14,
        }}
      >
        The audit Titi ran on Decision Intel concluded the platform was a strong intellectual
        product wrapped in a way that wouldn&apos;t survive a real procurement cycle. Since then,
        every Sankore-specific gap she flagged has either shipped to production, scaffolded for
        activation, or scheduled into the 12-week plan. This page is the live ledger.
      </p>

      {/* v3.2 lock: engagement-context strip — London office + summer 2026 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          padding: '10px 14px',
          background: 'rgba(22,163,74,0.06)',
          border: '1px solid rgba(22,163,74,0.20)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 24,
          fontSize: 12.5,
          color: 'var(--text-secondary)',
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: 'var(--accent-primary)',
            padding: '2px 7px',
            borderRadius: 999,
            background: 'rgba(22,163,74,0.10)',
            border: '1px solid rgba(22,163,74,0.25)',
          }}
        >
          Engagement
        </span>
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>London office</strong>, in-person
          summer 2026 · Design Foundation rate{' '}
          <strong style={{ color: 'var(--text-primary)' }}>£1,999/mo</strong> (20% off Strategy
          tier) for the founding cohort, optional equity-warrant + outcome-share clause. Per the
          GTM Plan v3.2 lock, Sankore is the design-partner bridge — not the GTM wedge — and
          produces the published reference DPRs that unlock the F500 ceiling.
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {THREE_SHIFTS.map(s => {
          const tone = TONE_COLOURS[STATUS_DISPLAY[s.status].tone];
          return (
            <div
              key={s.axis}
              style={{
                padding: '18px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderTop: `3px solid ${tone.text}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  Shift
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: tone.bg,
                    color: tone.text,
                    border: `1px solid ${tone.border}`,
                  }}
                >
                  {STATUS_DISPLAY[s.status].label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {s.axis}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{s.beforeLabel}</span>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {s.afterLabel}
                </span>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                {s.evidence.map((e, i) => (
                  <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: tone.text, flexShrink: 0, fontWeight: 700 }}>·</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
