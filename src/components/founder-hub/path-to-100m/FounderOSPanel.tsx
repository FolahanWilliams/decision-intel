'use client';

/**
 * Founder OS visualizations — 4 bespoke SVG + Framer Motion
 * sub-components codifying research-backed protocols for cognitive
 * sovereignty, encoding, external memory, and founder-led marketing.
 *
 * Locked 2026-05-02. Refactored 2026-05-02 from a standalone
 * FounderOSPanel section (which was the "build new things on top"
 * anti-pattern the founder explicitly rejected) into individual
 * exports interwoven into existing PathToHundredMillion sections:
 *
 *   - CognitiveSovereigntyStack  → StrengthsWeaknessesMatrix
 *   - EncodingProtocolsFlow      → R2FDeepDive (6th moat-deepening lever)
 *   - ExternalMemoryArchitecture → NotebookLmFollowUpLab (header context)
 *   - FounderLedMarketingRhythm  → RoleOutreachPlaybooks (discipline header)
 *
 * Strategic intent: the same R²F discipline DI runs on a customer's
 * memo applies to the founder's own knowledge work. The platform's
 * compounding moat (Decision Knowledge Graph + outcome flywheel)
 * mirrors the founder's compounding personal-mind moat (NotebookLM
 * master KB + Education Room + CLAUDE.md). Visible alignment between
 * product architecture and personal protocol is the ownable narrative —
 * but the alignment must be VISIBLE INSIDE existing surfaces, not in
 * a parallel "Founder OS" section, or the narrative is just feature-pile.
 *
 * Sources:
 *   - "Sociotechnical Convergence" research paper (2026-05-02 founder
 *     research) on Reverse Flynn Effect, neurobiological protection,
 *     digital asceticism, encoding protocols, agentic-shift defensive
 *     strategy.
 *   - GTM v3.3 §6 — Sharran's 1-1-1 framework lock.
 *   - Tiago Forte's "Building a Second Brain" — Progressive Summarization.
 *   - Cal Newport "Deep Work" — System 2 cognitive amplification.
 *   - Daniel Kahneman, Thinking Fast and Slow — System 1/System 2 ratio.
 *
 * Update HERE when: protocol research deepens, the 1-1-1 framework
 * shifts, or the external-memory stack changes (e.g. NotebookLM master
 * KB notebook ID changes, Founder Hub adds a new memory layer).
 */

import { useReducedMotion, motion } from 'framer-motion';
import {
  Shield,
  Layers,
  Network as NetworkIcon,
  Repeat,
  Activity,
  Brain,
  BookOpen,
  Zap,
  Megaphone,
} from 'lucide-react';

const ACCENT = 'var(--accent-primary)';
const BORDER = 'var(--border-color)';
const BG_ELEVATED = 'var(--bg-elevated)';
const BG_CARD = 'var(--bg-card)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const TEXT_SECONDARY = 'var(--text-secondary)';
const SUCCESS = 'var(--success)';
const WARNING = 'var(--warning)';

// ─── Sub-viz 1: Cognitive Sovereignty Stack ─────────────────────────

interface SovereigntyTier {
  level: number;
  label: string;
  icon: React.ReactNode;
  protocols: string[];
  source: string;
}

const SOVEREIGNTY_TIERS: SovereigntyTier[] = [
  {
    level: 4,
    label: 'Deploy · ethical AI orchestration',
    icon: <Megaphone size={14} />,
    protocols: [
      'AI as system to direct, not oracle to query',
      '1-1-1 marketing discipline (one channel, one offer, one delivery)',
      'Build-in-public cadence on bias case studies',
    ],
    source: 'Research paper · Irreplaceable Skill Acquisition + GTM v3.3 §6',
  },
  {
    level: 3,
    label: 'Encode · compounding memory',
    icon: <Repeat size={14} />,
    protocols: [
      'Active Recall over re-reading — pause + retrieve',
      'Elaborative Encoding — explain WHY in own words',
      'Progressive Summarization — bullets → highlight → distill',
    ],
    source: 'Karpicke 2008 · Bjork 1994 · Tiago Forte Building a Second Brain',
  },
  {
    level: 2,
    label: 'Acquire · System 2 deep work',
    icon: <BookOpen size={14} />,
    protocols: [
      'Long-form (30-90+ min) over short-form algorithmic content',
      'Deep reading: dense print rebuilds inferential reasoning',
      'Tolerance for boredom — reset dopaminergic baseline',
    ],
    source: 'Cal Newport Deep Work · Reverse Flynn Effect research',
  },
  {
    level: 1,
    label: 'Protect · neurobiological foundation',
    icon: <Shield size={14} />,
    protocols: [
      'Zero algorithmic short-form video (TikTok / Reels / Shorts)',
      'Phone-free morning · no notifications during deep work',
      'Physical exercise + sleep architecture',
    ],
    source: 'fMRI/EEG SFV addiction studies · Twenge digital-mental-health research',
  },
];

