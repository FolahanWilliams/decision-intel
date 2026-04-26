import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Clipboard,
  FileCheck2,
  Lock,
  MailCheck,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Server,
  FileText,
  type LucideIcon,
} from 'lucide-react';

import { MarketingNav } from '@/components/marketing/MarketingNav';
import { EncryptionFlowViz } from '@/components/marketing/security/EncryptionFlowViz';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Security · Decision Intel',
  description:
    'Enterprise-grade security posture on a founder budget. AES-256-GCM at rest with keyVersion rotation, TLS 1.2+ in transit, immutable audit log, 17 regulatory frameworks mapped flag-by-flag across G7, EU, GCC and African markets, and a Decision Provenance Record (EU AI Act Article 14 aligned) your GC can walk into a regulator meeting with.',
  alternates: { canonical: `${siteUrl}/security` },
  openGraph: {
    title: 'Security · Decision Intel',
    description: 'How Decision Intel is built to clear a Fortune-500 security questionnaire.',
    url: `${siteUrl}/security`,
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
  greenLight: '#DCFCE7',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.08)',
  amberBorder: 'rgba(217, 119, 6, 0.22)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.06)',
  redBorder: 'rgba(220, 38, 38, 0.18)',
};

// ── Data ───────────────────────────────────────────────────────────────

const TRUST_SPINE: Array<{ icon: LucideIcon; label: string; body: string }> = [
  {
    icon: Lock,
    label: 'AES-256-GCM at rest, with rotation',
    body: 'Strategic memos and Slack bot tokens are encrypted with authenticated AES-256-GCM. Every encrypted row carries a keyVersion stamp so keys rotate without bricking historical data.',
  },
  {
    icon: ShieldCheck,
    label: 'GDPR anonymizer runs first',
    body: 'PII is detected and redacted as the literal first node of the analysis pipeline. No analysis LLM ever sees the raw document.',
  },
  {
    icon: FileCheck2,
    label: '17 regulatory frameworks, provision-level',
    body: 'Every flag we surface carries a citation across SOX §404, GDPR Article 22, EU AI Act Annex III, Basel III, FCA Consumer Duty, SEC Reg D, and LPOA. Your GC can defend each flag against its source.',
  },
  {
    icon: Clipboard,
    label: 'Immutable audit log',
    body: 'Every sensitive action (exports, decryptions, deletions, recalibrations) writes an AuditLog row with the actor, the resource, and a structured details payload. Admins see the full firehose with filters.',
  },
  {
    icon: Server,
    label: 'SOC 2 infrastructure',
    body: 'Hosted on Vercel (SOC 2 Type II) + Supabase (SOC 2 Type II, HIPAA). Our own product audit is targeted for Type I completion in Q4 2026, with the Type II observation window opening immediately after. In-flight controls already mirror Type II.',
  },
];

const KEY_ROTATION: Array<{ step: number; label: string; body: string }> = [
  {
    step: 1,
    label: 'Provision the new key',
    body: 'Set DOCUMENT_ENCRYPTION_KEY_V2 (64-character hex) in production. The legacy v1 key stays in place, so no downtime, no lockout.',
  },
  {
    step: 2,
    label: 'Cut over writes',
    body: 'Bump DOCUMENT_ENCRYPTION_KEY_VERSION=2 and redeploy. New writes stamp keyVersion=2; every existing row still decrypts via v1.',
  },
  {
    step: 3,
    label: 'Backfill historical rows',
    body: 'Run npm run rotate:encryption-key. The CLI walks every row where keyVersion != 2, decrypts with v1, re-encrypts with v2, updates the stamp. Batched, resumable, idempotent.',
  },
  {
    step: 4,
    label: 'Drop the old key',
    body: 'Once every row is on v2, delete DOCUMENT_ENCRYPTION_KEY (v1) from the production env and redeploy. Rotation complete.',
  },
];

