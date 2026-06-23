/**
 * /track-record — the public prospective track record.
 *
 * The credibility engine: public, dated, falsifiable reasoning-audit calls,
 * scored on whether the FLAGGED RISK materialised, never on predicting the
 * price. Retro opens the door; prospective Brier earns belief. We publish the
 * false positives.
 *
 * Server-rendered (SEO + AI-citation friendly) mirroring the /trust house
 * style. The ledger reads from the canonical SSOT @/lib/data/public-calls,
 * shared with the founder-hub Pilot Plan so the two can never drift.
 *
 * Honesty discipline (load-bearing — never drift):
 *   - Score the flag, not the forecast.
 *   - Correlated risk indicators, not causation (POSITIONING_EPISTEMIC_HONESTY).
 *   - Publish losses. No confidentiality wall (PUBLIC decisions only).
 *   - Em-dash cap: exactly ONE user-visible em-dash on the page, and it comes
 *     from the imported POSITIONING_EPISTEMIC_HONESTY line. Author copy uses
 *     commas / colons / periods only.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Target, ArrowRight, ScrollText, ShieldCheck } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { PUBLIC_CALLS, CALL_STATUS_META, type PublicCall } from '@/lib/data/public-calls';
import { POSITIONING_EPISTEMIC_HONESTY } from '@/lib/constants/icp';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Track record · reasoning audits locked in public · Decision Intel',
  description:
    'Decision Intel’s prospective track record: public, dated, falsifiable reasoning-audit calls, scored on whether the flagged risk materialised, not on predicting the price. We publish the losses.',
  alternates: { canonical: `${siteUrl}/track-record` },
  openGraph: {
    title: 'Decision Intel · Prospective track record',
    description:
      'Public, dated, falsifiable reasoning-audit calls. We score whether the risk we flagged materialised, not whether we predicted the price. We publish the calls we get wrong.',
    url: `${siteUrl}/track-record`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reasoning audits, locked in public, before the outcome is known',
    description:
      'We score the flag, not the forecast. Public, dated, falsifiable, and we publish the losses.',
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
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const callCount = PUBLIC_CALLS.length;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Decision Intel · Prospective track record',
  description:
    'Public, dated, falsifiable reasoning-audit calls, scored on whether the flagged risk materialised.',
  url: `${siteUrl}/track-record`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: PUBLIC_CALLS.map((call, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: `${call.subject}: ${CALL_STATUS_META[call.status].label}`,
        text: `Flag: ${call.flag} Proxy: ${call.proxy}`,
        datePublished: call.dateLocked,
        url: `${siteUrl}/track-record#${call.id}`,
      },
    })),
  },
};

const STATUS_ORDER = ['locked', 'tracking', 'confirmed', 'false_positive', 'mixed'] as const;

const SECTIONS = [
  { id: 'method', label: 'The method' },
  { id: 'record', label: 'On the record' },
  { id: 'scope', label: 'What it is, and is not' },
];

export default function TrackRecordPage() {
  return (
    <div style={{ background: C.slate50, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 28px' }}>
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
          <Target size={12} strokeWidth={2.25} />
          Prospective track record
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
          Reasoning audits, locked in public, before the outcome is known.
        </h1>
        <p
          style={{
            margin: '18px 0 0',
            fontSize: 18,
            lineHeight: 1.55,
            color: C.slate600,
            maxWidth: 780,
          }}
        >
          Every call below names a specific reasoning-risk in a public decision, a falsifiable test,
          and a due date, all published in advance. We score whether the risk we flagged
          materialised, not whether we predicted the price, and we publish the calls we get wrong.
          The decisions are public and checkable; the reasoning-risk each one names is the shape
          that recurs in the memos and deals you actually work on.
        </p>
        <nav
          aria-label="Track record sections"
          style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 8 }}
        >
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                padding: '7px 14px',
                borderRadius: 9999,
                background: C.white,
                border: `1px solid ${C.slate200}`,
                color: C.slate700,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </section>

      {/* ── Method ────────────────────────────────────────────────── */}
      <section id="method" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <SectionEyebrow icon={<Target size={13} strokeWidth={2.25} />} text="The method" />
        <h2 style={h2Style}>Score the flag, not the forecast.</h2>
        <div style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ ...bodyStyle, color: C.slate700, fontWeight: 500 }}>
            Why this exists: you should not have to take our word that the audit catches what a
            committee misses. So the call is made in public, in advance, with a falsifiable test and
            a due date, and the result is published either way. Check the hit rate. That is the only
            honest proof a reasoning audit can offer before it is in your workflow.
          </p>
          <p style={bodyStyle}>
            A forecaster predicts the outcome. Decision Intel is a reasoning auditor: it names the
            specific reasoning-risk a committee should pressure-test, and the public test is simply
            whether that risk materialised. The share price can run while the risk we flagged still
            bites, and the call would still be validated, because the call was never about the
            price.
          </p>
          <p style={{ ...bodyStyle, color: C.slate700, fontWeight: 500 }}>
            {POSITIONING_EPISTEMIC_HONESTY}
          </p>
          <p style={bodyStyle}>
            Calibration across many calls beats being right once. We publish the false positives,
            because a record you can only see the wins of is not a record.
          </p>
        </div>

        {/* Status legend */}
        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {STATUS_ORDER.map(s => {
            const meta = CALL_STATUS_META[s];
            return (
              <div
                key={s}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: meta.color,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.slate900 }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: C.slate500, lineHeight: 1.5 }}>
                  {meta.description}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── The record ────────────────────────────────────────────── */}
      <section id="record" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <SectionEyebrow icon={<ScrollText size={13} strokeWidth={2.25} />} text="On the record" />
        <h2 style={h2Style}>
          {callCount === 1
            ? 'One call locked so far. The record is public from the first.'
            : `${callCount} calls, every one published before its due date.`}
        </h2>
        <p style={{ ...bodyStyle, maxWidth: 820, marginBottom: 22 }}>
          New calls land as they are made, on public decisions only. Each is dated, falsifiable, and
          left on the record whichever way it resolves.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PUBLIC_CALLS.map(call => (
            <CallCard key={call.id} call={call} />
          ))}
        </div>
      </section>

      {/* ── Scope / restraint ─────────────────────────────────────── */}
      <section id="scope" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 12px' }}>
        <SectionEyebrow icon={<ShieldCheck size={13} strokeWidth={2.25} />} text="The fine print" />
        <h2 style={h2Style}>What this record is, and what it is not.</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginTop: 8,
          }}
        >
          <ScopeCard
            kind="is"
            title="What it is"
            items={[
              'Public, dated, and falsifiable. Each call is published before its due date, on a decision anyone can check.',
              'Scored on the flag: whether the reasoning-risk we named materialised, win or lose.',
              'Inclusive of the losses. False positives stay on the record, because calibration needs them.',
            ]}
          />
          <ScopeCard
            kind="isnot"
            title="What it is not"
            items={[
              'A forecast of prices. We do not predict the stock; we test whether a flagged reasoning-risk bites.',
              'A causal claim. We name risk indicators correlated with poor outcomes, never a proof that a bias caused one.',
              'A verdict on the companies audited. We audit the reasoning, not the company.',
            ]}
          />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 72px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          <CtaCard
            href="/demo"
            title="Run it on your own decision"
            note="Paste a memo, closed or upcoming, and see the same audit on your actual text. No signup, no card."
          />
          <CtaCard
            href="/proof"
            title="See the same engine in hindsight"
            note="The identical methodology applied to decisions whose outcomes are already known, with no hindsight used."
          />
        </div>
      </section>
    </div>
  );
}

