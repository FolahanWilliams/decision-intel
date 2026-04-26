'use client';

import { AlertTriangle } from 'lucide-react';
import { HONEST_GAPS } from './sankore-brief-data';
import { SectionHeader } from './HoleClosureMatrix';

export function HonestGaps() {
  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="Honest gaps"
        title="What's NOT shipped — flag these proactively in the call"
        body="The fastest way to lose a sophisticated buyer is to overstate. Lead the conversation with these honestly; Titi will respect it more than buried disclaimers."
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 18,
        }}
      >
        {HONEST_GAPS.map((g, i) => (
          <div
            key={i}
            style={{
              padding: '14px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid #D97706',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 3,
                }}
              >
                {g.title}
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {g.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