const FRAMEWORKS = [
  {
    code: 'SOX §404',
    name: 'Sarbanes-Oxley',
    gates: 'Public-company material-statement controls.',
  },
  {
    code: 'GDPR Art. 22',
    name: 'General Data Protection Regulation',
    gates: 'Automated-decision rights for EU data subjects.',
  },
  {
    code: 'EU AI Act · Annex III',
    name: 'EU AI Act',
    gates: 'High-risk AI decision-support obligations.',
  },
  {
    code: 'Basel III',
    name: 'Basel III',
    gates: 'Capital-allocation decisions in regulated banks.',
  },
  {
    code: 'FCA Consumer Duty',
    name: 'Financial Conduct Authority',
    gates: 'UK financial-services decisioning.',
  },
  {
    code: 'SEC Reg D',
    name: 'SEC Regulation D',
    gates: 'Forward-looking statements + safe-harbour disclosure.',
  },
  {
    code: 'LPOA',
    name: 'Limited Partnership Obligations',
    gates: 'Fund-level fiduciary dissent documentation.',
  },
  {
    code: 'NDPR Art. 12',
    name: 'Nigeria Data Protection Regulation',
    gates:
      'Automated-decision rights for Nigerian data subjects (aligned with GDPR Art. 22 via the NDPR 2019 Implementation Framework).',
  },
  {
    code: 'CBN AI Guidelines',
    name: 'Central Bank of Nigeria',
    gates:
      'Financial-services AI governance obligations (draft 2024) — model governance, explainability and consumer-protection duties for regulated Nigerian financial institutions.',
  },
  {
    code: 'WAEMU',
    name: 'West African Economic and Monetary Union',
    gates:
      'Cross-border data localisation and financial-sector governance across the eight WAEMU member states.',
  },
  {
    code: 'CMA Kenya',
    name: 'Capital Markets Authority (Kenya)',
    gates:
      'Listed-company decisioning + prospectus disclosure obligations under the CMA (Conduct of Business) Regulations 2024.',
  },
  {
    code: 'CBK',
    name: 'Central Bank of Kenya — Banking & Digital Lending',
    gates:
      'Digital-lending licensing, AI/ML model-risk management, and consumer-disclosure obligations under the Banking (Amendment) Act 2024 §33B and CBK Risk Management Guidelines (rev. 2023).',
  },
  {
    code: 'BoG Cyber & ICT Risk',
    name: 'Bank of Ghana — Cyber & Information Security Directive',
    gates:
      'Cyber, data, and AI/ML model-governance obligations for Ghanaian regulated financial institutions (2018 directive + 2023 update).',
  },
  {
    code: 'FRC Nigeria',
    name: 'Financial Reporting Council of Nigeria',
    gates:
      'Nigerian Code of Corporate Governance — board-level decisioning, dissent capture, and risk-management documentation duties for public-interest entities.',
  },
  {
    code: 'CBE AI Guidelines',
    name: 'Central Bank of Egypt',
    gates:
      'AI/ML model-governance + explainability obligations for Egyptian banks under the CBE 2023 ICT Governance and Risk Management Framework.',
  },
  {
    code: 'PoPIA §71',
    name: 'Protection of Personal Information Act (South Africa)',
    gates:
      'Automated-decision rights + data-subject access for South African data subjects (PoPIA s.71, in force July 2021).',
  },
  {
    code: 'SARB Model Risk',
    name: 'South African Reserve Bank — Model Risk Governance',
    gates:
      'Model risk + AI governance obligations for SA-regulated banks (Directive D2/2022 + Joint Standard 2 of 2024 on cybersecurity).',
  },
  {
    code: 'BoT FinTech',
    name: 'Bank of Tanzania — FinTech Regulatory Sandbox',
    gates:
      'Tanzanian financial-services AI/ML decisioning obligations under the BoT FinTech Regulatory Sandbox Guidelines (2023).',
  },
];

type AccessAvailability = 'every_plan' | 'enterprise';

interface AccessControl {
  label: string;
  availability: AccessAvailability;
  body: string;
}

