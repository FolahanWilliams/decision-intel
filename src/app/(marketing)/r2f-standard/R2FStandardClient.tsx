'use client';

/**
 * R²F Standard — /r2f-standard
 *
 * A first-party voluntary standard for human-AI strategic reasoning.
 * Decision Intel publishes the rubric, any product can self-assess
 * against it, and the registry is opt-in. If other products carry the
 * R²F mark, the framework becomes a category definition by usage alone
 * (trademark filing deferred until funding round closes).
 *
 * Voice rules:
 *   - "Voluntary standard" — do NOT say "certification" or "compliance,"
 *     mirrors the same language discipline as /regulatory/ai-verify.
 *   - R²F is OUR framework. We are allowed to define the rubric.
 *   - No model names, no vendor names, no "AI-powered" on its own.
 */

import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import {
  ArrowRight,
  Scale,
  Compass,
  Layers,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import {
  PLATFORM_BASELINE_SNAPSHOT,
  PLATFORM_BASELINE_FOOTNOTE,
} from '@/lib/learning/platform-baseline-snapshot';
import { R2FDetectorAtlas } from '@/components/marketing/r2f-standard/R2FDetectorAtlas';
import { POSITIONING_SYNTHESIS_LINE, POSITIONING_EPISTEMIC_HONESTY } from '@/lib/constants/icp';

// Tetlock-anchored Brier scale — ordered low→high (low = better calibration).
// "self" marks where DI's seed baseline lands so the scale reads as procurement
// proof, not a marketing pitch.
interface CalibrationAnchor {
  label: string;
  value: number;
  self?: boolean;
}
const CALIBRATION_ANCHORS: readonly CalibrationAnchor[] = [
  { label: 'Tetlock superforecasters', value: 0.13 },
  { label: 'CIA analysts (calibrated)', value: 0.23 },
  {
    label: 'Decision Intel · platform seed',
    value: PLATFORM_BASELINE_SNAPSHOT.meanBrier,
    self: true,
  },
  { label: 'Coin-flip benchmark', value: 0.25 },
  { label: 'Motivated amateur', value: 0.35 },
];

const C = {
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
  navy: '#0F172A',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.08)',
  blue: '#2563EB',
  blueSoft: 'rgba(37, 99, 235, 0.08)',
};

interface Tenet {
  num: number;
  side: 'rigor' | 'recognition';
  name: string;
  claim: string;
  detail: string;
  pipelineStage: string;
}

const TENETS: Tenet[] = [
  {
    num: 1,
    side: 'rigor',
    name: 'Bias scan',
    claim: 'Every memo is scanned against a published, stable taxonomy of cognitive biases.',
    detail:
      'An R²F-aligned system publishes its bias taxonomy with stable IDs. Scans are reproducible — the same memo produces the same flags on re-run with the same model version.',
    pipelineStage: 'Bias Detective',
  },
  {
    num: 2,
    side: 'rigor',
    name: 'Noise audit',
    claim: 'The system measures internal inconsistency, not only bias.',
    detail:
      'Kahneman (Noise, 2021) separates noise from bias. An R²F-aligned system produces a noise score for every memo — within-memo contradictions, tone variance, and reasoning-chain divergence.',
    pipelineStage: 'Noise Judge',
  },
  {
    num: 3,
    side: 'rigor',
    name: 'Base-rate pull',
    claim: 'Every claim is anchored to a reference class.',
    detail:
      'The system surfaces the base-rate for the category of decision (e.g. cross-border acquisitions, market entry, enterprise software pivots) so the memo is read against prior precedent, not in isolation.',
    pipelineStage: 'Ensemble Sampling',
  },
  {
    num: 4,
    side: 'recognition',
    name: 'Pattern match to playbooks',
    claim: 'Expert intuition is surfaced, not overruled.',
    detail:
      'Klein (Sources of Power, 1998) — experts recognise patterns. An R²F-aligned system produces a list of the historical playbooks the memo most resembles, with confidence and analogues.',
    pipelineStage: 'Recognition-Primed Decision',
  },
  {
    num: 5,
    side: 'recognition',
    name: 'Forgotten questions',
    claim: 'The system names what the memo does not ask.',
    detail:
      'Strategic failures are disproportionately caused by un-asked questions. An R²F-aligned system flags the high-value questions the memo sidestepped and the ones the CEO or board will most likely raise.',
    pipelineStage: 'Forgotten Questions',
  },
  {
    num: 6,
    side: 'recognition',
    name: 'Pre-mortem',
    claim: 'Every memo is told from a future in which it failed.',
    detail:
      'Gary Klein’s pre-mortem technique: assume the decision went wrong, then reason backward to why. An R²F-aligned system produces at least one pre-mortem per memo, anchored in the specific bias signature flagged.',
    pipelineStage: 'Pre-mortem',
  },
];

