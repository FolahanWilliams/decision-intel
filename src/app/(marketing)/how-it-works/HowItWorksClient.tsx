'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  Microscope,
  BookOpen,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';

import { MarketingNav } from '@/components/marketing/MarketingNav';
import { PipelineMiniatureViz } from '@/components/marketing/how-it-works/PipelineMiniatureViz';
import { AnatomyOfACallGraph } from '@/components/marketing/AnatomyOfACallGraph';
import { PipelineFlowDiagram } from '@/components/marketing/how-it-works/PipelineFlowDiagram';
import { PipelineNodeDetail } from '@/components/marketing/how-it-works/PipelineNodeDetail';
import { FeaturedBiasCard } from '@/components/marketing/how-it-works/FeaturedBiasCard';
import { DqiComponentBars } from '@/components/marketing/how-it-works/DqiComponentBars';
import { NoiseDistributionViz } from '@/components/marketing/how-it-works/NoiseDistributionViz';
import { BoardroomSimViz } from '@/components/marketing/how-it-works/BoardroomSimViz';
import { OutcomeDetectionViz } from '@/components/marketing/how-it-works/OutcomeDetectionViz';
import { DprAnatomyViz } from '@/components/marketing/how-it-works/DprAnatomyViz';
import { CounterfactualLiftViz } from '@/components/marketing/how-it-works/CounterfactualLiftViz';
import { ResearchCitationCard } from '@/components/marketing/how-it-works/ResearchCitationCard';
import { ToxicNetworkGraph } from '@/components/marketing/genome/ToxicNetworkGraph';
import { computeGenomeFromSeed } from '@/lib/data/bias-genome-seed';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { PLATFORM_BASELINE_SNAPSHOT } from '@/lib/learning/platform-baseline-snapshot';

// Bias count derived from BIAS_EDUCATION (count-discipline rule); when DI-B-023
// lands the marketing copy picks it up automatically. The interaction matrix
// dimension (MATRIX_DIMENSION imported above) is the same number by
// construction — see the parity test in interaction-matrix.test.ts.
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

// R²F detectors — the three operationalisations of Kahneman & Klein 2009 +
// Kahneman & Lovallo 2003 that fire on every audit. Each ships as a
// first-class strip on the DPR cover; here they get a public marketing
// surface so a procurement reader can verify the methodology against the
// source paper before procurement-stage diligence.
const R2F_DETECTORS = [
  {
    id: 'R²F · Detector 1',
    /** Plain-language label — DESIGN.md universal point #9. Lead the
     *  cold reader with what the output IS, not what the academic
     *  literature calls it. The technical name lives in `technicalLabel`
     *  as a subhead + the academic anchor below. Item 4 lock 2026-05-07. */
    label: 'Validity',
    technicalLabel: 'Validity Classifier',
    body: 'Classifies the decision domain into high / medium / low / zero validity. High-validity domains have stable rules and rapid feedback (chess, weather forecasting one week out). Low-validity domains are noisy with delayed feedback (M&A, market entry, long-horizon strategy). Most strategic memos sit in the low / zero band.',
    dqiShift:
      'Confidence-language is penalised harder in low-validity domains (the same rhetorical certainty that scores neutrally on a high-validity decision becomes an Illusion-of-Validity flag in low-validity contexts). Methodology v2.1.0.',
    anchor:
      'Anchor: Kahneman & Klein, "Conditions for Intuitive Expertise: A Failure to Disagree" (American Psychologist, 2009) · first condition.',
  },
  {
    id: 'R²F · Detector 2',
    label: 'Outside View',
    technicalLabel: 'Reference Class Forecast',
    body: `Pure-function similarity scoring against the ${PLATFORM_BASELINE_SNAPSHOT.n}-case reference-class corpus. Returns top-5 historical analogs + matched-class baseline failure rate + four-band predicted outcome (succeeds / mixed / struggles / fails / too-small-to-judge). Structurally novel decisions return "too small to judge" rather than a fabricated forecast: the cold-start posture is honest.`,
    dqiShift:
      'When the matched class shows a higher base-rate failure than the memo concedes, the audit flags Inside-View Dominance (DI-B-022) and the audit-committee-ready hardening question lands on the cover of the DPR.',
    anchor:
      'Anchor: Kahneman & Lovallo, "Delusions of Success: How Optimism Undermines Executives\' Decisions" (Harvard Business Review, July 2003).',
  },
  {
    id: 'R²F · Detector 3',
    label: 'Author Calibration',
    technicalLabel: 'Feedback Adequacy',
    body: 'Audits the second condition for trustworthy intuition. Has the decision-maker had enough closed-loop feedback in this specific domain for their experience to be calibrated? Verdict bands: adequate (≥10 closed outcomes in domain past 18 months) / sparse (3-9) / cold-start (<3) / unknown.',
    dqiShift:
      'Cold-start posture: an audit by a domain-novice carries the same scrutiny rules as one with high closed-outcome history but the experience-based confidence claims are flagged for the reviewer rather than discounted silently.',
    anchor:
      'Anchor: Kahneman & Klein (2009) · second condition (adequate opportunity to learn from rapid feedback).',
  },
] as const;

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  red: '#DC2626',
  amber: '#F59E0B',
  violet: '#7C3AED',
  violetLight: 'rgba(124, 58, 237, 0.08)',
};

