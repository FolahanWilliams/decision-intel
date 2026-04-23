'use client';

/**
 * /decision-provenance — marketing surface for the DPR artifact.
 *
 * The wedge: a GC / audit committee / regulator can download a real
 * 4-page specimen DPR without a login. The PDF carries a diagonal
 * SPECIMEN watermark so it can't be mistaken for a live audit, but
 * the structure is the production shape. This is the single strongest
 * enterprise artifact Decision Intel produces; it belongs on the
 * public surface, not buried behind Pro gating on a document page.
 *
 * Language discipline:
 *   - "signed, hashed evidence record" — procurement-bar voice.
 *   - Regulatory tailwinds cited by statute + date, not speculation.
 *   - No pricing, no stage-of-company language, no startup voice.
 */

import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import {
  ArrowRight,
  Download,
  ShieldCheck,
  FileSignature,
  Fingerprint,
  Scale,
  ClipboardList,
  Sparkle,
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
};

interface PageRow {
  page: number;
  title: string;
  body: string;
  icon: typeof Fingerprint;
}

const PAGES: PageRow[] = [
  {
    page: 1,
    title: 'Cover + integrity fingerprints',
    body: 'R²F framework mark, audit summary, SHA-256 of the source document, SHA-256 of the prompt version used, schema version, server-side timestamp, reviewer counter-signature block.',
    icon: Fingerprint,
  },
  {
    page: 2,
    title: 'Model lineage + judge variance',
    body: 'Which model tier ran on which pipeline stage, with decoding parameters recorded per stage. Meta-judge verdict summary and the noise-band score. No prompt content is serialised — only the fingerprint.',
    icon: ClipboardList,
  },
  {
    page: 3,
    title: 'Academic citations + regulatory mapping',
    body: 'One row per detected bias: taxonomy ID, full APA citation, DOI when available. Each bias is mapped to the frameworks it touches — EU AI Act Article 13/14/15, Basel III ICAAP, GDPR Article 22, SEC AI disclosure.',
    icon: Scale,
  },
  {
    page: 4,
    title: 'Pipeline lineage',
    body: 'The ordered pipeline — node IDs, zones, academic anchors — exactly as the audit ran. No toxic-combination weights, no per-org causal edges, no learned bias-genome values (IP-protection rules baked into the assembler).',
    icon: FileSignature,
  },
];

interface Tailwind {
  name: string;
  status: string;
  anchor: string;
}

const TAILWINDS: Tailwind[] = [
  {
    name: 'EU AI Act',
    status: 'In force since Aug 2024',
    anchor: 'Art 14 human oversight · Art 15 record-keeping · high-risk obligations Aug 2026',
  },
  {
    name: 'Basel III · Pillar 2 ICAAP',
    status: 'Live for regulated banks',
    anchor: 'Qualitative-decision documentation attached to every flagged bias',
  },
  {
    name: 'SEC AI Disclosure',
    status: 'Evolving through 2026',
    anchor: 'Model lineage + prompt fingerprint + judge variance are the documentation',
  },
  {
    name: 'GDPR Article 22',
    status: 'Live since 2018',
    anchor: 'Meaningful information about the logic — provided without exposing platform IP',
  },
];

export function DecisionProvenanceClient() {
  return (
    <div style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 56px' }}>
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
          <ShieldCheck size={12} strokeWidth={2.25} aria-hidden />
          Decision Provenance Record · DPR
        </div>
        <h1
          className="marketing-display"
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            lineHeight: 1.05,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: C.slate900,
          }}
        >
          The record your AI-augmented decision-making is already supposed to produce.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.5,
            color: C.slate600,
            maxWidth: 780,
            margin: '18px 0 0',
          }}
        >
          Every Decision Intel audit ships with a signed, hashed evidence record: source-document
          hash, prompt-version fingerprint, model lineage, judge variance, academic citations,
          regulatory mapping, and the full pipeline lineage. Four pages. Your General Counsel can
          open the specimen in one click — no login, no gate.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
          <a
            href="/api/public/sample-dpr"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 18px',
              background: C.green,
              color: C.white,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            <Download size={15} strokeWidth={2.25} aria-hidden />
            Download the specimen PDF
          </a>
          <Link
            href="/r2f-standard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 18px',
              background: C.white,
              color: C.slate900,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
              border: `1px solid ${C.slate300}`,
            }}
          >
            Read the R²F standard
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
          <Link
            href="/regulatory/ai-verify"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 18px',
              background: C.white,
              color: C.slate900,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
              border: `1px solid ${C.slate300}`,
            }}
          >
            AI Verify mapping
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
        <p
          style={{
            margin: '20px 0 0',
            fontSize: 12,
            color: C.slate500,
            lineHeight: 1.6,
            maxWidth: 780,
          }}
        >
          The specimen is a SPECIMEN — the PDF carries a diagonal watermark on every page. The memo,
          hashes, and findings are fictional but representative; the structure is the production
          shape. A live DPR is generated on every authenticated audit.
        </p>
      </section>

      {/* Four-page breakdown */}
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
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              margin: '0 0 6px',
            }}
          >
            What’s inside the four pages
          </h2>
          <p
            style={{
              margin: '0 0 24px',
              fontSize: 14,
              color: C.slate600,
              maxWidth: 720,
            }}
          >
            Every live DPR ships with the same structure — the specimen and a real audit are
            byte-compatible on shape. Only the watermark, hashes, and findings differ.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {PAGES.map(p => {
              const Icon = p.icon;
              return (
                <article
                  key={p.page}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 14,
                    padding: '18px 20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: C.green,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    <Icon size={13} strokeWidth={2.25} aria-hidden />
                    Page {p.page}
                  </div>
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      margin: 0,
                      color: C.slate900,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: C.slate600,
                    }}
                  >
                    {p.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Regulatory tailwinds */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 24px' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            margin: '0 0 6px',
          }}
        >
          Why this matters now
        </h2>
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            color: C.slate600,
            maxWidth: 720,
          }}
        >
          The DPR maps onto regulation already in force or calendared. Every tailwind below carries
          a statute, a regulator guidance, or an enforcement date. Speculation is not cited.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {TAILWINDS.map(t => (
            <div
              key={t.name}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.green,
                  marginBottom: 6,
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.slate900,
                  marginBottom: 6,
                }}
              >
                {t.status}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: C.slate600 }}>{t.anchor}</div>
            </div>
          ))}
        </div>
      </section>

      {/* IP-protection promise */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 24px' }}>
        <div
          style={{
            background: C.navy,
            color: C.white,
            borderRadius: 16,
            padding: '32px 28px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 20,
            alignItems: 'center',
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
              <Sparkle size={12} strokeWidth={2.5} aria-hidden />
              IP-protection rules baked in
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#CBD5E1' }}>
              The DPR never serialises prompt content, the toxic-combination weight matrix, or
              per-org causal edges. The record declares what it contains, what it explicitly does
              not contain, and why. A GC can forward it without a secondary redaction pass.
            </p>
          </div>
          <Link
            href="/security"
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
              whiteSpace: 'nowrap',
            }}
          >
            Security posture
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </section>

      {/* Close */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 88px' }}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            padding: '24px 26px',
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.slate500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Next step
            </div>
            <div style={{ fontSize: 16, color: C.slate900, fontWeight: 600 }}>
              Run a real DPR on your next strategic memo.
            </div>
            <div style={{ fontSize: 13, color: C.slate600, marginTop: 4 }}>
              Sixty seconds from upload to signed record.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: C.green,
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Audit a memo
              <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
            </Link>
            <Link
              href="/pricing#design-partner"
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
              Design partner program
              <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