const SELF_ASSESSMENT: Array<{ question: string; weight: number }> = [
  { question: 'Does the product publish its bias taxonomy with stable IDs?', weight: 1 },
  { question: 'Are bias flags reproducible across runs on the same memo?', weight: 1 },
  { question: 'Is a separate noise score produced for each memo?', weight: 1 },
  { question: 'Is every strategic claim anchored to an explicit reference class?', weight: 1 },
  { question: 'Does the system surface pattern analogues from a published corpus?', weight: 1 },
  { question: 'Are "forgotten questions" flagged as a first-class output?', weight: 1 },
  { question: 'Is a pre-mortem produced for every memo, not just on request?', weight: 1 },
  {
    question: 'Is the pipeline’s reasoning arbitrated by an explicit meta-judge stage?',
    weight: 1,
  },
  { question: 'Does every output trace back to a hashed, tamper-evident record?', weight: 1 },
  {
    question: 'Does the system treat expert intuition as amplified input, not noise to suppress?',
    weight: 1,
  },
];

const TIERS = [
  {
    label: 'Bronze · R²F-aligned',
    minScore: 4,
    blurb:
      '4 of 10 tenets in place. Minimum bar to claim R²F alignment — bias + noise + one recognition signal.',
    tone: C.amber,
    bg: C.amberSoft,
  },
  {
    label: 'Silver · R²F-integrated',
    minScore: 7,
    blurb:
      '7 of 10 tenets in place. Both rigor and recognition pipelines are running, including a named meta-judge.',
    tone: C.blue,
    bg: C.blueSoft,
  },
  {
    label: 'Gold · R²F-arbitrated',
    minScore: 10,
    blurb:
      'All 10 tenets in place. Full Kahneman × Klein synthesis with a signed, reproducible audit record.',
    tone: C.green,
    bg: C.greenSoft,
  },
];