export function CognitiveSovereigntyStack() {
  const reduce = useReducedMotion();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 14,
        background: BG_CARD,
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
      }}
    >
      {SOVEREIGNTY_TIERS.map((tier, i) => {
        // Pyramid widths: 100% / 92% / 84% / 76% (level 4 widest at top, level 1 at base)
        const widthPct = 100 - (4 - tier.level) * 8;
        return (
          <motion.div
            key={tier.level}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              alignSelf: 'center',
              width: `${widthPct}%`,
              padding: '12px 16px',
              background: BG_ELEVATED,
              border: `1px solid ${BORDER}`,
              borderLeft: `3px solid ${tier.level === 1 ? ACCENT : tier.level === 2 ? SUCCESS : tier.level === 3 ? WARNING : '#7C3AED'}`,
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: ACCENT }}>{tier.icon}</span>
              <span
                style={{
                  fontSize: 'var(--fs-3xs)',
                  fontWeight: 600,
                  color: TEXT_MUTED,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Tier {tier.level}
              </span>
              <span
                style={{
                  fontSize: 'var(--fs-2xs)',
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                }}
              >
                {tier.label}
              </span>
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '6px 0 4px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {tier.protocols.map(p => (
                <li
                  key={p}
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    color: TEXT_SECONDARY,
                    lineHeight: 1.5,
                    paddingLeft: 12,
                    position: 'relative',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, color: TEXT_MUTED }}>•</span>
                  {p}
                </li>
              ))}
            </ul>
            <div
              style={{
                fontSize: 'var(--fs-3xs)',
                color: TEXT_MUTED,
                fontStyle: 'italic',
                marginTop: 4,
              }}
            >
              Source: {tier.source}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Sub-viz 2: Encoding Protocols (3-stage flow) ───────────────────

interface EncodingStage {
  id: string;
  label: string;
  protocol: string;
  technique: string;
  whenItFires: string;
  icon: React.ReactNode;
  color: string;
}

const ENCODING_STAGES: EncodingStage[] = [
  {
    id: 'capture',
    label: 'Capture',
    protocol: 'Bullets while watching',
    technique: 'Time-stamped notes during long-form video / book / paper. Don\'t paraphrase yet — capture the raw quote + the timestamp.',
    whenItFires: 'During a long-form interview · podcast · book session',
    icon: <BookOpen size={16} />,
    color: '#0EA5E9',
  },
  {
    id: 'encode',
    label: 'Encode',
    protocol: 'Elaborative Encoding',
    technique: 'Explain WHY the concept is true in your own words. Connect it to existing knowledge — what does this remind you of in CLAUDE.md, in your product, in a prior decision?',
    whenItFires: 'Within 24h of capture · before recall starts decaying',
    icon: <Brain size={16} />,
    color: WARNING,
  },
  {
    id: 'recall',
    label: 'Recall',
    protocol: 'Active Recall + Progressive Summarization',
    technique: 'Pause the video / close the book. Retrieve the concept from memory in writing. Then revisit notes, highlight only the most important parts, summarize the highlights again. Each layer compounds.',
    whenItFires: 'Day 1 · Day 3 · Week 1 · Month 1 (SM-2 schedule)',
    icon: <Repeat size={16} />,
    color: SUCCESS,
  },
];