const FEATURED_BIASES = [
  {
    biasKey: 'confirmation_bias',
    taxonomyId: 'DI-B-001',
    label: 'Confirmation Bias',
    description:
      'Selectively citing evidence that supports the dominant hypothesis and dismissing evidence that would reverse the call.',
    example: { title: 'Kodak', company: 'Kodak', year: '1975–2012' },
  },
  {
    biasKey: 'groupthink',
    taxonomyId: 'DI-B-004',
    label: 'Groupthink',
    description:
      'Suppressing dissent to maintain group harmony. The memo reads like unanimous consensus where there should be friction.',
    example: { title: 'Bay of Pigs', company: 'U.S. Government', year: '1961' },
  },
  {
    biasKey: 'authority_bias',
    taxonomyId: 'DI-B-005',
    label: 'Authority Bias',
    description:
      'Senior-voice framing replaces independent judgment. The argument defers to position, not evidence.',
    example: { title: 'Milgram Experiments', company: 'Yale University', year: '1963' },
  },
  {
    biasKey: 'overconfidence_bias',
    taxonomyId: 'DI-B-007',
    label: 'Overconfidence',
    description:
      'Stated certainty far exceeds what the evidence supports. Confidence language without commensurate calibration.',
    example: { title: 'LTCM collapse', company: 'LTCM', year: '1998' },
  },
  {
    biasKey: 'planning_fallacy',
    taxonomyId: 'DI-B-009',
    label: 'Planning Fallacy',
    description:
      'Timelines and costs estimated bottom-up instead of against comparable reference classes. Understated by design.',
    example: { title: 'Sydney Opera House', company: 'NSW Government', year: '1957–1973' },
  },
  {
    biasKey: 'status_quo_bias',
    taxonomyId: 'DI-B-012',
    label: 'Status Quo Bias',
    description:
      'Preference for the current path dressed up as strategic discipline. Inaction gets the benefit of every doubt.',
    example: { title: 'Blockbuster vs. Netflix', company: 'Blockbuster', year: '2000–2010' },
  },
];

const SAMPLE_DQI_SCORES = [
  {
    label: 'Enron (Aug 2001)',
    score: 38,
    grade: 'D',
    color: '#EA580C',
    note: 'Groupthink + authority + off-balance-sheet masking.',
  },
  {
    label: 'Apple iPhone (Jan 2007)',
    score: 86,
    grade: 'A',
    color: C.green,
    note: 'Explicit risks, dissent tracked, reference class cited.',
  },
  {
    label: 'WeWork S-1 (Aug 2019)',
    score: 24,
    grade: 'F',
    color: C.red,
    note: 'Narrative fallacy, founder halo, undefined unit economics.',
  },
];

