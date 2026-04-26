'use client';

import Link from 'next/link';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { CAPABILITY_SURFACES } from './sankore-brief-data';
import { SectionHeader } from './HoleClosureMatrix';

export function CapabilitySurfaces() {
  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="Capability surfaces"
        title="Where to take Titi during the live demo"
        body="Each card opens the surface in a new tab. Demo notes spell out what to point at when you click in."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          marginTop: 18,
        }}
      >
        {CAPABILITY_SURFACES.map(s => {
          const inner = (
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                height: '100%',
                cursor: 'pointer',
                transition: 'border-color .15s, transform .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {s.title}
                </span>
                {s.internal ? (
                  <ArrowUpRight
                    size={13}
                    style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}
                  />
                ) : (
                  <ExternalLink
                    size={11}
                    style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}
                  />
                )}
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {s.oneLiner}
              </p>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 8,
                  borderTop: '1px dashed var(--border-color)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--text-secondary)', fontStyle: 'normal' }}>
                  Demo:{' '}
                </strong>
                {s.demoNote}
              </div>
            </div>
          );
          return s.internal ? (
            <Link key={s.title} href={s.href} style={{ textDecoration: 'none' }}>
              {inner}
            </Link>
          ) : (
            <a
              key={s.title}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              {inner}
            </a>
          );
        })}
      </div>
    </section>
  );
}
