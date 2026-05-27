'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, FileText, ShieldCheck, Gauge, AlertOctagon, ShieldAlert } from 'lucide-react';
import { ALL_CASES, getDeepCases, getSlugForCase, type CaseStudy } from '@/lib/data/case-studies';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { DprSpecimenShowcase } from '@/components/marketing/dpr/DprSpecimenShowcase';
import { CaseSelector } from '@/components/marketing/proof/CaseSelector';
import { PreDecisionDocument } from '@/components/marketing/proof/PreDecisionDocument';
import { FlaggedAnalysisPanel } from '@/components/marketing/proof/FlaggedAnalysisPanel';
import { OutcomeReveal } from '@/components/marketing/proof/OutcomeReveal';
import { DecisionTimeline } from '@/components/marketing/proof/DecisionTimeline';
import { CaseBiasWeb } from '@/components/marketing/proof/CaseBiasWeb';

// Derived — "30+ bias" deprecated per CR-3 (2026-05-13).
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
};

const INDUSTRY_LABEL: Record<string, string> = {
  financial_services: 'Financial Services',
  technology: 'Technology',
  healthcare: 'Healthcare',
  energy: 'Energy',
  automotive: 'Automotive',
  retail: 'Retail',
  aerospace: 'Aerospace',
  government: 'Government',
  entertainment: 'Entertainment',
  media: 'Media',
  real_estate: 'Real Estate',
  telecommunications: 'Telecommunications',
  manufacturing: 'Manufacturing',
};

