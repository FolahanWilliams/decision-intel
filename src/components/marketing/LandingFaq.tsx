'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  Plug,
  Radar,
  Sparkles,
  DollarSign,
  Scale,
  Users,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Landing-page FAQ. Rebuild goals:
 *   - Match the visual confidence of /how-it-works and /demo pages.
 *   - Category chips + icons per question so the section skims as a
 *     table of contents, not a plain accordion.
 *   - Bigger typography, softer shadow, hover halo on collapsed cards.
 *   - Answers expanded with the specifics an enterprise buyer actually
 *     asks about (SOC 2, DPA, API auth, data residency) instead of
 *     marketing one-liners.
 */

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
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
} as const;

type Category =
  | 'Security'
  | 'Integration'
  | 'Outcomes'
  | 'Methodology'
  | 'Pricing'
  | 'Compliance'
  | 'Team'
  | 'Data';

const CATEGORY_META: Record<
  Category,
  { color: string; bg: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  Security: { color: '#DC2626', bg: '#FEE2E2', Icon: ShieldCheck },
  Integration: { color: '#2563EB', bg: '#DBEAFE', Icon: Plug },
  Outcomes: { color: '#16A34A', bg: '#DCFCE7', Icon: Radar },
  Methodology: { color: '#7C3AED', bg: '#EDE9FE', Icon: Sparkles },
  Pricing: { color: '#0891B2', bg: '#CFFAFE', Icon: DollarSign },
  Compliance: { color: '#C2410C', bg: '#FFEDD5', Icon: Scale },
  Team: { color: '#BE185D', bg: '#FCE7F3', Icon: Users },
  Data: { color: '#475569', bg: '#F1F5F9', Icon: Globe },
};

interface FaqItem {
  category: Category;
  q: string;
  a: React.ReactNode;
}

const ITEMS: FaqItem[] = [
  {
    category: 'Security',
    q: 'How is sensitive data protected?',
    a: (
      <>
        Every document is encrypted with AES-256-GCM at rest and TLS 1.3 in transit. A GDPR
        anonymization layer strips PII before any LLM call. We sign DPAs on request and our
        processor list is published at{' '}
        <Link href="/privacy" style={{ color: C.green, fontWeight: 600 }}>
          /privacy
        </Link>
        . Infrastructure is hosted on Vercel + Supabase inside audited US/EU regions; no model
        provider is allowed to train on customer content.
      </>
    ),
  },
  {
    category: 'Integration',
    q: 'How long does integration take?',
    a: (
      <>
        Under 30 minutes for the standard path: upload documents directly, connect Slack and Google
        Drive via OAuth, and send memos to a unique{' '}
        <code style={{ background: C.slate100, padding: '1px 6px', borderRadius: 4 }}>
          analyze+token@in.decision-intel.com
        </code>{' '}
        address. For programmatic use there&apos;s a REST API with per-org keys and scoped
        permissions — most teams land their first automated audit inside a single engineering
        afternoon.
      </>
    ),
  },
  {
    category: 'Outcomes',
    q: 'How does outcome tracking work?',
    a: (
      <>
        Outcomes are detected passively across three channels: follow-up documents you upload, Slack
        threads on decisions Decision Intel saw, and weekly web intelligence on the companies or
        initiatives you analysed. You confirm each detected outcome with one click. Confirmed
        outcomes feed the Decision Quality Index recalibration, so your org&apos;s DQI becomes
        specifically tuned to the kind of decisions you actually make.
      </>
    ),
  },
  {
    category: 'Methodology',
    q: 'How is this different from ChatGPT?',
    a: (
      <>
        ChatGPT gives one opinion from one model — it will confidently tell you the deck looks fine.
        Decision Intel runs a multi-stage audit: 30+ domain-specific biases mapped to published
        research, triangulated noise measurement, compound-risk scoring across interacting biases,
        and an outcome flywheel that recalibrates your scores with every confirmed result. The full
        methodology is documented at{' '}
        <Link href="/how-it-works" style={{ color: C.green, fontWeight: 600 }}>
          /how-it-works
        </Link>
        .
      </>
    ),
  },
  {
    category: 'Pricing',
    q: 'What does a real audit actually cost us?',
    a: (
      <>
        Individual plan is $249/month with 15 audits — sized for a single strategy operator.
        Strategy plan is $2,499/month with unlimited audits and team surfaces (Decision Rooms,
        shared Knowledge Graph). Enterprise is quoted per seat with SSO, audit-log retention SLAs,
        and a signed DPA. No per-seat minimums on the first two tiers. The free tier gives you 4
        audits a month to evaluate before you upgrade.
      </>
    ),
  },
  {
    category: 'Compliance',
    q: 'Which regulatory frameworks do you map to?',
    a: (
      <>
        Seven currently: GDPR, SOC 2 Type II, HIPAA, CCPA, SOX (financial materiality), EU AI Act
        (transparency + risk tiers), and the NIST AI Risk Management Framework. Every flagged bias
        cross-links to the relevant control section, and the Audit Defense Packet exports a
        regulator-grade PDF citing every framework the decision touches. We add frameworks on
        paying-customer request — if you need a specific one, tell us.
      </>
    ),
  },
  {
    category: 'Team',
    q: 'Can the whole team see the same analysis?',
    a: (
      <>
        On Strategy and Enterprise plans, yes. Decision Rooms capture blind priors from every
        stakeholder before they see the group&apos;s view (beats groupthink), and the shared
        Decision Knowledge Graph links every analysis back to the memo, the stakeholders, and the
        eventual outcome. Shareable permalinks work for one-off reviews with people outside the org.
      </>
    ),
  },
  {
    category: 'Data',
    q: 'Where is our data physically stored, and can we delete it?',
    a: (
      <>
        Production data sits in Supabase&apos;s <strong>us-east-1</strong> region by default, with
        EU-region provisioning available on Enterprise. Documents are deletable from the dashboard;
        analyses can be force-deleted via the API. Retention defaults to 180 days for
        free/Individual plans and is configurable on Strategy and above. Full lifecycle is described
        at{' '}
        <Link href="/privacy" style={{ color: C.green, fontWeight: 600 }}>
          /privacy
        </Link>
        .
      </>
    ),
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        const meta = CATEGORY_META[item.category];
        const Icon = meta.Icon;
        return (
          <div
            key={item.q}
            style={{
              border: `1px solid ${isOpen ? C.slate300 : C.slate200}`,
              borderRadius: 14,
              background: C.white,
              boxShadow: isOpen
                ? '0 10px 30px rgba(15, 23, 42, 0.08)'
                : '0 1px 2px rgba(15, 23, 42, 0.03)',
              overflow: 'hidden',
              transition: 'box-shadow 0.2s, border-color 0.2s',
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '18px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: meta.bg,
                  color: meta.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: meta.color,
                    marginBottom: 4,
                  }}
                >
                  {item.category}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: C.slate900,
                    lineHeight: 1.35,
                  }}
                >
                  {item.q}
                </div>
              </div>
              <ChevronDown
                size={18}
                style={{
                  color: C.slate400,
                  flexShrink: 0,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {isOpen && (
              <div
                style={{
                  padding: '0 20px 20px 68px',
                  fontSize: 15,
                  color: C.slate600,
                  lineHeight: 1.65,
                }}
              >
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