const ACCESS_CONTROLS: AccessControl[] = [
  {
    label: 'Google Workspace SSO',
    availability: 'every_plan',
    body: 'Single sign-on via Google Workspace, live today on every plan. No password is ever stored; sessions are signed and rotated server-side.',
  },
  {
    label: 'SAML 2.0 and OIDC single sign-on (coming soon)',
    availability: 'enterprise',
    body: 'Okta, Azure AD, OneLogin, Ping, JumpCloud, and generic SAML / OIDC. Activated as part of every Enterprise design-partner onboarding; the integration code, admin UI, and audit-log wiring are in place today and provisioning takes under 20 minutes from your IdP metadata to first login. Until then, Workspace orgs use Google SSO above.',
  },
  {
    label: 'Org-wide session visibility',
    availability: 'enterprise',
    body: 'Admins see every active session across the organisation, can force-log-out a departing member in a single click, and can set a per-org idle timeout between 15 minutes and 8 hours.',
  },
  {
    label: 'Admin audit log',
    availability: 'every_plan',
    body: 'Org admins review every action taken inside their workspace (who viewed which memo, who exported a Decision Provenance Record, who invited a new member) with filters, date range, and CSV export for downstream compliance tooling.',
  },
  {
    label: 'Per-org data isolation',
    availability: 'every_plan',
    body: 'Every data access scopes on organisation. Your Decision Knowledge Graph, your audit trail, and your outcome history are strictly org-private and are never cross-read by any other tenant.',
  },
];

const AVAILABILITY_STYLE: Record<
  AccessAvailability,
  { label: string; border: string; pillBg: string; pillBorder: string; pillText: string }
> = {
  every_plan: {
    label: 'Available',
    border: '#16A34A',
    pillBg: 'rgba(22, 163, 74, 0.08)',
    pillBorder: 'rgba(22, 163, 74, 0.25)',
    pillText: '#16A34A',
  },
  enterprise: {
    label: 'Enterprise',
    border: '#0F172A',
    pillBg: 'rgba(15, 23, 42, 0.06)',
    pillBorder: 'rgba(15, 23, 42, 0.18)',
    pillText: '#0F172A',
  },
};

const RETENTION_TIERS: Array<{
  tier: string;
  retention: string;
  grace: string;
  body: string;
}> = [
  {
    tier: 'Free',
    retention: '30 days',
    grace: '+ 30-day soft-delete grace',
    body: 'Documents auto-soft-delete 30 days after upload. Recoverable via support during the grace window, then permanently purged.',
  },
  {
    tier: 'Individual',
    retention: '90 days',
    grace: '+ 30-day soft-delete grace',
    body: 'Documents auto-soft-delete 90 days after upload. Same grace window, same support-recoverable path.',
  },
  {
    tier: 'Strategy',
    retention: '12 months',
    grace: '+ 30-day soft-delete grace',
    body: 'Quarter-after-quarter retention for team-level Decision Knowledge Graph. Auto-soft-delete at 365 days; same recoverable grace.',
  },
  {
    tier: 'Enterprise',
    retention: '360 days default · configurable',
    grace: '+ 30-day soft-delete grace',
    body: 'Default matches Strategy; per-Order-Form overrides for legal-hold, SEC, or Basel III obligations. Configurable in either direction.',
  },
];

const PROCESSORS = [
  { name: 'Vercel', role: 'Application hosting + CDN', cert: 'SOC 2 Type II', region: 'US + EU' },
  {
    name: 'Supabase',
    role: 'Postgres + Auth + Storage',
    cert: 'SOC 2 Type II · HIPAA',
    region: 'US',
  },
  {
    name: 'Google AI',
    role: 'Primary analysis LLM',
    cert: 'No-training contract terms',
    region: 'US',
  },
  {
    name: 'Anthropic',
    role: 'Fallback analysis LLM',
    cert: 'No-training contract terms',
    region: 'US',
  },
  { name: 'Stripe', role: 'Billing', cert: 'PCI-DSS Level 1 · SOC 1/2', region: 'US + EU' },
  { name: 'Sentry', role: 'Error monitoring', cert: 'SOC 2 Type II', region: 'US' },
];

