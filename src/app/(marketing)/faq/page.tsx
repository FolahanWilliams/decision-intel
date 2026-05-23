/**
 * /faq — comprehensive question-answer surface for AI answer engines + buyers.
 *
 * AEO discipline (locked 2026-05-23): question-answer formatted content is
 * the single highest-leverage extraction shape for AI answer engines.
 * ChatGPT / Perplexity / Gemini / Claude grounding cite Q&A passages
 * verbatim more often than any other content shape, because the question
 * narrows the retrieval window and the answer is structurally complete.
 *
 * Three categories of question (each contributing to a separate buyer
 * decision moment):
 *
 *   1. Category + product — what is Decision Intel, who is it for, what
 *      does "reasoning audit platform" mean, how is it different from
 *      data tools or model-governance tools. These get cited when an
 *      AI client is asked "what is X" or "decision intelligence vs Y".
 *
 *   2. Methodology + IP — the Recognition-Rigor Framework, the bias
 *      taxonomy, the DPR, the DQI, the historical case library. These
 *      get cited when an AI client is asked about decision-quality
 *      methodology, cognitive-bias auditing, or the academic anchors.
 *
 *   3. Security + procurement — SOC 2 posture, sub-processors,
 *      indemnification, data retention. These get cited when an AI
 *      client is asked vendor-risk questions on Decision Intel's behalf
 *      (which is how procurement-led searches surface us).
 *
 * Every answer uses the canonical positioning vocabulary verbatim per
 * the PROTECTED_VOCABULARY discipline. Every count derives from canonical
 * exports per the count-drift ratchet. Every claim has either an inline
 * source or a deep-link to the canonical page (so an AI client following
 * a citation arrives at the procurement-grade source, not a synthesis).
 *
 * JSON-LD: FAQPage schema with mainEntity array. Google Rich Results
 * eligibility AND structured ingest for the AI answer-engine family.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import {
  CATEGORY_CLAIM,
  POSITIONING_HERO_PRIMARY,
  POSITIONING_HERO_CONTRAST,
  POSITIONING_PAIN_FRAMING,
  COMPETITIVE_DEFENSIVE_LINES,
} from '@/lib/constants/icp';
import { SOC2_FULL_STATEMENT, DPR_PROVENANCE_CLAIM_LONG } from '@/lib/constants/trust-copy';
import { FOUNDED_YEAR, FOUNDER_NAME, FOUNDER_TITLE } from '@/lib/constants/company-info';

const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;
const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions · Decision Intel',
  description:
    'Every question a CSO, M&A head, fund partner, audit-committee chair, or vendor-risk reviewer asks before signing. Category, methodology, security, procurement.',
  alternates: { canonical: `${siteUrl}/faq` },
  openGraph: {
    title: 'Frequently Asked Questions · Decision Intel',
    description: 'Category, methodology, security, procurement — answered in one place.',
    url: `${siteUrl}/faq`,
  },
  robots: { index: true, follow: true },
};

const C = {
  navy: '#0F172A',
  slate900: '#0F172A',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
};

interface FaqEntry {
  question: string;
  answer: string;
  /** Optional deep-link readers (and AI clients) should follow for the canonical source. */
  source?: { label: string; href: string };
}

interface FaqGroup {
  eyebrow: string;
  heading: string;
  intro: string;
  entries: FaqEntry[];
}

