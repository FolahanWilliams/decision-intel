'use client';

import { motion } from 'framer-motion';
import { CADENCE, type CadenceBlock } from './data';
import { SectionHeader } from './UnicornTimeline';

const DAYS: CadenceBlock['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS: CadenceBlock['slot'][] = ['morning', 'midday', 'evening'];

const CATEGORY_META: Record<
  CadenceBlock['category'],
  { color: string; label: string; bg: string }
> = {
  sell: { color: '#16A34A', label: 'Sell', bg: 'rgba(22,163,74,0.10)' },
  build: { color: '#7C3AED', label: 'Build', bg: 'rgba(124,58,237,0.10)' },
  learn: { color: '#0EA5E9', label: 'Learn', bg: 'rgba(14,165,233,0.10)' },
  rest: { color: '#94A3B8', label: 'Rest', bg: 'rgba(148,163,184,0.10)' },
};

export function OperatingCadence() {
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
        eyebrow="Operating cadence"
        title="One week, repeatable. Sell-heavy, build-disciplined, rest-enforced."
        subtitle="Move things around — but every week must show green (sell), purple (build), blue (learn), and grey (rest)."
      />
      <div style={{ padding: '18px 22px 28px', overflowX: 'auto' }}>
        <LegendRow />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '70px repeat(7, minmax(120px, 1fr))',
            gap: 6,
            marginTop: 14,
            minWidth: 900,
          }}
        >
          {/* Day header row */}
          <div />
          {DAYS.map(d => (
            <div
              key={d}
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '6px 10px',
                borderBottom: '1px solid var(--border-primary)',
              }}
            >
              {d}
            </div>
          ))}
          {/* Slot rows */}
          {SLOTS.map(slot => (
            <SlotRow key={slot} slot={slot} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LegendRow() {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
      {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map(k => {
        const m = CATEGORY_META[k];
        return (
          <div key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: m.color,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {m.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SlotRow({ slot }: { slot: CadenceBlock['slot'] }) {
  return (
    <>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontFamily: 'var(--font-mono, monospace)',
          padding: '10px 0',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        {slot}
      </div>
      {DAYS.map(day => {
        const block = CADENCE.find(b => b.day === day && b.slot === slot);
        return <CadenceCell key={`${day}-${slot}`} block={block} />;
      })}
    </>
  );
}

function CadenceCell({ block }: { block: CadenceBlock | undefined }) {
  if (!block) {
    return (
      <div
        style={{
          height: 80,
          borderRadius: 6,
          border: '1px dashed var(--border-primary)',
          opacity: 0.3,
        }}
      />
    );
  }
  const m = CATEGORY_META[block.category];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      style={{
        padding: 10,
        borderRadius: 6,
        background: m.bg,
        border: `1px solid ${m.color}35`,
        borderLeft: `3px solid ${m.color}`,
        minHeight: 80,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          color: m.color,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {block.duration}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: 2,
          lineHeight: 1.3,
        }}
      >
        {block.label}
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: 'var(--text-muted)',
          marginTop: 3,
          lineHeight: 1.4,
        }}
      >
        {block.detail}
      </div>
    </motion.div>
  );
}
