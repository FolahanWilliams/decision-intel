'use client';

/**
 * DecisionProofPanel — the generalized public-document proof artefact.
 *
 * Generalized 2026-06-05 from the original WeWorkProofPanel so the two halves
 * of the retroactive cold-open ("one you feel good about AND one that went
 * sideways") can render as a MATCHED PAIR on /demo (see RetroProofPair):
 *   - variant 'flagged'  → a closed deal that went sideways (WeWork S-1).
 *   - variant 'held_up'  → a closed deal that held up (Apple iPhone bet).
 *
 * The held-up half is the ego-safe move from the SF-advisor retro motion
 * (icp.ts RETRO_POSTMORTEM_COLD_OPEN): it proves the audit is not just a
 * hit-piece — when the reasoning is sound, the audit gives it a clean bill.
 *
 * Anchored to a real public document with a famous KNOWN outcome so a cold
 * reader does not have to parse a synthetic sample before the credibility is
 * earned. Whole panel is a clickable card.
 *
 * Self-contained: imports its own minimal palette + lucide icons, no external
 * palette dependency. Safe to render anywhere.
 */

import { ArrowRight, FileText } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  red: '#DC2626',
};

export interface ProofItem {
  name: string;
  finding: string;
  /** Dot accent — severity colour for 'flagged', green for 'held_up'. */
  accent: string;
}

export interface DecisionProofPanelProps {
  variant: 'flagged' | 'held_up';
  /** Title-bar eyebrow, e.g. "What we'd have flagged in the WeWork S-1". */
  eyebrow: string;
  /** Sub-line under the eyebrow, e.g. "Public document · 2019 IPO prospectus · went sideways". */
  subtitle: string;
  /** Body eyebrow, e.g. "Three biases the prospectus carried". */
  bodyEyebrow: string;
  items: ProofItem[];
  /** One-line audit verdict shown above the CTA (the paired DQI contrast). */
  verdict: string;
  cta: {
    href: string;
    label: string;
    sublabel: string;
    /** true → plain <a> for a STATIC public asset (PDF); false → internal route. */
    staticAsset: boolean;
  };
  /** Analytics event fired on click. */
  eventName: string;
}

