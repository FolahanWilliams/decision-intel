'use client';

/**
 * TrustEvidencePackPointer — compact procurement-pack pointer card
 * (5.4 lock 2026-05-08).
 *
 * Single DM-able URL bundling every artefact a F500 GC / vendor-risk
 * reviewer asks for: SOC 2 receipts, Sub-Processor Schedule, vendor-
 * questionnaire row table, audit log retention SLA, indemnification
 * posture, Bias Genome data ownership, DPA + DPR specimens. The
 * /trust page shipped 2026-05-07 wedge-batch-3 but is reachable only
 * via MarketingNav today; this card surfaces the URL on the founder's
 * daily entry points (StartHereTab + FounderOSTab) so it's one click
 * away when a procurement reviewer asks on a call.
 *
 * No duplicate content — just the deep links the founder needs at hand.
 *
 * Two variants:
 * - default (StartHereTab): dual-layer card with subhead + 6 deep
 *   links + source-of-truth context line.
 * - compact (FounderOSTab): single-row strip, 4 most-load-bearing
 *   links, no subhead. Stays out of the way on the daily-check-in
 *   surface.
 */

import { ShieldCheck, ExternalLink } from 'lucide-react';

const PRIMARY_LINK = '/trust';
const DEEP_LINKS: Array<{ href: string; label: string }> = [
  { href: '/trust#soc2', label: 'SOC 2 receipts' },
  { href: '/trust#sub-processors', label: 'Sub-Processor Schedule' },
  { href: '/trust#vendor-questionnaire', label: 'Vendor questionnaire rows' },
  { href: '/trust#audit-log-retention', label: 'Audit log retention SLA' },
  { href: '/dpa-template.pdf', label: 'DPA template (PDF + DOCX)' },
];

const DEEP_LINKS_COMPACT: Array<{ href: string; label: string }> = [
  { href: '/trust#soc2', label: 'SOC 2' },
  { href: '/trust#sub-processors', label: 'Sub-processors' },
  { href: '/trust#vendor-questionnaire', label: 'Vendor questionnaire' },
];

export type TrustEvidencePackVariant = 'default' | 'compact';

export function TrustEvidencePackPointer({
  variant = 'default',
}: {
  variant?: TrustEvidencePackVariant;
}) {
  if (variant === 'compact') {
    return (
      <div style={compactCardStyle}>
        <div style={compactEyebrow}>
          <ShieldCheck size={11} /> Procurement-grade evidence pack · /trust
        </div>
        <div style={compactLinkRow}>
          <a href={PRIMARY_LINK} target="_blank" rel="noopener noreferrer" style={compactPrimary}>
            Open /trust
            <ExternalLink size={11} strokeWidth={2.25} aria-hidden />
          </a>
          {DEEP_LINKS_COMPACT.map(link => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={compactSecondary}
            >
              {link.label} &rarr;
            </a>
          ))}
        </div>
        <div style={compactContext}>
          When a procurement reviewer asks for SOC 2 / sub-processors / DPA on a call, DM this URL.
          One link, every answer.
        </div>
      </div>
    );
  }

  return (
    <div style={defaultCardStyle}>
      <div style={defaultEyebrow}>
        <ShieldCheck size={11} /> Procurement-grade evidence pack · /trust
      </div>
      <div style={defaultSubhead}>
        One DM-able URL bundling every vendor-risk-register answer a Fortune 500 GC, audit-committee
        reviewer, or design-partner counsel will ask for. When the call goes &ldquo;send me your
        sub-processor list / SOC 2 status / DPA template&rdquo;, this is the URL.
      </div>
      <div style={defaultLinkGrid}>
        <a href={PRIMARY_LINK} target="_blank" rel="noopener noreferrer" style={defaultPrimary}>
          Open /trust evidence pack
          <ExternalLink size={12} strokeWidth={2.25} aria-hidden />
        </a>
        {DEEP_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={defaultSecondary}
          >
            {link.label} &rarr;
          </a>
        ))}
      </div>
      <div style={defaultContext}>
        Source-of-truth for every claim: <code>src/lib/constants/trust-copy.ts</code>. When a
        posture changes (SOC 2 Type I issues, new sub-processor, indemnification cap shifts), the
        page auto-picks up the new value. Discipline: never quote a procurement claim from memory
        &mdash; DM the URL or read from the page.
      </div>
    </div>
  );
}

// ─── Default variant styles (StartHereTab full card) ───────────────

const defaultCardStyle: React.CSSProperties = {
  marginBottom: 14,
  padding: 16,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: '3px solid var(--accent-primary)',
  borderRadius: 'var(--radius-md)',
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--text-primary)',
};

const defaultEyebrow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--accent-primary)',
  marginBottom: 6,
};

const defaultSubhead: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 12,
  lineHeight: 1.5,
};

const defaultLinkGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 10,
};

const defaultPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
  border: '1px solid var(--accent-primary)',
  borderRadius: 'var(--radius-sm, 6px)',
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--accent-primary)',
  textDecoration: 'none',
  letterSpacing: '-0.005em',
};

const defaultSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm, 6px)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
};

const defaultContext: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--text-muted)',
  lineHeight: 1.5,
  paddingTop: 8,
  borderTop: '1px dashed var(--border-color)',
};

// ─── Compact variant styles (FounderOSTab one-row strip) ───────────

const compactCardStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: '10px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: '3px solid var(--accent-primary)',
  borderRadius: 'var(--radius-md)',
  fontSize: 11.5,
  lineHeight: 1.5,
  color: 'var(--text-primary)',
};

const compactEyebrow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--accent-primary)',
  marginBottom: 6,
};

const compactLinkRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 4,
};

const compactPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
  border: '1px solid var(--accent-primary)',
  borderRadius: 'var(--radius-sm, 6px)',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--accent-primary)',
  textDecoration: 'none',
};

const compactSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm, 6px)',
  fontSize: 10.5,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
};

const compactContext: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--text-muted)',
  lineHeight: 1.45,
  marginTop: 4,
};
