/**
 * DprSpecimenShowcase — surfaces the WeWork + Dangote DPR specimens on
 * cold marketing surfaces.
 *
 * Shipped 2026-05-27 to close the conversion-funnel gap surfaced by the
 * platform audit on the same day: the McKinsey-grade DPR rendering route
 * (/dpr-render/specimen/wework + /dpr-render/specimen/dangote) was
 * shipped 2026-05-05 but ZERO marketing surfaces linked to it. The only
 * surfacing was the PDF download on /trust. Cold readers who want to
 * SEE a procurement-grade audit before committing had no in-browser
 * path; the PDF download is a heavier ask than a click-through.
 *
 * Two specimens, two surfacing patterns per card:
 *   - "View in browser →" → /dpr-render/specimen/<slug> (HTML render)
 *   - "Download PDF" → /dpr-sample-<slug>.pdf (existing static asset)
 *
 * Mount on:
 *   - /decision-provenance (the page about DPRs — should show one)
 *   - /proof (the public procurement-evidence surface)
 *   - Anywhere a cold reader benefits from seeing the artefact shape
 *     before being asked to commit.
 */

import Link from 'next/link';
import { FileText, ExternalLink, Download, Shield } from 'lucide-react';

const SPECIMENS = [
  {
    slug: 'wework',
    title: 'WeWork S-1 (2019)',
    subtitle: 'Pre-IPO audit · narrative coherence + valuation framework',
    description:
      'Retroactive Recognition-Rigor Framework audit of the WeWork S-1, anonymised as "Project Heliograph DACH" to demonstrate the procurement-grade artefact shape on a high-stakes US capital-markets shape.',
    biases: 'Illusion of Validity · Overconfidence · Authority Bias',
    region: 'US capital markets · DACH expansion lens',
    pdfHref: '/dpr-sample-wework.pdf',
    htmlHref: '/dpr-render/specimen/wework',
  },
  {
    slug: 'dangote',
    title: 'Dangote Pan-African Expansion (2014)',
    subtitle: 'Cross-border cement industrial expansion · regulatory map',
    description:
      'Retroactive audit of an anonymised cement-sector Pan-African expansion plan. Surfaces three Dalio determinants (currency cycle, trade share, governance) plus the seven-framework Pan-African regulatory mapping (NDPR · CBN · WAEMU · PoPIA · CMA Kenya · CBE · Basel III).',
    biases: 'Inside-View Dominance · Optimism Bias · Anchoring',
    region: 'Pan-African · cross-border M&A',
    pdfHref: '/dpr-sample-dangote.pdf',
    htmlHref: '/dpr-render/specimen/dangote',
  },
] as const;

const C = {
  white: '#FFFFFF',
  slate900: '#0F172A',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
};

interface Props {
  /** Optional background override (the consumer page sets the rhythm). */
  background?: string;
  /** Optional eyebrow override — defaults to "DPR specimens". */
  eyebrow?: string;
  /** Optional heading override. */
  heading?: string;
  /** Optional subhead override. */
  subhead?: string;
}

export function DprSpecimenShowcase({
  background = C.white,
  eyebrow = 'Decision Provenance Record · specimens',
  heading = 'See the procurement-grade artefact, before you commit.',
  subhead = 'Two retroactive R²F audits of well-known historical decisions, rendered as the same Decision Provenance Record your team would receive after every audit.',
}: Props) {
  return (
    <section
      style={{
        padding: '64px 24px',
        background,
        borderTop: `1px solid ${C.slate100}`,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              background: C.greenSoft,
              color: C.green,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              borderRadius: 999,
              marginBottom: 14,
            }}
          >
            <Shield size={12} />
            {eyebrow}
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.6vw, 30px)',
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              color: C.slate900,
              letterSpacing: '-0.01em',
              maxWidth: 760,
            }}
          >
            {heading}
          </h2>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: 1.6,
              color: C.slate600,
              maxWidth: 720,
            }}
          >
            {subhead}
          </p>
        </div>

        {/* Specimen cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {SPECIMENS.map(s => (
            <div
              key={s.slug}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderTop: `3px solid ${C.green}`,
                borderRadius: 12,
                padding: '20px 22px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: C.slate500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                <FileText size={12} />
                {s.region}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.slate900,
                  margin: '0 0 4px',
                  letterSpacing: '-0.01em',
                }}
              >
                {s.title}
              </h3>
              <div
                style={{
                  fontSize: 12,
                  color: C.slate500,
                  fontStyle: 'italic',
                  marginBottom: 12,
                }}
              >
                {s.subtitle}
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: C.slate600,
                  margin: '0 0 12px',
                  flex: 1,
                }}
              >
                {s.description}
              </p>
              <div
                style={{
                  fontSize: 11.5,
                  color: C.slate500,
                  fontFamily: 'var(--font-mono, monospace)',
                  marginBottom: 16,
                  padding: '6px 10px',
                  background: C.slate50,
                  borderRadius: 6,
                  border: `1px solid ${C.slate100}`,
                }}
              >
                {s.biases}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link
                  href={s.htmlHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: C.green,
                    color: C.white,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    textDecoration: 'none',
                  }}
                >
                  View in browser
                  <ExternalLink size={12} />
                </Link>
                {/* Static asset — plain <a> per CLAUDE.md static-asset rule
                    (next/link RSC-prefetches the href as a route; static
                    PDFs have none and 404). */}
                <a
                  href={s.pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: 'transparent',
                    color: C.slate700,
                    border: `1px solid ${C.slate200}`,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    textDecoration: 'none',
                  }}
                >
                  <Download size={12} />
                  Download PDF
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Foot — direct trust-page cross-link for procurement readers
            who want the canonical artefact bundle. */}
        <div
          style={{
            marginTop: 24,
            fontSize: 13,
            color: C.slate500,
            textAlign: 'center',
          }}
        >
          The same DPR shape is generated for every audit. See{' '}
          <Link href="/trust" style={{ color: C.green, fontWeight: 600 }}>
            the full trust + procurement page
          </Link>{' '}
          for the contractual specimen + DPA + sub-processor schedule.
        </div>
      </div>
    </section>
  );
}