const RESEARCH_CITATIONS = [
  {
    authorMonogram: 'DK',
    authors: 'Daniel Kahneman, Olivier Sibony, Cass Sunstein',
    title: 'Noise: A Flaw in Human Judgment',
    year: '2021',
    connection:
      'Ensemble sampling across three Kahneman-side nodes plus inter-judge variance scoring inside the Noise Judge node come directly from this framework.',
    featureName: 'Noise Judge',
  },
  {
    authorMonogram: 'GK',
    authors: 'Gary Klein',
    title: 'Sources of Power: How People Make Decisions',
    year: '1998',
    connection:
      'Recognition-Primed Decision theory grounds the RPD Recognition node: pattern matching against a labeled historical library.',
    featureName: 'RPD Recognition',
  },
  {
    authorMonogram: 'KT',
    authors: 'Daniel Kahneman & Amos Tversky',
    title: 'Prospect Theory & Judgment under Uncertainty',
    year: '1974 / 1979',
    connection:
      'The foundational taxonomy for framing, loss aversion, anchoring, and availability biases detected by the Bias Detective.',
    featureName: 'Bias Detective',
  },
  {
    authorMonogram: 'PT',
    authors: 'Philip Tetlock',
    title: 'Superforecasting & Expert Political Judgment',
    year: '2005 / 2015',
    connection:
      'Calibration methodology for the outcome flywheel and the Forgotten Questions node: what are you not asking?',
    featureName: 'Forgotten Questions',
  },
  {
    authorMonogram: 'AD',
    authors: 'Annie Duke',
    title: 'Thinking in Bets',
    year: '2018',
    connection:
      'Probabilistic decision framing behind the blind-prior capture and per-analysis confidence model.',
    featureName: 'Blind priors',
  },
  {
    authorMonogram: 'IS',
    authors: 'Ilya Strebulaev',
    title: 'Stanford VC Initiative · Corporate Decision Research',
    year: 'ongoing',
    connection:
      'Source for the 11 strategy-specific biases (entry-price anchor, thesis confirmation, winner\u2019s curse, management halo).',
    featureName: '11 strategy biases',
  },
  {
    authorMonogram: 'RD',
    authors: 'Ray Dalio',
    title: 'Principles for Dealing with the Changing World Order',
    year: '2021',
    connection:
      '18 rise-and-fall determinants (debt cycle, currency cycle, reserve-currency status, governance, infrastructure) feed the Structural Assumptions audit, the macro-layer pass that sits beside cognitive-bias detection, asking what the plan is betting on about the world.',
    featureName: 'Structural Assumptions',
  },
];

