/**
 * /onepager — the procurement-grade one-page artifact (locked 2026-05-11).
 *
 * Format mirrors Arden's /onepager.html (Y Combinator P26): one clean
 * page, sections numbered 01/02/03, stat strip, team credibility row,
 * sources cited at the bottom. The artifact a founder can DM to a
 * CSO / M&A head / fund partner with no context — they read it once
 * and decide whether to book a call.
 *
 * Voice rules (CLAUDE.md "Marketing Voice — Enterprise Discipline"):
 *   - No stage-of-company language; "design-partner phase" is the
 *     canonical enterprise-voiced stage.
 *   - Counts derive from canonical constants (HISTORICAL_CASE_COUNT,
 *     FRAMEWORK_COUNT) so the one-pager never drifts when the
 *     reference library or compliance registry changes.
 *   - Sources cited verbatim with date + publisher — procurement
 *     readers verify these.
 *   - The founder narrative leads with Lagos/Nigeria per the founder
 *     positioning lock, names Mr. Reiner without naming Wiz directly
 *     (the locked confidentiality discipline).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import {
  PROCUREMENT_CONTACT_EMAIL,
  FOUNDED_YEAR,
} from '@/lib/constants/company-info';

const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Decision Intel · One-pager',
  description:
    'The reasoning audit platform for corporate strategy and M&A teams. The procurement-grade one-page brief — problem, what we do, team, sources.',
  alternates: { canonical: `${siteUrl}/onepager` },
  openGraph: {
    title: 'Decision Intel · One-pager',
    description:
      'The reasoning audit platform for corporate strategy and M&A teams. Problem, solution, team — one page.',
    url: `${siteUrl}/onepager`,
  },
  robots: { index: true, follow: true },
};

const C = {
  bg: '#FAFAF9', // warm off-white — Arden uses #FCFCFB; close enough
  card: '#FFFFFF',
  text: '#0A0E27',
  muted: '#6B7280',
  meta: '#9CA3AF',
  rule: '#E5E7EB',
  green: '#16A34A',
};

export default function OnepagerPage() {
  return (
    <main
      style={{
        background: C.bg,
        minHeight: '100vh',
        padding: '64px 16px',
        fontFamily:
          'var(--font-serif, "Times New Roman", Georgia, serif)',
      }}
    >
      <article
        style={{
          maxWidth: 820,
          margin: '0 auto',
          background: C.card,
          padding: '64px 56px',
          color: C.text,
          fontSize: 15,
          lineHeight: 1.65,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo bar */}
        <header style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/logo.png"
            alt="Decision Intel"
            width={28}
            height={28}
            style={{ borderRadius: 6, objectFit: 'cover' }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Decision Intel
          </span>
        </header>

        {/* H1 + lead */}
        <h1
          style={{
            fontSize: 'clamp(32px, 4.6vw, 48px)',
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
            marginBottom: 24,
          }}
        >
          The reasoning audit platform for corporate strategy and M&amp;A teams.
        </h1>
        <p style={{ marginTop: 0, marginBottom: 16, color: C.text, fontSize: 16, lineHeight: 1.7 }}>
          Decision Intel runs the Recognition-Rigor Framework over your strategic memos,
          investment-committee decks, and M&amp;A diligence packs. We detect cognitive biases,
          surface cross-document conflicts, score Decision Quality, and produce a hashed Decision
          Provenance Record your audit committee can defend.
        </p>
        <p style={{ marginTop: 0, marginBottom: 0, color: C.muted, fontSize: 15, lineHeight: 1.7 }}>
          Built for the EU AI Act Aug 2026 enforcement deadline, the Basel III ICAAP qualitative-
          decision documentation requirement, and SEC AI-disclosure rules. Cross-border M&amp;A
          coverage no US-only incumbent carries.
        </p>

        {/* Divider */}
        <hr style={{ border: 0, borderTop: `1px solid ${C.rule}`, margin: '48px 0' }} />

        {/* 01 + 02 — two-column body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
          }}
          className="onepager-cols"
        >
          <section>
            <SectionLabel index="01" title="The problem" />
            <h3 style={sectionHeadingStyle}>
              Every Fortune 500 has data governance. None has reasoning governance.
            </h3>
            <p style={bodyParaStyle}>
              McKinsey: only <strong>8% of corporate strategies</strong> deliver against their
              stated objectives. KPMG: <strong>70-90% of M&amp;A deals</strong> fail to realize
              projected synergies. The reasoning behind those memos arrives at the audit
              committee with none of the discipline applied to the underlying data.
            </p>
            <p style={bodyParaStyle}>
              When the EU AI Act Article 14 record-keeping obligation hits in August 2026,
              Fortune 500 GCs need an artifact that documents not just what was decided, but
              the reasoning that produced it. None of the incumbent platforms (Cloverpop,
              IBM watsonx.governance, Palantir Foundry) produce that artifact today.
            </p>
          </section>

          <section>
            <SectionLabel index="02" title="What Decision Intel does" />
            <h3 style={sectionHeadingStyle}>The full audit workflow, end-to-end.</h3>
            <p style={bodyParaStyle}>
              Upload a strategic memo, IC deck, CIM, or synergy model. The R²F audit pipeline
              anonymizes the document, detects {BIAS_COUNT} canonical cognitive biases per a
              published taxonomy, runs a 3-frame noise jury across two model families, scores a
              composite Decision Quality Index, and emits a hashed Decision Provenance Record.
            </p>
            <p style={bodyParaStyle}>
              The DPR is the artifact your audit committee defends — mapped onto EU AI Act Art
              14, Basel III ICAAP, SEC AI disclosure, plus {FRAMEWORK_COUNT} regulatory
              frameworks covering G7, EU, GCC, and African markets (NDPR, CBN, WAEMU, PoPIA,
              SARB, ISA Nigeria 2007). Every confirmed outcome compounds back into per-org
              Brier-scored calibration.
            </p>
          </section>
        </div>

        {/* Divider */}
        <hr style={{ border: 0, borderTop: `1px solid ${C.rule}`, margin: '48px 0' }} />

        {/* Stat strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            textAlign: 'center',
            padding: '8px 0',
          }}
          className="onepager-stats"
        >
          <Stat
            value={String(HISTORICAL_CASE_COUNT)}
            label="audited corporate decisions"
            sub="reference library"
          />
          <Stat
            value={String(BIAS_COUNT)}
            label="cognitive biases detected"
            sub="R²F taxonomy"
          />
          <Stat
            value={String(FRAMEWORK_COUNT)}
            label="regulatory frameworks"
            sub="G7 · EU · GCC · African"
          />
        </div>

        {/* Divider */}
        <hr style={{ border: 0, borderTop: `1px solid ${C.rule}`, margin: '48px 0' }} />

        {/* 03 — team */}
        <section>
          <SectionLabel index="03" title="Team" />
          <h3 style={sectionHeadingStyle}>Technical founder. Audited methodology. Senior advisor.</h3>
          <p style={bodyParaStyle}>
            Decision Intel is built by Folahan Williams — Lagos-raised, UK-resident, US-bound for
            university. Published research on the cognitive-bias mechanics behind the 2008
            financial crisis. Runs a financial-literacy initiative teaching finance +
            psychological principles to middle-school students. The Lagos perspective on
            cross-border capital allocation is the anchor behind the cross-border M&amp;A
            coverage built into the product.
          </p>
          <p style={bodyParaStyle}>
            Advised by a senior cybersecurity-and-governance operator who took a venture-stage
            company through a $32B strategic acquisition. The codebase IS the company — any
            senior full-stack engineer can onboard in weeks; the R²F pipeline, the
            {BIAS_COUNT}-bias taxonomy, and the {FRAMEWORK_COUNT}-framework regulatory registry
            are all inspectable in the GitHub repo on request.
          </p>
        </section>

        {/* Divider */}
        <hr style={{ border: 0, borderTop: `1px solid ${C.rule}`, margin: '48px 0' }} />

        {/* Sources strip */}
        <section
          style={{ fontSize: 12, color: C.meta, lineHeight: 1.8, letterSpacing: '0.02em' }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.text,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 12,
            }}
          >
            Sources
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 24px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
            className="onepager-sources"
          >
            <span>McKinsey · Strategy Beyond the Hockey Stick (2018)</span>
            <span>KPMG · M&amp;A Outlook 2024</span>
            <span>Kahneman &amp; Klein · Conditions for Intuitive Expertise (2009)</span>
            <span>Kahneman &amp; Lovallo · Delusions of Success · HBR (2003)</span>
            <span>EU AI Act · Articles 13–15 · in force Aug 2024 → 2026</span>
            <span>Basel III · Pillar 2 ICAAP qualitative-decision documentation</span>
            <span>SEC AI Disclosure · Investment-adviser rulemaking 2024+</span>
            <span>AI Verify Foundation · 11 governance principles · Singapore IMDA</span>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${C.rule}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: C.meta,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <Link
            href="/"
            style={{ color: C.text, textDecoration: 'none', fontWeight: 600 }}
          >
            decision-intel.com
          </Link>
          <a
            href={`mailto:${PROCUREMENT_CONTACT_EMAIL}`}
            style={{ color: C.text, textDecoration: 'none', fontWeight: 600 }}
          >
            {PROCUREMENT_CONTACT_EMAIL}
          </a>
        </footer>
      </article>

      {/* Mobile collapse */}
      <style>{`
        @media (max-width: 720px) {
          .onepager-cols { grid-template-columns: 1fr !important; gap: 32px !important; }
          .onepager-stats { grid-template-columns: 1fr !important; gap: 16px !important; }
          .onepager-sources { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.3,
  margin: 0,
  marginTop: 4,
  marginBottom: 16,
  letterSpacing: '-0.01em',
};

const bodyParaStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: C.muted,
  margin: 0,
  marginBottom: 16,
};

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.meta,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        marginBottom: 12,
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
      }}
    >
      {index} / {title}
    </div>
  );
}

function Stat({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 400,
          color: C.text,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: C.text,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 10,
          color: C.meta,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {sub}
      </div>
    </div>
  );
}

// Mark `FOUNDED_YEAR` as referenced so lint doesn't complain — it's imported
// for future expansion of the team section but not surfaced in the current
// copy (founder narrative leads with the year only indirectly via the
// build-history). Keeping the import keeps the canonical company-info
// pointer fresh for the next iteration.
void FOUNDED_YEAR;