export function EncodingProtocolsFlow() {
  const reduce = useReducedMotion();
  return (
    <div
      style={{
        padding: 14,
        background: BG_CARD,
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          alignItems: 'stretch',
        }}
        className="founder-os-encoding-grid"
      >
        {ENCODING_STAGES.map((stage, i) => (
          <motion.div
            key={stage.id}
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            style={{
              padding: 12,
              background: BG_ELEVATED,
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              borderTop: `3px solid ${stage.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `${stage.color}20`,
                  color: stage.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stage.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: TEXT_MUTED,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Stage {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    color: TEXT_PRIMARY,
                  }}
                >
                  {stage.label}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 'var(--fs-2xs)',
                fontWeight: 600,
                color: stage.color,
                marginTop: 4,
              }}
            >
              {stage.protocol}
            </div>
            <div
              style={{
                fontSize: 'var(--fs-2xs)',
                color: TEXT_SECONDARY,
                lineHeight: 1.5,
              }}
            >
              {stage.technique}
            </div>
            <div
              style={{
                fontSize: 'var(--fs-3xs)',
                color: TEXT_MUTED,
                fontStyle: 'italic',
                marginTop: 'auto',
                paddingTop: 6,
              }}
            >
              When it fires: {stage.whenItFires}
            </div>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'rgba(22, 163, 74, 0.06)',
          border: `1px solid ${SUCCESS}30`,
          borderRadius: 8,
          fontSize: 'var(--fs-2xs)',
          color: TEXT_SECONDARY,
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: TEXT_PRIMARY }}>The compounding loop:</strong>{' '}
        This mirrors what Decision Intel runs on every customer memo — capture (document upload) →
        encode (R²F + DPR provenance) → recall (Decision Knowledge Graph). The product&apos;s moat is the
        founder&apos;s personal protocol made into an enterprise-grade artefact.
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          :global(.founder-os-encoding-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-viz 3: External Memory Architecture (4-layer stack) ────────

interface MemoryLayer {
  layer: number;
  label: string;
  example: string;
  feeds: string;
  icon: React.ReactNode;
}

const MEMORY_LAYERS: MemoryLayer[] = [
  {
    layer: 4,
    label: 'Decision Provenance Record (product output)',
    example: 'Hashed + tamper-evident PDF · 6 R²F cover signals · 19-framework regulatory map',
    feeds: 'Customer artefact → audit committee + GC + procurement',
    icon: <Activity size={14} />,
  },
  {
    layer: 3,
    label: 'CLAUDE.md (canonical project lock)',
    example: 'Positioning vocabulary · External Attack Vectors · drift-class rules · founder constraints',
    feeds: 'Every Claude Code session loads this · every nightly audit reads it · founder-context.ts mirrors it',
    icon: <Layers size={14} />,
  },
  {
    layer: 2,
    label: 'Founder Hub (operational interface)',
    example: '28 tabs · PathToHundredMillion + Education Room + Sparring Room + Founder School + Outreach Hub',
    feeds: 'Daily founder workflow · pre-event drilling · live conversations',
    icon: <NetworkIcon size={14} />,
  },
  {
    layer: 1,
    label: 'NotebookLM master KB (synthesis layer)',
    example: 'Notebook 809f5104 · 200+ sources · cross-document synthesis · primary research',
    feeds: 'Strategic decisions · positioning shifts · investor-narrative drafts · NotebookLM follow-up lab',
    icon: <Brain size={14} />,
  },
];

export function ExternalMemoryArchitecture() {
  const reduce = useReducedMotion();
  return (
    <div
      style={{
        padding: 14,
        background: BG_CARD,
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
        {MEMORY_LAYERS.map((m, i) => (
          <motion.div
            key={m.layer}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            style={{
              padding: '12px 14px',
              background: BG_ELEVATED,
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div
              style={{
                minWidth: 32,
                height: 32,
                borderRadius: '50%',
                background: `${ACCENT}15`,
                color: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 'var(--fs-2xs)',
              }}
            >
              {m.layer}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ color: TEXT_MUTED, opacity: 0.7 }}>{m.icon}</span>
                Layer {m.layer} · {m.label}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-2xs)',
                  color: TEXT_SECONDARY,
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                {m.example}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-3xs)',
                  color: TEXT_MUTED,
                  fontStyle: 'italic',
                  marginTop: 4,
                }}
              >
                ↳ Feeds: {m.feeds}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'rgba(124, 58, 237, 0.06)',
          border: '1px solid rgba(124, 58, 237, 0.30)',
          borderRadius: 8,
          fontSize: 'var(--fs-2xs)',
          color: TEXT_SECONDARY,
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: TEXT_PRIMARY }}>The fortification rule:</strong> every layer feeds
        the next. NotebookLM produces synthesis → drops into Founder Hub as a section update →
        propagates to CLAUDE.md as a lock → renders on customer DPRs as procurement-grade
        vocabulary. Updates travel UP the stack from research to product, never down. The
        founder&apos;s memory is the platform&apos;s memory; both compound on the same flywheel.
      </div>
    </div>
  );
}

// ─── Sub-viz 4: Founder-led Marketing 1-1-1 Rhythm ──────────────────

interface MarketingPillar {
  type: 'traffic' | 'conversion' | 'delivery';
  label: string;
  primaryChannel: string;
  cadence: string;
  detail: string;
  icon: React.ReactNode;
}

const MARKETING_PILLARS: MarketingPillar[] = [
  {
    type: 'traffic',
    label: 'ONE traffic source',
    primaryChannel: 'LinkedIn + warm intros + in-person events',
    cadence: '1× post per week + warm intros from Mr. Reiner / Mr. Gabe + 2 events/month max',
    detail: 'Build in public anchored to a famous bias-resonance corporate decision (Kodak / Blockbuster / Nokia / WeWork / Theranos / Wirecard) from the 143-case library. Each post drives 1:1 conversations.',
    icon: <Megaphone size={14} />,
  },
  {
    type: 'conversion',
    label: 'ONE conversion mechanism',
    primaryChannel: 'Hybrid discovery + tailored-pitch motion (GTM v3.3 §7)',
    cadence: '20-min audit on a real strategic memo. Discovery first (4 questions), then pitch tailored to revealed signal',
    detail: 'The artefact does the persuasion. The DPR (anonymized) goes home with every prospect. Pattern-match across 10+ before declaring the motion working.',
    icon: <Zap size={14} />,
  },
  {
    type: 'delivery',
    label: 'ONE delivery model',
    primaryChannel: 'Self-serve + Individual £249/mo subscription',
    cadence: 'Frictionless · personal-card / t-card budget · zero procurement gate · WoM scale (Mr. Reiner principle)',
    detail: 'Sankore-class pilots and F500 ceiling come later. Do not split focus. Word of mouth is the only marketing channel that scales without paid acquisition.',
    icon: <Activity size={14} />,
  },
];

export function FounderLedMarketingRhythm() {
  const reduce = useReducedMotion();
  return (
    <div
      style={{
        padding: 14,
        background: BG_CARD,
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          color: TEXT_MUTED,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        Sharran 1-1-1 framework · GTM v3.3 §6 lock
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
        className="founder-os-marketing-grid"
      >
        {MARKETING_PILLARS.map((pillar, i) => (
          <motion.div
            key={pillar.type}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            style={{
              padding: 12,
              background: BG_ELEVATED,
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              borderTop: `3px solid ${ACCENT}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 'var(--fs-3xs)',
                color: ACCENT,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {pillar.icon}
              {pillar.label}
            </div>
            <div
              style={{
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                color: TEXT_PRIMARY,
                lineHeight: 1.35,
              }}
            >
              {pillar.primaryChannel}
            </div>
            <div
              style={{
                fontSize: 'var(--fs-2xs)',
                color: TEXT_SECONDARY,
                fontStyle: 'italic',
                lineHeight: 1.45,
              }}
            >
              {pillar.cadence}
            </div>
            <div
              style={{
                fontSize: 'var(--fs-2xs)',
                color: TEXT_SECONDARY,
                lineHeight: 1.5,
                marginTop: 4,
              }}
            >
              {pillar.detail}
            </div>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'rgba(245, 158, 11, 0.06)',
          border: `1px solid ${WARNING}30`,
          borderRadius: 8,
          fontSize: 'var(--fs-2xs)',
          color: TEXT_SECONDARY,
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: TEXT_PRIMARY }}>Why this stays narrow:</strong> founder-led
        marketing only scales if the channel + offer + delivery are protected from drift. Adding a
        second traffic source (e.g. Twitter/X, paid ads, podcasts) before the first hits the
        graduation rule (5+ paid Individual subscribers retained 90+ days + 10 raving advocates +
        1+ verifiable referral) splits attention without compounding. The 1-1-1 lock is a
        commitment device against the founder&apos;s own future temptation.
      </div>

      <style jsx>{`
        @media (max-width: 800px) {
          :global(.founder-os-marketing-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Wrapper FounderOSPanel + SubSection helper deliberately removed
// 2026-05-02 — interwoven into existing PathToHundredMillion sections
// per the founder's "don't pile new things on top" course-correct.
// Each visualization now lives inside the existing component where it
// belongs (see file header). Add new visualizations here as named
// exports; do NOT reintroduce a wrapper section.