export function HowItWorksClient() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const genome = computeGenomeFromSeed();

  return (
    <div style={{ background: C.slate50, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* HERO ───────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '72px 24px 56px',
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
              gap: 48,
              alignItems: 'center',
            }}
            className="hiw-hero"
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: C.green,
                  marginBottom: 18,
                }}
              >
                Inside the engine
              </div>
              <h1
                style={{
                  fontSize: 'clamp(34px, 5.5vw, 62px)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  marginBottom: 20,
                }}
              >
                How we audit a strategic memo
                <span style={{ color: C.green }}>.</span>
              </h1>
              <p
                style={{
                  fontSize: 'clamp(16px, 1.8vw, 19px)',
                  lineHeight: 1.55,
                  color: C.slate600,
                  margin: 0,
                  marginBottom: 14,
                  maxWidth: 560,
                }}
              >
                The audit fires the constraint while the deal sponsor is still drafting &mdash; not
                after the IC memo lands. Twelve specialized agents grounded in Kahneman, Klein, and
                Tetlock. The audit log carries the provenance, so the corp dev lead routes the
                flagged signal to the sponsor without spending personal political capital on the
                challenge. The methodology backbone (taxonomy, frameworks, regulatory map) lives
                further down the page for procurement readers.
              </p>
              <p style={{ fontSize: 14, color: C.slate500, margin: 0, maxWidth: 560 }}>
                This is a general-but-detailed walk-through of our methodology. It omits proprietary
                weights and prompts by design. Everything you see here is public-safe, citable, and
                reproducible against the academic record.
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    background: C.green,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <FileText size={14} /> Try it on a memo <ArrowRight size={14} />
                </Link>
                <Link
                  href="/taxonomy"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    background: C.white,
                    color: C.slate900,
                    border: `1px solid ${C.slate200}`,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <BookOpen size={14} /> See the taxonomy
                </Link>
                <a
                  href="#research"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    color: C.slate600,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Read the research <ChevronDown size={14} />
                </a>
              </div>
            </div>
            <div>
              <PipelineMiniatureViz />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1b — ANATOMY OF A CALL (the constellation beat) ─────
          Mirrors the landing-page ScrollRevealGraph pentagon so readers
          who arrived from /proof or /pricing see the same moat visual
          they almost-saw on the landing overlay. Shared component:
          AnatomyOfACallGraph (single source of truth). */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
              gap: 48,
              alignItems: 'center',
            }}
            className="hiw-anatomy"
          >
            <div>
              <SectionHeader
                eyebrow="Anatomy of a call"
                title="Every Decision Intel call composes five rigor layers around one decision."
                body="Knowledge Graph (what you've decided before), AI Boardroom (how each stakeholder will receive the memo), Reasoning Audit (what the bias + noise stack flags), What-if (the counterfactual impact), Outcome Loop (how the decision actually played out). Individually, any one of these is a feature. Composed, they are the call. The pipeline below is how we assemble them."
              />
            </div>
            <div
              style={{
                maxWidth: 420,
                margin: '0 auto',
                aspectRatio: '1 / 1',
                width: '100%',
              }}
            >
              <AnatomyOfACallGraph stage={5} size={420} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PIPELINE ───────────────────────────────── */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="The pipeline"
            title="Twelve specialized agents. Three zones."
            body="Every memo passes through a sequential preprocessing chain, then a parallel fan-out of seven analysis agents that reason over the same shared context, then a two-step synthesis that reconciles the signals and computes a deterministic score. Click any node to see what it does."
          />
          <PipelineFlowDiagram
            activeNodeId={activeNodeId}
            onSelectNode={id => setActiveNodeId(id === activeNodeId ? null : id)}
          />
          <PipelineNodeDetail nodeId={activeNodeId} onClose={() => setActiveNodeId(null)} />
        </div>
      </section>

      {/* SECTION 3 — BIAS DETECTION ─────────────────────────────── */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Bias detection"
            title="Thirty-plus cognitive biases. Every detection citable."
            body="Our taxonomy is published openly at /taxonomy (DI-B-001 onward, growing as the Kahneman-Klein paper-application sprint lands new detectors), extended with eleven strategy-specific biases drawn from Stanford VC and PE decision research. Every detection comes back with an excerpt, a severity, and a confidence score."
          />

          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 28,
            }}
          >
            <StatPill value="30+" label="cognitive biases" />
            <StatPill
              value={String(BIAS_COUNT)}
              label={`general (DI-B-001–${String(BIAS_COUNT).padStart(3, '0')})`}
            />
            <StatPill value="11" label="strategy-specific" />
            <StatPill value="0" label="detections without an excerpt" />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {FEATURED_BIASES.map(b => (
              <FeaturedBiasCard
                key={b.biasKey}
                taxonomyId={b.taxonomyId}
                biasKey={b.biasKey}
                label={b.label}
                description={b.description}
                example={{
                  title: b.example.title,
                  company: b.example.company,
                  year: b.example.year,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/taxonomy"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 999,
                background: C.white,
                border: `1px solid ${C.slate200}`,
                color: C.slate900,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              See all {BIAS_COUNT} biases with academic citations <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — TOXIC COMBINATIONS ─────────────────────────── */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Toxic combinations"
            title="Individual biases are features. Combinations are catastrophic."
            body={
              <>
                Our {MATRIX_DIMENSION}×{MATRIX_DIMENSION} interaction matrix scores every bias pair
                against the others. Context amplifiers multiply the score when monetary stakes are
                high, dissent is absent, or time pressure is active. False-positive damping kicks in
                when a pattern gets flagged but the outcome succeeded. Over time, each organization
                calibrates its own weights from its own outcomes, which is why this section of the
                engine is the hardest to replicate.
              </>
            }
          />
          <ToxicNetworkGraph patterns={genome.toxicPatterns} />
        </div>
      </section>

      {/* SECTION 4b — M&A WORKFLOW OVERLAYS — locked 2026-05-09 alongside
          the marketing-cascade ship. Surfaces the deal-stage overlay
          model: the patterns the engine catches map onto specific M&A
          deal stages by document type. PMI marked as roadmap so the
          claim stays honest (per CLAUDE.md M&A roadmap, deal-stage UI
          overlays are P3 / acqui-hire window, but the pattern detection
          ALREADY fires at the appropriate stage based on document
          type). Lets a Head of Corp Dev / PE Deal Partner see the M&A
          workflow nativeness without leaving the marketing surface. */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="M&A workflow coverage · by deal stage"
            title="Each pattern fires at the deal stage where it's most decision-fatal."
            body="Document type drives overlay. A CIM gets the seller-halo filter and the strategic-adjacency audit; an IC memo gets the full toxic-combination pass plus the reference-class forecast; a synergy model fires the Synergy Mirage detector hardest. The same 12-node pipeline runs on each, with stage-appropriate prompts layered on top."
          />
          <div className="how-it-works-stages">
            <DealStageCard
              num="1"
              stage="Sourcing"
              docs="CIM · teaser · IM"
              patterns={['Conglomerate Fallacy']}
              detail="Strategic Adjacency Audit. Zook core-vs-adjacency framework on the target's distance from the acquirer's core."
              status="shipped"
            />
            <DealStageCard
              num="2"
              stage="Diligence"
              docs="QofE · model · DD pack"
              patterns={['Synergy Mirage', 'Reference Class Forecast']}
              detail="Synergy claims pattern-matched against BCG triad (mechanism / owner / 90-day milestone). Reference Class Forecast benchmarks projections against the 143-case base rate."
              status="shipped"
            />
            <DealStageCard
              num="3"
              stage="IC Review"
              docs="IC memo · IC deck"
              patterns={['Synergy Mirage', "Winner's Curse", 'Yes Committee']}
              detail="Full toxic-combination pass. Boardroom Decision Twin simulates 5-persona IC vote. Pre-mortem fires prospective hindsight (Klein & Mitchell 1995)."
              status="shipped"
            />
            <DealStageCard
              num="4"
              stage="Closing"
              docs="LOI · final memo · term sheet"
              patterns={["Winner's Curse", 'Sunk Ship']}
              detail="Deal Fever Check: scans final documents against original screening memo for escalation language and anchoring drift."
              status="shipped"
            />
            <DealStageCard
              num="5"
              stage="Post-Merger Integration"
              docs="Integration plan · Day-1 ops"
              patterns={['Synergy Mirage (execution side)']}
              detail="Cultural divergence + IT-simplicity fallacy + talent-flight retention. Roadmap: deeper PMI overlays land once acquirer-side engineering capacity is in place."
              status="roadmap"
            />
          </div>
        </div>
        <style>{`
          .how-it-works-stages {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 14px;
            margin-top: 28px;
          }
          @media (max-width: 1100px) {
            .how-it-works-stages {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 600px) {
            .how-it-works-stages {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>

      {/* SECTION 5 — DQI ────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Decision Quality Index"
            title="A FICO score for decisions. Zero to a hundred, A through F."
            body="The final DQI is a weighted composite across six components. The weights are fixed and transparent; the scores inside each component are computed deterministically from the earlier pipeline outputs. Same inputs always produce the same DQI."
          />
          <DqiComponentBars />

          <div
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14,
            }}
          >
            {SAMPLE_DQI_SCORES.map(s => (
              <div
                key={s.label}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderTop: `3px solid ${s.color}`,
                  borderRadius: 14,
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: C.slate400,
                  }}
                >
                  Sample score
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.slate900 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: s.color,
                      fontFamily: 'var(--font-mono, monospace)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {s.score}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: s.color,
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: `${s.color}18`,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {s.grade}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: C.slate500, margin: 0, lineHeight: 1.5 }}>
                  {s.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5.25 — R²F DETECTORS ─────────────────────────────
          Item 4 lock 2026-05-07. Per DESIGN.md universal point #9: cold
          readers see the OUTPUTS by their plain-language names first
          (Validity / Outside View / Author Calibration); the academic
          framework name + citations live as supporting context. The
          R²F brand stays in the eyebrow + footer because /how-it-works
          IS the dedicated R²F explainer page — it's a warm-context
          surface for procurement readers who arrived intentionally. */}
      <section id="r2f-detectors" style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Three outputs on every audit · plain-language first"
            title="Validity. Outside View. Author Calibration. Three load-bearing outputs, three published papers."
            body={
              <>
                Three signals fire on the audit before the DQI is finalised. Each one is named for
                what the buyer reads on the cover of every Decision Provenance Record. Plain
                language for the procurement reviewer, with the Recognition-Rigor Framework
                technical names + the source-paper citations carried as the supporting context. Each
                shifts the score, and each appears as a first-class strip on every audit so the
                methodology is verifiable against the source paper directly.
              </>
            }
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 18,
            }}
          >
            {R2F_DETECTORS.map(d => (
              <div
                key={d.id}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderTop: `3px solid ${C.green}`,
                  borderRadius: 14,
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: C.green,
                  }}
                >
                  {d.id}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 700,
                      color: C.slate900,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {d.label}
                  </h3>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.slate500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Technical name · {d.technicalLabel}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.slate600 }}>
                  {d.body}
                </p>
                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 12,
                    borderTop: `1px dashed ${C.slate200}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: C.slate400,
                    }}
                  >
                    What shifts in the DQI
                  </div>
                  <div style={{ fontSize: 12.5, color: C.slate700, lineHeight: 1.5 }}>
                    {d.dqiShift}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11.5,
                    color: C.slate500,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {d.anchor}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 28,
              padding: '20px 24px',
              background: C.slate50,
              border: `1px solid ${C.slate200}`,
              borderLeft: `3px solid ${C.green}`,
              borderRadius: 12,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ flex: '1 1 320px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: C.green,
                  marginBottom: 6,
                }}
              >
                Calibration anchor
              </div>
              <div style={{ fontSize: 14.5, color: C.slate700, lineHeight: 1.55 }}>
                The same R²F methodology applied retrospectively to{' '}
                <strong style={{ color: C.slate900 }}>
                  {PLATFORM_BASELINE_SNAPSHOT.n} historical corporate decisions
                </strong>{' '}
                produces a mean Brier score of{' '}
                <strong style={{ color: C.slate900 }}>
                  {PLATFORM_BASELINE_SNAPSHOT.meanBrier.toFixed(3)}
                </strong>{' '}
                · fair band, between CIA-analyst (0.23) and motivated-amateur (0.35) per Tetlock
                anchors.
              </div>
            </div>
            <Link
              href="/r2f-standard#calibration"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                background: C.slate900,
                color: C.white,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              See the calibration baseline
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5.5 — COUNTERFACTUAL LIFT ──────────────────────── */}
      <section id="counterfactual-lift" style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Counterfactual lift"
            title="What shifts when you remove the bias. Made visible."
            body="Every flagged bias on a memo carries a reproducible lift weight: the exact number of DQI points that returns to the score if the bias is mitigated. Toggle the chips below on the actual WeWork S-1 audit and watch the gauge respond. Same memo, same lift, every time. The calculation is deterministic, not generative."
          />
          <CounterfactualLiftViz />
        </div>
      </section>

      {/* SECTION 6 — NOISE + BOARDROOM ──────────────────────────── */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Two parallel stability checks"
            title="Stable reasoning. Surviving dissent."
            body="Two of the seven analysis agents run at the same time and answer complementary questions. Would a second read of the memo come to the same conclusion? And would it survive the real room?"
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
            className="hiw-parallel-checks"
          >
            <NoiseDistributionViz />
            <BoardroomSimViz />
          </div>
        </div>
      </section>

      {/* SECTION 6.5 — THE DECISION PROVENANCE RECORD ───────────── */}
      <section id="provenance-record" style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="The Decision Provenance Record"
            title="What comes out the end. Hashed, cited, and built to be defended."
            body="Every audit produces a Decision Provenance Record: the artifact your team carries into the room when the decision is challenged. Each section below is a real part of the record we generate today; click any row to see what it contains, what regulatory provision it satisfies, and what an external reviewer can verify without leaving the document. Specimen records are publicly available so a procurement reviewer can read one before the conversation starts."
          />
          <DprAnatomyViz />
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <a
              href="/dpr-sample-wework.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: C.white,
                background: C.green,
                padding: '12px 22px',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              <FileText size={15} />
              Read a real DPR (WeWork S-1, PDF)
              <ArrowRight size={14} />
            </a>
            <a
              href="/dpr-sample-dangote.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                color: C.slate700,
                padding: '12px 16px',
                textDecoration: 'none',
                border: `1px solid ${C.slate200}`,
                borderRadius: 10,
                background: C.white,
              }}
            >
              Pan-African shape (Dangote, PDF)
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 7 — OUTCOME LOOP ───────────────────────────────── */}
      <section id="outcome-loop" style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Closing the loop"
            title="Every decision becomes signal for the next one."
            body="An audit is only half the work. After a decision gets made, Decision Intel listens for the outcome through the tools your team already uses (Slack threads, Drive folders, inbox replies, public announcements) and writes what actually happened back into your Decision Knowledge Graph. Your team's calibration improves quarter after quarter, on your own data."
          />
          <OutcomeDetectionViz />
        </div>
      </section>

      {/* SECTION 8 — ACADEMIC FOUNDATION ────────────────────────── */}
      <section id="research" style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Academic foundation"
            title="Standing on shoulders."
            body="None of this methodology is invented in a vacuum. Every node in the pipeline cites a specific academic lineage, and every detected bias on your memo links back to the peer-reviewed paper that first named it."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {RESEARCH_CITATIONS.map(c => (
              <ResearchCitationCard key={c.authorMonogram} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — SECURITY & PRIVACY ─────────────────────────── */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 20,
              padding: '32px 32px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 24,
              alignItems: 'flex-start',
            }}
            className="hiw-security"
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: C.greenLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={26} style={{ color: C.green }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: C.slate400,
                  marginBottom: 8,
                }}
              >
                Security · privacy · compliance
              </div>
              <h3
                style={{
                  fontSize: 'clamp(20px, 2.4vw, 26px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  marginBottom: 14,
                  color: C.slate900,
                }}
              >
                The same standard we audit your memos with, we hold ourselves to.
              </h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 14,
                  color: C.slate600,
                  lineHeight: 1.75,
                }}
              >
                <li>
                  <strong>GDPR anonymizer is the first node</strong>, not an afterthought. PII is
                  redacted before any analysis LLM sees the document. If anonymization fails, the
                  pipeline short-circuits to the risk scorer rather than transmitting raw content.
                </li>
                <li>
                  <strong>AES-256-GCM</strong> document encryption at rest; per-record keys;
                  rotating encryption envelopes.
                </li>
                <li>
                  <strong>Seven-framework compliance mapping</strong> built into the Verification
                  node: FCA Consumer Duty, SOX, Basel III, EU AI Act, SEC Reg D, GDPR, plus an
                  internal framework. The same detection runs on your memos and on our own shipping
                  policies.
                </li>
                <li>
                  <strong>Anonymized aggregation is opt-in.</strong> Your data never contributes to
                  the public Bias Genome or cross-org causal weights unless the org admin flips the
                  switch inside Settings → Privacy.
                </li>
              </ul>
              <p style={{ fontSize: 12, color: C.slate400, marginTop: 14, marginBottom: 0 }}>
                Full data-handling and sub-processor list:{' '}
                <Link
                  href="/privacy"
                  style={{ color: C.green, fontWeight: 600, textDecoration: 'none' }}
                >
                  /privacy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9b — WHY REGULATORS CARE ─────────────────────── */}
      <section style={{ padding: '36px 24px 0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              background: C.slate50,
              border: `1px solid ${C.slate200}`,
              borderRadius: 12,
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <ShieldCheck size={18} style={{ color: C.green, flexShrink: 0 }} />
            <span
              style={{
                fontSize: 14,
                color: C.slate600,
                lineHeight: 1.6,
                flex: 1,
                minWidth: 280,
              }}
            >
              Each node&rsquo;s audit trail maps onto EU AI Act Art. 14, Basel III ICAAP, and SEC AI
              disclosure.
            </span>
            <Link
              href="/security"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: C.green,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 13.5,
                whiteSpace: 'nowrap',
              }}
            >
              See the mapping
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 88px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              background: C.navy,
              color: C.white,
              borderRadius: 20,
              padding: '44px 44px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 28,
              alignItems: 'center',
            }}
            className="hiw-cta"
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: C.green,
                  marginBottom: 10,
                }}
              >
                Your turn
              </div>
              <h3
                style={{
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  marginBottom: 8,
                  color: C.white,
                }}
              >
                Run the engine on your next strategic memo.
              </h3>
              <p style={{ fontSize: 14.5, color: C.slate300, margin: 0, maxWidth: 640 }}>
                Upload takes 60 seconds. The twelve-node pipeline you just read about runs on your
                document and returns a DQI, flagged biases, toxic combinations, and the questions
                the memo didn&apos;t ask.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: C.green,
                  color: C.white,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <FileText size={14} /> Audit your memo <ArrowRight size={14} />
              </Link>
              <Link
                href="/proof"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  color: C.white,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <Microscope size={14} /> See the proof
              </Link>
              <Link
                href="/r2f-standard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  color: C.white,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <GraduationCap size={14} /> Read the R²F standard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .hiw-hero { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hiw-anatomy { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hiw-parallel-checks { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .hiw-security, .hiw-cta {
            grid-template-columns: 1fr !important;
            padding: 28px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Small presentational helpers ────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28, maxWidth: 800 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: C.green,
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: 'clamp(26px, 3.5vw, 38px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: 0,
          marginBottom: 10,
          color: C.slate900,
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, color: C.slate600, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

