import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  EyeOff,
  Trash2,
  FileLock2,
  ServerCog,
  Database,
  CircleSlash,
  Cpu,
  FileText,
  MessageSquare,
  Plug,
  User,
  Mail,
  Download,
  Pencil,
  Ban,
  Workflow,
} from 'lucide-react';

import { MarketingNav } from '@/components/marketing/MarketingNav';
import { DataLifecycleViz } from '@/components/marketing/privacy/DataLifecycleViz';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Security & Privacy · Decision Intel',
  description:
    'Your strategic memos are evidence. We treat them that way. GDPR anonymization runs first — before any analysis LLM sees your text. AES-256-GCM at rest, TLS 1.2+ in transit, no model training on your content.',
  alternates: { canonical: `${siteUrl}/privacy` },
  openGraph: {
    title: 'Security & Privacy · Decision Intel',
    description:
      'How Decision Intel protects your strategic memos. GDPR anonymization, AES-256-GCM encryption, and a 30-day hard-delete guarantee.',
    url: `${siteUrl}/privacy`,
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
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.06)',
  redBorder: 'rgba(220, 38, 38, 0.18)',
};

const TRUST_STACK = [
  {
    icon: ShieldCheck,
    label: 'GDPR anonymizer runs first',
    body: 'PII is detected and redacted before any analysis LLM sees the document. It is the literal first node in the pipeline, not a post-hoc scrub.',
  },
  {
    icon: Lock,
    label: 'AES-256-GCM at rest',
    body: 'Document content is encrypted with authenticated AES-256-GCM using keys held in a separate vault from the database.',
  },
  {
    icon: FileLock2,
    label: 'TLS 1.2+ in transit',
    body: 'Every request between your browser, our API, and third-party processors uses modern TLS. No plaintext paths.',
  },
  {
    icon: EyeOff,
    label: 'No model training on your data',
    body: 'Your documents are not used to train any upstream model. Every processor operates under no-training contract terms.',
  },
  {
    icon: Trash2,
    label: '30-day hard-delete',
    body: 'Delete your account and every document, analysis, and associated record is permanently erased within 30 days.',
  },
] as const;

const COLLECTION = [
  {
    icon: User,
    label: 'Account',
    what: 'Name, email, and organization via Google OAuth (Supabase). We never see or store your Google password.',
    how: 'Authenticate sessions and enforce per-org data isolation.',
  },
  {
    icon: FileText,
    label: 'Documents',
    what: 'Strategic memos, board decks, market-entry recommendations, and any other files you upload.',
    how: 'Analyzed by our pipeline and stored AES-256-GCM encrypted in your organization\u2019s vault.',
  },
  {
    icon: ServerCog,
    label: 'Usage',
    what: 'Feature-usage events, analysis completion metrics, performance timings.',
    how: 'Improve the product and debug errors. No cross-tenant aggregation is exposed externally.',
  },
  {
    icon: Plug,
    label: 'Integrations',
    what: 'Encrypted Slack / Drive tokens, and only the content you explicitly route through the bot or share.',
    how: 'Execute the integration you asked for. We do not read your full Slack history or crawl your Drive.',
  },
] as const;

const NEVER = [
  'Sell your data or share it with data brokers',
  'Use your documents to train our models or upstream LLMs',
  'Allow any cross-tenant data access or analysis',
  'Set third-party tracking or advertising cookies',
  'Read your full Slack history or mailbox beyond what you explicitly route through us',
  'Retain documents after account deletion beyond the 30-day purge window',
] as const;

const RIGHTS = [
  {
    icon: Download,
    label: 'Access',
    body: 'Request a full machine-readable export of the data we hold about you.',
  },
  {
    icon: Pencil,
    label: 'Rectification',
    body: 'Correct any inaccurate or outdated personal data.',
  },
  {
    icon: Trash2,
    label: 'Erasure',
    body: 'Delete your account and trigger a 30-day hard-purge of every associated record.',
  },
  {
    icon: Workflow,
    label: 'Portability',
    body: 'Export your analyses and documents in structured, portable formats.',
  },
  {
    icon: Ban,
    label: 'Object',
    body: 'Opt out of any specific processing activity, including anonymized causal-edge contribution.',
  },
] as const;

