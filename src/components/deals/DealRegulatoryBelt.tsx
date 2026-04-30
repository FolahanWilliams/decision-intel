'use client';

/**
 * DealRegulatoryBelt — chip surfacing the African / EM regulatory map
 * the deal's audits cover, when at least one analysis on the deal has
 * surfaced an EM-jurisdiction signal.
 *
 * Locked 2026-04-30 (B7 lock; Titi persona ask). Per CLAUDE.md
 * External Attack Vectors: IBM watsonx.governance bundling is the #2
 * outside-in risk, but watsonx does NOT cover NDPR / CBN / FRC Nigeria
 * / WAEMU / PoPIA / CMA Kenya / etc. Surfacing the African belt at
 * the deal-page header IS the procurement-grade counter — a Lagos /
 * Nairobi / Johannesburg deal team sees their primary regulators
 * named on the very first screen.
 *
 * Renders nothing when the input list is empty OR when no input
 * country maps onto an African regulator (non-African EM deals like
 * Argentina / Turkey / Vietnam fall through silently rather than
 * surfacing a misleading "Pan-African" label).
 */

import { Globe2 } from 'lucide-react';
import { getAfricanRegulatorBelt } from '@/lib/utils/african-regulators';

interface Props {
  countries: string[] | null | undefined;
}

export function DealRegulatoryBelt({ countries }: Props) {
  const belt = getAfricanRegulatorBelt(countries);
  if (belt.regulators.length === 0) return null;

  // Compact summary — "Audit covers Pan-African regulatory map: NDPR · CBN · FRC Nigeria + N more"
  // when more than 4 regulators map; full enumeration otherwise.
  const visible = belt.regulators.slice(0, 4);
  const overflow = belt.regulators.length - visible.length;

  const tooltip = `Pan-African regulatory belt detected from this deal's audits. Covers: ${belt.regulators
    .map(r => r.shortLabel)
    .join(' · ')}. Source jurisdictions: ${belt.matchedCountries.join(', ')}.`;

  return (
    <div
      title={tooltip}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        padding: '6px 10px',
        background: 'rgba(22, 163, 74, 0.06)',
        border: '1px solid rgba(22, 163, 74, 0.22)',
        borderRadius: 999,
        fontSize: 11.5,
        color: 'var(--text-secondary)',
        fontWeight: 600,
      }}
    >
      <Globe2 size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
      <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
        Pan-African regulatory belt:
      </span>
      {visible.map((r, i) => (
        <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.shortLabel}</span>
          {i < visible.length - 1 && (
            <span aria-hidden style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              ·
            </span>
          )}
        </span>
      ))}
      {overflow > 0 && (
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>+ {overflow} more</span>
      )}
    </div>
  );
}
