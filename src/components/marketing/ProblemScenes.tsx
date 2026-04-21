'use client';

/**
 * ProblemScenes — beat 02 of the landing-page narrative arc.
 *
 * Three broad-enterprise pain scenes on a dark-navy panel. Tone is
 * grounded-CSO but reads for M&A and CorpStrategy too — every scene is
 * a meeting these three audiences have already lived.
 *
 * Visual language: typography-led, each scene has a small numbered
 * eyebrow and one tight icon-scale motif (no full illustrations — the
 * beat is about rhythm, not spectacle).
 */

import { motion } from 'framer-motion';
import { FileQuestion, UserMinus, GitMerge } from 'lucide-react';

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  navyBorder: 'rgba(255,255,255,0.08)',
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#EF4444',
};

const SCENES = [
  {
    num: '01',
    tag: 'Forgotten reasoning',
    body: "A memo lands on the board's desk. A quarter later, no one can reconstruct why the call was made — or which assumptions it rested on.",
    Icon: FileQuestion,
    accent: C.amber,
  },
  {
    num: '02',
    tag: 'Departed judgment',
    body: 'Your head of strategy takes a new role. The reasoning behind the last four bets walks out with her, and the next CSO starts from a blank page.',
    Icon: UserMinus,
    accent: C.red,
  },
  {
    num: '03',
    tag: 'Parallel re-work',
    body: 'Two divisions run the same market-entry analysis in the same quarter. Neither knows the other did it. Neither inherits the other’s findings.',
    Icon: GitMerge,
    accent: C.green,
  },
];

export function ProblemScenes() {
  return (
    <section
      id="the-pattern"
      style={{
        background: C.navy,
        borderTop: `1px solid ${C.navyBorder}`,
        borderBottom: `1px solid ${C.navyBorder}`,
        color: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background texture — diagonal grid, barely visible, gives
          the dark panel weight without reading as decorative. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(135deg, rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(45deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '96px 24px',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15, margin: '0px 0px -8% 0px' }}
          transition={{ duration: 0.5 }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#86EFAC',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              marginBottom: 14,
              margin: 0,
            }}
          >
            The pattern
          </p>
          <h2
            style={{
              fontSize: 'clamp(30px, 4.6vw, 46px)',
              fontWeight: 800,
              color: C.white,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginTop: 14,
              marginBottom: 18,
              maxWidth: 860,
            }}
          >
            Every strategy function has lived these three meetings.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: C.slate300,
              lineHeight: 1.65,
              maxWidth: 680,
              marginBottom: 60,
            }}
          >
            Not because the team lacked rigour. Because rigour has never had a governance layer —
            the reasoning in every memo has been treated as a draft, not an asset.
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
          className="problem-scenes-grid"
        >
          {SCENES.map((scene, i) => (
            <motion.div
              key={scene.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{
                background: C.navyLight,
                border: `1px solid ${C.navyBorder}`,
                borderRadius: 16,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                position: 'relative',
              }}
            >
              {/* Accent strip at top-left — very thin, reads as a subtle index */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 28,
                  width: 48,
                  height: 2,
                  borderRadius: 2,
                  background: scene.accent,
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: scene.accent,
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {scene.num}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: C.slate400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  {scene.tag}
                </span>
              </div>

              <p
                style={{
                  fontSize: 16.5,
                  lineHeight: 1.55,
                  color: '#E2E8F0',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {scene.body}
              </p>

              {/* Icon motif — sits bottom-right, muted, a visual anchor not a
                  focal point. Keeps the card typography-led. */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  bottom: 22,
                  right: 22,
                  opacity: 0.18,
                }}
              >
                <scene.Icon size={36} color={C.white} strokeWidth={1.5} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .problem-scenes-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
