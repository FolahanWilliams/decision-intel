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

import { CaseStudyNav } from '../case-studies/CaseStudyNav';
import { EncryptionFlowViz } from '@/components/marketing/security/EncryptionFlowViz';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Security · Decision Intel',
  description:
    'Enterprise-grade security posture on a founder budget. AES-256-GCM at rest with keyVersion rotation, TLS 1.2+ in transit, immutable audit log, seven regulatory frameworks mapped flag-by-flag, and an Audit Defense Packet your GC can walk into a regulator meeting with.',
  alternates: { canonical: `${siteUrl}/security` },
  openGraph: {
    title: 'Security · Decision Intel',
    description:
      'How Decision Intel is built to clear a Fortune-500 security questionnaire.',
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
    label: 'Seven regulatory frameworks, provision-level',
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
    body: 'Hosted on Vercel (SOC 2 Type II) + Supabase (SOC 2 Type II, HIPAA). Our own SOC 2 audit is scoped for 2026 — in-flight controls already mirror Type II.',
  },
];

const KEY_ROTATION: Array<{ step: number; label: string; body: string }> = [
  {
    step: 1,
    label: 'Provision the new key',
    body: 'Set DOCUMENT_ENCRYPTION_KEY_V2 (64-character hex) in production. The legacy v1 key stays in place — no downtime, no lockout.',
  },
  {
    step: 2,
    label: 'Cut over writes',
    body: 'Bump DOCUMENT_ENCRYPTION_KEY_VERSION=2 and redeploy. New writes stamp keyVersion=2; every existing row still decrypts via v1.',
  },
  {
    step: 3,
    label: 'Backfill historical rows',
    body: 'Run npm run rotate:encryption-key — the CLI walks every row where keyVersion != 2, decrypts with v1, re-encrypts with v2, updates the stamp. Batched, resumable, idempotent.',
  },
  {
    step: 4,
    label: 'Drop the old key',
    body: 'Once every row is on v2, delete DOCUMENT_ENCRYPTION_KEY (v1) from the production env and redeploy. Rotation complete.',
  },
];

