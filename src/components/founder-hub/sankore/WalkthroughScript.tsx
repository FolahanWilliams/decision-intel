'use client';

import { ArrowRight, Clock } from 'lucide-react';
import { WALKTHROUGH } from './sankore-brief-data';
import { SectionHeader } from './HoleClosureMatrix';

export function WalkthroughScript() {
  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="15-minute walkthrough"
        title="The narrative arc for the Titi conversation"
        body="Optimised for a single live demo. Each beat ends with a concrete proof — a URL, a button, or a downloadable artifact. No slides."
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 18,
        }}
      >
        {WALKTHROUGH.map((b, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr',
              gap: 14,
              padding: '14px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                background: 'rgba(22,163,74,0.10)',
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid rgba(22,163,74,0.30)',
                whiteSpace: 'nowrap',
                justifySelf: 'start',
                letterSpacing: '0.04em',
              }}
            >
              <Clock size={10} /> {b.minute}
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {b.title}
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {b.what}
              </p>
              {b.link && (
                <a
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    marginTop: 6,
                    textDecoration: 'none',
                  }}
                >
                  Open {b.link} <ArrowRight size={11} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
