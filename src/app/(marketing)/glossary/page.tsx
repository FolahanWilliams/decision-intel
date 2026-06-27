/**
 * /glossary — formal definitions of the canonical platform vocabulary.
 *
 * AEO discipline (locked 2026-05-23): formal definition surfaces are the
 * shape AI answer engines lean on when they need to RESOLVE a term, as
 * opposed to ANSWER a question. When a user asks ChatGPT "what is R²F?"
 * the answer pulls from a DefinedTerm shape; when they ask "what does
 * Decision Intel do?" it pulls from FAQ / Article shapes. Two different
 * extraction patterns, two different surfaces — this page covers the
 * RESOLVE pattern.
 *
 * Two tiers of definition:
 *
 *   1. Platform vocabulary — the protected category lexicon (CATEGORY_CLAIM,
 *      R²F, DPR, DQI, Bias Genome, Decision Knowledge Graph, etc.).
 *      Every protected term gets a verbatim definition + the canonical
 *      reference URL. These are the terms a buyer needs to learn before
 *      a discovery call lands.
 *
 *   2. Bias taxonomy index — the BIAS_COUNT-bias canonical taxonomy
 *      surfaced as a single DefinedTermSet, one entry per bias, each
 *      linking to the deep /taxonomy entry. The DefinedTermSet on
 *      /taxonomy is the canonical academic surface; this glossary
 *      entry is the cross-link for AI engines that hit /glossary first.
 *
 * JSON-LD: DefinedTermSet at the document root + one DefinedTerm per
 * entry. Each DefinedTerm carries name + description + termCode (stable
 * identifier) + inDefinedTermSet (back-reference) + url (canonical
 * detail page). This is the Mintlify / Stripe pattern for technical
 * documentation grounded in schema.org.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import { CATEGORY_CLAIM, IP_MOAT_NAME } from '@/lib/constants/icp';

const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;
const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Glossary · Decision Intel',
  description: `Formal definitions of every protected term in the Decision Intel vocabulary. The reasoning audit platform, R²F, DPR, DQI, Bias Genome, and the ${BIAS_COUNT}-bias canonical taxonomy.`,
  alternates: { canonical: `${siteUrl}/glossary` },
  openGraph: {
    title: 'Glossary · Decision Intel',
    description:
      'Formal definitions of every protected platform term and the canonical bias taxonomy.',
    url: `${siteUrl}/glossary`,
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

interface GlossaryEntry {
  /** The canonical term — the headword that AI engines look up. */
  term: string;
  /** Alternate names (acronym expansions, shorthand forms). */
  alternates?: string[];
  /** Stable identifier used in the DefinedTerm schema. */
  termCode: string;
  /** The verbatim definition. Procurement-grade, citable, complete. */
  definition: string;
  /**
   * Canonical source URL on the platform where the term is anchored.
   * Optional — some terms (Outcome Gate, Noise Jury, Validity Classifier,
   * Reference Class Forecast, Prospective Hindsight) are operationalisations
   * with no dedicated detail page yet; the definition itself IS canonical.
   */
  source?: { label: string; href: string };
}

