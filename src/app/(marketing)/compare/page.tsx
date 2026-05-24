/**
 * /compare — Decision Intel vs the named competitive set.
 *
 * AEO discipline (locked 2026-05-23): comparison pages are the third
 * highest-leverage AI-extraction shape (after FAQ + Glossary). When a
 * user asks an AI answer engine "X vs Y" the engine pulls a comparison
 * table verbatim — which means the row-shape, the canonical-line text,
 * and the JSON-LD ItemList all need to be procurement-grade.
 *
 * The three competitors named here (Cloverpop, IBM watsonx.governance,
 * Aera Technology) are the canonical defensive set per CLAUDE.md's
 * "External Attack Vectors" lock + COMPETITIVE_DEFENSIVE_LINES. None
 * are unsigned-prospect leaks — they are public commercial competitors
 * with shipped products on the buyer's procurement shortlist.
 *
 * Voice discipline: each comparison leads with the canonical defensive
 * line (the COMPETITIVE_DEFENSIVE_LINES exports), then surfaces the
 * specific capability axes where Decision Intel and the competitor
 * diverge. NEVER disparage the competitor's general technology — every
 * row names a SPECIFIC capability difference the buyer can verify
 * against the competitor's own published documentation.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Minus, Scale } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import {
  CATEGORY_CLAIM,
  COMPETITIVE_DEFENSIVE_LINES,
  POSITIONING_HERO_PRIMARY,
} from '@/lib/constants/icp';

const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;
const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Decision Intel vs Cloverpop, IBM watsonx, Aera · Compare',
  description: `${POSITIONING_HERO_PRIMARY} Side-by-side comparison vs Cloverpop, IBM watsonx.governance, and Aera Technology on the axes a procurement reader actually scores.`,
  alternates: { canonical: `${siteUrl}/compare` },
  openGraph: {
    title: 'Compare · Decision Intel vs Cloverpop, IBM watsonx, Aera',
    description:
      'Side-by-side on bias detection, regulatory mapping, audit-trail provenance, and the calibration flywheel.',
    url: `${siteUrl}/compare`,
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
  amber: '#D97706',
};

interface CompareRow {
  axis: string;
  decisionIntel: string;
  competitor: string;
  diVerdict: 'yes' | 'partial' | 'no';
  competitorVerdict: 'yes' | 'partial' | 'no';
}

interface Comparison {
  competitor: string;
  /** The canonical defensive one-liner from icp.ts COMPETITIVE_DEFENSIVE_LINES. */
  oneLiner: string;
  /** What the competitor does well — never disparage; name the strength honestly. */
  competitorStrength: string;
  /** The specific gap Decision Intel addresses. */
  diDifferentiator: string;
  rows: CompareRow[];
}

