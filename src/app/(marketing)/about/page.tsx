/**
 * /about — Vendor transparency surface (created 2026-04-26 P0).
 *
 * Margaret's audit (audit-committee chair persona) flagged the absence
 * of any procurement-facing surface where a Fortune 500 vendor-risk
 * register reviewer can verify the legal entity, founder, stage, and
 * the contact for due-diligence questions. This page is that surface.
 *
 * Voice rules (CLAUDE.md "Marketing Voice — Enterprise Discipline"):
 *   - No stage-of-company language; use "design-partner phase" instead
 *     (the canonical enterprise-voiced replacement).
 *   - No customer logos we don't have.
 *   - Lead the founder narrative with Lagos/Nigeria per the founder
 *     positioning lock.
 *   - Honest about pre-incorporation state of the entity until the
 *     legal entity formation completes.
 *   - DO NOT name unsigned prospects on this page (locked discipline).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  FileText,
  Briefcase,
  Users,
  Target,
} from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import {
  LEGAL_ENTITY_NAME,
  JURISDICTION,
  REGISTERED_OFFICE_LINES,
  FOUNDED_YEAR,
  COMPANY_STAGE,
  FOUNDER_NAME,
  FOUNDER_TITLE,
  PROCUREMENT_CONTACT_EMAIL,
  COMPLIANCE_CONTACT_NAME,
  COMPLIANCE_CONTACT_TITLE,
  COMPLIANCE_CONTACT_EMAIL,
  COMPLIANCE_RESPONSE_SLA,
  FOUNDER_NARRATIVE_SHORT,
} from '@/lib/constants/company-info';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';

// Framework count derived from registry per CLAUDE.md count-discipline rule:
// when a new African / EM framework lands the about page picks it up
// without a copy edit.
const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'About · Decision Intel',
  description:
    'About Decision Intel, the native reasoning layer for every high-stakes call. Legal entity, founder, stage, and procurement contact in one place for vendor-risk diligence.',
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: 'About Decision Intel',
    description:
      'The native reasoning layer for every high-stakes call. Legal entity, founder, stage, and procurement contact in one place.',
    url: `${siteUrl}/about`,
  },
};

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
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
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
};

interface FactRowProps {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function FactRow({ label, children, icon }: FactRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 220px) 1fr',
        gap: 24,
        padding: '20px 0',
        borderBottom: `1px solid ${C.slate100}`,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: C.slate500,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ color: C.slate900, fontSize: 14, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* HERO */}
      <section style={{ padding: '88px 24px 56px', background: C.white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 12,
              color: C.green,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            About
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
            The native reasoning layer for every high-stakes call.
          </h1>
          <p
            style={{
              marginTop: 20,
              fontSize: 18,
              lineHeight: 1.6,
              color: C.slate600,
              maxWidth: 720,
            }}
          >
            Decision Intel audits the reasoning behind every strategic memo, simulates the
            steering-committee objections it&rsquo;ll face, runs what-if interventions against a{' '}
            {HISTORICAL_CASE_COUNT}-case public reference library, and compounds confirmed outcomes
            back into a calibrated Decision Quality Index your audit committee can defend.
          </p>
        </div>
      </section>

      {/* COMPANY FACTS — the section a vendor-risk register reviewer is looking for */}
      <section style={{ padding: '32px 24px 56px', background: C.slate50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              color: C.slate500,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Company facts · for vendor-risk diligence
          </div>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              padding: '8px 28px',
            }}
          >
            <FactRow label="Legal entity" icon={<Building2 size={14} strokeWidth={2.2} />}>
              <strong style={{ fontWeight: 700 }}>{LEGAL_ENTITY_NAME}</strong>
            </FactRow>
            <FactRow label="Jurisdiction" icon={<Globe size={14} strokeWidth={2.2} />}>
              {JURISDICTION}
            </FactRow>
            <FactRow label="Registered office" icon={<MapPin size={14} strokeWidth={2.2} />}>
              {REGISTERED_OFFICE_LINES.map((line, i) => (
                <div
                  key={i}
                  style={{ marginBottom: i === REGISTERED_OFFICE_LINES.length - 1 ? 0 : 4 }}
                >
                  {line}
                </div>
              ))}
            </FactRow>
            <FactRow label="Founded" icon={<Briefcase size={14} strokeWidth={2.2} />}>
              {FOUNDED_YEAR}
            </FactRow>
            <FactRow label="Stage" icon={<Target size={14} strokeWidth={2.2} />}>
              {COMPANY_STAGE}, running a structured design-partner program with Fortune 500 strategy
              and M&amp;A teams. Procurement diligence questions welcomed at the contact below.
            </FactRow>
            <FactRow label="Founder" icon={<Users size={14} strokeWidth={2.2} />}>
              <strong style={{ fontWeight: 700 }}>{FOUNDER_NAME}</strong>
              <span style={{ color: C.slate500 }}>, {FOUNDER_TITLE}</span>
              <div style={{ marginTop: 8, color: C.slate600 }}>{FOUNDER_NARRATIVE_SHORT}</div>
            </FactRow>
            <FactRow label="Procurement contact" icon={<Mail size={14} strokeWidth={2.2} />}>
              <a
                href={`mailto:${PROCUREMENT_CONTACT_EMAIL}`}
                style={{ color: C.slate900, fontWeight: 600, textDecoration: 'underline' }}
              >
                {PROCUREMENT_CONTACT_EMAIL}
              </a>
              <div style={{ color: C.slate500, marginTop: 4, fontSize: 13 }}>
                Vendor-risk questionnaires, DPA execution, security-questionnaire requests, and
                regulatory mapping queries all route here.
              </div>
            </FactRow>
            <FactRow label="Compliance contact" icon={<Mail size={14} strokeWidth={2.2} />}>
              <strong style={{ fontWeight: 700, color: C.slate900 }}>
                {COMPLIANCE_CONTACT_NAME}
              </strong>
              <span style={{ color: C.slate500 }}>, {COMPLIANCE_CONTACT_TITLE}</span>
              <div style={{ marginTop: 6 }}>
                <a
                  href={`mailto:${COMPLIANCE_CONTACT_EMAIL}`}
                  style={{ color: C.slate900, fontWeight: 600, textDecoration: 'underline' }}
                >
                  {COMPLIANCE_CONTACT_EMAIL}
                </a>
              </div>
              <div style={{ color: C.slate500, marginTop: 4, fontSize: 13 }}>
                Named counterparty for DPA execution, sub-processor objections, GDPR Art 22
                automated-decision contestations, and audit-committee diligence.{' '}
                <span style={{ color: C.slate600 }}>{COMPLIANCE_RESPONSE_SLA}.</span>
              </div>
            </FactRow>
          </div>
        </div>
      </section>

      {/* WHY WE EXIST */}
      <section style={{ padding: '64px 24px', background: C.white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              color: C.slate500,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Why we exist
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.5vw, 28px)',
              fontWeight: 700,
              lineHeight: 1.25,
              margin: 0,
              color: C.slate900,
              letterSpacing: '-0.01em',
            }}
          >
            Your data has governance. Your code has governance. Your reasoning doesn&rsquo;t.
          </h2>
          <div style={{ marginTop: 24, color: C.slate600, fontSize: 15, lineHeight: 1.7 }}>
            <p>
              Every Fortune 500 has invested in data governance, code review, and security audit.
              The reasoning behind a strategic decision (the memo, the model assumption, the
              boardroom argument that closed the discussion) arrives at the audit committee without
              any of it. Decision Intel is the reasoning layer that brings the same discipline to
              that artefact.
            </p>
            <p style={{ marginTop: 16 }}>
              The Recognition-Rigor Framework (R&sup2;F) underneath the platform is the only
              production system that combines Daniel Kahneman&rsquo;s debiasing tradition with Gary
              Klein&rsquo;s recognition-primed decision framework in one pipeline, arbitrated by a
              meta-judge stage. Every audit produces a hashed, tamper-evident Decision Provenance
              Record &mdash; the artefact your General Counsel hands to the audit committee or
              regulator. It maps onto EU AI Act Article 14 record-keeping, Basel III ICAAP, and SEC
              AI disclosure requirements, plus the cross-border M&amp;A coverage no US-only
              incumbent carries: NDPR, CBN, WAEMU, PoPIA, SARB, ISA Nigeria 2007, FRC Nigeria,
              CMA Kenya. The Africa-anchored coverage is the differentiator for Fortune 500
              corporate development teams running cross-border acquisitions into emerging markets.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST + SAFEGUARDS LINKS */}
      <section style={{ padding: '0 24px 80px', background: C.white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            <Link
              href="/security"
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 14,
                padding: '22px 24px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <ShieldCheck size={22} color={C.green} strokeWidth={2.25} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.slate900 }}>
                Security posture
              </div>
              <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.5 }}>
                Encryption, key rotation, sub-processors, regulatory mapping across {FRAMEWORK_COUNT} frameworks.
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.green,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                /security
                <ArrowRight size={12} />
              </div>
            </Link>

            <Link
              href="/privacy"
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 14,
                padding: '22px 24px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <FileText size={22} color={C.green} strokeWidth={2.25} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.slate900 }}>Privacy policy</div>
              <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.5 }}>
                Controller identity, lawful bases under GDPR Art 6, data-subject rights, complaint
                routing, and the international transfer mechanism.
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.green,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                /privacy
                <ArrowRight size={12} />
              </div>
            </Link>

            <Link
              href="/terms"
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 14,
                padding: '22px 24px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <FileText size={22} color={C.green} strokeWidth={2.25} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.slate900 }}>
                Terms of service
              </div>
              <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.5 }}>
                Indemnification, SLA tiers, data portability on termination, exit assistance,
                sub-processor change notice, audit rights, governing law (with EEA/UK carve-out).
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.green,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                /terms
                <ArrowRight size={12} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* LAST-UPDATED FOOTER */}
      <section style={{ padding: '24px 24px 80px', background: C.white }}>
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            paddingTop: 16,
            borderTop: `1px dashed ${C.slate200}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: C.slate500,
              letterSpacing: '0.04em',
            }}
          >
            Last reviewed: April 26, 2026
          </div>
          <div style={{ fontSize: 12, color: C.slate500 }}>
            Procurement diligence?{' '}
            <a
              href={`mailto:${PROCUREMENT_CONTACT_EMAIL}`}
              style={{ color: C.slate900, fontWeight: 600 }}
            >
              {PROCUREMENT_CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
