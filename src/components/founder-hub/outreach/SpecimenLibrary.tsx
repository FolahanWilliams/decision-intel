'use client';

/**
 * Specimen Library — send-ready BAFTA artefacts surfaced in the Outreach Hub
 * (2026-05-29). The /specimen/[persona] pages are noindex + unlisted (reachable
 * by direct link only, per the repositioning plan §11 validation phase), so
 * the founder needs a place to grab + send them. This is that place: the
 * canonical outbound surface (Outreach Hub Pipeline), one copy-link click from
 * a cold DM or a coffee screen-share.
 *
 * Reads from the SPECIMEN_PERSONAS SSOT — when a persona's hook / slug changes,
 * this list updates automatically; no second copy to drift.
 */

import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { SPECIMEN_PERSONAS, SPECIMEN_SLUGS } from '@/lib/data/specimen-personas';

export function SpecimenLibrary() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = async (slug: string) => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/specimen/${slug}`
        : `/specimen/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(slug);
      window.setTimeout(() => setCopied(c => (c === slug ? null : c)), 1800);
    } catch {
      // Clipboard API unavailable (non-HTTPS / older browser) — the path is
      // shown inline + "Open" still works, so copy-failure degrades gracefully.
    }
  };

  return (
    <AccentCard accent="primary" title="Specimen library · send-ready artefacts">
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        The procurement-grade &ldquo;what unaudited looks like&rdquo; leave-behind, one per HXC
        persona. Copy the link into a cold DM, or open it to screen-share at a coffee. Unlisted
        &mdash; reachable by direct link only, so it persuades by artefact, not by search.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SPECIMEN_SLUGS.map(slug => {
          const p = SPECIMEN_PERSONAS[slug];
          if (!p) return null;
          const isCopied = copied === slug;
          return (
            <div
              key={slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                padding: '12px 14px',
              }}
              className="specimen-lib-row"
            >
              <div style={{ minWidth: 0, flex: '1 1 280px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {p.personaLabel}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                    lineHeight: 1.45,
                  }}
                >
                  {p.heroTitle}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 4,
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  }}
                >
                  /specimen/{slug}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => copyLink(slug)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: `1px solid color-mix(in srgb, var(--accent-primary) ${isCopied ? 45 : 30}%, transparent)`,
                    background: `color-mix(in srgb, var(--accent-primary) ${isCopied ? 16 : 8}%, transparent)`,
                    color: 'var(--accent-primary)',
                  }}
                >
                  {isCopied ? <Check size={13} /> : <Copy size={13} />}
                  {isCopied ? 'Copied' : 'Copy link'}
                </button>
                <a
                  href={`/specimen/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} />
                  Open
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <p
        style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}
      >
        Pair the link with the matching cold-DM opener (Message Generator section). The artefact
        does the persuasion; the DM just earns the click.
      </p>
      <style>{`
        @media (max-width: 560px) {
          .specimen-lib-row { align-items: stretch; }
        }
      `}</style>
    </AccentCard>
  );
}