const COMPARISONS: Comparison[] = [
  {
    competitor: 'Cloverpop',
    oneLiner: COMPETITIVE_DEFENSIVE_LINES[0].line,
    competitorStrength:
      'Cloverpop is positioned as a decision system of record. Logging, voting, accountability, and post-decision retrospectives. Strong adoption in mid-market product and operations teams; acquired by Clearbox Decisions in September 2025 for enterprise commercialisation.',
    diDifferentiator: `Decision Intel audits the reasoning chain BEFORE the decision is logged. The ${BIAS_COUNT}-bias canonical taxonomy fires on the memo text; Cloverpop has no bias detection layer. The ${HISTORICAL_CASE_COUNT}-case reference library and the Recognition-Rigor Framework anchor the calibration; Cloverpop has no academic anchor of comparable depth. Cloverpop logs decisions; Decision Intel audits them.`,
    rows: [
      {
        axis: 'Decision logging + accountability',
        decisionIntel: 'Built-in via Decision Knowledge Graph',
        competitor: 'Core product capability',
        diVerdict: 'yes',
        competitorVerdict: 'yes',
      },
      {
        axis: 'Cognitive bias detection on memo text',
        decisionIntel: `${BIAS_COUNT}-bias canonical taxonomy with stable IDs and academic citations`,
        competitor: 'Not in product',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: 'Compound failure-pattern detection',
        decisionIntel: `${MATRIX_DIMENSION}×${MATRIX_DIMENSION} pairwise interaction matrix; named patterns (Coherent Confidence, Reference-Class Blindness)`,
        competitor: 'Not in product',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: 'Historical reference-class forecasting',
        decisionIntel: `${HISTORICAL_CASE_COUNT}-case public library, similarity-scored per audit`,
        competitor: 'Customer-decision history only, no public anchor',
        diVerdict: 'yes',
        competitorVerdict: 'partial',
      },
      {
        axis: 'Procurement-grade audit-trail artefact (DPR)',
        decisionIntel: 'Hashed + tamper-evident, EU AI Act Art. 14 mapped, ES fingerprint bound',
        competitor: 'Decision log export; no cryptographic fingerprint, no regulatory mapping',
        diVerdict: 'yes',
        competitorVerdict: 'partial',
      },
      {
        axis: 'Per-org Brier-scored calibration',
        decisionIntel: `Active on every audit; methodology version ${METHODOLOGY_VERSION}`,
        competitor: 'Internal analytics; no published calibration discipline',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: `Regulatory mapping across ${FRAMEWORK_COUNT} frameworks (G7, EU, GCC, African markets)`,
        decisionIntel: 'Every bias finding carries its regulatory exposure inline',
        competitor: 'US-centric; no multi-jurisdiction regulatory layer',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
    ],
  },
  {
    competitor: 'IBM watsonx.governance',
    oneLiner: COMPETITIVE_DEFENSIVE_LINES[1].line,
    competitorStrength:
      'IBM watsonx.governance audits AI model behaviour: lineage tracking, fairness metrics, drift detection, model risk management. Massive Q1 2026 product updates explicitly targeting EU AI Act readiness for high-risk AI systems. Bundled with the broader IBM enterprise stack, a strong incumbency advantage at Fortune 500 procurement.',
    diDifferentiator: `IBM audits AI MODELS. Decision Intel audits HUMAN REASONING — the chain of analysis a human author produced before a recommendation reached the committee. The strategic-memo authorship is human (or AI-assisted by the human); watsonx has no detector for cognitive bias in human reasoning, no Recognition-Rigor Framework, and no public reference-class corpus. The two products are not substitutes; they are complementary layers of governance.`,
    rows: [
      {
        axis: 'AI model lineage + drift detection',
        decisionIntel: 'Out of scope (we audit humans, not models)',
        competitor: 'Core product capability',
        diVerdict: 'no',
        competitorVerdict: 'yes',
      },
      {
        axis: 'Cognitive bias detection on HUMAN-authored memos',
        decisionIntel: `${BIAS_COUNT}-bias canonical taxonomy with academic citations`,
        competitor: 'Not in product',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: 'Recognition-Rigor Framework (Kahneman + Klein arbitrated)',
        decisionIntel: 'Protected IP moat; ten paper-application detectors shipped',
        competitor: 'Not in product',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: 'EU AI Act Article 14 (human oversight) artefact',
        decisionIntel: 'DPR maps directly onto Art. 14 record-keeping by design',
        competitor: 'Model-side AI Act compliance, not human-oversight artefact',
        diVerdict: 'yes',
        competitorVerdict: 'partial',
      },
      {
        axis: 'Historical reference-class library',
        decisionIntel: `${HISTORICAL_CASE_COUNT} corporate decisions across 12 industries`,
        competitor: 'Model benchmark suites, not decision-outcome library',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: 'Pan-African / EM regulatory mapping',
        decisionIntel: 'NDPR, CBN, WAEMU, POPIA, SARB and seven more',
        competitor: 'US-and-EU centric registry',
        diVerdict: 'yes',
        competitorVerdict: 'partial',
      },
      {
        axis: 'Solo-buyer onramp without enterprise procurement cycle',
        decisionIntel: 'Free tier and £249/mo individual tier; sign-up in minutes',
        competitor: 'Enterprise-only, procurement-led, multi-month sales cycle',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
    ],
  },
  {
    competitor: 'Aera Technology',
    oneLiner: 'Aera automates supply-chain decisions; Decision Intel audits strategic ones.',
    competitorStrength:
      'Aera Technology is positioned as a "decision intelligence" platform with autonomous agents that execute supply-chain decisions directly: replenishment, pricing, logistics. Strong fit for operations-heavy enterprises with high-volume, low-judgment-density decision flow. Aera Decision Cloud excels where the decision can be automated end-to-end.',
    diDifferentiator: `Decision Intel and Aera occupy different ends of the decision-stakes spectrum. Aera automates the high-volume, low-stakes operational decisions; Decision Intel audits the low-volume, high-stakes STRATEGIC decisions where the decision must remain a human call but the reasoning needs to be reviewed before commitment. M&A memos, market-entry recommendations, capital-allocation IC artefacts. Where Aera reduces operator load via automation, Decision Intel reduces decision risk via auditing.`,
    rows: [
      {
        axis: 'Autonomous decision execution on operational flow',
        decisionIntel: 'Out of scope (we audit, never execute)',
        competitor: 'Core product capability',
        diVerdict: 'no',
        competitorVerdict: 'yes',
      },
      {
        axis: 'Cognitive bias audit on strategic memos',
        decisionIntel: `${BIAS_COUNT}-bias canonical taxonomy fired on memo text`,
        competitor: 'Not in product',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: 'Procurement-grade reasoning artefact (DPR)',
        decisionIntel: 'Hashed + tamper-evident; legal-trail bound',
        competitor: 'Decision logs from automated workflows',
        diVerdict: 'yes',
        competitorVerdict: 'partial',
      },
      {
        axis: 'Recognition-Rigor Framework (Kahneman + Klein)',
        decisionIntel: 'Protected IP moat',
        competitor: 'Not in product',
        diVerdict: 'yes',
        competitorVerdict: 'no',
      },
      {
        axis: 'High-volume operational throughput',
        decisionIntel: 'Not optimised for thousands of decisions per hour',
        competitor: 'Built for operational scale',
        diVerdict: 'no',
        competitorVerdict: 'yes',
      },
      {
        axis: 'Audit-committee-defensible decision history',
        decisionIntel: 'Living Decision Knowledge Graph survives team transitions',
        competitor: 'Operational dashboards, not strategic-decision archive',
        diVerdict: 'yes',
        competitorVerdict: 'partial',
      },
    ],
  },
];

const comparisonItemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${siteUrl}/compare#comparison-list`,
  name: 'Decision Intel · Competitive comparison',
  itemListElement: COMPARISONS.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Article',
      headline: `Decision Intel vs ${c.competitor}`,
      description: c.oneLiner,
      url: `${siteUrl}/compare#${slugify(c.competitor)}`,
    },
  })),
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'Compare', item: `${siteUrl}/compare` },
  ],
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function VerdictIcon({ v }: { v: 'yes' | 'partial' | 'no' }) {
  if (v === 'yes') {
    return <Check size={16} style={{ color: C.green }} aria-label="Yes" />;
  }
  if (v === 'partial') {
    return <Minus size={16} style={{ color: C.amber }} aria-label="Partial" />;
  }
  return <Minus size={16} style={{ color: C.slate500 }} aria-label="No" />;
}

