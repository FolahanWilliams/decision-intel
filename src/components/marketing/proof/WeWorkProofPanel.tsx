'use client';

/**
 * WeWorkProofPanel — the public-document proof artefact.
 *
 * Originally lived as a hero right-column card on the landing page
 * alongside the H1. Moved 2026-05-07 to /demo per founder refactor: the
 * landing page hero needed a single-column, single-eye-pass focus on
 * H1 + contrast sub-head + CTAs + McKinsey-anchored mini-cards. The
 * WeWork-specific proof now sits inside /demo where readers actively
 * looking for evidence will encounter it, paired with the full DPR PDF
 * download link.
 *
 * The component anchors the proof to a real public document with a
 * famous outcome (WeWork's 2019 S-1) so cold readers don't have to parse
 * a synthetic sample audit before the credibility is earned. Three
 * biases (Overconfidence / Anchoring / Sunk cost) name what the audit
 * would have flagged. Whole panel is a clickable card to the public DPR
 * sample PDF.
 *
 * Self-contained: imports its own minimal palette + lucide icons, no
 * external palette dependency. Safe to render anywhere.
 */

import Link from 'next/link';
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
};

const BIASES = [
  {
    name: 'Overconfidence',
    finding:
      'adjusted EBITDA excluded standard operating costs (marketing, design, member acquisition) and was presented as the headline metric.',
    sev: '#DC2626',
  },
  {
    name: 'Anchoring',
    finding:
      'every projection tethered to the $47B private valuation set by SoftBank, not to market comparables.',
    sev: '#D97706',
  },
  {
    name: 'Sunk cost',
    finding:
      '$4B+ of prior funding shaped the IPO as the only path forward, narrowing the alternatives the document considered.',
    sev: '#D97706',
  },
];

interface WeWorkProofPanelProps {
  /** Optional event name override for tracking. Defaults to 'wework_proof_panel_clicked'. */
  eventName?: string;
}

export function WeWorkProofPanel({
  eventName = 'wework_proof_panel_clicked',
}: WeWorkProofPanelProps = {}) {
  return (
    <Link
      className="wework-proof-panel"
      href="/dpr-sample-wework.pdf"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(eventName)}
      style={{
        width: '100%',
        maxWidth: 560,
        borderRadius: 18,
        background: C.white,
        border: `1px solid ${C.slate200}`,
        boxShadow:
          '0 32px 64px -20px rgba(15,23,42,0.22), 0 16px 36px -16px rgba(15,23,42,0.12), 0 2px 4px rgba(15,23,42,0.04)',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s',
        display: 'block',
      }}
    >
      <style>{`
        .wework-proof-panel:hover {
          transform: translateY(-3px);
          box-shadow: 0 38px 72px -20px rgba(15,23,42,0.26), 0 18px 40px -16px rgba(15,23,42,0.14), 0 2px 4px rgba(15,23,42,0.04) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .wework-proof-panel,
          .wework-proof-panel:hover {
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
            color: C.green,
            marginBottom: 6,
          }}
        >
          What we&apos;d have flagged in the WeWork S-1
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.slate500,
            fontWeight: 500,
          }}
        >
          Public document &middot; 2019 IPO prospectus &middot; 60-second audit
        </div>
      </div>

      {/* Body — three biases */}
      <div style={{ padding: '20px 22px 18px' }}>
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
          Three biases the prospectus carried
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
          {BIASES.map(b => (
            <li
              key={b.name}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: b.sev,
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
          <FileText size={14} />
          Read the full audit report
          <ArrowRight size={14} />
        </span>
        <span
          style={{
            fontSize: 11,
            color: C.slate500,
            fontWeight: 600,
          }}
        >
          PDF &middot; opens in new tab
        </span>
      </div>
    </Link>
  );
}
