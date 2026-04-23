'use client';

/**
 * R²F Standard — /r2f-standard
 *
 * A first-party voluntary standard for human-AI strategic reasoning.
 * Decision Intel publishes the rubric, any product can self-assess
 * against it, and the registry is opt-in. If other products carry the
 * R²F mark, the framework becomes a category definition by usage alone
 * (trademark filing deferred until fundraise closes).
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
} from 'lucide-react';

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
    pipelineStage: 'Statistical Jury',
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
  { question: 'Is the pipeline’s reasoning arbitrated by an explicit meta-judge stage?', weight: 1 },
  { question: 'Does every output trace back to a signed, hashed record?', weight: 1 },
  { question: 'Does the system treat expert intuition as amplified input, not noise to suppress?', weight: 1 },
];

const TIERS = [
  {
    label: 'Bronze · R²F-aligned',
    minScore: 4,
    blurb: '4 of 10 tenets in place. Minimum bar to claim R²F alignment — bias + noise + one recognition signal.',
    tone: C.amber,
    bg: C.amberSoft,
  },
  {
    label: 'Silver · R²F-integrated',
    minScore: 7,
    blurb: '7 of 10 tenets in place. Both rigor and recognition pipelines are running, including a named meta-judge.',
    tone: C.blue,
    bg: C.blueSoft,
  },
  {
    label: 'Gold · R²F-arbitrated',
    minScore: 10,
    blurb: 'All 10 tenets in place. Full Kahneman × Klein synthesis with a signed, reproducible audit record.',
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
          style={{
            fontSize: 20,
            lineHeight: 1.5,
            color: C.slate600,
            maxWidth: 780,
            margin: '18px 0 0',
          }}
        >
          A first-party, voluntary standard for human-AI strategic reasoning. Kahneman’s
          debiasing tradition and Klein’s Recognition-Primed Decision tradition, run in one
          pipeline and arbitrated into a single artifact. Any product can self-assess against
          the rubric below.
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
              Three rigor tenets on Kahneman’s side, three recognition tenets on Klein’s.
              Arbitrated by an explicit meta-judge stage — the glue that makes R²F different
              from running two pipelines in parallel.
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
            135 cases in the reference corpus
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
                  Decision Intel pipeline stage: <span style={{ color: C.slate900 }}>{t.pipelineStage}</span>
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
          Ten yes/no questions. Score your own product, not ours. A score of 4+ earns Bronze;
          7+ earns Silver; 10 earns Gold. This is a self-assessment — no external audit body
          certifies the result, and the standard is published so it can be disputed in public.
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
              Kahneman, D. &amp; Klein, G. (2009). <em>Conditions for Intuitive Expertise:
              A failure to disagree.</em> American Psychologist, 64(6), 515–526. The framing
              paper where the two traditions converged. R²F is the operationalisation.
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
            <Link href="/regulatory/ai-verify" style={{ color: C.slate600, textDecoration: 'none' }}>
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