// Note: answers reference Cloverpop / IBM watsonx / Aera by name where the
// COMPETITIVE_DEFENSIVE_LINES surface those competitors as the canonical
// comparison. This is the procurement-grade response shape, not a named-
// prospect leak (those are unsigned customers; competitors are public).
const FAQ_GROUPS: FaqGroup[] = [
  {
    eyebrow: 'Category + product',
    heading: 'What Decision Intel is, and who it is for',
    intro:
      'The category claim, the buyer types, and the contrast against the tooling already on the procurement reader’s shortlist.',
    entries: [
      {
        question: 'What is Decision Intel?',
        answer: `${POSITIONING_HERO_PRIMARY} ${POSITIONING_HERO_CONTRAST} Chief Strategy Officers, corporate development teams, fund partners, and PE-backed CEOs run every strategic memo, board deck, and IC artefact through the audit before the committee sees it — and the reasoning trail compounds quarter after quarter into a living Decision Knowledge Graph that audit committees can defend.`,
        source: { label: 'How it works', href: '/how-it-works' },
      },
      {
        question: 'What does "reasoning audit platform" mean?',
        answer: `It is the protected category noun. BI tools audit your data. Model-risk-management tools audit your algorithms. ${CATEGORY_CLAIM} audits the human reasoning chain that produced the recommendation — the ${BIAS_COUNT}-bias canonical taxonomy fires on the memo text, the ${MATRIX_DIMENSION}×${MATRIX_DIMENSION} bias-interaction matrix surfaces compound failure patterns, and the procurement-grade Decision Provenance Record carries the audit trail into the legal record.`,
        source: { label: 'R²F Standard', href: '/r2f-standard' },
      },
      {
        question: 'Who is the primary buyer?',
        answer:
          'Four ICP personas: fractional Chief Strategy Officers running 3-5 client engagements, Heads of Corporate Development at scale-ups paying personally pre-team-budget, partners at smaller funds with active deal flow or investor-governance pressure, and PE-backed mid-market founders. The Fortune 500 corporate-strategy ceiling activates after the wedge: cross-border M&A leaders whose audit committees need the regulatory-mapping moat.',
        source: { label: 'Pricing', href: '/pricing' },
      },
      {
        question: 'What is the pain Decision Intel solves?',
        answer: `${POSITIONING_PAIN_FRAMING} Reasoning is never objectively sound; it is either audited or unaudited. Capital is not destroyed because executives have cognitive biases — biases are the operating system of the human mind. Capital is destroyed because organisations lack the structural friction required to catch and neutralise bias before capital is committed.`,
        source: { label: 'Proof', href: '/proof' },
      },
      {
        question: 'How is this different from ChatGPT or a general AI assistant?',
        answer: `ChatGPT gives one opinion from one model: ungoverned, untraceable, unaudited. ${CATEGORY_CLAIM} runs a 12-node analysis pipeline with a 3-frame noise jury (analyst-skeptical, regulator-hostile, contrarian-strategist) across two model families, arbitrated by a metaJudge, scored against a ${HISTORICAL_CASE_COUNT}-case reference library, and persisted as a hashed tamper-evident artefact. Not a chatbot; a reasoning audit, checkable from memo to outcome.`,
        source: { label: 'How it works', href: '/how-it-works' },
      },
      {
        question: 'How is Decision Intel different from Cloverpop?',
        answer: `${COMPETITIVE_DEFENSIVE_LINES[0].line} ${COMPETITIVE_DEFENSIVE_LINES[0].why}`,
        source: { label: 'Compare', href: '/compare' },
      },
      {
        question: 'How is Decision Intel different from IBM watsonx.governance?',
        answer: `${COMPETITIVE_DEFENSIVE_LINES[1].line} ${COMPETITIVE_DEFENSIVE_LINES[1].why}`,
        source: { label: 'Compare', href: '/compare' },
      },
      {
        question: 'How is this different from a red-team workshop?',
        answer:
          'Red teams fail structurally because the political cost of dissent in sponsor-driven environments is unsustainable. The antagonist that costs you no political capital fires before the IC memo can hide what the deal sponsor does not want to see — the audit surfaces the dissent algorithmically, so the corp-dev professional shifts from antagonist trying to kill the sponsor’s deal to facilitator surfacing a system-generated risk flag. Same dissent, zero ego cost.',
      },
    ],
  },
  {
    eyebrow: 'Methodology + IP',
    heading: 'How the audit works, and the academic anchors behind it',
    intro:
      'The Recognition-Rigor Framework, the bias taxonomy, the Decision Provenance Record, the Decision Quality Index — every claim traceable to a primary source.',
    entries: [
      {
        question: 'What is the Recognition-Rigor Framework (R²F)?',
        answer:
          'R²F is the protected IP moat. Kahneman’s System 2 debiasing pipeline (bias detection, noise jury, statistical scoring) and Klein’s Recognition-Primed Decision framework (pattern recognition, mental simulation, pre-mortem) arbitrated in one pipeline by a metaJudge. The only vendor running both halves. Anchored on Kahneman & Klein (2009) "Conditions for Intuitive Expertise: A Failure to Disagree."',
        source: { label: 'R²F Standard', href: '/r2f-standard' },
      },
      {
        question: 'How many cognitive biases does the platform detect?',
        answer: `${BIAS_COUNT} biases in the canonical taxonomy, stable IDs DI-B-001 through DI-B-0${String(BIAS_COUNT).padStart(2, '0')}. Each carries a real-world example, debiasing techniques, related biases, and a primary academic citation with DOI. The narrowness is the moat — every detector is paper-grounded, not heuristically added.`,
        source: { label: 'Bias taxonomy', href: '/taxonomy' },
      },
      {
        question: 'What is the Decision Provenance Record (DPR)?',
        answer: `Every audit produces a Decision Provenance Record: ${DPR_PROVENANCE_CLAIM_LONG}, with SHA-256 input hashes, methodology version stamp (current: ${METHODOLOGY_VERSION}), prompt fingerprint, DQI weight-resolution hash, and a composed Evidentiary Standard fingerprint bound into the legal trail. Mapped onto EU AI Act Article 14, Basel III Pillar 2 ICAAP, SEC AI disclosure, GDPR Article 22, and the 11 AI Verify Foundation principles.`,
        source: { label: 'Decision Provenance', href: '/decision-provenance' },
      },
      {
        question: 'What is the Decision Quality Index (DQI)?',
        answer: `A weighted composite score derived from seven components (bias load, noise, evidence quality, process maturity, compliance exposure, historical alignment, compound risk) calibrated against ${HISTORICAL_CASE_COUNT} historical corporate decisions in the public reference library. Methodology version ${METHODOLOGY_VERSION}. Weights are user-adjustable on the Strategy tier per the Dietvorst (2015) algorithm-aversion fix: practitioners use imperfect algorithms IF allowed to slightly modify the inputs or weights.`,
        source: { label: 'How it works', href: '/how-it-works' },
      },
      {
        question: 'What is the Bias Genome?',
        answer:
          'The first public ranking of which biases predict failure by industry, built from the case library and (as customers consent) calibrated against live outcome data. Every metric carries its sample size; dimmed rows flag n<3. The cross-org data flywheel that compounds the platform’s defensive moat against incumbents who lack reasoning-quality data.',
        source: { label: 'Bias Genome', href: '/bias-genome' },
      },
      {
        question: 'What is the Decision Knowledge Graph?',
        answer:
          'A living record of every strategic decision your team has run through the platform, their outcomes, and the reasoning trail. Decision history survives team transitions (CSO leaves; reasoning trail stays). Audit-committee Q&A pulls up the reasoning in 60 seconds. Future decisions get sharper because the platform learns YOUR specific bias patterns via Brier-scored per-org recalibration.',
      },
      {
        question: 'What academic research underpins the platform?',
        answer:
          'Kahneman & Klein (2009) "Conditions for Intuitive Expertise" is the canonical anchor for the Recognition-Rigor Framework. Kahneman & Lovallo (2003) "Delusions of Success" grounds reference-class forecasting. Klein & Mitchell (1995) and Mitchell, Russo & Pennington (1989) ground the prospective-hindsight pre-mortem. Dawes (1979) "The Robust Beauty of Improper Linear Models" grounds the decision-rubric detector. Dietvorst, Simmons & Massey (2015) grounds the algorithm-aversion counter-programming. Every academic anchor carries its DOI in the bias-education taxonomy.',
        source: { label: 'R²F Standard', href: '/r2f-standard' },
      },
      {
        question: 'How does the platform learn from outcomes?',
        answer:
          'Every closed outcome is Brier-scored against the predicted Decision Quality Index. Per-org calibration data sharpens the model for that organisation’s specific bias patterns. The Outcome Gate (enforced on HXC-cohort accounts from day one) ensures the loop closes: a user cannot escalate to the next decision until the prior decision’s outcome is on record. Engineered into the workflow, not optional.',
      },
    ],
  },
  {
    eyebrow: 'Security + procurement',
    heading: 'Posture for vendor-risk registers and audit committees',
    intro:
      'Encryption, regulatory mapping, sub-processors, retention SLA, indemnification, and the contracted artefacts a procurement reviewer needs to clear a Wednesday queue.',
    entries: [
      {
        question: 'What is the security posture?',
        answer: SOC2_FULL_STATEMENT,
        source: { label: 'Security', href: '/security' },
      },
      {
        question: 'Which regulatory frameworks does the DPR map onto?',
        answer: `${FRAMEWORK_COUNT} frameworks across G7, EU, GCC, and African markets. The anchor set covers EU AI Act Article 14 (human oversight), Basel III Pillar 2 ICAAP (qualitative-decision documentation), SOX §404 (internal controls), SEC AI disclosure, GDPR Article 22 (automated-decision rights), FCA Consumer Duty, NDPR (Nigeria), CBN AI guidance, WAEMU, CMA Kenya, POPIA (South Africa), SARB Model Risk, and seven more. Every bias finding in a DPR carries its regulatory exposure inline.`,
        source: { label: 'Security', href: '/security' },
      },
      {
        question: 'Where is data stored, and who are the sub-processors?',
        answer:
          'Production data lives in US-region Supabase (Postgres + Auth) with AES-256-GCM at rest and TLS 1.2+ in transit. Application compute runs on Vercel. Email delivery via Resend. DNS + edge via Cloudflare. AI inference via Anthropic (Claude) and Google (Gemini) under no-training contractual terms. The full sub-processor schedule with verification paths is on the trust page.',
        source: { label: 'Sub-processor schedule', href: '/trust' },
      },
      {
        question: 'What is the audit-log retention SLA?',
        answer:
          'Three tiers. Individual: 1 year (legal-defensible floor). Strategy (team): 3 years (mid-market default for quarterly board cycles). Enterprise: 7 years (SOX §404 aligned). Custom retention (HIPAA, banking, government) negotiable on pilot agreement. Every entry is immutable, append-only, timestamped at write, queryable via the AdminAuditLog UI, and exportable as a JSON bundle on Enterprise.',
      },
      {
        question: 'What is the indemnification posture?',
        answer:
          'Standard 12-months-of-fees cap with carve-outs for confidentiality breaches, wilful misconduct, third-party IP claims, and sub-processor failures. Cyber-liability + E&O insurance procurement scheduled for Q1 2027. Posture surfaced on /security and contracted in the DPA template available for download.',
        source: { label: 'Trust', href: '/trust' },
      },
      {
        question: 'Does the platform train on customer data?',
        answer:
          'No. Customer content is not used to train models — contractually locked in the DPA and reinforced via the vendor agreement with every AI sub-processor (Anthropic and Google both honour no-training enterprise contracts). The cross-org Bias Genome aggregates outcome metadata only, never raw content, and only across consenting accounts.',
        source: { label: 'Privacy', href: '/privacy' },
      },
      {
        question: 'What is the SOC 2 status?',
        answer:
          'Hosted on SOC 2 Type II infrastructure (Vercel + Supabase, both Type II audited). Decision Intel’s own SOC 2 Type I is targeted for Q4 2026 with Type II observation window opening immediately after. The DPA, sub-processor schedule, vendor-risk questionnaire, and DPR specimens are all available on the trust page in advance.',
        source: { label: 'Trust', href: '/trust' },
      },
      {
        question: 'Who founded Decision Intel, and what stage is the company at?',
        answer: `Decision Intel was founded in ${FOUNDED_YEAR} by ${FOUNDER_NAME}, ${FOUNDER_TITLE}. The company is in design-partner phase: a five-seat program for Fortune 500 strategy teams shaping the Recognition-Rigor Framework as it scales toward enterprise general availability. Legal entity, jurisdiction, registered office, and procurement contact are disclosed on the About page.`,
        source: { label: 'About', href: '/about' },
      },
    ],
  },
];