const INCIDENT_COMMITMENTS = [
  {
    threshold: '1h',
    body: 'Internal detection + containment triggered. Customer-visible status posted within the hour when customer data is in scope.',
  },
  {
    threshold: '24h',
    body: 'First disclosure to affected customers with the scope, the data classes involved, and the remediation plan.',
  },
  {
    threshold: '72h',
    body: 'Regulator notification where applicable (GDPR Art. 33, SEC 8-K item 1.05) with the materiality assessment attached.',
  },
  {
    threshold: '30d',
    body: 'Full post-mortem delivered to affected customers. Root cause, timeline, controls added, exposure window. Signed by the founder.',
  },
];

/**
 * Disaster recovery + business continuity disclosure (added 2026-04-26
 * P1 #26 — Margaret persona finding). A Fortune 500 security
 * questionnaire asks for RPO/RTO, backup window, and geographic
 * redundancy posture before it asks for SOC 2. Without these the
 * /security page reads as marketing, not a procurement-grade artefact.
 *
 * Numbers reflect what the Vercel + Supabase production tier delivers
 * today — no claims beyond what the underlying infrastructure SLA
 * documents. When the production posture changes (e.g. moving to a
 * multi-region Supabase configuration on Enterprise design-partner
 * deployments), update HERE so the questionnaire-response is consistent.
 */
