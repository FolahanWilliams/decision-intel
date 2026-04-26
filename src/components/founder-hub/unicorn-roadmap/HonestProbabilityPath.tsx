'use client';

/**
 * HonestProbabilityPath — the 4-phase 2026→2030 conditional-probability
 * unicorn roadmap. Replaces "5-year hopeful timeline" with
 * "multiplied conditionals + named risks." Each phase card carries
 * targets, what-has-to-be-true checklist, conditional probability,
 * and the single hardest transition risk. The footer surfaces the
 * absolute outcome (~2.6%), the 10x baseline lift, and the
 * most-likely-real-outcome (Series B-stage acquisition).
 *
 * Below the timeline: a live "Hard Truth Risks" tracker — five
 * weaknesses Claude flagged during the strengths/weaknesses thesis.
 * Each maps to a phase, evidence, countermove, and tripwire signal.
 *
 * Locked 2026-04-27. Update quarterly when phases narrow.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, TrendingUp, Target } from 'lucide-react';
import {
  HONEST_PROBABILITY_PATH,
  ABSOLUTE_UNICORN_PROBABILITY,
  BASELINE_PRESEED_UNICORN_PROBABILITY,
  MOST_LIKELY_OUTCOME,
  HARD_TRUTH_RISKS,
  type RoadmapPhase,
} from './honest-probability-data';
import { SectionHeader } from './UnicornTimeline';

const STATUS_LABEL: Record<RoadmapPhase['status'], string> = {
  now: 'NOW',
  next: 'NEXT',
  later: 'LATER',
  reached: 'REACHED',
};

export function HonestProbabilityPath() {
  const [activePhaseId, setActivePhaseId] = useState<string>(HONEST_PROBABILITY_PATH[0].id);
  const [openRiskId, setOpenRiskId] = useState<string | null>(HARD_TRUTH_RISKS[0].id);
  const activePhase =
    HONEST_PROBABILITY_PATH.find(p => p.id === activePhaseId) ?? HONEST_PROBABILITY_PATH[0];
  const baselineMultiple = ABSOLUTE_UNICORN_PROBABILITY / BASELINE_PRESEED_UNICORN_PROBABILITY;

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
        eyebrow="The honest math · 2026 → 2030"
        title="Conditional probabilities, not hopeful targets."
        subtitle="Click a phase for what has to be true. The footer shows the multiplied absolute outcome and the most-likely real exit."
      />

      {/* Phase cards — 4-column responsive grid */}
      <div
        style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          background: 'linear-gradient(180deg, rgba(22,163,74,0.02) 0%, transparent 100%)',
        }}
      >
        {HONEST_PROBABILITY_PATH.map(phase => {
          const isActive = phase.id === activePhaseId;
          return (
            <motion.button
              key={phase.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActivePhaseId(phase.id)}
              style={{
                textAlign: 'left',
                padding: 16,
                borderRadius: 12,
                background: isActive ? `${phase.accent}10` : 'var(--bg-elevated)',
                border: `1px solid ${isActive ? phase.accent : 'var(--border-primary)'}`,
                borderTop: `4px solid ${phase.accent}`,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: phase.accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {phase.quarter}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: '1px solid var(--border-primary)',
                    letterSpacing: '0.1em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {STATUS_LABEL[phase.status]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                  letterSpacing: '-0.01em',
                  marginBottom: 8,
                }}
              >
                {phase.headline}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.02em',
                }}
              >
                {phase.targets.arr} · {phase.targets.valuation}
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: phase.accent,
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {(phase.conditionalProbability * 100).toFixed(0)}%
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  if prior phase landed
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Active phase detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePhase.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
          style={{
            margin: '0 24px 20px',
            padding: 22,
            borderRadius: 12,
            background: 'var(--bg-elevated)',
            border: `1px solid ${activePhase.accent}`,
            borderLeft: `4px solid ${activePhase.accent}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: activePhase.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontFamily: 'var(--font-mono, monospace)',
              marginBottom: 6,
            }}
          >
            {activePhase.quarter} · what has to be true
          </div>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 16px',
            }}
          >
            {activePhase.framing}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {activePhase.whatHasToBeTrue.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <CheckCircle2
                  size={14}
                  style={{
                    color: activePhase.accent,
                    flexShrink: 0,
                    marginTop: 3,
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderLeft: '3px solid #EF4444',
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: '#EF4444',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontFamily: 'var(--font-mono, monospace)',
                marginBottom: 5,
              }}
            >
              Primary risk
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {activePhase.primaryRisk}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Math footer — absolute outcome + baseline multiple + most-likely exit */}
      <div
        style={{
          margin: '0 24px 28px',
          padding: 20,
          borderRadius: 12,
          background:
            'linear-gradient(135deg, rgba(22,163,74,0.06) 0%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 14,
          }}
        >
          <Stat
            icon={<TrendingUp size={14} />}
            label="Absolute path probability"
            value={`${(ABSOLUTE_UNICORN_PROBABILITY * 100).toFixed(2)}%`}
            sub="Multiplied conditionals · 2030 unicorn IPO outcome"
            accent="#16A34A"
          />
          <Stat
            icon={<Target size={14} />}
            label="vs pre-seed B2B baseline"
            value={`${baselineMultiple.toFixed(0)}× lift`}
            sub={`Baseline ~${(BASELINE_PRESEED_UNICORN_PROBABILITY * 100).toFixed(2)}% · Crunchbase / CB Insights cohort math`}
            accent="#0EA5E9"
          />
          <Stat
            icon={<AlertCircle size={14} />}
            label="Most-likely real outcome"
            value="Acquisition"
            sub={`${MOST_LIKELY_OUTCOME.shape} · ${MOST_LIKELY_OUTCOME.range}`}
            accent="#7C3AED"
          />
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            background: 'var(--bg-card)',
            padding: 12,
            borderRadius: 8,
            border: '1px solid var(--border-primary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Read this honestly.</strong>{' '}
          {MOST_LIKELY_OUTCOME.note} The point of the conditional probabilities above is not to feel
          low — they are 10× the baseline B2B pre-seed founder. The point is that the multiplier
          only works if every prior phase actually lands. Mark phases reached and re-multiply
          quarterly.
        </div>
      </div>

      {/* Hard-truth risk tracker */}
      <div
        style={{
          padding: '0 24px 28px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#EF4444',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            fontFamily: 'var(--font-mono, monospace)',
            marginBottom: 6,
          }}
        >
          Live · five hard-truth weaknesses
        </div>
        <h4
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 12px',
            letterSpacing: '-0.015em',
          }}
        >
          What will actually break the path if unaddressed.
        </h4>
        <div style={{ display: 'grid', gap: 8 }}>
          {HARD_TRUTH_RISKS.map(risk => {
            const isOpen = openRiskId === risk.id;
            return (
              <div
                key={risk.id}
                style={{
                  borderRadius: 10,
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${isOpen ? '#EF4444' : 'var(--border-primary)'}`,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setOpenRiskId(isOpen ? null : risk.id)}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AlertCircle size={12} color="#EF4444" />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {risk.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono, monospace)',
                        letterSpacing: '0.04em',
                        marginTop: 2,
                      }}
                    >
                      {risk.phaseImpact}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {isOpen ? '–' : '+'}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{
                        borderTop: '1px solid var(--border-primary)',
                        padding: '14px 16px 16px 50px',
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                      <RiskRow label="Evidence" body={risk.evidence} />
                      <RiskRow label="Countermove" body={risk.countermove} accent="#16A34A" />
                      <RiskRow label="Tripwire" body={risk.tripwire} accent="#EF4444" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 9.5,
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontFamily: 'var(--font-mono, monospace)',
          marginBottom: 6,
        }}
      >
        <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: accent,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{sub}</div>
    </div>
  );
}

function RiskRow({ label, body, accent }: { label: string; body: string; accent?: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          color: accent ?? 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontFamily: 'var(--font-mono, monospace)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}