export default function ComparePage() {
  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonItemListJsonLd) }}
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
            <Scale size={14} />
            Compare
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
            Decision Intel vs Cloverpop, IBM watsonx, and Aera.
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
            {CATEGORY_CLAIM[0].toUpperCase() + CATEGORY_CLAIM.slice(1)} sits in a different category
            than the tools your team has already evaluated. Three side-by-sides on the axes that
            actually move a procurement scorecard.
          </p>
        </div>
      </section>

      {COMPARISONS.map((c, ci) => (
        <section
          key={c.competitor}
          id={slugify(c.competitor)}
          style={{
            padding: '56px 24px 56px',
            background: ci % 2 === 0 ? C.slate50 : C.white,
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
                marginBottom: 10,
              }}
            >
              Decision Intel vs {c.competitor}
            </div>
            <h2
              style={{
                fontSize: 'clamp(22px, 2.6vw, 32px)',
                fontWeight: 700,
                lineHeight: 1.2,
                margin: 0,
                color: C.slate900,
                letterSpacing: '-0.01em',
              }}
            >
              {c.oneLiner}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
                marginTop: 28,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  padding: '18px 20px',
                  borderTop: `3px solid ${C.slate500}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.slate500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  What {c.competitor} does well
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: C.slate700, margin: 0 }}>
                  {c.competitorStrength}
                </p>
              </div>
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  padding: '18px 20px',
                  borderTop: `3px solid ${C.green}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.green,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Where Decision Intel is different
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: C.slate700, margin: 0 }}>
                  {c.diDifferentiator}
                </p>
              </div>
            </div>

            <div
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: C.slate50, borderBottom: `1px solid ${C.slate200}` }}>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        color: C.slate500,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Axis
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        color: C.green,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Decision Intel
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        color: C.slate500,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {c.competitor}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r, ri) => (
                    <tr
                      key={r.axis}
                      style={{
                        borderTop: ri === 0 ? 'none' : `1px solid ${C.slate100}`,
                      }}
                    >
                      <th
                        scope="row"
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: C.slate900,
                          fontSize: 13,
                          fontWeight: 600,
                          verticalAlign: 'top',
                          width: '34%',
                        }}
                      >
                        {r.axis}
                      </th>
                      <td
                        style={{
                          padding: '14px 16px',
                          color: C.slate700,
                          fontSize: 13,
                          lineHeight: 1.55,
                          verticalAlign: 'top',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ marginTop: 2 }}>
                            <VerdictIcon v={r.diVerdict} />
                          </span>
                          <span>{r.decisionIntel}</span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          color: C.slate600,
                          fontSize: 13,
                          lineHeight: 1.55,
                          verticalAlign: 'top',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ marginTop: 2 }}>
                            <VerdictIcon v={r.competitorVerdict} />
                          </span>
                          <span>{r.competitor}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            Run the audit on a real memo.
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
            The category claim is the H1. The category proof is the artefact. Paste a strategic memo
            and see the audit run end-to-end, free.
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
              href="/demo"
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
              Run the live demo
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/onepager"
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
              Download the one-pager
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
