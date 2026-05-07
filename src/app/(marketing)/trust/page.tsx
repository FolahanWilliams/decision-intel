/**
 * /trust — procurement-evidence landing surface.
 *
 * Item 2 lock 2026-05-07. Per the 2026-05-07 nightly audit Section 8
 * Margaret + James persona synthesis: "the procurement-grade
 * transparency surfaces are strong but discoverability is bad. Bundle
 * SOC 2 + DPA + Sub-Processor Schedule + Vendor Questionnaire + Bias
 * Genome ownership + indemnification into one /trust page so a F500
 * vendor-risk reviewer can answer their entire questionnaire from a
 * single URL."
 *
 * Reading order matters — procurement reviewers triage in this exact
 * sequence:
 *   1. SOC 2 receipts (vendor + sub-processor audit metadata)
 *   2. Sub-Processor Schedule (Schedule of Sub-Processors)
 *   3. Vendor Questionnaire row table (SIG / VSA / CAIQ-shaped answers)
 *   4. Audit log retention SLA
 *   5. Indemnification posture
 *   6. Bias Genome data ownership
 *   7. DPA + DPR specimen download
 *   8. Procurement contact
 *
 * Every section pulls from the canonical trust-copy.ts source so the
 * page can never drift from /security, /pricing, /privacy, or the DPR.
 *
 * `noindex` deliberately OFF — investor diligence + procurement reviewers
 * should be able to land here via search if a DM URL is forwarded.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  ScrollText,
  FileCheck,
  Database,
  Lock,
  ClipboardList,
  ArrowRight,
  Layers,
  Mail,
} from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import {
  SOC2_RECEIPTS,
  SOC2_FULL_STATEMENT,
  AI_VERIFY_DISCLAIMER_LONG,
  DPR_PROVENANCE_CARD_LABEL,
  DPR_PROVENANCE_CLAIM_LONG,
  INDEMNIFICATION_LABEL,
  INDEMNIFICATION_VALUE,
  INDEMNIFICATION_BODY,
  AUDIT_LOG_RETENTION_LABEL,
  AUDIT_LOG_RETENTION_TIERS,
  AUDIT_LOG_RETENTION_BODY,
  VENDOR_QUESTIONNAIRE_ROWS,
  BIAS_GENOME_OWNERSHIP,
  SUB_PROCESSORS,
  SUB_PROCESSOR_CHANGE_NOTIFICATION_SLA,
} from '@/lib/constants/trust-copy';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Trust · procurement evidence in one page · Decision Intel',
  description:
    'Single-URL procurement evidence pack for Decision Intel: SOC 2 receipts, Schedule of Sub-Processors, vendor-risk questionnaire answers, audit-log retention SLA, indemnification posture, Bias Genome data ownership, DPA + DPR specimen.',
  alternates: { canonical: `${siteUrl}/trust` },
  openGraph: {
    title: 'Decision Intel · Trust',
    description:
      'Procurement evidence in one page. Vendor-risk reviewers can answer their entire questionnaire from this URL.',
    url: `${siteUrl}/trust`,
  },
};

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
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.06)',
};

export default function TrustPage() {
  return (
    <div style={{ background: C.slate50, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '64px 24px 32px',
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
            marginBottom: 16,
          }}
        >
          <ShieldCheck size={12} strokeWidth={2.25} />
          Procurement evidence
        </div>
        <h1
          className="marketing-display"
          style={{
            fontSize: 'clamp(34px, 5vw, 56px)',
            lineHeight: 1.05,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: C.slate900,
          }}
        >
          Every answer your vendor-risk team needs.
        </h1>
        <p
          style={{
            margin: '18px 0 0',
            fontSize: 18,
            lineHeight: 1.55,
            color: C.slate600,
            maxWidth: 760,
          }}
        >
          One page. Eight sections. Every claim cross-referenced to a verifiable source. Built so a
          F500 vendor-risk reviewer can answer their SIG / VSA / CAIQ questionnaire in one sitting
          without a back-and-forth email cycle.
        </p>
        <nav
          aria-label="Trust page sections"
          style={{
            marginTop: 28,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {[
            { href: '#soc2', label: '1. SOC 2 receipts' },
            { href: '#sub-processors', label: '2. Sub-Processor Schedule' },
            { href: '#questionnaire', label: '3. Vendor questionnaire' },
            { href: '#retention', label: '4. Audit log retention' },
            { href: '#indemnification', label: '5. Indemnification' },
            { href: '#bias-genome-ownership', label: '6. Bias Genome ownership' },
            { href: '#dpa', label: '7. DPA + DPR specimen' },
            { href: '#contact', label: '8. Procurement contact' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: 12,
                color: C.slate600,
                textDecoration: 'none',
                background: C.white,
                border: `1px solid ${C.slate200}`,
                padding: '6px 10px',
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      {/* ── 1. SOC 2 Receipts ──────────────────────────────────── */}
      <Section
        id="soc2"
        eyebrow="1 · Audit metadata"
        title="SOC 2 receipts · Decision Intel + every sub-processor"
        body={SOC2_FULL_STATEMENT}
        icon={<ShieldCheck size={18} />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {SOC2_RECEIPTS.map(r => (
            <article
              key={r.party}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderLeft: `3px solid ${r.status === 'attested' ? C.green : C.amber}`,
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: r.status === 'attested' ? C.green : C.amber,
                  marginBottom: 4,
                }}
              >
                {r.status === 'attested' ? 'Attested · ' : 'Targeted · '}
                {r.reportType}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.slate900, marginBottom: 6 }}>
                {r.party}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.slate600, marginBottom: 8 }}>
                {r.role}
              </div>
              <KeyVal label="Auditor" value={r.auditor} />
              <KeyVal label="Window" value={r.observationWindow} />
              <KeyVal label="Scope" value={r.scope} />
              <KeyVal label="Verification" value={r.verification} />
            </article>
          ))}
        </div>
      </Section>

      {/* ── 2. Sub-Processor Schedule ─────────────────────────── */}
      <Section
        id="sub-processors"
        eyebrow="2 · Schedule of Sub-Processors"
        title="Where data resides, who touches it, how change-notification works"
        body="The procurement-grade Schedule of Sub-Processors a F500 vendor-risk register expects. Each entry names region + service category + what data is touched + compliance posture + verification path. Change-notification SLA is contractual via the DPA."
        icon={<Database size={18} />}
        toneAccent={C.green}
      >
        <div
          style={{
            background: C.greenSoft,
            border: `1px solid ${C.greenBorder}`,
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: C.slate900,
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: C.green }}>Change-notification SLA · </strong>
          {SUB_PROCESSOR_CHANGE_NOTIFICATION_SLA}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {SUB_PROCESSORS.map(sp => (
            <article
              key={sp.name}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>{sp.name}</div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: C.slate500,
                    background: C.slate100,
                    border: `1px solid ${C.slate200}`,
                    padding: '2px 7px',
                    borderRadius: 999,
                  }}
                >
                  {sp.categoryLabel}
                </span>
              </div>
              <KeyVal label="Region" value={sp.region} />
              <KeyVal label="Data touched" value={sp.dataTouched} />
              {sp.compliancePosture && <KeyVal label="Compliance" value={sp.compliancePosture} />}
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    color: C.slate500,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Verification:
                </span>{' '}
                <span
                  style={{
                    fontSize: 11.5,
                    color: C.slate700,
                    fontFamily: 'ui-monospace, monospace',
                    wordBreak: 'break-word',
                  }}
                >
                  {sp.verification}
                </span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ── 3. Vendor Questionnaire ───────────────────────────── */}
      <Section
        id="questionnaire"
        eyebrow="3 · Vendor-risk questionnaire"
        title="SIG / VSA / CAIQ-shaped answers, ready to copy row-for-row"
        body="The 10 questions a F500 vendor-risk reviewer asks first, with verbatim answers + verification paths. The shape mirrors SIG / VSA / CAIQ row-shape so a procurement reviewer copies answers row-for-row instead of paraphrasing."
        icon={<ClipboardList size={18} />}
        toneAccent={C.slate600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {VENDOR_QUESTIONNAIRE_ROWS.map((row, i) => (
            <article
              key={`q-${i}`}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderLeft: `3px solid ${C.slate400}`,
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
                  {row.question}
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: C.slate500,
                  }}
                >
                  Class · {row.category}
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: C.slate700, marginBottom: 8 }}>
                {row.answer}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: C.slate500,
                  fontStyle: 'italic',
                  paddingTop: 6,
                  borderTop: `1px dashed ${C.slate200}`,
                }}
              >
                <span style={{ fontWeight: 700, color: C.slate600, fontStyle: 'normal' }}>
                  Verification:
                </span>{' '}
                {row.verification}
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ── 4. Audit Log Retention SLA ──────────────────────── */}
      <Section
        id="retention"
        eyebrow="4 · Retention SLA"
        title={AUDIT_LOG_RETENTION_LABEL}
        body={AUDIT_LOG_RETENTION_BODY}
        icon={<ScrollText size={18} />}
        toneAccent={C.amber}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {AUDIT_LOG_RETENTION_TIERS.map(tier => (
            <article
              key={tier.tier}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: C.amber,
                  marginBottom: 4,
                }}
              >
                {tier.tier}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.slate900, marginBottom: 4 }}>
                {tier.window}
              </div>
              <div style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.55 }}>{tier.note}</div>
            </article>
          ))}
        </div>
      </Section>

      {/* ── 5. Indemnification posture ──────────────────────── */}
      <Section
        id="indemnification"
        eyebrow="5 · Contractual posture"
        title={INDEMNIFICATION_LABEL}
        body={INDEMNIFICATION_BODY}
        icon={<FileCheck size={18} />}
        toneAccent={C.slate600}
      >
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderLeft: `3px solid ${C.green}`,
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.green,
              marginBottom: 4,
            }}
          >
            Standard cap
          </div>
          <div style={{ fontSize: 14, color: C.slate900, fontWeight: 600, lineHeight: 1.5 }}>
            {INDEMNIFICATION_VALUE}
          </div>
        </div>
      </Section>

      {/* ── 6. Bias Genome ownership ────────────────────────── */}
      <Section
        id="bias-genome-ownership"
        eyebrow="6 · Data ownership"
        title="Bias Genome data ownership posture"
        body="Five contractual commitments governing what happens to Customer content vs. anonymised outcome metadata when an organisation contributes to the Bias Genome cohort signal."
        icon={<Lock size={18} />}
        toneAccent={C.green}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {BIAS_GENOME_OWNERSHIP.map(item => (
            <article
              key={item.label}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderLeft: `3px solid ${C.green}`,
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.slate900, marginBottom: 4 }}>
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: C.green,
                  marginBottom: 8,
                }}
              >
                {item.value}
              </div>
              <div style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.55 }}>{item.body}</div>
            </article>
          ))}
        </div>
      </Section>

      {/* ── 7. DPA + DPR specimen ──────────────────────────── */}
      <Section
        id="dpa"
        eyebrow="7 · Documents"
        title="DPA template + DPR specimens"
        body={`Download the redline-ready DPA + a specimen ${DPR_PROVENANCE_CARD_LABEL} (${DPR_PROVENANCE_CLAIM_LONG}) so your legal team can review the contractual + operational shape before any conversation.`}
        icon={<Layers size={18} />}
        toneAccent={C.green}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          <DownloadCard
            label="DPA template (PDF)"
            href="/dpa-template.pdf"
            note="Read-only procurement reference."
          />
          <DownloadCard
            label="DPA template (DOCX)"
            href="/dpa-template.docx"
            note="Word-native, redline-ready with Track Changes."
          />
          <DownloadCard
            label="DPR specimen · WeWork S-1"
            href="/dpr-sample-wework.pdf"
            note="US public-market shape · 15 pages."
          />
          <DownloadCard
            label="DPR specimen · Pan-African industrial"
            href="/dpr-sample-dangote.pdf"
            note="Cross-border EM shape · 15 pages."
          />
        </div>

        <div
          style={{
            background: C.amberSoft,
            border: `1px solid rgba(217, 119, 6, 0.22)`,
            borderRadius: 10,
            padding: '12px 14px',
            marginTop: 14,
            fontSize: 12.5,
            color: C.slate700,
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: C.amber }}>AI Verify alignment · </strong>
          {AI_VERIFY_DISCLAIMER_LONG}
        </div>
      </Section>

      {/* ── 8. Procurement contact ─────────────────────────── */}
      <Section
        id="contact"
        eyebrow="8 · Procurement contact"
        title="Direct line to the security + procurement inbox"
        body="For SOC 2 reports under NDA, additional sub-processor questions, custom DPA redlines, or vendor-risk-register pre-fill requests."
        icon={<Mail size={18} />}
        toneAccent={C.slate600}
      >
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 12,
            padding: '20px 22px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.slate500,
                marginBottom: 4,
              }}
            >
              Security inbox
            </div>
            <a
              href="mailto:security@decision-intel.com"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.green,
                textDecoration: 'none',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              security@decision-intel.com
            </a>
            <div style={{ fontSize: 12, color: C.slate500, marginTop: 4 }}>
              Routed via Cloudflare Email Routing to the founder. Response SLA &lt; 1 business day.
            </div>
          </div>
          <Link
            href="/pricing/quote"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 18px',
              background: C.green,
              color: C.white,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Run the Enterprise quote builder
            <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* ── Footer strip ──────────────────────────────────────── */}
      <section
        style={{
          background: C.white,
          borderTop: `1px solid ${C.slate200}`,
          padding: '28px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: C.slate500,
            lineHeight: 1.55,
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          Every claim on this page cross-references a canonical source in the codebase. When the
          posture changes (SOC 2 Type I issues / new sub-processor activates / indemnification cap
          shifts), the change lands in{' '}
          <code style={{ background: C.slate100, padding: '1px 6px', borderRadius: 4 }}>
            src/lib/constants/trust-copy.ts
          </code>{' '}
          first and propagates here, to{' '}
          <Link href="/security" style={{ color: C.green, fontWeight: 600 }}>
            /security
          </Link>
          ,{' '}
          <Link href="/privacy" style={{ color: C.green, fontWeight: 600 }}>
            /privacy
          </Link>
          , and the DPR cover. No drift.
        </div>
      </section>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function Section({
  id,
  eyebrow,
  title,
  body,
  icon,
  toneAccent = C.green,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  toneAccent?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        scrollMarginTop: 80,
        padding: '32px 24px',
        background: C.white,
        borderTop: `1px solid ${C.slate200}`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${toneAccent}18`,
              border: `1px solid ${toneAccent}33`,
              color: toneAccent,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: toneAccent,
            }}
          >
            {eyebrow}
          </span>
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(22px, 2.4vw, 30px)',
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: C.slate900,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '8px 0 22px',
            fontSize: 14,
            color: C.slate600,
            lineHeight: 1.6,
            maxWidth: 820,
          }}
        >
          {body}
        </p>
        {children}
      </div>
    </section>
  );
}

function KeyVal({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
      <span
        style={{
          fontSize: 10.5,
          color: C.slate500,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          flexShrink: 0,
          minWidth: 78,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12, color: C.slate700, lineHeight: 1.55 }}>{value}</span>
    </div>
  );
}

function DownloadCard({ label, href, note }: { label: string; href: string; note: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 10,
        padding: '14px 16px',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        transition: 'border-color 0.15s ease',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: C.slate500, marginTop: 4, lineHeight: 1.5 }}>
          {note}
        </div>
      </div>
      <ArrowRight size={14} style={{ color: C.green, flexShrink: 0, marginTop: 2 }} />
    </a>
  );
}