export function ProofPageClient() {
  const searchParams = useSearchParams();
  const requested = searchParams.get('case');

  // All cases with preDecisionEvidence, sorted chronologically (oldest first —
  // makes the timeline feel historical).
  const deepCases = useMemo(() => {
    return [...getDeepCases()].sort((a, b) => a.year - b.year);
  }, []);

  const caseEntries = useMemo(
    () =>
      deepCases.map(c => ({
        slug: getSlugForCase(c),
        company: c.company,
        year: c.year,
        outcome: c.outcome,
      })),
    [deepCases]
  );

  const timelineEntries = useMemo(
    () =>
      deepCases.map(c => ({
        slug: getSlugForCase(c),
        company: c.company,
        year: c.year,
        yearRealized: c.yearRealized,
        outcome: c.outcome,
        impactScore: c.impactScore,
        industry: c.industry,
      })),
    [deepCases]
  );

  const active = useMemo<CaseStudy>(() => {
    if (requested) {
      const match = deepCases.find(c => getSlugForCase(c) === requested);
      if (match) return match;
    }
    return deepCases[0];
  }, [deepCases, requested]);

  const industryCoverage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of ALL_CASES) {
      counts.set(c.industry, (counts.get(c.industry) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([key, count]) => ({ key, label: INDUSTRY_LABEL[key] ?? key, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const yearsElapsed = Math.max(0, active.yearRealized - active.year);
  const activeSlug = getSlugForCase(active);
  const evidence = active.preDecisionEvidence!;

  return (
    <div style={{ background: C.slate50, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* HERO ───────────────────────────────────────────────────── */}
      <section
        style={{
          background: C.navy,
          color: C.white,
          padding: '72px 24px 80px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 16,
            }}
          >
            Anti-Hindsight Proof
          </div>
          <h1
            style={{
              fontSize: 'clamp(30px, 5vw, 54px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              margin: 0,
              marginBottom: 20,
            }}
          >
            We didn&apos;t analyze this after it happened.
            <br />
            <span style={{ color: C.green }}>We analyzed what was on the page.</span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              lineHeight: 1.6,
              color: C.slate300,
              maxWidth: 720,
              margin: 0,
            }}
          >
            {deepCases.length} real documents (memos, SEC filings, earnings calls) from{' '}
            <strong style={{ color: C.white }}>before</strong> the outcome was known. Run through
            the same {BIAS_COUNT}-bias detection methodology we apply to your next strategic memo.
          </p>

          {/* Hero stats */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              flexWrap: 'wrap',
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <HeroStat value={String(deepCases.length)} label="Pre-decision documents" />
            <HeroStat
              value={String(new Set(deepCases.map(c => c.industry)).size)}
              label="Industries"
            />
            <HeroStat value="0" label="Hindsight used" />
          </div>
        </div>
      </section>

      {/* VALUE-AT-STAKE BANNER ─────────────────────────────────────
          The page was already strong on hindsight discipline but soft
          on the procurement-grade "why this matters in dollars" frame.
          This banner translates the proof exercise into the cost of
          missing what's already on the page. */}
      <section style={{ padding: '32px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderTop: `4px solid ${C.green}`,
              borderRadius: 16,
              padding: '28px 32px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 24,
              alignItems: 'flex-start',
            }}
            className="proof-value-banner"
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'rgba(22, 163, 74, 0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={26} style={{ color: C.green }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: C.green,
                  marginBottom: 8,
                }}
              >
                The cost of missing what&apos;s on the page
              </div>
              <h3
                style={{
                  fontSize: 'clamp(20px, 2.4vw, 26px)',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  margin: 0,
                  marginBottom: 10,
                  color: C.slate900,
                  letterSpacing: '-0.01em',
                }}
              >
                Across these {deepCases.length} pre-decision documents, hundreds of billions in
                market capitalization were destroyed after bias-laden reasoning made it through the
                audit committee.
              </h3>
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: C.slate600,
                  margin: 0,
                }}
              >
                Every flag below was visible in writing <strong>before</strong> the outcome was
                known. The DPR your audit committee defends is the artifact that catches the same
                reasoning patterns on your next strategic memo — for £249/mo per seat, not the
                McKinsey bill.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DECISION TIMELINE — hero visualization of the full set ───── */}
      <section style={{ padding: '40px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <DecisionTimeline cases={timelineEntries} activeSlug={activeSlug} />
        </div>
      </section>

      {/* CASE SELECTOR — sticky quick-jump ───────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <CaseSelector cases={caseEntries} activeSlug={activeSlug} />
      </div>

      {/* FEATURED CASE ──────────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Featured case header */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate400,
              marginBottom: 8,
            }}
          >
            {INDUSTRY_LABEL[active.industry] ?? active.industry} · {active.year}
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 34px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: 8,
              color: C.slate900,
            }}
          >
            {active.company}
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              color: C.slate600,
              margin: 0,
              maxWidth: 820,
            }}
          >
            {active.decisionContext}
          </p>
        </div>

        {/* Split panel: document (left) + analysis (right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
            gap: 24,
            marginBottom: 32,
            alignItems: 'stretch',
          }}
          className="proof-split"
        >
          <PreDecisionDocument
            document={evidence.document}
            source={evidence.source}
            date={evidence.date}
            documentType={evidence.documentType}
            flagCount={evidence.detectableRedFlags.length}
          />
          <FlaggedAnalysisPanel
            detectableRedFlags={evidence.detectableRedFlags}
            flaggableBiases={evidence.flaggableBiases}
            hypotheticalAnalysis={evidence.hypotheticalAnalysis}
            dqiEstimate={active.dqiEstimate}
          />
        </div>

        {/* Outcome reveal */}
        <div style={{ marginBottom: 32 }}>
          <OutcomeReveal
            company={active.company}
            outcome={active.outcome}
            yearRealized={active.yearRealized}
            yearsElapsed={yearsElapsed}
            estimatedImpact={active.estimatedImpact}
            summary={active.summary}
            detailHref={`/case-studies/${activeSlug}`}
          />
        </div>

        {/* BIAS WEB for the featured case ─────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <CaseBiasWeb
            biases={evidence.flaggableBiases}
            primaryBias={active.primaryBias}
            caseLabel={`${active.company}, ${active.year}`}
            activePatterns={active.toxicCombinations}
          />
        </div>

        {/* PER-CASE ROI CALLOUT ──────────────────────────────────────
            The user-facing translation: "this many biases were on the
            page · this much was destroyed · DI would have flagged them
            in 60 seconds at £X". The most procurement-relevant chunk
            of the page — surfaces directly below the bias web so the
            reader sees the cost of missing what's already detectable. */}
        <div
          style={{
            background: C.navy,
            color: C.white,
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 56,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 24,
            alignItems: 'center',
          }}
          className="proof-case-roi"
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertOctagon size={28} style={{ color: '#FCA5A5' }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.green,
                marginBottom: 8,
              }}
            >
              What the {evidence.documentType ?? 'document'} carried, in writing, before the outcome
            </div>
            <h3
              style={{
                fontSize: 'clamp(20px, 2.4vw, 26px)',
                fontWeight: 700,
                lineHeight: 1.3,
                margin: 0,
                marginBottom: 10,
                color: C.white,
                letterSpacing: '-0.01em',
              }}
            >
              {evidence.detectableRedFlags.length} red flags · {evidence.flaggableBiases.length}{' '}
              biases · {active.estimatedImpact}.
            </h3>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: C.slate300,
                margin: 0,
                maxWidth: 720,
              }}
            >
              The original auditors signed off. The audit committee approved. A 60-second R²F audit
              on the same {evidence.documentType ?? 'document'} would have surfaced every item below
              before any of this {Math.abs(yearsElapsed) > 0 ? `${yearsElapsed}-year` : '12-month'}{' '}
              outcome could unfold.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 10,
                background: C.green,
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Audit yours now <ArrowRight size={14} />
            </Link>
            <Link
              href="/pricing"
              style={{
                fontSize: 12,
                color: C.slate400,
                textDecoration: 'none',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              From £249/mo per seat →
            </Link>
          </div>
        </div>

        {/* METHOD NOTE ───────────────────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              padding: '28px 32px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 20,
              alignItems: 'flex-start',
            }}
            className="proof-method"
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: C.greenLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} style={{ color: C.green }} />
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
                Method · Why this is replicable, not hindsight
              </div>
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.65,
                  color: C.slate600,
                  margin: 0,
                  marginBottom: 10,
                }}
              >
                Every document above existed publicly, in writing, before the outcome was known. We
                ran the same bias taxonomy we apply to live strategic memos (published at{' '}
                <Link
                  href="/taxonomy"
                  style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}
                >
                  /taxonomy
                </Link>
                , DI-B-001 onward) against each: a blind test against your own library. Our findings
                are the red flags the original authors, auditors, and committees missed at the time.
              </p>
              <p style={{ fontSize: 13, color: C.slate400, margin: 0 }}>
                Every flaggable bias links to its peer-reviewed academic source. No LLM storytelling
                . The methodology is fully cited.
              </p>
            </div>
          </div>
        </section>

        {/* COVERAGE ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate400,
              marginBottom: 14,
            }}
          >
            Across the full library · {ALL_CASES.length} curated cases, {industryCoverage.length}{' '}
            industries
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {industryCoverage.map(ind => (
              <span
                key={ind.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.slate700,
                }}
              >
                {ind.label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.slate400,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {ind.count}
                </span>
              </span>
            ))}
          </div>
        </section>

        {/* DPR specimen showcase — surfaces the procurement-grade artefact
            between the proof grid and the close CTA. Shipped 2026-05-27. */}
        <div style={{ marginBottom: 40 }}>
          <DprSpecimenShowcase
            background={C.white}
            eyebrow="Procurement-grade artefact"
            heading="The DPR your audit committee + GC actually expect."
            subhead="Two retroactive R²F audits rendered as the same Decision Provenance Record every audit produces. Click through to read in-browser, or download for diligence review."
          />
        </div>

        {/* CTA ───────────────────────────────────────────────────── */}
        <section
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
          className="proof-cta"
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
              Run this on your next strategic memo.
            </h3>
            <p style={{ fontSize: 14.5, color: C.slate300, margin: 0, maxWidth: 640 }}>
              Upload the same document you&apos;re preparing for your next board or steering
              committee. Get the 60-second audit: same methodology, your memo.
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
              href="/case-studies"
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
              All {ALL_CASES.length} cases
            </Link>
          </div>
        </section>

        {/* Regulatory closer */}
        <div
          style={{
            marginTop: 32,
            padding: '18px 22px',
            borderRadius: 12,
            background: C.white,
            border: `1px solid ${C.slate200}`,
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
            This same taxonomy is what regulators have written into the EU AI Act high-risk
            decision-support obligations effective Aug 2026.
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

        {/* Trust strip at bottom */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            color: C.slate400,
            fontSize: 12,
          }}
        >
          <Gauge size={14} />
          <span>
            DQI projections calibrated against {ALL_CASES.length} labeled outcomes. Methodology open
            at{' '}
            <Link
              href="/taxonomy"
              style={{ color: C.slate600, textDecoration: 'none', fontWeight: 600 }}
            >
              /taxonomy
            </Link>
            .
          </span>
        </div>
      </main>

      {/* Responsive: stack the split on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .proof-split {
            grid-template-columns: 1fr !important;
          }
          .proof-case-roi {
            grid-template-columns: auto 1fr !important;
          }
          .proof-case-roi > :last-child {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 720px) {
          .proof-method,
          .proof-cta,
          .proof-value-banner {
            grid-template-columns: 1fr !important;
            padding: 24px !important;
          }
          .proof-case-roi {
            grid-template-columns: 1fr !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 800,
          color: C.white,
          lineHeight: 1,
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate400,
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}