const ALL_ENTRIES = FAQ_GROUPS.flatMap(g => g.entries);

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: ALL_ENTRIES.map(e => ({
    '@type': 'Question',
    name: e.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: e.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${siteUrl}/faq` },
  ],
};

export default function FaqPage() {
  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <MarketingNav />

      {/* HERO */}
      <section style={{ padding: '88px 24px 48px', background: C.white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: C.greenSoft,
              color: C.green,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            <HelpCircle size={14} />
            Frequently Asked Questions
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              color: C.slate900,
              letterSpacing: '-0.02em',
            }}
          >
            Every question a CSO, GC, or vendor-risk reviewer asks before signing.
          </h1>
          <p
            style={{
              marginTop: 20,
              fontSize: 18,
              lineHeight: 1.6,
              color: C.slate600,
              maxWidth: 760,
            }}
          >
            Category, methodology, security, procurement — answered in one place, with the canonical
            sources one click away. Updated whenever the methodology version, framework registry, or
            taxonomy ships an extension.
          </p>
        </div>
      </section>

      {/* GROUPS */}
      {FAQ_GROUPS.map((group, gi) => (
        <section
          key={group.eyebrow}
          style={{
            padding: '48px 24px 56px',
            background: gi % 2 === 0 ? C.slate50 : C.white,
            borderTop: `1px solid ${C.slate100}`,
          }}
        >
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div
              style={{
                fontSize: 12,
                color: C.green,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {group.eyebrow}
            </div>
            <h2
              style={{
                fontSize: 'clamp(22px, 2.4vw, 30px)',
                fontWeight: 700,
                lineHeight: 1.2,
                margin: 0,
                color: C.slate900,
                letterSpacing: '-0.01em',
              }}
            >
              {group.heading}
            </h2>
            <p
              style={{
                marginTop: 12,
                marginBottom: 32,
                fontSize: 16,
                lineHeight: 1.6,
                color: C.slate600,
                maxWidth: 760,
              }}
            >
              {group.intro}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {group.entries.map(entry => (
                <article
                  key={entry.question}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 12,
                    padding: '24px 28px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      margin: 0,
                      color: C.slate900,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {entry.question}
                  </h3>
                  <p
                    style={{
                      marginTop: 12,
                      marginBottom: entry.source ? 14 : 0,
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: C.slate700,
                    }}
                  >
                    {entry.answer}
                  </p>
                  {entry.source ? (
                    <Link
                      href={entry.source.href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.green,
                        textDecoration: 'none',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {entry.source.label}
                      <ArrowRight size={14} />
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CLOSE */}
      <section style={{ padding: '64px 24px 96px', background: C.navy, color: C.white }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              color: C.white,
              letterSpacing: '-0.01em',
            }}
          >
            Question we did not answer here?
          </h2>
          <p
            style={{
              marginTop: 16,
              marginBottom: 28,
              fontSize: 17,
              lineHeight: 1.6,
              color: '#CBD5E1',
            }}
          >
            Procurement, security, audit-committee, and compliance questions go to the founder
            directly. 24-hour acknowledgement, 5-business-day substantive response.
          </p>
          <div
            style={{
              display: 'inline-flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/trust"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: C.green,
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Trust + procurement evidence
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: 'transparent',
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: 'none',
                border: `1px solid ${C.slate500}`,
              }}
            >
              About + contact
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
