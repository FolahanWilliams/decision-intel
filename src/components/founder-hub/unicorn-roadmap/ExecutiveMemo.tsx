'use client';

import { motion } from 'framer-motion';
import { EXECUTIVE_MEMO } from './data';

/**
 * ExecutiveMemo — styled as a board-memo one-pager. Six sections, each
 * eyebrow + heading + body. Designed to read like a strategy memo, not
 * a dashboard. This is the page's narrative spine.
 */
export function ExecutiveMemo() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      {/* Memo header */}
      <div
        style={{
          padding: '28px 32px 20px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'linear-gradient(180deg, rgba(22,163,74,0.04) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontFamily: 'var(--font-mono, monospace)',
            marginBottom: 10,
          }}
        >
          Executive memo &middot; unicorn thesis
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Where this goes, how you get there, what breaks it.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            marginTop: 12,
            marginBottom: 0,
            lineHeight: 1.55,
            maxWidth: 720,
          }}
        >
          Refined synthesis of the LLM Council roadmap, reconciled with the codebase, founder
          context, and honest counter-takes. Read once. Act on it. Update quarterly.
        </p>
      </div>

      {/* Memo body — 6 sections in a responsive grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 0,
        }}
      >
        {EXECUTIVE_MEMO.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            style={{
              padding: '24px 28px',
              borderRight: '1px solid var(--border-primary)',
              borderBottom: '1px solid var(--border-primary)',
              background: 'transparent',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontFamily: 'var(--font-mono, monospace)',
                marginBottom: 8,
              }}
            >
              {section.eyebrow}
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
                lineHeight: 1.25,
                margin: 0,
                marginBottom: 10,
              }}
            >
              {section.heading}
            </h3>
            <p
              style={{
                fontSize: 13.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {section.body}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