const h2Style: React.CSSProperties = {
  fontSize: 'clamp(22px, 3vw, 30px)',
  lineHeight: 1.15,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '10px 0 14px',
  color: C.slate900,
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15.5,
  lineHeight: 1.6,
  color: C.slate600,
};

function SectionEyebrow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        color: C.green,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {icon}
      {text}
    </div>
  );
}

function CallCard({ call }: { call: PublicCall }) {
  const meta = CALL_STATUS_META[call.status];
  return (
    <div
      id={call.id}
      style={{
        scrollMarginTop: 90,
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderLeft: `4px solid ${meta.color}`,
        borderRadius: 12,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: C.slate900 }}>{call.subject}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: meta.color,
            padding: '3px 9px',
            borderRadius: 9999,
            background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${meta.color} 30%, transparent)`,
          }}
        >
          {meta.label}
        </span>
        <span style={{ fontSize: 12, color: C.slate500 }}>
          Locked {fmtDate(call.dateLocked)} · Due {fmtDate(call.dueDate)}
        </span>
      </div>
      <CallField label="Flag" body={call.flag} />
      <CallField label="Falsifiable proxy" body={call.proxy} />
      {call.result && <CallField label="Result" body={call.result} color={meta.color} />}

      {call.mirrors && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: C.greenSoft,
            border: `1px solid ${C.greenBorder}`,
            borderRadius: 8,
          }}
        >
          <div style={ladderHeadingStyle}>Why this is your risk too</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.slate700 }}>{call.mirrors}</div>
        </div>
      )}

      {call.proxyLadder && call.proxyLadder.length > 0 && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${C.slate100}`, paddingTop: 14 }}>
          <div style={ladderHeadingStyle}>Monitoring ladder</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {call.proxyLadder.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={ladderWindowStyle}>{step.window}</span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: C.slate600, flex: 1 }}>
                  {step.question}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {call.scoringNote && (
        <div
          style={{
            marginTop: 14,
            padding: '11px 13px',
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 8,
          }}
        >
          <div style={ladderHeadingStyle}>How this is scored</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: C.slate600 }}>
            {call.scoringNote}
          </div>
        </div>
      )}
    </div>
  );
}

const ladderHeadingStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: C.slate400,
  marginBottom: 8,
};

const ladderWindowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: C.slate700,
  flexShrink: 0,
  width: 132,
  paddingTop: 1,
};

function CallField({ label, body, color }: { label: string; body: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: C.slate400,
          flexShrink: 0,
          width: 116,
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.55, color: color ?? C.slate700, flex: 1 }}>
        {body}
      </span>
    </div>
  );
}

function ScopeCard({
  kind,
  title,
  items,
}: {
  kind: 'is' | 'isnot';
  title: string;
  items: string[];
}) {
  const accent = kind === 'is' ? C.green : C.slate400;
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '18px 20px',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900, marginBottom: 12 }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55, color: C.slate600 }}>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CtaCard({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Link
      href={href}
      style={{
        background: C.navy,
        borderRadius: 12,
        padding: '20px 22px',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{title}</div>
        <div style={{ fontSize: 12.5, color: C.slate300, marginTop: 6, lineHeight: 1.5 }}>
          {note}
        </div>
      </div>
      <ArrowRight size={16} style={{ color: C.green, flexShrink: 0, marginTop: 3 }} />
    </Link>
  );
}
