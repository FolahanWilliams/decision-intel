'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIMELINE, type Milestone, type MilestoneTrack } from './data';

/**
 * UnicornTimeline — a multi-track Gantt-like scroll showing 5-year path.
 *
 * Rows: founder / business / fundraising / product (4 tracks)
 * Columns: quarter labels
 * Interaction: hover/click a milestone tile to open a detail card.
 */

const TRACKS: Array<{ id: MilestoneTrack; label: string; color: string }> = [
  { id: 'founder', label: 'Founder', color: '#16A34A' },
  { id: 'business', label: 'Business', color: '#0EA5E9' },
  { id: 'product', label: 'Product', color: '#7C3AED' },
  { id: 'fundraising', label: 'Fundraising', color: '#F59E0B' },
];

const STATUS_STYLES: Record<
  Milestone['status'],
  { bg: string; border: string; fg: string; label: string }
> = {
  locked: {
    bg: 'rgba(22,163,74,0.10)',
    border: 'rgba(22,163,74,0.35)',
    fg: 'var(--accent-primary)',
    label: 'LOCKED',
  },
  in_progress: {
    bg: 'rgba(22,163,74,0.05)',
    border: 'rgba(22,163,74,0.45)',
    fg: 'var(--accent-primary)',
    label: 'IN PROGRESS',
  },
  next: {
    bg: 'rgba(14,165,233,0.06)',
    border: 'rgba(14,165,233,0.35)',
    fg: '#0EA5E9',
    label: 'NEXT',
  },
  later: {
    bg: 'rgba(148,163,184,0.05)',
    border: 'var(--border-primary)',
    fg: 'var(--text-muted)',
    label: 'LATER',
  },
};

export function UnicornTimeline() {
  const [selected, setSelected] = useState<Milestone | null>(null);

  const quarters = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of TIMELINE) {
      if (!seen.has(m.quarter)) {
        seen.add(m.quarter);
        out.push(m.quarter);
      }
    }
    return out;
  }, []);

  const byTrackAndQuarter = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of TIMELINE) {
      const key = `${m.track}|${m.quarter}`;
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return map;
  }, []);

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      <SectionHeader
        eyebrow="The 5-year path"
        title="From solo founder to category infrastructure."
        subtitle="Four tracks, eleven milestones. Click any tile for detail."
      />

      <div style={{ padding: '16px 20px 32px', overflowX: 'auto' }}>
        {/* Quarter column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `140px repeat(${quarters.length}, minmax(140px, 1fr))`,
            gap: 8,
            marginBottom: 10,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-primary)',
            minWidth: 900,
          }}
        >
          <div />
          {quarters.map(q => (
            <div
              key={q}
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {q}
            </div>
          ))}
        </div>

        {/* Track rows */}
        {TRACKS.map(track => (
          <div
            key={track.id}
            style={{
              display: 'grid',
              gridTemplateColumns: `140px repeat(${quarters.length}, minmax(140px, 1fr))`,
              gap: 8,
              alignItems: 'stretch',
              marginBottom: 10,
              minWidth: 900,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: track.color,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {track.label}
              </span>
            </div>
            {quarters.map(q => {
              const items = byTrackAndQuarter.get(`${track.id}|${q}`) ?? [];
              return (
                <div key={q} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map(m => {
                    const s = STATUS_STYLES[m.status];
                    const isActive = selected?.id === m.id;
                    return (
                      <motion.button
                        key={m.id}
                        onClick={() => setSelected(isActive ? null : m)}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: s.bg,
                          border: `1px solid ${isActive ? track.color : s.border}`,
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8.5,
                            fontWeight: 800,
                            color: s.fg,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontFamily: 'var(--font-mono, monospace)',
                            marginBottom: 4,
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.3,
                          }}
                        >
                          {m.title}
                        </div>
                      </motion.button>
                    );
                  })}
                  {items.length === 0 && (
                    <div
                      style={{
                        height: 48,
                        borderRadius: 8,
                        border: '1px dashed var(--border-primary)',
                        opacity: 0.3,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Selected detail card */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 12,
                background: 'var(--bg-elevated)',
                border: `1px solid ${
                  TRACKS.find(t => t.id === selected.track)?.color ?? 'var(--border-primary)'
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: TRACKS.find(t => t.id === selected.track)?.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {TRACKS.find(t => t.id === selected.track)?.label} &middot; {selected.quarter}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Target: {selected.date}
                </span>
              </div>
              <h4
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  marginBottom: 8,
                  letterSpacing: '-0.015em',
                }}
              >
                {selected.title}
              </h4>
              <p
                style={{
                  fontSize: 13.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {selected.detail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Reusable section header ─────────────────────────────────────── */

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        padding: '22px 28px 16px',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: 'var(--accent-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          fontFamily: 'var(--font-mono, monospace)',
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.015em',
          margin: 0,
          marginBottom: subtitle ? 6 : 0,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
