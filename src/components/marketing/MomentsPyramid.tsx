'use client';

/**
 * MomentsPyramid — beat 04 of the landing-page narrative arc.
 *
 * Pyramid-style vertical sequence of alternating panels: illustration
 * left + copy right, then flipped. Each moment gets a bespoke SVG
 * illustration. Count-agnostic — the section header doesn't hard-code
 * a number, so adding or removing moments doesn't break the copy.
 *
 * Background alternates slate-50 / white per moment so the eye reads
 * discrete beats, not a single slab.
 */

import { motion } from 'framer-motion';
import { DecisionGraphViz } from './moments/DecisionGraphViz';
import { BoardroomViz } from './moments/BoardroomViz';
import { AuditTraceViz } from './moments/AuditTraceViz';
import { DqiGaugeViz } from './moments/DqiGaugeViz';
import { OutcomeLoopViz } from './moments/OutcomeLoopViz';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
};

type MomentDef = {
  num: '01' | '02' | '03' | '04' | '05';
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  Viz: React.ComponentType;
  bg: string;
};

const MOMENTS: MomentDef[] = [
  {
    num: '01',
    eyebrow: 'Decision Knowledge Graph',
    title: 'Every strategic call, compounded into one living graph.',
    body: (
      <>
        Every board memo, market-entry recommendation, and M&amp;A paper your team writes becomes a
        node in one navigable graph &mdash; connected by assumption, bias, and outcome.
        Today&rsquo;s decision always inherits yesterday&rsquo;s lessons.
      </>
    ),
    Viz: DecisionGraphViz,
    bg: C.white,
  },
  {
    num: '02',
    eyebrow: 'AI boardroom simulation',
    title: 'Walk in with every objection already answered.',
    body: (
      <>
        Every memo runs past an AI boardroom &mdash; CEO, CFO, board, and division-lead personas,
        each raising the objections their real counterparts always raise. You see the questions
        before the meeting, not on your third draft of the deck.
      </>
    ),
    Viz: BoardroomViz,
    bg: C.slate50,
  },
  {
    num: '03',
    eyebrow: 'Reasoning audit',
    title: 'Governance, not a black box.',
    body: (
      <>
        Your team keeps the judgment. The system keeps the receipts. Every bias flag and evidence
        excerpt traces back to the exact line in your memo that triggered it &mdash; so every
        recommendation is defensible, not just delivered.
      </>
    ),
    Viz: AuditTraceViz,
    bg: C.white,
  },
  {
    num: '04',
    eyebrow: 'What-if',
    title: 'Run what-if before the call.',
    body: (
      <>
        See how removing a bias or reframing an assumption lifts the Decision Quality Index &mdash;
        before you make the call. We surface the one change that actually moves the number, not
        the one that sounds best in the room.
      </>
    ),
    Viz: DqiGaugeViz,
    bg: C.slate50,
  },
  {
    num: '05',
    eyebrow: 'Outcome loop',
    title: 'Every outcome sharpens the next decision.',
    body: (
      <>
        When the real-world outcome lands, Decision Intel closes the loop &mdash; measuring how
        close your call came to reality, recalibrating the Decision Quality Index, and feeding the
        lesson back into the Knowledge Graph. The judgment that made yesterday&rsquo;s call{' '}
        <em style={{ color: C.green, fontStyle: 'italic', fontWeight: 700 }}>compounds</em> into
        the one you make today.
      </>
    ),
    Viz: OutcomeLoopViz,
    bg: C.white,
  },
];

export function MomentsPyramid() {
  return (
    <section id="four-moments" aria-label="The four moments">
      {/* Section header — appears once, then each moment stands on its own */}
      <div style={{ background: C.white, borderTop: `1px solid ${C.slate200}` }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '96px 24px 48px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                margin: 0,
              }}
            >
              The system
            </p>
            <h2
              style={{
                fontSize: 'clamp(30px, 4.4vw, 44px)',
                fontWeight: 800,
                color: C.slate900,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginTop: 14,
                marginBottom: 18,
                maxWidth: 860,
              }}
            >
              How we compound your team&rsquo;s judgment, one decision at a time.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: C.slate600,
                lineHeight: 1.65,
                maxWidth: 720,
                margin: 0,
              }}
            >
              Four governed moments, every strategic call. The reasoning stops being a draft and
              starts being an asset that grows quarter after quarter.
            </p>
          </motion.div>
        </div>
      </div>

      {MOMENTS.map((moment, idx) => {
        const flipped = idx % 2 === 1;
        return (
          <div
            key={moment.num}
            style={{
              background: moment.bg,
              borderTop: `1px solid ${C.slate200}`,
            }}
          >
            <div
              style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: '72px 24px',
              }}
            >
              <div
                className="moment-panel"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 64,
                  alignItems: 'center',
                }}
              >
                {/* Illustration column */}
                <motion.div
                  initial={{ opacity: 0, x: flipped ? 24 : -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.25, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    order: flipped ? 2 : 1,
                    minWidth: 0,
                  }}
                  className={`moment-illustration moment-illustration-${flipped ? 'right' : 'left'}`}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 520,
                      aspectRatio: '480 / 340',
                      margin: flipped ? '0 0 0 auto' : '0 auto 0 0',
                    }}
                  >
                    <moment.Viz />
                  </div>
                </motion.div>

                {/* Copy column */}
                <motion.div
                  initial={{ opacity: 0, x: flipped ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.25, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ order: flipped ? 1 : 2, minWidth: 0 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: C.green,
                        background: C.greenLight,
                        padding: '5px 12px',
                        borderRadius: 6,
                        letterSpacing: '0.08em',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {moment.num}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: C.slate500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      {moment.eyebrow}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: 'clamp(24px, 3vw, 32px)',
                      fontWeight: 800,
                      color: C.slate900,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.18,
                      margin: 0,
                      marginBottom: 18,
                    }}
                  >
                    {moment.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 17,
                      color: C.slate600,
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {moment.body}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Mobile stack — illustration always lands above copy */}
      <style>{`
        @media (max-width: 960px) {
          .moment-panel {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .moment-illustration {
            order: 1 !important;
          }
          .moment-illustration > div {
            margin: 0 auto !important;
          }
        }
      `}</style>
    </section>
  );
}