const PLATFORM_VOCABULARY: GlossaryEntry[] = [
  {
    term: 'Reasoning audit platform',
    alternates: ['the reasoning audit platform', 'reasoning audit'],
    termCode: 'DI-V-CATEGORY',
    definition: `The protected category noun. ${CATEGORY_CLAIM[0].toUpperCase() + CATEGORY_CLAIM.slice(1)} is software that audits the human reasoning chain that produced a strategic recommendation, before the recommendation reaches the steering committee. Differentiated from business-intelligence tools (which audit data) and model-risk-management tools (which audit algorithms) by baking the human-reasoning differentiator into the noun itself.`,
    source: { label: 'How it works', href: '/how-it-works' },
  },
  {
    term: 'Recognition-Rigor Framework',
    alternates: ['R²F', 'R2F'],
    termCode: 'DI-V-R2F',
    definition: `${IP_MOAT_NAME}. The protected IP moat that arbitrates Daniel Kahneman’s System 2 debiasing (bias detection, noise jury, statistical scoring) with Gary Klein’s Recognition-Primed Decision framework (pattern recognition, mental simulation, prospective-hindsight pre-mortem) in a single 12-node analysis pipeline. Anchored on Kahneman & Klein (2009) "Conditions for Intuitive Expertise: A Failure to Disagree." Operationalised across ten paper-application detectors: validity classifier, reference-class forecasting, feedback adequacy, calibrated rejection of subjective confidence, fractionation of expertise, decision rubric, algorithm aversion, prospective hindsight, inside-view dominance, illusion of validity.`,
    source: { label: 'R²F Standard', href: '/r2f-standard' },
  },
  {
    term: 'Decision Provenance Record',
    alternates: ['DPR'],
    termCode: 'DI-V-DPR',
    definition: `The procurement-grade artefact produced by every audit. Hashed and tamper-evident, with SHA-256 input hashes, methodology version stamp (current: ${METHODOLOGY_VERSION}), prompt fingerprint, DQI weight-resolution hash, and a composed Evidentiary Standard fingerprint bound into the legal trail. Mapped onto EU AI Act Article 14 (human oversight), Basel III Pillar 2 ICAAP (qualitative decision documentation), SEC AI disclosure rules, GDPR Article 22 (automated-decision rights), and the 11 AI Verify Foundation principles. The artefact a General Counsel carries across years to maintain an audit-committee-defensible reasoning record.`,
    source: { label: 'Decision Provenance', href: '/decision-provenance' },
  },
  {
    term: 'Decision Quality Index',
    alternates: ['DQI'],
    termCode: 'DI-V-DQI',
    definition: `A weighted composite score from 0 to 100 derived from seven components: bias load, noise level, evidence quality, process maturity, compliance exposure, historical alignment with the ${HISTORICAL_CASE_COUNT}-case reference library, and compound failure-pattern risk. Methodology version ${METHODOLOGY_VERSION} is the current live engine. Grade bands: A 85+, B 70+, C 55+, D 40+, F 0+. Weights are user-adjustable on the Strategy tier per Dietvorst, Simmons & Massey (2015), the canonical fix for algorithm aversion: practitioners adopt imperfect algorithms only if allowed to slightly modify the inputs or weights.`,
    source: { label: 'How it works', href: '/how-it-works' },
  },
  {
    term: 'Decision Knowledge Graph',
    termCode: 'DI-V-DKG',
    definition:
      'A living record of every strategic decision an organisation has run through the platform, their outcomes, and the reasoning trail. Decision history survives team transitions (CSO leaves; reasoning trail stays). Audit-committee Q&A pulls up reasoning in 60 seconds. The data substrate that makes future decisions sharper because the platform learns the organisation’s specific bias patterns via Brier-scored per-org recalibration.',
    source: { label: 'How it works', href: '/how-it-works' },
  },
  {
    term: 'Bias Genome',
    termCode: 'DI-V-GENOME',
    definition: `The first public ranking of which cognitive biases predict failure by industry, built from the historical case library and (as customers consent) calibrated against live outcome data. Every metric carries its sample size; dimmed rows flag n<3 (insufficient confidence for a published claim). The cross-organisation data flywheel that compounds the platform's defensive moat against incumbents whose AI-governance tools lack reasoning-quality data.`,
    source: { label: 'Bias Genome', href: '/bias-genome' },
  },
  {
    term: 'Outcome Gate',
    termCode: 'DI-V-OUTCOME-GATE',
    definition:
      'A workflow-level enforcement that prevents a user from escalating to the next strategic decision until the prior decision’s outcome is on record. Engineered into the platform rather than left optional, because the cross-org calibration flywheel only compounds when outcomes close. Enforced on HXC-cohort accounts from day one. The structural answer to the canonical decision-intelligence failure mode (Cloverpop manual-logging adoption trap).',
  },
  {
    term: 'Bias-Interaction Matrix',
    alternates: ['interaction matrix'],
    termCode: 'DI-V-MATRIX',
    definition: `A ${MATRIX_DIMENSION} × ${MATRIX_DIMENSION} pairwise weight matrix capturing how each canonical bias amplifies, dampens, or compounds with every other bias. ${MATRIX_DIMENSION * MATRIX_DIMENSION} weights total. The substrate for compound-failure-pattern detection — toxic combinations like "Coherent Confidence" (illusion of validity + overconfidence + confirmation bias) and "Reference-Class Blindness" (inside-view dominance + planning fallacy + overconfidence) are detected as named patterns when their constituent biases co-occur at sufficient severity.`,
    source: { label: 'Bias Genome', href: '/bias-genome' },
  },
  {
    term: 'Noise Jury',
    termCode: 'DI-V-NOISE-JURY',
    definition:
      'A 3-frame jury that scores each audit through three orthogonal professional lenses: analyst-skeptical, regulator-hostile, and contrarian-strategist. Run across two model families (Gemini + Grok) for architectural diversity. Disagreement across the three frames IS the noise signal: low standard deviation indicates robust quality (the document survives multiple lenses), high standard deviation indicates framing-sensitive quality (which itself tells the reviewer which audience will be harshest). Inspired by Kahneman’s 2021 Noise insurance-underwriter study.',
  },
  {
    term: 'Validity Classifier',
    termCode: 'DI-V-VALIDITY',
    definition:
      'A paper-application detector that classifies a decision’s "validity environment" into four bands (high / medium / low / zero) per Kahneman & Klein (2009)’s first condition for trustworthy intuition. In low-validity environments (frontier VC, cross-border mega-merger), confidence-language is penalised harder in scoring and the DQI weight distribution shifts toward historical-alignment and bias-load components. The methodology version stamp on every DPR records which validity-shift rule applied.',
  },
  {
    term: 'Reference Class Forecast',
    termCode: 'DI-V-RCF',
    definition:
      'A paper-application detector grounded in Kahneman & Lovallo (2003) "Delusions of Success." Pure-function similarity scoring against the historical case library returns the top-5 historical analogs plus a matched-class baseline failure rate, surfaced as a four-band predicted outcome (succeeds / mixed / struggles / fails / too-small-to-judge). Cold-start posture is honest: structurally novel decisions return "too-small-to-judge" rather than a fabricated forecast.',
  },
  {
    term: 'Prospective Hindsight',
    alternates: ['pre-mortem'],
    termCode: 'DI-V-PROSPECTIVE-HINDSIGHT',
    definition:
      'A paper-application detector grounded in Klein & Mitchell (1995) and Mitchell, Russo & Pennington (1989). The pipeline’s pre-mortem prompts project one year into the future, assume the plan was implemented as written and the outcome was a total disaster, then ask the user (and the model) to write the history of that disaster in past tense. The past-tense fait-accompli framing produces 25-30% more failure-cause insights than asking "what could go wrong?" in conditional voice.',
  },
  {
    term: 'Decision Provenance Record · Evidentiary Standard fingerprint',
    alternates: ['ES fingerprint'],
    termCode: 'DI-V-ES-FINGERPRINT',
    definition: `A composed cryptographic token bound into every DPR's legal trail (locked 2026-05-18). Shape: ES·m${METHODOLOGY_VERSION}·in:<input-hash-8>·pf:<prompt-fingerprint-8>·w:<weights-hash>·s<schema-version>. Recomputes deterministically from the persisted audit values: methodology version + SHA-256 input hash + prompt fingerprint + DQI weights-resolution hash + record schema version. The single citable token a General Counsel carries forward to verify two DPRs are from the same engine state. Bound contractually via the Data Processing Agreement Section 11.`,
    source: { label: 'Trust', href: '/trust' },
  },
];

const platformVocabularyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': `${siteUrl}/glossary#platform-vocabulary`,
  name: 'Decision Intel · Platform Vocabulary',
  description:
    'The canonical platform lexicon: the protected terms that constitute the Decision Intel category vocabulary.',
  hasDefinedTerm: PLATFORM_VOCABULARY.map(e => ({
    '@type': 'DefinedTerm',
    '@id': `${siteUrl}/glossary#${e.termCode.toLowerCase()}`,
    name: e.term,
    alternateName: e.alternates ?? [],
    termCode: e.termCode,
    description: e.definition,
    inDefinedTermSet: `${siteUrl}/glossary#platform-vocabulary`,
    ...(e.source
      ? {
          url: e.source.href.startsWith('http') ? e.source.href : `${siteUrl}${e.source.href}`,
        }
      : { url: `${siteUrl}/glossary#${e.termCode.toLowerCase()}` }),
  })),
};

const biasTaxonomyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': `${siteUrl}/glossary#bias-taxonomy`,
  name: `Decision Intel · ${BIAS_COUNT}-Bias Canonical Taxonomy`,
  description: `The ${BIAS_COUNT} cognitive biases in the canonical Decision Intel taxonomy, with stable identifiers DI-B-001 through DI-B-0${String(BIAS_COUNT).padStart(2, '0')}. Every bias is anchored to a primary academic source.`,
  hasDefinedTerm: Object.entries(BIAS_EDUCATION).map(([key, bias]) => ({
    '@type': 'DefinedTerm',
    '@id': `${siteUrl}/taxonomy#${bias.taxonomyId.toLowerCase()}`,
    name: humanizeBiasKey(key),
    termCode: bias.taxonomyId,
    description: bias.quickTip,
    inDefinedTermSet: `${siteUrl}/glossary#bias-taxonomy`,
    url: `${siteUrl}/taxonomy#${bias.taxonomyId.toLowerCase()}`,
  })),
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'Glossary', item: `${siteUrl}/glossary` },
  ],
};