const PROCESSORS = [
  {
    name: 'Supabase',
    role: 'Authentication and encrypted Postgres hosting (EU region available).',
  },
  {
    name: 'Google AI (Gemini)',
    role: 'Analysis model. Processed under no-training terms; input is anonymized first.',
  },
  {
    name: 'Anthropic (fallback)',
    role: 'Fallback analysis when explicitly enabled. Same no-training terms.',
  },
  {
    name: 'Stripe',
    role: 'Payment processing. We never see or store card numbers.',
  },
  {
    name: 'Sentry',
    role: 'Error and performance telemetry. PII scrubbers enabled at the SDK layer.',
  },
  {
    name: 'Vercel',
    role: 'Application hosting and serverless compute.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <div style={{ background: C.slate50, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* HERO */}
      <section
        style={{
          padding: '72px 24px 56px',
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
              gap: 48,
              alignItems: 'center',
            }}
            className="privacy-hero"
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: C.green,
                  marginBottom: 18,
                }}
              >
                Security &amp; privacy
              </div>
              <h1
                style={{
                  fontSize: 'clamp(34px, 5.5vw, 58px)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  marginBottom: 20,
                }}
              >
                Your strategic memos are evidence.
                <br />
                We treat them that way
                <span style={{ color: C.green }}>.</span>
              </h1>
              <p
                style={{
                  fontSize: 'clamp(16px, 1.8vw, 19px)',
                  lineHeight: 1.55,
                  color: C.slate600,
                  margin: 0,
                  marginBottom: 14,
                  maxWidth: 620,
                }}
              >
                GDPR anonymization runs{' '}
                <span style={{ fontWeight: 600, color: C.slate900 }}>first</span>
                &nbsp;&mdash; before any analysis LLM sees your text. AES-256-GCM at rest. TLS 1.2+
                in transit. No training on your content. And a 30-day hard-delete when you&rsquo;re
                done.
              </p>
              <p style={{ fontSize: 14, color: C.slate500, margin: 0, maxWidth: 620 }}>
                This page is the full policy and the full security posture, laid out so you can read
                it in five minutes instead of fifty.
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                <a
                  href="#lifecycle"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    background: C.slate900,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Walk through the lifecycle <ArrowRight size={14} />
                </a>
                <a
                  href="#rights"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    background: C.white,
                    color: C.slate900,
                    border: `1px solid ${C.slate200}`,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Your GDPR rights
                </a>
                <a
                  href="mailto:team@decision-intel.com"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    color: C.slate600,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Mail size={14} /> Ask a question
                </a>
              </div>
            </div>

            <div>
              <DataLifecycleViz />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STACK */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="The stack"
            title="Five guarantees, non-negotiable."
            body="Every strategic memo is high-leverage data. These are the defaults you get from the moment you create an account — not premium features, not paid add-ons."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginTop: 32,
            }}
          >
            {TRUST_STACK.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 16,
                    padding: '22px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: C.greenSoft,
                      border: `1px solid ${C.greenBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.green,
                    }}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.55 }}>
                    {item.body}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DATA LIFECYCLE (detailed) */}
      <section id="lifecycle" style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="The lifecycle"
            title="What happens to a document, step by step."
            body="Four stages between upload and rest. The most load-bearing is the second: anonymization happens before your text reaches any analysis model, not after."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
              marginTop: 32,
            }}
          >
            <LifecycleStep
              n="01"
              icon={FileText}
              title="Upload via TLS 1.2+"
              body="Your memo travels from your browser to our API over modern TLS. Nothing touches disk in plaintext, not even briefly."
            />
            <LifecycleStep
              n="02"
              icon={ShieldCheck}
              title="GDPR anonymization"
              body="The first pipeline node — before analysis — scans for PII (names, emails, account numbers, internal IDs) and redacts in place. Anonymized text is what the reasoning models receive."
              highlight
            />
            <LifecycleStep
              n="03"
              icon={Cpu}
              title="Analysis inside your tenant"
              body="The twelve-node pipeline runs entirely within your organization's data scope. No cross-tenant aggregation, no shared model memory, no contribution to any global training run."
            />
            <LifecycleStep
              n="04"
              icon={Lock}
              title="Vault at rest (AES-256-GCM)"
              body="Results and the original document are stored encrypted with authenticated AES-256-GCM. Keys are held in a separate vault from the database that holds the ciphertext."
            />
          </div>
        </div>
      </section>

      {/* WHAT WE COLLECT */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader eyebrow="What we collect" title="Four categories. Every one justified." />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
              marginTop: 32,
            }}
          >
            {COLLECTION.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 16,
                    padding: '22px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: C.slate100,
                        border: `1px solid ${C.slate200}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: C.slate700,
                      }}
                    >
                      <Icon size={16} strokeWidth={2.2} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
                      {item.label}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.slate400,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 5,
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      What
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: C.slate700,
                        lineHeight: 1.55,
                        marginBottom: 12,
                      }}
                    >
                      {item.what}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.slate400,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 5,
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      How we use it
                    </div>
                    <div style={{ fontSize: 13, color: C.slate700, lineHeight: 1.55 }}>
                      {item.how}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT WE NEVER DO */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="What we never do"
            title="Explicit prohibitions."
            body="The inverse list matters as much as the positive one. Every bullet below is a thing we will not do, by design and by policy."
          />
          <div
            style={{
              background: `linear-gradient(180deg, ${C.white} 0%, ${C.redSoft} 100%)`,
              border: `1px solid ${C.redBorder}`,
              borderRadius: 16,
              padding: 26,
              marginTop: 32,
            }}
          >
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {NEVER.map(line => (
                <li
                  key={line}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 13.5,
                    color: C.slate700,
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: C.red,
                      color: C.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                    aria-hidden
                  >
                    <CircleSlash size={12} strokeWidth={2.4} />
                  </div>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* GDPR RIGHTS */}
      <section id="rights" style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Your rights"
            title="Five rights, one response window."
            body="If you are in the EEA, United Kingdom, or a jurisdiction with similar data-protection law, you can exercise any of these. We respond within 30 days."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginTop: 32,
            }}
          >
            {RIGHTS.map(r => {
              const Icon = r.icon;
              return (
                <div
                  key={r.label}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 16,
                    padding: '22px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: C.slate100,
                      border: `1px solid ${C.slate200}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.slate700,
                    }}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
                    Right to {r.label.toLowerCase()}
                  </div>
                  <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.55 }}>{r.body}</div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 20,
              padding: '14px 18px',
              borderRadius: 12,
              background: C.white,
              border: `1px dashed ${C.slate200}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: C.slate600,
              flexWrap: 'wrap',
            }}
          >
            <Mail size={14} color={C.slate500} />
            <span>
              To exercise any right, email{' '}
              <a
                href="mailto:team@decision-intel.com"
                style={{ color: C.slate900, fontWeight: 600 }}
              >
                team@decision-intel.com
              </a>
              . We respond within 30 days.
            </span>
          </div>
        </div>
      </section>

      {/* PROCESSORS */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="Third-party processors"
            title="The short list."
            body="These are the only external services your data touches. Each has a specific role, and each is contractually bound not to train on or resell your content."
          />
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              overflow: 'hidden',
              marginTop: 32,
            }}
          >
            {PROCESSORS.map((p, i) => (
              <div
                key={p.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(140px, 200px) 1fr',
                  gap: 20,
                  padding: '18px 22px',
                  borderTop: i === 0 ? 'none' : `1px solid ${C.slate100}`,
                  alignItems: 'center',
                }}
                className="privacy-processor-row"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: C.slate100,
                      border: `1px solid ${C.slate200}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.slate700,
                    }}
                  >
                    <Database size={14} strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>{p.name}</div>
                </div>
                <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.55 }}>{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RETENTION + COOKIES + CONTACT */}
      <section style={{ padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            <FineprintCard
              icon={Trash2}
              label="Retention"
              body="We retain your data while your account is active. On deletion, every personal record, uploaded document, analysis, and associated row is permanently removed within 30 days. Fully anonymized aggregate analytics (no identifiers, no content) may be retained to improve the product."
            />
            <FineprintCard
              icon={FileLock2}
              label="Cookies"
              body="Only essential session cookies (Supabase auth). We do not set third-party tracking cookies or advertising cookies. Analytics is collected server-side without cookies."
            />
            <FineprintCard
              icon={MessageSquare}
              label="Changes to this policy"
              body='We may update this policy. Material changes are highlighted on this page and the "Last updated" date below changes. Your continued use constitutes acceptance.'
            />
            <FineprintCard
              icon={Mail}
              label="Contact"
              body={
                <>
                  Privacy questions, complaints, or rights requests:{' '}
                  <a
                    href="mailto:team@decision-intel.com"
                    style={{ color: C.slate900, fontWeight: 600 }}
                  >
                    team@decision-intel.com
                  </a>
                </>
              }
            />
          </div>

          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
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
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.04em',
              }}
            >
              Last updated: April 16, 2026
            </div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: C.slate600,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              &larr; Back to home
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .privacy-hero {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .privacy-processor-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div style={{ maxWidth: 760 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: C.green,
          marginBottom: 14,
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: 'clamp(24px, 3vw, 34px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          marginBottom: body ? 14 : 0,
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
      {body && (
        <p
          style={{
            fontSize: 15.5,
            color: C.slate600,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

function LifecycleStep({
  n,
  icon: Icon,
  title,
  body,
  highlight,
}: {
  n: string;
  icon: typeof FileText;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${highlight ? C.greenBorder : C.slate200}`,
        borderRadius: 16,
        padding: '22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
      }}
    >
      {highlight && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: 16,
            padding: '3px 10px',
            borderRadius: 999,
            background: C.green,
            color: C.white,
            fontSize: 9.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          Load-bearing
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: highlight ? C.greenSoft : C.slate100,
            border: `1px solid ${highlight ? C.greenBorder : C.slate200}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: highlight ? C.green : C.slate700,
          }}
        >
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: C.slate400,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.1em',
          }}
        >
          {n}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.slate900, lineHeight: 1.3 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

function FineprintCard({
  icon: Icon,
  label,
  body,
}: {
  icon: typeof FileText;
  label: string;
  body: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: C.slate100,
            border: `1px solid ${C.slate200}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.slate700,
          }}
        >
          <Icon size={14} strokeWidth={2.2} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.slate400,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {label}
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: C.slate600, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}
