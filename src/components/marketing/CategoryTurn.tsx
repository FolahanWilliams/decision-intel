'use client';

/**
 * CategoryTurn — beat 03 of the landing-page narrative arc.
 *
 * Single-line category interstitial, white background, maximum breathing
 * room. The turn between pain (beat 02) and system (beat 04). This is
 * the category-defining sentence: where pain becomes insight.
 *
 * Visual language: pure typography, no illustration. The silence IS the
 * visual — each line animates in on its own cadence so the reader reads
 * them as three separate beats, not one paragraph.
 */

import { motion } from 'framer-motion';

const C = {
  white: '#FFFFFF',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
};

export function CategoryTurn() {
  return (
    <section
      style={{
        background: C.white,
        borderTop: `1px solid ${C.slate200}`,
        borderBottom: `1px solid ${C.slate200}`,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '120px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'center',
            fontSize: 'clamp(28px, 4.4vw, 46px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            color: C.slate900,
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            style={{ margin: 0 }}
          >
            Your data has governance.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{ margin: 0 }}
          >
            Your code has governance.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            style={{ margin: 0 }}
          >
            Your reasoning lives in{' '}
            <span
              style={{
                color: C.green,
                position: 'relative',
                display: 'inline-block',
              }}
            >
              400 Slack threads.
              {/* Underline flourish — draws in after the word animates */}
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -4,
                  height: 3,
                  borderRadius: 2,
                  background: C.green,
                  transformOrigin: 'left center',
                }}
              />
            </span>
          </motion.p>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          style={{
            marginTop: 36,
            fontSize: 16,
            color: C.slate600,
            lineHeight: 1.65,
            maxWidth: 620,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Strategic reasoning deserves its own system of record &mdash; not an excavation site
          across Google Docs, Slack, Confluence, and the board deck.
        </motion.p>
      </div>
    </section>
  );
}