function humanizeBiasKey(key: string): string {
  return key
    .split('_')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export default function GlossaryPage() {
  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(platformVocabularyJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(biasTaxonomyJsonLd) }}
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
            <BookOpen size={14} />
            Glossary
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
            Formal definitions of every protected platform term.
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
            Canonical vocabulary for buyers, vendor-risk reviewers, and AI answer engines. Every
            definition is the verbatim source-of-truth; the canonical detail page is one click away.
          </p>
        </div>
      </section>

      {/* PLATFORM VOCABULARY */}
      <section
        style={{
          padding: '48px 24px 64px',
          background: C.slate50,
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
            Platform vocabulary
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
            The protected category lexicon
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
            These terms are owned by Decision Intel through consistent usage. Paraphrases dilute the
            category; the canonical phrasing is the citable source.
          </p>

          {/* role=list + dfn (the element for the defining instance of a term)
              rather than dl/dt/dd: the rich card layout (code badge, "also
              known as", source link) can't satisfy axe's definition-list /
              dlitem direct-child rules, and dfn is the more correct semantic
              for a glossary term anyway. */}
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: 0 }}>
            {PLATFORM_VOCABULARY.map(entry => (
              <article
                key={entry.termCode}
                id={entry.termCode.toLowerCase()}
                role="listitem"
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 12,
                  padding: '24px 28px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <dfn
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      fontStyle: 'normal',
                      color: C.slate900,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {entry.term}
                  </dfn>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.slate500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                    }}
                  >
                    {entry.termCode}
                  </span>
                </div>
                {entry.alternates && entry.alternates.length > 0 ? (
                  <div style={{ fontSize: 13, color: C.slate500, marginBottom: 12 }}>
                    Also known as: {entry.alternates.join(', ')}
                  </div>
                ) : null}
                <div
                  style={{
                    margin: 0,
                    marginTop: 8,
                    marginBottom: entry.source ? 14 : 0,
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: C.slate700,
                  }}
                >
                  {entry.definition}
                </div>
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

      {/* BIAS TAXONOMY INDEX */}
      <section style={{ padding: '64px 24px 96px', background: C.white }}>
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
            Bias taxonomy index
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
            {BIAS_COUNT} cognitive biases · {FRAMEWORK_COUNT} regulatory mappings
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
            Stable identifiers DI-B-001 through DI-B-0{String(BIAS_COUNT).padStart(2, '0')}. Every
            bias is anchored to a primary academic source with DOI. Click any entry for the full
            detection rationale, debiasing techniques, related biases, and real-world example.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {Object.entries(BIAS_EDUCATION).map(([key, bias]) => (
              <Link
                key={bias.taxonomyId}
                href={`/taxonomy#${bias.taxonomyId.toLowerCase()}`}
                style={{
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  padding: '16px 18px',
                  textDecoration: 'none',
                  color: C.slate900,
                  display: 'block',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.green,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                    marginBottom: 4,
                  }}
                >
                  {bias.taxonomyId}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.slate900, marginBottom: 4 }}>
                  {humanizeBiasKey(key)}
                </div>
                <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.5 }}>
                  {bias.quickTip}
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link
              href="/taxonomy"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 20px',
                background: C.navy,
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Open the full taxonomy
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
