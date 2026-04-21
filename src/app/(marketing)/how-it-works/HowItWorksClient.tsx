'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, ShieldCheck, Microscope, BookOpen, ChevronDown } from 'lucide-react';

import { MarketingNav } from '@/components/marketing/MarketingNav';
import { PipelineMiniatureViz } from '@/components/marketing/how-it-works/PipelineMiniatureViz';
import { PipelineFlowDiagram } from '@/components/marketing/how-it-works/PipelineFlowDiagram';
import { PipelineNodeDetail } from '@/components/marketing/how-it-works/PipelineNodeDetail';
import { FeaturedBiasCard } from '@/components/marketing/how-it-works/FeaturedBiasCard';
import { DqiComponentBars } from '@/components/marketing/how-it-works/DqiComponentBars';
import { NoiseDistributionViz } from '@/components/marketing/how-it-works/NoiseDistributionViz';
import { BoardroomSimViz } from '@/components/marketing/how-it-works/BoardroomSimViz';
import { OutcomeDetectionViz } from '@/components/marketing/how-it-works/OutcomeDetectionViz';
import { ResearchCitationCard } from '@/components/marketing/how-it-works/ResearchCitationCard';
import { ToxicNetworkGraph } from '@/components/marketing/genome/ToxicNetworkGraph';
import { computeGenomeFromSeed } from '@/lib/data/bias-genome-seed';

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
      'The three-judge jury and inter-judge variance scoring inside the Noise Judge node come directly from this framework.',
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
                The engine behind the native reasoning layer for every boardroom strategic decision.
                Twelve specialized agents, thirty cognitive biases, and a ten-pattern interaction
                model grounded in Kahneman, Klein, and Tetlock. Every memo audited in under
                sixty seconds, so the reasoning lives in one surface instead of four.
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
            body="Our taxonomy is published openly at /taxonomy (DI-B-001 through DI-B-020), extended with eleven strategy-specific biases drawn from Stanford VC and PE decision research. Every detection comes back with an excerpt, a severity, and a confidence score."
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
            <StatPill value="20" label="general (DI-B-001–020)" />
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
              See all 20 biases with academic citations <ArrowRight size={14} />
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
                Our twenty-by-twenty interaction matrix scores every bias pair against the others.
                Context amplifiers multiply the score when monetary stakes are high, dissent is
                absent, or time pressure is active. False-positive damping kicks in when a pattern
                gets flagged but the outcome succeeded. Over time, each organization calibrates its
                own weights from its own outcomes, which is why this section of the engine is the
                hardest to replicate.
              </>
            }
          />
          <ToxicNetworkGraph patterns={genome.toxicPatterns} />
        </div>
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
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .hiw-hero { grid-template-columns: 1fr !important; gap: 32px !important; }
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