const FRAMEWORKS = [
  { code: 'SOX §404', name: 'Sarbanes-Oxley', gates: 'Public-company material-statement controls.' },
  { code: 'GDPR Art. 22', name: 'General Data Protection Regulation', gates: 'Automated-decision rights for EU data subjects.' },
  { code: 'EU AI Act · Annex III', name: 'EU AI Act', gates: 'High-risk AI decision-support obligations.' },
  { code: 'Basel III', name: 'Basel III', gates: 'Capital-allocation decisions in regulated banks.' },
  { code: 'FCA Consumer Duty', name: 'Financial Conduct Authority', gates: 'UK financial-services decisioning.' },
  { code: 'SEC Reg D', name: 'SEC Regulation D', gates: 'Forward-looking statements + safe-harbour disclosure.' },
  { code: 'LPOA', name: 'Limited Partnership Obligations', gates: 'Fund-level fiduciary dissent documentation.' },
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
    label: 'SAML 2.0 and OIDC single sign-on',
    availability: 'enterprise',
    body: 'Okta, Azure AD, OneLogin, Ping, JumpCloud, and generic SAML / OIDC. Your IT admin configures the connection from the admin console; typical setup is under 20 minutes from metadata paste to first login.',
  },
  {
    label: 'Org-wide session visibility',
    availability: 'enterprise',
    body: 'Admins see every active session across the organisation, can force-log-out a departing member in a single click, and can set a per-org idle timeout between 15 minutes and 8 hours.',
  },
  {
    label: 'Admin audit log',
    availability: 'every_plan',
    body: 'Org admins review every action taken inside their workspace — who viewed which memo, who exported an Audit Defense Packet, who invited a new member — with filters, date range, and CSV export for downstream compliance tooling.',
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

const PROCESSORS = [
  { name: 'Vercel', role: 'Application hosting + CDN', cert: 'SOC 2 Type II', region: 'US + EU' },
  { name: 'Supabase', role: 'Postgres + Auth + Storage', cert: 'SOC 2 Type II · HIPAA', region: 'US' },
  { name: 'Google AI', role: 'Primary analysis LLM', cert: 'No-training contract terms', region: 'US' },
  { name: 'Anthropic', role: 'Fallback analysis LLM', cert: 'No-training contract terms', region: 'US' },
  { name: 'Stripe', role: 'Billing', cert: 'PCI-DSS Level 1 · SOC 1/2', region: 'US + EU' },
  { name: 'Sentry', role: 'Error monitoring', cert: 'SOC 2 Type II', region: 'US' },
];

const INCIDENT_COMMITMENTS = [
  { threshold: '1h', body: 'Internal detection + containment triggered. Customer-visible status posted within the hour when customer data is in scope.' },
  { threshold: '24h', body: 'First disclosure to affected customers with the scope, the data classes involved, and the remediation plan.' },
  { threshold: '72h', body: 'Regulator notification where applicable (GDPR Art. 33, SEC 8-K item 1.05) with the materiality assessment attached.' },
  { threshold: '30d', body: 'Full post-mortem delivered to affected customers. Root cause, timeline, controls added, exposure window. Signed by the founder.' },
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
      <CaseStudyNav />

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
              AES-256-GCM at rest with keyVersion rotation, TLS 1.2+ in transit, an immutable
              audit log, and every flag cross-linked to a specific regulatory provision across
              seven frameworks. A Fortune-500 security questionnaire finishes in minutes, not
              weeks.
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

      {/* Key rotation */}
      <section style={{ padding: '72px 24px', background: C.slate50, borderTop: `1px solid ${C.slate200}`, borderBottom: `1px solid ${C.slate200}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Key rotation"
            title="Rotate encryption keys without downtime"
            body="Every row in an encrypted column carries an integer keyVersion stamp. Swapping keys is a four-step protocol — no big-bang migration, no data loss, no customer-visible pause."
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
                        body.includes('KEY') || body.includes('rotate:')
                          ? undefined
                          : undefined,
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
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
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
            title="Seven frameworks, mapped flag-by-flag"
            body="Every flag the pipeline surfaces carries a regulatory citation. Your GC doesn't take the tool on faith — they walk into the audit committee meeting with the memo, the flags, and the framework sections attached."
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
                <div style={{ fontSize: 12, color: C.slate600, lineHeight: 1.5 }}>
                  {fw.gates}
                </div>
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
                Audit Defense Packet export
              </div>
              <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.5 }}>
                One-click regulator-grade PDF of every flag on an analysis, with its framework
                citation and provision section. Available on Pro tier.
              </div>
            </div>
            <Link
              href="/pricing"
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
              See Pro pricing <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Access controls */}
      <section style={{ padding: '72px 24px', background: C.slate50, borderTop: `1px solid ${C.slate200}`, borderBottom: `1px solid ${C.slate200}` }}>
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
            body="The commitment isn't that incidents never happen — it's what you'll hear from us when one does, and in what timeframe."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
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
                <div style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.55 }}>
                  {c.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processors */}
      <section style={{ padding: '72px 24px', background: C.slate50, borderTop: `1px solid ${C.slate200}`, borderBottom: `1px solid ${C.slate200}` }}>
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
                  borderBottom:
                    i === PROCESSORS.length - 1 ? undefined : `1px solid ${C.slate100}`,
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
          <ShieldAlert
            size={32}
            color={C.green}
            strokeWidth={2}
            style={{ marginBottom: 14 }}
          />
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
          <p style={{ fontSize: 14, color: C.slate600, lineHeight: 1.65, margin: '0 auto 22px', maxWidth: 560 }}>
            Responsible disclosure is a first-class contract with our users. Report vulnerabilities to{' '}
            <a
              href="mailto:security@decision-intel.com"
              style={{ color: C.green, fontWeight: 700, textDecoration: 'none' }}
            >
              security@decision-intel.com
            </a>{' '}
            — first response within 48 hours, every time. For DPA requests, SOC 2 reports, or a
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