function DealStageCard({
  num,
  stage,
  docs,
  patterns,
  detail,
  status,
}: {
  num: string;
  stage: string;
  docs: string;
  patterns: string[];
  detail: string;
  status: 'shipped' | 'roadmap';
}) {
  const accent = status === 'shipped' ? C.green : C.amber;
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '18px 18px 16px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: C.slate400,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.05em',
          }}
        >
          STAGE {num}
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: accent,
            background: status === 'shipped' ? C.greenLight : 'rgba(245,158,11,0.10)',
            padding: '2px 7px',
            borderRadius: 999,
          }}
        >
          {status === 'shipped' ? 'live' : 'roadmap'}
        </span>
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: C.slate900,
          margin: 0,
          marginBottom: 6,
          letterSpacing: '-0.01em',
        }}
      >
        {stage}
      </h3>
      <div
        style={{
          fontSize: 11,
          color: C.slate500,
          fontFamily: 'var(--font-mono, monospace)',
          marginBottom: 10,
          lineHeight: 1.4,
        }}
      >
        {docs}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {patterns.map(p => (
          <span
            key={p}
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: C.slate700,
              background: C.slate100,
              border: `1px solid ${C.slate200}`,
              padding: '2px 7px',
              borderRadius: 4,
            }}
          >
            {p}
          </span>
        ))}
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: C.slate600,
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {detail}
      </p>
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 12,
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: C.slate900,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 12, color: C.slate500, fontWeight: 600 }}>{label}</span>
    </div>
  );
}