export function DecisionProofPanel({
  variant,
  eyebrow,
  subtitle,
  bodyEyebrow,
  items,
  verdict,
  cta,
  eventName,
}: DecisionProofPanelProps) {
  const topAccent = variant === 'held_up' ? C.green : C.red;
  // Static public assets (the WeWork DPR PDF) MUST use a plain <a>: next/link
  // would RSC-prefetch `…pdf?rsc=…` (no route → 404 console-spam on /demo, the
  // highest-leverage acquisition surface). Internal routes use a plain <a> too
  // here for symmetry — these are full navigations, not prefetch-worthy.
  const linkProps = cta.staticAsset ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <a
      className="decision-proof-panel"
      href={cta.href}
      onClick={() => trackEvent(eventName)}
      {...linkProps}
      style={{
        width: '100%',
        maxWidth: 560,
        borderRadius: 18,
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderTop: `3px solid ${topAccent}`,
        boxShadow:
          '0 32px 64px -20px rgba(15,23,42,0.18), 0 16px 36px -16px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.04)',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .decision-proof-panel:hover {
          transform: translateY(-3px);
          box-shadow: 0 38px 72px -20px rgba(15,23,42,0.22), 0 18px 40px -16px rgba(15,23,42,0.12), 0 2px 4px rgba(15,23,42,0.04) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .decision-proof-panel,
          .decision-proof-panel:hover {
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Title bar */}
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.slate200}`,
          background: C.slate50,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: topAccent,
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 12, color: C.slate500, fontWeight: 500 }}>{subtitle}</div>
      </div>

      {/* Body — three items */}
      <div style={{ padding: '20px 22px 16px', flex: 1 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.slate500,
            marginBottom: 14,
          }}
        >
          {bodyEyebrow}
        </div>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          {items.map(b => (
            <li key={b.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: b.accent,
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              <div style={{ fontSize: 13.5, color: C.slate900, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>{b.name}:</span>
                <span style={{ color: C.slate700 }}> {b.finding}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Verdict strip — the paired DQI contrast (low + flagged vs high + clean). */}
      <div
        style={{
          padding: '10px 22px',
          borderTop: `1px solid ${C.slate200}`,
          fontSize: 11.5,
          fontWeight: 600,
          color: topAccent,
        }}
      >
        {verdict}
      </div>

      {/* CTA footer — visible affordance for the clickable panel */}
      <div
        style={{
          padding: '14px 22px',
          borderTop: `1px solid ${C.slate200}`,
          background: C.slate50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: C.green,
          }}
        >
          {cta.staticAsset ? <FileText size={14} /> : null}
          {cta.label}
          <ArrowRight size={14} />
        </span>
        <span style={{ fontSize: 11, color: C.slate500, fontWeight: 600 }}>{cta.sublabel}</span>
      </div>
    </a>
  );
}

// ── Canonical proof data — the two halves of the retro cold-open ──────────────

/** Flagged half — a closed deal that went sideways (WeWork S-1, 2019). */
export const WEWORK_FLAGGED: Omit<DecisionProofPanelProps, 'eventName'> = {
  variant: 'flagged',
  eyebrow: "What we'd have flagged in the WeWork S-1",
  subtitle: 'Public document · 2019 IPO prospectus · went sideways',
  bodyEyebrow: 'Three biases the prospectus carried',
  items: [
    {
      name: 'Overconfidence',
      finding:
        'adjusted EBITDA excluded standard operating costs (marketing, design, member acquisition) and was presented as the headline metric.',
      accent: C.red,
    },
    {
      name: 'Anchoring',
      finding:
        'every projection tethered to the $47B private valuation set by SoftBank, not to market comparables.',
      accent: '#D97706',
    },
    {
      name: 'Sunk cost',
      finding:
        '$4B+ of prior funding shaped the IPO as the only path forward, narrowing the alternatives the document considered.',
      accent: '#D97706',
    },
  ],
  verdict: 'Audit verdict · low DQI, multiple critical flags',
  cta: {
    href: '/dpr-sample-wework.pdf',
    label: 'Read the full audit report',
    sublabel: 'PDF · opens in new tab',
    staticAsset: true,
  },
};

/** Held-up half — a closed deal that went well (Apple iPhone bet, 2007). */
export const APPLE_HELD_UP: Omit<DecisionProofPanelProps, 'eventName'> = {
  variant: 'held_up',
  eyebrow: "What held up in Apple's iPhone bet",
  subtitle: 'Public record · 2007 iPhone launch · went well',
  bodyEyebrow: 'Three things the reasoning got right',
  items: [
    {
      name: 'Outside view',
      finding:
        "Jobs reasoned from the reference class, not the inside view: 'the phone will eat the iPod; the only question is whether it's ours.' Disruption was priced in, not assumed away.",
      accent: C.green,
    },
    {
      name: 'Sunk cost confronted',
      finding:
        "he overrode the iPod team's 'don't kill our baby' instinct rather than protect 40% of revenue. The audit rewards naming the sunk-cost pull and choosing against it.",
      accent: C.green,
    },
    {
      name: 'Honest downside',
      finding:
        'the cannibalisation was stated outright (iPod revenue fell 70% by 2012), not papered over with optimism.',
      accent: C.green,
    },
  ],
  verdict: 'Audit verdict · high DQI; sound reasoning gets a clean bill',
  cta: {
    // getSlugForCase('cs-success-tech-001') === 'apple' (verified 2026-06-05).
    href: '/case-studies/apple',
    label: 'See the full case',
    sublabel: 'Case study',
    staticAsset: false,
  },
};
