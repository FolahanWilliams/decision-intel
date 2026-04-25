'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Code2, ExternalLink, Filter } from 'lucide-react';
import { HOLE_MATRIX, STATUS_DISPLAY, type CapabilityStatus } from './sankore-brief-data';

const TONE: Record<'success' | 'amber' | 'info' | 'muted', { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(22,163,74,0.10)', text: '#16A34A', border: 'rgba(22,163,74,0.30)' },
  amber: { bg: 'rgba(217,119,6,0.10)', text: '#D97706', border: 'rgba(217,119,6,0.30)' },
  info: { bg: 'rgba(37,99,235,0.10)', text: '#2563EB', border: 'rgba(37,99,235,0.30)' },
  muted: { bg: 'rgba(100,116,139,0.10)', text: '#64748B', border: 'rgba(100,116,139,0.30)' },
};

const FILTERS: Array<{ key: 'all' | CapabilityStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'scaffolded', label: 'Scaffolded' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'deferred', label: 'Deferred' },
];

export function HoleClosureMatrix() {
  const [filter, setFilter] = useState<'all' | CapabilityStatus>('all');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const counts = useMemo(() => {
    const m: Record<CapabilityStatus, number> = {
      shipped: 0,
      scaffolded: 0,
      scheduled: 0,
      deferred: 0,
    };
    for (const h of HOLE_MATRIX) m[h.status]++;
    return m;
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return HOLE_MATRIX.map((h, i) => ({ ...h, _idx: i }));
    return HOLE_MATRIX.map((h, i) => ({ ...h, _idx: i })).filter(h => h.status === filter);
  }, [filter]);

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="Hole-closure matrix"
        title="Every Titi-flagged gap, mapped to its current status"
        body="Convergent findings (both audit panels agreed) are listed first. Click a row to see what shipped + where it lives in code or product."
      />
      <div className="flex items-center gap-2 mb-4 flex-wrap" style={{ marginTop: 18 }}>
        <Filter size={12} style={{ color: 'var(--text-muted)' }} />
        {FILTERS.map(f => {
          const active = filter === f.key;
          const n = f.key === 'all' ? HOLE_MATRIX.length : counts[f.key as CapabilityStatus];
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: active ? 'rgba(22,163,74,0.10)' : 'transparent',
                border: `1px solid ${active ? 'rgba(22,163,74,0.30)' : 'var(--border-color)'}`,
                padding: '5px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.label} <span style={{ opacity: 0.7 }}>({n})</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(h => {
          const tone = TONE[STATUS_DISPLAY[h.status].tone];
          const expanded = expandedIdx === h._idx;
          return (
            <div
              key={h._idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${tone.text}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setExpandedIdx(expanded ? null : h._idx)}
                aria-expanded={expanded}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: tone.bg,
                    color: tone.text,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  {h.status === 'shipped' ? <CheckCircle2 size={13} /> : <Code2 size={12} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {h.title}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
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
                        {STATUS_DISPLAY[h.status].label}
                      </span>
                      {h.plannedWeek && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {h.plannedWeek}
                        </span>
                      )}
                      <ChevronDown
                        size={14}
                        style={{
                          color: 'var(--text-muted)',
                          transition: 'transform .15s',
                          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                    }}
                  >
                    Flagged by: {h.flaggedBy}
                  </div>
                </div>
              </button>

              {expanded && (
                <div
                  style={{
                    padding: '0 16px 16px 50px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {h.shipped}
                  </p>
                  {h.surfaces.length > 0 && (
                    <div
                      className="flex flex-wrap gap-2"
                      style={{ marginTop: 4 }}
                    >
                      {h.surfaces.map((s, i) => {
                        const isLink = !!s.href;
                        const inner = (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 999,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-color)',
                              color: isLink ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              fontFamily: s.codePath ? 'var(--font-mono, monospace)' : 'inherit',
                            }}
                          >
                            {isLink && <ExternalLink size={9} />}
                            {s.codePath ? <Code2 size={9} /> : null}
                            {s.label}
                          </span>
                        );
                        return s.href ? (
                          <a
                            key={i}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            {inner}
                          </a>
                        ) : (
                          <span key={i}>{inner}</span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Local SectionHeader — small, kept inline so each panel file is standalone.
export function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 2.4vw, 26px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {body && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '6px 0 0',
            lineHeight: 1.55,
            maxWidth: 760,
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}
