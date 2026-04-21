import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  FileCheck2,
  Gavel,
  Landmark,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'For the board · Decision Intel',
  description:
    'A 4-minute read for the board director whose CSO is about to propose a Decision Intel subscription. Written in director-facing language — fiduciary duty, EU AI Act board oversight, SEC AI disclosure, Basel III ICAAP, SOX §404.',
  alternates: { canonical: `${siteUrl}/decision-intel-for-boards` },
  // Intentionally off the public discovery index: this surface is a CSO-
  // forwards-to-board artifact, not a top-of-funnel landing page.
  robots: { index: false, follow: true },
};

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
};

type Tailwind = {
  icon: LucideIcon;
  label: string;
  status: string;
  body: string;
};

const BOARD_TAILWINDS: Tailwind[] = [
  {
    icon: Gavel,
    label: 'EU AI Act — high-risk decision-support obligations',
    status: 'Enforceable 2 August 2026',
    body: 'Article 14 (human oversight) and Article 15 (record-keeping + accuracy) apply to AI-augmented strategic decision systems. The board is the accountable body. Decision Intel produces a per-decision Decision Provenance Record — model lineage, prompt fingerprint, judge variance, signed input hash — mapped onto Article 14 record-keeping by design.',
  },
  {
    icon: Landmark,
    label: 'SEC AI Disclosure — investor-adviser decisions',
    status: 'Rulemaking evolving 2024 — 2026',
    body: 'The SEC proposal requires documentation of AI use in decisions that affect investors. "We use AI" is no longer a sufficient disclosure. Decision Intel\'s per-decision audit trail is the documentation your GC can attach to a 10-K or investor letter without hand-assembly.',
  },
  {
    icon: FileCheck2,
    label: 'Basel III · Pillar 2 ICAAP',
    status: 'Live for regulated banks',
    body: 'The Internal Capital Adequacy Assessment Process requires documented qualitative decisions, including the reasoning behind them. Decision Intel attaches a Basel III provision to every flagged bias — so the audit committee can defend each capital-allocation call against its source.',
  },
  {
    icon: ShieldCheck,
    label: 'SOX §404 — internal controls over financial reporting',
    status: 'Live for public companies',
    body: 'When strategic decisions affect material financial statements (M&A reserves, impairment, forward guidance), the reasoning behind those decisions is part of the internal-controls perimeter. Decision Intel is the first tool that instruments it.',
  },
];

type Objection = {
  number: string;
  question: string;
  answer: string;
};

const OBJECTIONS: Objection[] = [
  {
    number: '01',
    question: 'Is this just AI wrapped around existing board-reporting tools?',
    answer:
      'No. Board-reporting tools (Diligent, Nasdaq Boardvantage) package what the strategy team produces. Decision Intel instruments how the strategy team reasons — it sits one layer earlier in the workflow, before the board deck is written. The two are complementary: Decision Intel\'s Decision Provenance Record attaches to your board-pack as evidentiary backup for the decision it describes.',
  },
  {
    number: '02',
    question: 'What happens to our data?',
    answer:
      'Documents are encrypted at rest with authenticated AES-256-GCM (keyVersion-rotated). A GDPR anonymizer runs as the literal first node of the pipeline — no analysis model ever sees raw PII. No customer data is used to train upstream models. Hosted on SOC 2 Type II infrastructure (Vercel + Supabase). Full posture at /security.',
  },
  {
    number: '03',
    question: 'Who vouches for the methodology?',
    answer:
      'The analysis pipeline is a synthesis of two Nobel-adjacent traditions: Kahneman\'s System 2 debiasing (Thinking, Fast and Slow; Noise) and Klein\'s Recognition-Primed Decision framework (Sources of Power). Both authors converged on the arbitrated integration in their 2009 paper "Conditions for Intuitive Expertise." Decision Intel is the only platform that operationalises the synthesis — we call it the Recognition-Rigor Framework. The 11 AI-governance principles published by AI Verify Foundation (Singapore IMDA) map field-by-field onto our Decision Provenance Record.',
  },
];

// ── Shell ─────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  background: C.white,
  color: C.navy,
  minHeight: '100vh',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  padding: '64px 24px 96px',
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: C.green,
  marginBottom: 20,
};

const h1Style: React.CSSProperties = {
  fontSize: 'clamp(32px, 5vw, 44px)',
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
  color: C.navy,
  marginBottom: 24,
};

const leadStyle: React.CSSProperties = {
  fontSize: 19,
  lineHeight: 1.6,
  color: C.slate600,
  marginBottom: 0,
};

const h2Style: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: C.navy,
  marginTop: 56,
  marginBottom: 16,
};

const h3Style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: C.navy,
  marginBottom: 4,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.68,
  color: C.slate700,
  marginBottom: 16,
};

const bodyMutedStyle: React.CSSProperties = {
  ...bodyStyle,
  color: C.slate500,
  fontSize: 14.5,
};

// ── Page ──────────────────────────────────────────────────────────────