const DR_BCP = [
  {
    label: 'Recovery Point Objective (RPO)',
    value: '≤ 15 minutes',
    body: 'Supabase point-in-time recovery operates on a 15-minute checkpoint cadence on the production tier. Any incident is recoverable to within 15 minutes of the failure window.',
  },
  {
    label: 'Recovery Time Objective (RTO)',
    value: '< 4 hours',
    body: 'Target restoration of the document-analysis pipeline within four hours of confirmed incident. Vercel edge deployment auto-fails-over for the application layer; Supabase recovery is the bottleneck and the 4-hour figure is sized against its published SLA.',
  },
  {
    label: 'Backup cadence',
    value: 'Daily + WAL streaming',
    body: 'Supabase performs daily encrypted snapshots plus continuous write-ahead-log streaming for point-in-time recovery. Backups are stored in the same Supabase-managed S3 region as the production database; cross-region replication is on the Enterprise design-partner roadmap.',
  },
  {
    label: 'Geographic redundancy',
    value: 'US production · multi-region edge',
    body: 'Vercel runs the application across global edge locations; Supabase production database is US-region single-AZ on the standard tier with multi-AZ on Enterprise. EU-region residency is available on Enterprise design-partner configurations — confirm with the Decision Intel team before signature.',
  },
  {
    label: 'Annual restore drill',
    value: 'Calendared',
    body: 'Backup restore is tested at least annually against a synthetic dataset to validate the RPO/RTO numbers above. Drill outcome is logged to the internal AuditLog and shared with Enterprise customers on request.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  body,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div style={{ textAlign: align, marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: C.green,
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: 'clamp(26px, 3vw, 34px)',
          fontWeight: 800,
          color: C.slate900,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
          margin: 0,
          maxWidth: align === 'center' ? 780 : undefined,
          marginLeft: align === 'center' ? 'auto' : undefined,
          marginRight: align === 'center' ? 'auto' : undefined,
        }}
      >
        {title}
      </h2>
      {body && (
        <p
          style={{
            fontSize: 'clamp(14px, 1.35vw, 16px)',
            color: C.slate600,
            lineHeight: 1.65,
            marginTop: 14,
            maxWidth: align === 'center' ? 720 : 760,
            marginLeft: align === 'center' ? 'auto' : undefined,
            marginRight: align === 'center' ? 'auto' : undefined,
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function SecurityPage() {
  return (
    <div style={{ background: C.white, color: C.slate900 }}>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          padding: '72px 24px 60px',
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 48,
            alignItems: 'center',
          }}
          className="security-hero-grid"
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.green,
                background: C.greenSoft,
                border: `1px solid ${C.greenBorder}`,
                padding: '4px 10px',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              <ShieldCheck size={11} strokeWidth={2.4} />
              Enterprise-grade security posture
            </div>
            <h1
              style={{
                fontSize: 'clamp(32px, 4.2vw, 48px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                color: C.slate900,
                margin: '0 0 18px',
              }}
            >
              Built for the audit committee,
              <br />
              <span style={{ color: C.green }}>not the afterthought.</span>
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 1.5vw, 17px)',
                color: C.slate600,
                lineHeight: 1.65,
                margin: '0 0 24px',
                maxWidth: 540,
              }}
            >
              AES-256-GCM at rest with keyVersion rotation, TLS 1.2+ in transit, an immutable audit
              log, and every flag cross-linked to a specific regulatory provision across{' '}
              {FRAMEWORKS.length} international frameworks spanning G7, EU, GCC, and African
              markets. A Fortune-500 security questionnaire finishes in minutes, not weeks.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="#trust-spine"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '11px 18px',
                  background: C.slate900,
                  color: C.white,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                See the trust spine <ArrowRight size={14} />
              </Link>
              <Link
                href="/privacy"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '11px 18px',
                  background: C.white,
                  color: C.slate900,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Privacy policy <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div>
            <EncryptionFlowViz />
          </div>
        </div>
      </section>

      {/* Trust spine */}
      <section id="trust-spine" style={{ padding: '72px 24px', background: C.white }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Trust spine"
            title="Five controls a GC actually tests"
            body="Every enterprise security questionnaire probes the same five things. This is how Decision Intel answers each one today, with code paths, not aspirations."
            align="center"
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {TRUST_SPINE.map(({ icon: Icon, label, body }) => (
              <div
                key={label}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 16,
                  padding: '22px 22px 20px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: C.greenSoft,
                    border: `1px solid ${C.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <Icon size={16} color={C.green} strokeWidth={2.25} />
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: C.slate900,
                    lineHeight: 1.3,
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.slate600,
                    lineHeight: 1.6,
                  }}
                >
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory tailwinds — the wave already in motion */}
      <section
        id="tailwinds"
        style={{
          padding: '72px 24px',
          background: C.navy,
          color: C.white,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'left', marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#86EFAC',
                marginBottom: 10,
              }}
            >
              Regulatory tailwinds · already in motion
            </div>
            <h2
              style={{
                fontSize: 'clamp(26px, 3vw, 34px)',
                fontWeight: 800,
                color: C.white,
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
                margin: 0,
                maxWidth: 820,
              }}
            >
              The record your AI-augmented decision-making is already supposed to produce.
            </h2>
            <p
              style={{
                marginTop: 14,
                fontSize: 15,
                color: C.slate300,
                lineHeight: 1.65,
                maxWidth: 760,
              }}
            >
              Three regulatory waves are already in force or on the enforcement calendar. Each one
              asks for exactly the artifact the Decision Provenance Record produces. The reasoning
              behind a decision, the model lineage that shaped it, and the evidence that it was
              reviewed, not just generated. We built for this on purpose.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {[
              {
                code: 'EU AI Act',
                status: 'In force · high-risk obligations Aug 2026',
                body: 'Article 13 (transparency), Article 14 (human oversight), Article 15 (accuracy + record-keeping), Annex III (high-risk decision-support). Every DPR section maps onto one of these by design.',
              },
              {
                code: 'SEC AI Disclosure',
                status: 'Rulemaking 2024–2026',
                body: 'Proposed rules on AI use in investment-adviser decisions require documented oversight of the model\u2019s role. The DPR\u2019s model lineage + prompt fingerprint + judge variance are the documentation.',
              },
              {
                code: 'Basel III · Pillar 2 ICAAP',
                status: 'Live for regulated banks',
                body: 'Banks must document the internal capital-adequacy process including qualitative decisions. Every flagged bias in the DPR carries a Basel III provision reference on the same page.',
              },
              {
                code: 'UK AI White Paper',
                status: 'Principles-based, pre-statutory',
                body: 'Regulator guidance across FCA, ICO, and CMA converges on safety, transparency, fairness, accountability, and contestability. The DPR is the contestable artifact by default.',
              },
              {
                code: 'SOX §404 + SEC Reg D',
                status: 'Live for public companies + private placements',
                body: 'Internal-control documentation and forward-looking-statement disclosure both require evidence of process. The DPR is process evidence your auditor can point at instead of a narrative describing it.',
              },
              {
                code: 'GDPR Art. 22',
                status: 'Live since 2018',
                body: 'Automated-decision rights require the data subject be told meaningful information about the logic involved. DPR citations provide that in one document without exposing platform IP.',
              },
            ].map(t => (
              <div
                key={t.code}
                style={{
                  background: C.navyLight,
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 14,
                  padding: '18px 20px 20px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#86EFAC',
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(22,163,74,0.12)',
                    marginBottom: 10,
                  }}
                >
                  {t.status}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.white,
                    marginBottom: 8,
                  }}
                >
                  {t.code}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.slate300,
                    lineHeight: 1.6,
                  }}
                >
                  {t.body}
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 24,
              fontSize: 12,
              color: C.slate400,
              lineHeight: 1.6,
              fontStyle: 'italic',
              maxWidth: 880,
            }}
          >
            Positioning note for CSOs evaluating us: the Decision Provenance Record is the record
            your AI-augmented decision-making is supposed to produce anyway under these frameworks.
            We ship it on every audit so your procurement conversation starts at &ldquo;here is the
            control&rdquo; instead of &ldquo;we&rsquo;re working on it.&rdquo;
          </p>

          {/* AI Verify alignment strip — sits at the base of the Regulatory
              Tailwinds section as the proof point that the DPR maps onto an
              existing, internationally-recognised governance framework. Link
              to the dedicated /regulatory/ai-verify mapping page. */}
          <div
            style={{
              marginTop: 32,
              padding: '22px 24px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 16,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 18,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#86EFAC',
                  marginBottom: 8,
                }}
              >
                AI Verify Foundation &middot; Singapore IMDA
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.white,
                  lineHeight: 1.4,
                  marginBottom: 6,
                }}
              >
                Aligned with the 11 internationally-recognised AI governance principles.
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: C.slate300,
                  lineHeight: 1.6,
                }}
              >
                Every Decision Provenance Record field maps onto AI Verify&rsquo;s 11 principles
                (transparency, explainability, repeatability, safety, security, robustness,
                fairness, data governance, accountability, human agency &amp; oversight, inclusive
                growth). Cross-aligned with the EU AI Act and OECD AI Principles. Self-assessment
                framework; no certification claim, no overclaim.
              </div>
            </div>
            <Link
              href="/regulatory/ai-verify"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: C.white,
                color: C.slate900,
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 10,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              View the principle mapping <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Key rotation */}
      <section
        style={{
          padding: '72px 24px',
          background: C.slate50,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Key rotation"
            title="Rotate encryption keys without downtime"
            body="Every row in an encrypted column carries an integer keyVersion stamp. Swapping keys is a four-step protocol with no big-bang migration, no data loss, no customer-visible pause."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {KEY_ROTATION.map(({ step, label, body }) => (
              <div
                key={step}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr',
                  gap: 16,
                  padding: '16px 20px',
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: C.green,
                    color: C.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {step}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: C.slate900,
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.slate600,
                      lineHeight: 1.6,
                      fontFamily:
                        body.includes('KEY') || body.includes('rotate:') ? undefined : undefined,
                    }}
                  >
                    {body}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 20,
              padding: '14px 18px',
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <RefreshCcw size={18} color={C.green} strokeWidth={2.25} />
            <div style={{ fontSize: 13, color: C.slate700, lineHeight: 1.55 }}>
              The rotate CLI lives at{' '}
              <code
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 12.5,
                }}
              >
                scripts/rotate-encryption-key.ts
              </code>
              . Resumable, batched, idempotent. Dry-run mode available.
            </div>
          </div>
        </div>
      </section>

      {/* Compliance frameworks */}
      <section style={{ padding: '72px 24px', background: C.white }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Regulatory coverage"
            title={`${FRAMEWORKS.length} frameworks, mapped flag-by-flag`}
            body="Every flag the pipeline surfaces carries a regulatory citation across G7, EU, GCC, and African markets. Your GC doesn't take the tool on faith. They walk into the audit committee meeting with the memo, the flags, and the framework sections attached."
            align="center"
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {FRAMEWORKS.map(fw => (
              <div
                key={fw.code}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderLeft: `3px solid ${C.green}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: C.green,
                    letterSpacing: '0.02em',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  }}
                >
                  {fw.code}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.slate900,
                    marginTop: 4,
                    marginBottom: 6,
                  }}
                >
                  {fw.name}
                </div>
                <div style={{ fontSize: 12, color: C.slate600, lineHeight: 1.5 }}>{fw.gates}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 26,
              padding: '18px 22px',
              background: C.greenSoft,
              border: `1px solid ${C.greenBorder}`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <FileCheck2 size={22} color={C.green} strokeWidth={2.25} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.slate900, marginBottom: 2 }}>
                Decision Provenance Record export
              </div>
              <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.5 }}>
                A hashed, tamper-evident 4-page artifact your General Counsel hands to the audit
                committee or regulator of record, built to the shape EU AI Act Article 14, SEC AI
                disclosure, and Basel III ICAAP already require. Includes input-document SHA-256
                hash, prompt fingerprint, model lineage, academic citations across the 30+ bias
                taxonomy, regulatory mapping across all {FRAMEWORKS.length} frameworks, and full
                pipeline lineage.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a
                href="/dpr-sample-wework.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  background: C.green,
                  color: C.white,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <FileText size={13} /> Sample DPR · US public-market
              </a>
              <a
                href="/dpr-sample-dangote.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  background: C.green,
                  color: C.white,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <FileText size={13} /> Sample DPR · Pan-African industrial
              </a>
              <a
                href="/dpa-template.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  background: C.white,
                  color: C.slate900,
                  border: `1px solid ${C.slate300}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <FileText size={13} /> DPA template
              </a>
              <Link
                href="/pricing"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  background: 'transparent',
                  color: C.slate600,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Strategy pricing <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Access controls */}
      <section
        style={{
          padding: '72px 24px',
          background: C.slate50,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Access controls"
            title="Who gets in, and who sees what"
            body="What is available today across every plan, and what is unlocked on Enterprise."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACCESS_CONTROLS.map(ctrl => {
              const style = AVAILABILITY_STYLE[ctrl.availability];
              return (
                <div
                  key={ctrl.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr',
                    gap: 16,
                    padding: '16px 20px',
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderLeft: `3px solid ${style.border}`,
                    borderRadius: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: style.pillBg,
                      color: style.pillText,
                      border: `1px solid ${style.pillBorder}`,
                      height: 22,
                      alignSelf: 'center',
                      justifySelf: 'start',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {style.label}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: C.slate900,
                        marginBottom: 3,
                      }}
                    >
                      {ctrl.label}
                    </div>
                    <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.55 }}>
                      {ctrl.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Incident response */}
      <section style={{ padding: '72px 24px', background: C.white }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Incident response"
            title="What happens if something goes wrong"
            body="The commitment isn't that incidents never happen. It's what you'll hear from us when one does, and in what timeframe."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {INCIDENT_COMMITMENTS.map(c => (
              <div
                key={c.threshold}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: C.slate500,
                    marginBottom: 4,
                  }}
                >
                  Within
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: C.green,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginBottom: 10,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  }}
                >
                  {c.threshold}
                </div>
                <div style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.55 }}>{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disaster recovery + business continuity (P1 #26 — Margaret persona) */}
      <section
        id="dr-bcp"
        style={{
          padding: '72px 24px',
          background: C.slate50,
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Disaster recovery + business continuity"
            title="What happens if production fails"
            body="The numbers a Fortune 500 security questionnaire opens with. Recovery objectives, backup cadence, redundancy posture — sized against what the production-tier infrastructure SLA actually delivers, not what would sound nice."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              marginTop: 24,
            }}
          >
            {DR_BCP.map(item => (
              <div
                key={item.label}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: C.slate500,
                    marginBottom: 6,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.green,
                    letterSpacing: '-0.01em',
                    marginBottom: 8,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.55 }}>
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-tier retention SLA */}
      <section
        id="retention"
        style={{
          padding: '72px 24px',
          background: C.white,
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Retention SLA"
            title="How long your documents live, and how to delete them"
            body="Documents auto-soft-delete at the end of your tier's window. A 30-day grace window applies before permanent purge — recoverable via support during the grace, irrecoverable after. Self-serve Delete is on every document detail page and on the post-upload reveal card."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
              marginTop: 24,
            }}
          >
            {RETENTION_TIERS.map(t => (
              <div
                key={t.tier}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 14,
                  padding: '20px 22px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: C.slate500,
                    }}
                  >
                    {t.tier}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.green,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                  }}
                >
                  {t.retention}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.slate500,
                    marginTop: 2,
                  }}
                >
                  {t.grace}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: C.slate600,
                    lineHeight: 1.55,
                    marginTop: 12,
                  }}
                >
                  {t.body}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 12,
              color: C.slate500,
              marginTop: 18,
              textAlign: 'center',
            }}
          >
            Right-to-delete (GDPR Art. 17) requests are processed within 30 days. Send to{' '}
            <a href="mailto:privacy@decision-intel.com" style={{ color: C.green }}>
              privacy@decision-intel.com
            </a>{' '}
            or use the in-app Delete button on any document.
          </p>
        </div>
      </section>

      {/* Processors */}
      <section
        style={{
          padding: '72px 24px',
          background: C.slate50,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Sub-processors"
            title="Every vendor that touches your data"
            body="Transparent processor list with each vendor's certification posture and hosting region. Updated in lock-step with our vendor agreements."
          />
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr 1.3fr 0.8fr',
                padding: '12px 18px',
                background: C.slate50,
                borderBottom: `1px solid ${C.slate200}`,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.slate500,
              }}
            >
              <div>Vendor</div>
              <div>Role</div>
              <div>Certification</div>
              <div>Region</div>
            </div>
            {PROCESSORS.map((p, i) => (
              <div
                key={p.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.4fr 1.3fr 0.8fr',
                  padding: '14px 18px',
                  borderBottom: i === PROCESSORS.length - 1 ? undefined : `1px solid ${C.slate100}`,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 700, color: C.slate900 }}>{p.name}</div>
                <div style={{ color: C.slate600 }}>{p.role}</div>
                <div style={{ color: C.slate600 }}>{p.cert}</div>
                <div style={{ color: C.slate500, fontSize: 12 }}>{p.region}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reach us */}
      <section style={{ padding: '72px 24px 100px', background: C.white }}>
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            background: `linear-gradient(135deg, ${C.white} 0%, ${C.greenSoft} 100%)`,
            border: `1px solid ${C.greenBorder}`,
            borderRadius: 20,
            padding: '40px 40px 36px',
            textAlign: 'center',
          }}
        >
          <ShieldAlert size={32} color={C.green} strokeWidth={2} style={{ marginBottom: 14 }} />
          <h2
            style={{
              fontSize: 'clamp(24px, 2.6vw, 30px)',
              fontWeight: 800,
              color: C.slate900,
              letterSpacing: '-0.015em',
              margin: '0 0 12px',
            }}
          >
            Found something? We want to hear about it.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: C.slate600,
              lineHeight: 1.65,
              margin: '0 auto 22px',
              maxWidth: 560,
            }}
          >
            Responsible disclosure is a first-class contract with our users. Report vulnerabilities
            to{' '}
            <a
              href="mailto:security@decision-intel.com"
              style={{ color: C.green, fontWeight: 700, textDecoration: 'none' }}
            >
              security@decision-intel.com
            </a>{' '}
            (first response within 48 hours, every time). For DPA requests, SOC 2 reports, or a
            security questionnaire response, reach the same inbox and reference your organisation
            name.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="mailto:security@decision-intel.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '11px 20px',
                background: C.green,
                color: C.white,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <MailCheck size={14} />
              Email security@
            </a>
            <Link
              href="/privacy"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '11px 20px',
                background: C.white,
                color: C.slate900,
                border: `1px solid ${C.slate200}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <FileText size={14} />
              Privacy policy
            </Link>
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.slate400,
              marginTop: 22,
              paddingTop: 18,
              borderTop: `1px solid ${C.greenBorder}`,
            }}
          >
            Last reviewed · 2026-04-19 · security@decision-intel.com
          </div>
        </div>
      </section>
    </div>
  );
}