export function R2FStandardClient() {
  return (
    <div style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '72px 24px 48px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            borderRadius: 9999,
            background: C.greenSoft,
            border: `1px solid ${C.greenBorder}`,
            color: C.green,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          <Layers size={12} strokeWidth={2.25} aria-hidden />
          Voluntary standard · v1.0
        </div>
        <h1
          className="marketing-display"
          style={{
            fontSize: 'clamp(34px, 5.5vw, 60px)',
            lineHeight: 1.05,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: C.slate900,
          }}
        >
          The Recognition-Rigor Framework
        </h1>
        <p
          className="marketing-display"
          style={{
            fontSize: 'clamp(22px, 3vw, 30px)',
            lineHeight: 1.2,
            fontWeight: 400,
            fontStyle: 'italic',
            color: C.green,
            margin: '16px 0 0',
          }}
        >
          {POSITIONING_SYNTHESIS_LINE}
        </p>
        <p
          style={{
            fontSize: 20,
            lineHeight: 1.5,
            color: C.slate600,
            maxWidth: 780,
            margin: '14px 0 0',
          }}
        >
          A first-party, voluntary standard for human-AI strategic reasoning. Kahneman’s debiasing
          tradition and Klein’s Recognition-Primed Decision tradition, run in one pipeline and
          arbitrated into a single artifact. Any product can self-assess against the rubric below.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
          <Link
            href="/how-it-works"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: C.green,
              color: C.white,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            See it running end-to-end
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
          <Link
            href="mailto:team@decision-intel.com?subject=R%C2%B2F%20registry%20%E2%80%94%20self-assessment"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: C.white,
              color: C.slate900,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
              border: `1px solid ${C.slate300}`,
            }}
          >
            Opt in to the registry
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
          {/* Investor / procurement deep-link to the calibration section.
              Item 2 lock 2026-05-07: the calibration section IS the
              answer to "show me your outcome calibration"; the jumplink
              makes it reachable without scrolling past the tenets. */}
          <Link
            href="#calibration"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: 'transparent',
              color: C.slate700,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
              border: `1px solid ${C.slate300}`,
            }}
          >
            Investor diligence answer
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </section>

      {/* Why */}
      <section
        style={{
          background: C.slate50,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px' }}>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              margin: '0 0 22px',
            }}
          >
            Why a voluntary standard
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 18,
            }}
          >
            {[
              {
                title: 'Regulators are already asking',
                body: 'The EU AI Act (Article 14 · human oversight; Article 15 · accuracy and record-keeping) and Basel III ICAAP both require documented reasoning on consequential decisions. R²F is one operational answer to "what does good look like."',
              },
              {
                title: 'Both Nobel traditions, not one',
                body: 'Kahneman (2002) and Klein converged in their 2009 paper "Conditions for Intuitive Expertise." The rigor tradition says expert intuition is biased; the recognition tradition says it is load-bearing. Real strategic reasoning needs both — arbitrated, not picked.',
              },
              {
                title: 'Usage beats certification',
                body: 'No third-party body certifies strategy products today. The path to a stable category is consistent usage of a shared rubric. R²F is published so others can self-assess and opt in to the registry.',
              },
            ].map(b => (
              <div
                key={b.title}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 12,
                  padding: '18px 18px',
                }}
              >
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: '0 0 6px',
                    color: C.slate900,
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: C.slate600,
                  }}
                >
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tenets */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              The six tenets
            </h2>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 14,
                color: C.slate600,
                maxWidth: 620,
              }}
            >
              Three rigor tenets on Kahneman’s side, three recognition tenets on Klein’s. Arbitrated
              by an explicit meta-judge stage — the glue that makes R²F different from running two
              pipelines in parallel.
            </p>
          </div>
          <Link
            href="/case-studies"
            style={{
              fontSize: 13,
              color: C.green,
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {HISTORICAL_CASE_COUNT} cases in the reference corpus
            <ArrowRight size={12} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {TENETS.map(t => {
            const accent = t.side === 'rigor' ? C.amber : C.blue;
            const accentBg = t.side === 'rigor' ? C.amberSoft : C.blueSoft;
            const Icon = t.side === 'rigor' ? Scale : Compass;
            return (
              <article
                key={t.num}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 14,
                  padding: '18px 20px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: accent,
                      background: accentBg,
                      borderRadius: 9999,
                    }}
                  >
                    <Icon size={10} strokeWidth={2.25} aria-hidden />
                    {t.side === 'rigor' ? 'Kahneman · rigor' : 'Klein · recognition'}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: C.slate400,
                    }}
                  >
                    TENET {t.num}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: 0,
                    color: C.slate900,
                  }}
                >
                  {t.name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: C.slate700,
                    fontWeight: 500,
                  }}
                >
                  {t.claim}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: C.slate500,
                  }}
                >
                  {t.detail}
                </p>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.slate500,
                    letterSpacing: '0.04em',
                  }}
                >
                  Decision Intel pipeline stage:{' '}
                  <span style={{ color: C.slate900 }}>{t.pipelineStage}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Self-assessment */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 24px' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            margin: '0 0 6px',
          }}
        >
          Self-assessment rubric
        </h2>
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            color: C.slate600,
            maxWidth: 720,
          }}
        >
          Ten yes/no questions. Score your own product, not ours. A score of 4+ earns Bronze; 7+
          earns Silver; 10 earns Gold. This is a self-assessment — no external audit body certifies
          the result, and the standard is published so it can be disputed in public.
        </p>
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 8,
          }}
        >
          {SELF_ASSESSMENT.map((q, i) => (
            <li
              key={q.question}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                background: C.slate50,
                border: `1px solid ${C.slate200}`,
                borderRadius: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: C.white,
                  border: `1px solid ${C.slate300}`,
                  color: C.slate600,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: C.slate900, lineHeight: 1.45 }}>
                {q.question}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Tiers */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {TIERS.map(t => (
            <div
              key={t.label}
              style={{
                background: t.bg,
                border: `1px solid ${t.tone}`,
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: t.tone,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                <CheckCircle2 size={12} strokeWidth={2.5} aria-hidden />
                {t.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: C.slate700,
                }}
              >
                {t.blurb}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* R²F Detector Atlas — wedge-batch-4 lock 2026-05-07. The 10
          paper-application surface that gives a procurement reader /
          advisor / investor a single canonical view of every detector
          in the framework: what each one is, what paper it derives
          from, where it lives in the codebase, and what the live
          surfaces look like. Click any of the 10 cards → detail panel
          opens inline with a per-detector mini-viz of the signal shape. */}
      <R2FDetectorAtlas />

      {/* Calibration baseline — procurement-grade answer to "show me your outcome calibration".
          Item 2 lock 2026-05-07: this section IS the calibration page. The
          /calibration URL redirects here. The eyebrow names the section
          for investor-diligence readers; the methodology timeline +
          reproducibility code block + Tetlock-anchored scale are the
          procurement evidence. */}
      <section
        id="calibration"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px 24px 24px',
          scrollMarginTop: 80,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: C.green,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          <Activity size={12} strokeWidth={2.5} aria-hidden />
          Calibration baseline · investor-diligence answer
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(24px, 3vw, 34px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: C.slate900,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Brier {PLATFORM_BASELINE_SNAPSHOT.meanBrier.toFixed(3)} ±{' '}
          {PLATFORM_BASELINE_SNAPSHOT.brierCi95.halfWidth.toFixed(3)} across{' '}
          {PLATFORM_BASELINE_SNAPSHOT.n} historical corporate decisions.
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            lineHeight: 1.6,
            color: C.slate600,
            maxWidth: 760,
            marginBottom: 24,
          }}
        >
          Procurement-stage diligence asks <em>show me your outcome calibration</em>. The published
          R²F methodology is run retrospectively over {PLATFORM_BASELINE_SNAPSHOT.n} historical
          corporate decisions where the outcome is known — Brier-fair (evidence dimension
          neutralised, no peek at ground truth). The proper-scoring rule does the rest. The 95% CI
          comes from a {PLATFORM_BASELINE_SNAPSHOT.bootstrapIterations.toLocaleString('en-US')}
          -iteration deterministic bootstrap with a pinned seed; the reproducibility recipe sits
          below.
        </p>

        {/* Brier-vs-DQI honest distinction + Active Open-Mindedness (locked
            2026-06-05). The Brier baseline is shown prominently above; a
            sophisticated reader could mistake it for the DQI's accuracy. Naming
            the distinction is the same procurement-grade honesty as the "what it
            deliberately doesn't" epistemic-honesty section, and frames the
            calibration loop as Tetlock's measurement leg on top of the Kahneman
            x Klein synthesis. Minimal em-dashes per the marketing voice cap. */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.slate500,
              marginBottom: 12,
            }}
          >
            What Brier scores, and what it doesn&rsquo;t
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: C.slate700 }}>
            Brier scores our <strong>calibration on these forecasts</strong>, not the DQI. The DQI
            grades the <em>reasoning quality</em> of a memo; Brier grades whether our probability
            estimates were right. Two instruments, kept separate on purpose: a calibration number is
            only meaningful against settled outcomes, which is why every live audit also logs a
            falsifiable 90-day proxy that scores at the horizon.
          </p>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 14.5,
              lineHeight: 1.6,
              color: C.slate700,
            }}
          >
            That calibration loop, measured rather than asserted, is the third tradition in the
            framework: Kahneman debiases, Klein recognises the pattern, and the calibration layer
            (anchored in Tetlock&rsquo;s Good Judgment Project) tracks whether the call was right
            and sharpens the next one. It is also why the audit captures your prior <em>before</em>{' '}
            it reveals its own read, the discipline Tetlock calls Active Open-Mindedness: the gap
            between the two is the signal.
          </p>
        </div>

        {/* Methodology version progression — Item 2 lock 2026-05-07,
            extended 2026-05-13 (M-4 sharpening) to surface the full
            engine-epoch chain through 2.4.0. Procurement readers ask
            "which methodology produced this number?" The progression
            shows the audit trail: legacy 2.0.0 (deprecated) → 2.0.0-seed
            (current platform baseline) → 2.1.0 (validity shift) → 2.2.0
            (compound-pattern 7th component) → 2.3.0 (user-adjustable
            weights per Dietvorst 2016) → 2.4.0 (22×22 interaction matrix
            covering DI-B-021 + DI-B-022; CURRENT LIVE stamp) → per-org
            Brier supersedes once outcomes accumulate via Outcome Gate
            enforcement + the Vohra HXC PMF cohort signals the org has
            converged. */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.slate500,
              marginBottom: 14,
            }}
          >
            Methodology version progression
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {[
              {
                version: '2.0.0',
                label: 'Legacy',
                state: 'deprecated' as const,
                blurb: 'Pre-validity-weighted DQI. Surfaced on audits run before 2026-04-30.',
              },
              {
                version: '2.0.0-seed',
                label: 'Platform seed baseline',
                state: 'current-seed' as const,
                blurb: `The number above. Computed retrospectively over the ${PLATFORM_BASELINE_SNAPSHOT.n}-case library; evidence dimension neutralised so predictions don't peek at ground truth.`,
              },
              {
                version: '2.1.0',
                label: 'Validity shift',
                state: 'superseded' as const,
                blurb:
                  'Validity-aware weight shift per Kahneman & Klein 2009 first condition. Stamped when only validityClass is supplied; superseded by 2.2.0+ when compound patterns + matrix coverage land.',
              },
              {
                version: '2.2.0',
                label: 'Compound risk',
                state: 'superseded' as const,
                blurb:
                  'Added compoundRisk as the 7th DQI component (M&A hard-layer ship 2026-05-09). 20×20 interaction matrix coverage. Stamped on audits between 2026-05-09 and 2026-05-13.',
              },
              {
                version: '2.3.0',
                label: 'User-adjustable weights',
                state: 'live' as const,
                blurb:
                  'Customer tunes the DQI component weights for their domain (Dietvorst 2016 algorithm-aversion fix). Stamped when userAdjustableWeights are applied + the weights-hash for tamper-evidence.',
              },
              {
                version: '2.4.0',
                label: '22×22 matrix',
                state: 'current-live' as const,
                blurb:
                  'Interaction matrix extended to cover DI-B-021 (illusion of validity) + DI-B-022 (inside-view dominance). Current canonical stamp when compound patterns are supplied. Coherent Confidence + Reference-Class Blindness toxic combinations now amplify properly.',
              },
              {
                version: 'per-org',
                label: 'Customer outcomes',
                state: 'future' as const,
                blurb:
                  'Once a customer org accumulates closed outcomes via Outcome Gate enforcement AND the Vohra HXC PMF cohort exceeds the ≥5 sample-size floor, per-org Brier replaces the seed baseline on every DPR they generate.',
              },
            ].map(v => {
              const tone =
                v.state === 'current-live'
                  ? { color: C.green, bg: C.greenSoft, border: C.greenBorder, label: 'LIVE' }
                  : v.state === 'live'
                    ? {
                        color: C.green,
                        bg: C.greenSoft,
                        border: C.greenBorder,
                        label: 'LIVE (USER-TUNE PATH)',
                      }
                    : v.state === 'current-seed'
                      ? {
                          color: C.blue,
                          bg: C.blueSoft,
                          border: 'rgba(37, 99, 235, 0.25)',
                          label: 'SEED',
                        }
                      : v.state === 'superseded'
                        ? {
                            color: C.slate600,
                            bg: C.slate100,
                            border: C.slate200,
                            label: 'SUPERSEDED',
                          }
                        : v.state === 'deprecated'
                          ? {
                              color: C.slate500,
                              bg: C.slate100,
                              border: C.slate200,
                              label: 'DEPRECATED',
                            }
                          : {
                              color: C.amber,
                              bg: C.amberSoft,
                              border: 'rgba(217, 119, 6, 0.25)',
                              label: 'FUTURE',
                            };
              return (
                <div
                  key={v.version}
                  style={{
                    background: tone.bg,
                    border: `1px solid ${tone.border}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: tone.color,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      v{v.version}
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        color: tone.color,
                        background: C.white,
                        border: `1px solid ${tone.border}`,
                        padding: '2px 6px',
                        borderRadius: 999,
                      }}
                    >
                      {tone.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.slate900,
                    }}
                  >
                    {v.label}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: C.slate600,
                    }}
                  >
                    {v.blurb}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tetlock-anchored scale */}
        <div
          style={{
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
            padding: '24px 28px',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.slate500,
              marginBottom: 16,
            }}
          >
            Where the seed baseline lands · Tetlock-anchored scale
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CALIBRATION_ANCHORS.map(a => (
              <div
                key={a.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: a.self ? '12px 14px' : '6px 0',
                  background: a.self ? C.greenSoft : 'transparent',
                  border: a.self ? `1px solid ${C.greenBorder}` : 'none',
                  borderRadius: a.self ? 10 : 0,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 19,
                    fontWeight: 700,
                    color: a.self ? C.green : C.slate900,
                    minWidth: 70,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {a.value.toFixed(3)}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: a.self ? 700 : 600,
                    color: a.self ? C.green : C.slate900,
                  }}
                >
                  {a.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Honesty + reproducibility */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              background: C.amberSoft,
              border: `1px solid rgba(217, 119, 6, 0.22)`,
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.amber,
                marginBottom: 6,
              }}
            >
              Seed, not forecast
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: C.slate700 }}>
              These cases were audited retrospectively. The platform did NOT predict them ahead of
              time. The Brier number reads: &ldquo;if the methodology had been applied at decision
              time using only pre-decision signal, this is how it would have calibrated against
              ground truth.&rdquo;
            </p>
          </div>
          <div
            style={{
              background: C.blueSoft,
              border: `1px solid rgba(37, 99, 235, 0.22)`,
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.blue,
                marginBottom: 6,
              }}
            >
              Per-org Brier supersedes
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: C.slate700 }}>
              When a customer org accumulates closed outcomes via Outcome Gate enforcement AND the
              Vohra HXC PMF cohort clears the ≥5 sample-size floor (locked v3.5 graduation gate),
              per-org calibration replaces the seed baseline on every DPR they generate. Until then,
              the seed IS the contractual answer — and the version stamp on the cover page tells the
              audit-committee reader exactly which methodology epoch produced it.
            </p>
          </div>
          <div
            style={{
              background: C.slate100,
              border: `1px solid ${C.slate200}`,
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.slate600,
                marginBottom: 6,
              }}
            >
              Reproducibility
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: C.slate700 }}>
              {PLATFORM_BASELINE_FOOTNOTE}.
            </p>
          </div>
        </div>

        {/* Reproducibility recipe — Item 2 lock 2026-05-07. Procurement
            auditors expect to reproduce the Brier number themselves; the
            code block + the public API endpoint together close the
            audit-trail loop. The seed is pinned and the bootstrap is
            deterministic so an auditor running the recipe gets the same
            number byte-for-byte. */}
        <div
          style={{
            background: C.slate900,
            color: C.slate100,
            borderRadius: 12,
            padding: '20px 22px',
            marginTop: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#86EFAC',
              }}
            >
              Reproducibility recipe
            </div>
            <Link
              href="/api/intelligence/calibration-baseline"
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11.5,
                color: '#86EFAC',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              GET /api/intelligence/calibration-baseline
              <ArrowRight size={11} strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 12,
              lineHeight: 1.55,
              color: C.slate100,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {`# Reproduce the Brier baseline locally
import { computePlatformCalibrationBaseline } from '@/lib/learning/platform-baseline';
const baseline = computePlatformCalibrationBaseline();
// → {
//     n: ${PLATFORM_BASELINE_SNAPSHOT.n},
//     meanBrier: ${PLATFORM_BASELINE_SNAPSHOT.meanBrier.toFixed(3)},
//     brierCi95: { lower: ${PLATFORM_BASELINE_SNAPSHOT.brierCi95.lower.toFixed(3)}, upper: ${PLATFORM_BASELINE_SNAPSHOT.brierCi95.upper.toFixed(3)} },
//     bootstrapIterations: ${PLATFORM_BASELINE_SNAPSHOT.bootstrapIterations.toLocaleString('en-US')},
//     bootstrapSeed: ${PLATFORM_BASELINE_SNAPSHOT.bootstrapSeed},
//     methodologyVersion: '${PLATFORM_BASELINE_SNAPSHOT.methodologyVersion}',
//   }`}
          </pre>
          <div
            style={{
              fontSize: 11.5,
              color: C.slate400,
              marginTop: 12,
              lineHeight: 1.55,
            }}
          >
            The function reads `ALL_CASES` from the case-study library, runs
            `computeBrierFairPredictedDqi` (the no-evidence-peeking variant of the DQI formula) over
            each case, and bootstraps the mean with a seeded mulberry32 PRNG. Same seed → same
            number across machines and dates.
          </div>
        </div>
      </section>

      {/* Epistemic honesty — correlation, not causation. Locked 2026-05-31
          (GPT-pushback-validated). Turns the sharpest sophisticated-buyer
          challenge ("you can't prove the bias CAUSED the loss") into the
          differentiator: a reasoning audit names risk indicators a committee
          pressure-tests, it does not pretend to prove cause. Reads the
          POSITIONING_EPISTEMIC_HONESTY SSOT so the public line can't drift
          from the chat-coaching + Sparring rebuttal. */}
      <section
        id="epistemic-honesty"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px 24px 24px',
          scrollMarginTop: 80,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: C.green,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          <Scale size={12} strokeWidth={2.5} aria-hidden />
          What the audit establishes · and what it deliberately doesn&rsquo;t
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(24px, 3vw, 34px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: C.slate900,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          We name the risk indicators &mdash; not the cause.
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            lineHeight: 1.6,
            color: C.slate600,
            maxWidth: 760,
            marginBottom: 24,
          }}
        >
          {POSITIONING_EPISTEMIC_HONESTY} A score that names what a committee should pressure-test
          survives the first hard question in the room; a score that claims to have found the cause
          does not. The restraint is the rigor.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            maxWidth: 860,
          }}
        >
          <div
            style={{
              border: `1px solid ${C.slate200}`,
              borderTop: `3px solid ${C.green}`,
              borderRadius: 12,
              padding: '18px 20px',
              background: C.white,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: C.green,
                marginBottom: 8,
              }}
            >
              What the DQI establishes
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: C.slate600 }}>
              Which reasoning-risk patterns were present in the memo before the outcome was known,
              scored against a 22-bias taxonomy and a 143-case reference class &mdash; reproducible,
              weighted, and versioned. Indicators a committee can act on.
            </p>
          </div>
          <div
            style={{
              border: `1px solid ${C.slate200}`,
              borderTop: `3px solid ${C.slate600}`,
              borderRadius: 12,
              padding: '18px 20px',
              background: C.slate50,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: C.slate600,
                marginBottom: 8,
              }}
            >
              What it deliberately doesn&rsquo;t claim
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: C.slate600 }}>
              That a detected bias <em>caused</em> the outcome. Markets move, rates shift, execution
              slips &mdash; no audit can isolate one cause after the fact. Anything that claims
              otherwise is correlation dressed as proof, and a sophisticated buyer knows it.
            </p>
          </div>
        </div>
      </section>

      {/* Canonical citation */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px 24px 72px',
        }}
      >
        <div
          style={{
            background: C.navy,
            color: C.white,
            borderRadius: 16,
            padding: '32px 28px',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#86EFAC',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              <BookOpen size={12} strokeWidth={2.5} aria-hidden />
              Canonical citation
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#CBD5E1' }}>
              Kahneman, D. &amp; Klein, G. (2009).{' '}
              <em>Conditions for Intuitive Expertise: A failure to disagree.</em> American
              Psychologist, 64(6), 515–526. The framing paper where the two traditions converged.
              R²F is the operationalisation.
            </p>
          </div>
          <Link
            href="mailto:team@decision-intel.com?subject=R%C2%B2F%20registry%20%E2%80%94%20opt-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 18px',
              background: C.green,
              color: C.white,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Opt in to the registry
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </section>

      {/* Footer strip */}
      <section style={{ borderTop: `1px solid ${C.slate200}`, background: C.slate50 }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '28px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: C.slate500,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <ShieldCheck size={14} strokeWidth={2.25} aria-hidden />
            R²F Standard · v1.0 · Published 2026-04-23
          </div>
          <div style={{ display: 'flex', gap: 18, fontSize: 13 }}>
            <Link href="/how-it-works" style={{ color: C.slate600, textDecoration: 'none' }}>
              How it works
            </Link>
            <Link
              href="/regulatory/ai-verify"
              style={{ color: C.slate600, textDecoration: 'none' }}
            >
              AI Verify alignment
            </Link>
            <Link href="/bias-genome" style={{ color: C.slate600, textDecoration: 'none' }}>
              Bias taxonomy
            </Link>
            <Link href="/security" style={{ color: C.slate600, textDecoration: 'none' }}>
              Security
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