export default function DecisionIntelForBoardsPage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Minimal header — this is a forwarded artifact, not a navigated page */}
        <div style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: C.navy, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Decision Intel
          </Link>
          <span style={{ fontSize: 12, color: C.slate500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            For the board · 4-minute read
          </span>
        </div>

        {/* Hero */}
        <div style={eyebrowStyle}>A note to the board director</div>
        <h1 style={h1Style}>
          Your CSO is about to ask the board to approve a Decision Intel subscription. Here is the
          four-minute version of why it matters.
        </h1>
        <p style={leadStyle}>
          This page is written for the board director whose Chief Strategy Officer is the primary
          signatory. It summarises what the platform does, why it is relevant to the governance
          agenda this board already carries, and the three objections you might reasonably raise.
        </p>

        {/* What it is */}
        <h2 style={h2Style}>What your CSO is proposing</h2>
        <p style={bodyStyle}>
          Decision Intel is the native reasoning layer for every boardroom strategic decision. It
          sits between the strategy team drafting a memo and the committee that will vote on it. In
          roughly sixty seconds, it scores thirty-plus cognitive biases, predicts the questions the
          CEO or board chair is most likely to ask, simulates five role-primed committee personas
          against the memo, and attaches every decision to a Decision Knowledge Graph that
          compounds over time.
        </p>
        <p style={bodyStyle}>
          Every audit produces a Decision Provenance Record: the signed, hashed, mapped-onto-EU-AI-Act
          artifact that your GC can walk into a regulator meeting with. This is the piece most
          relevant to the board.
        </p>

        {/* Why it matters to the board */}
        <h2 style={h2Style}>Why this is relevant to the board agenda this year</h2>
        <p style={bodyStyle}>
          The regulatory wave that makes this a board-level topic — not a pure strategy-team
          purchase — is already calendared, not speculative. Four items specifically.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8, marginBottom: 8 }}>
          {BOARD_TAILWINDS.map(({ icon: Icon, label, status, body }) => (
            <div
              key={label}
              style={{
                padding: 20,
                borderRadius: 12,
                background: C.slate50,
                border: `1px solid ${C.slate200}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: C.greenSoft,
                    border: `1px solid ${C.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={C.green} strokeWidth={2.25} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={h3Style}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.green, letterSpacing: '0.02em', marginBottom: 8 }}>
                    {status}
                  </div>
                  <div style={{ ...bodyStyle, marginBottom: 0, fontSize: 15, lineHeight: 1.6 }}>{body}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The ask */}
        <h2 style={h2Style}>The specific ask</h2>
        <p style={bodyStyle}>
          The CSO is almost certainly proposing one of two tiers.
        </p>
        <p style={bodyStyle}>
          <strong>Strategy tier at £2,499/month</strong> supports a team of up to ten users and 250
          audits per month — the operating rhythm for a single strategy function running memos,
          board decks, and M&A recommendations through the platform. This is the most common
          starting point for Fortune 500 corporate strategy teams.
        </p>
        <p style={bodyStyle}>
          <strong>Enterprise</strong> is custom-priced, includes a volume floor, and covers
          cross-functional deployments where multiple strategy and M&A teams share the same
          Decision Knowledge Graph. Enterprise buyers typically also request dedicated GC
          onboarding on the seven-framework compliance mapping.
        </p>
        <p style={bodyMutedStyle}>
          Gross margin runs approximately ninety percent blended, so the subscription is
          structurally self-sustaining rather than promotional — relevant context for boards that
          have been burned by AI vendors whose unit economics collapse at scale.
        </p>

        {/* Objections */}
        <h2 style={h2Style}>Three objections you might reasonably raise</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
          {OBJECTIONS.map(({ number, question, answer }) => (
            <div
              key={number}
              style={{
                paddingLeft: 20,
                borderLeft: `3px solid ${C.green}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: C.slate500,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Objection {number}
              </div>
              <div style={{ ...h3Style, fontSize: 17, marginBottom: 10 }}>{question}</div>
              <div style={{ ...bodyStyle, marginBottom: 0, fontSize: 15 }}>{answer}</div>
            </div>
          ))}
        </div>

        {/* Founder close */}
        <div
          style={{
            marginTop: 72,
            padding: 28,
            borderRadius: 12,
            background: C.navy,
            color: C.white,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#86EFAC',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            A note from the founder
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: C.slate200, marginBottom: 14 }}>
            I am Folahan Williams, the solo technical founder of Decision Intel. I built the
            platform alongside secondary school over roughly sixteen hours a week. I am advised by
            a senior operator who helped scale Wiz from startup to $32B. If the board has a
            question that is best answered by the person holding the pen on the product roadmap
            rather than the sales team, I am one email away.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
            <Link
              href="/how-it-works"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: C.navy,
                background: C.white,
                padding: '10px 16px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              See the 12-node pipeline
              <ArrowRight size={15} strokeWidth={2.25} />
            </Link>
            <Link
              href="/security"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: C.white,
                border: `1px solid ${C.slate400}`,
                padding: '10px 16px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Review the security posture
              <ArrowRight size={15} strokeWidth={2.25} />
            </Link>
          </div>
        </div>

        {/* Minimal footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: `1px solid ${C.slate200}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: C.slate500,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={13} strokeWidth={2} />
            Decision Intel · the reasoning layer the Fortune 500 needs before regulators start
            asking
          </span>
          <Link href="/" style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}>
            decision-intel.com
          </Link>
        </div>
      </div>
    </div>
  );
}
