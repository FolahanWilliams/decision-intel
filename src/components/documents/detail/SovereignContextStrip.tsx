'use client';

/**
 * SovereignContextStrip — Adaeze-persona-anchored above-fold surface
 * for cross-border decisions.
 *
 * Item A lock 2026-05-07 (replaces the skipped Positioning Hub
 * consolidation). Per the 2026-05-07 nightly audit Section 8 Adaeze
 * finding: cross-border deal context is currently buried inside the
 * regulatory tab body via deriveSovereignContexts; mid-market PE Heads
 * of M&A (Richard) and Pan-African fund partners (Adaeze) read this
 * info FIRST, not three tabs deep.
 *
 * Component shape:
 *   - Eyebrow: "Cross-border context · sovereign cycle"
 *   - Per-jurisdiction columns (max 3) with FX regime + sovereign-cycle
 *     note + the specific risk class.
 *   - Compact 3-column grid, single-column below 720px.
 *   - Renders null when no emerging-market countries — safe to mount
 *     unconditionally above-fold.
 *
 * Mounted in /documents/[id] rightPaneAboveTabs between VerdictBand
 * and RemediationChecklist. Data flows from analysis.marketContext
 * (already populated by structuralAssumptions endpoint).
 */

import { Globe } from 'lucide-react';

interface JurisdictionEntry {
  /** ISO-style country slug (lowercase, e.g. "nigeria"). */
  slug: string;
  /** Human-readable display name. */
  display: string;
  /** FX regime / sovereign-cycle short note. */
  note: string;
  /** Specific risk class — pulls a single 1-line procurement-grade phrase. */
  riskClass: string;
}

const JURISDICTION_LIBRARY: Record<string, Omit<JurisdictionEntry, 'slug'>> = {
  nigeria: {
    display: 'Nigeria',
    note: 'Naira free-float + CBN I&E window',
    riskClass: 'FX exposure material · NDPR + ISA 2007 + CBN sectoral lens',
  },
  kenya: {
    display: 'Kenya',
    note: 'KES managed float',
    riskClass: 'Sovereign-cycle risk on cross-border ticket · CMA Kenya disclosure',
  },
  ghana: {
    display: 'Ghana',
    note: 'Cedi + IMF programme cycle',
    riskClass: 'Currency + policy alignment open · BoG approval-path nuance',
  },
  waemu: {
    display: 'WAEMU',
    note: 'CFA-zone peg to euro',
    riskClass: 'Peg risk negligible · trade-routing + capital-controls risk material',
  },
  'south africa': {
    display: 'South Africa',
    note: 'ZAR + SARB model-risk regime',
    riskClass: 'PoPIA s.71 + SARB model-risk attestation expected on every cross-border deal',
  },
  egypt: {
    display: 'Egypt',
    note: 'EGP post-devaluation band',
    riskClass: 'Exchange-rate band volatility · CBE FX-clearance gating',
  },
  tanzania: {
    display: 'Tanzania',
    note: 'TZS + BoT sandbox',
    riskClass: 'BoT FinTech sandbox active · cross-border permit dependency',
  },
  argentina: {
    display: 'Argentina',
    note: 'ARS dual-rate regime',
    riskClass: 'Crawling-peg + capital-control overhang · IRR sensitivity high',
  },
  turkey: {
    display: 'Turkey',
    note: 'TRY managed depreciation',
    riskClass: 'Currency-cycle volatility · CBRT policy unpredictability',
  },
};

interface MarketContextLike {
  context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
  emergingMarketCountries: string[];
  developedMarketCountries: string[];
  cagrCeiling: number;
  rationale: string;
}

interface Props {
  marketContext: MarketContextLike | null;
  /** True when the current marketContext is an explicit founder-set
   *  override rather than the auto-detected applied context — surfaces
   *  in the strip footer so a procurement reader sees the provenance. */
  overridden?: boolean;
}

function deriveEntries(emCountries: string[]): JurisdictionEntry[] {
  return emCountries.slice(0, 3).map(c => {
    const slug = c.toLowerCase();
    const meta = JURISDICTION_LIBRARY[slug];
    if (meta) {
      return { slug, display: meta.display, note: meta.note, riskClass: meta.riskClass };
    }
    return {
      slug,
      display: c.charAt(0).toUpperCase() + c.slice(1),
      note: 'Emerging-market sovereign cycle exposure',
      riskClass: 'Cross-border lens applies — see DPR Regulatory Crosswalk for the framework map',
    };
  });
}

export function SovereignContextStrip({ marketContext, overridden = false }: Props) {
  if (!marketContext || marketContext.emergingMarketCountries.length === 0) return null;

  const entries = deriveEntries(marketContext.emergingMarketCountries);
  if (entries.length === 0) return null;

  const moreCount = marketContext.emergingMarketCountries.length - entries.length;

  return (
    <section
      aria-labelledby="sovereign-context-heading"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--info)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--info)',
              background: 'color-mix(in srgb, var(--info) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--info) 30%, var(--border-color))',
              padding: '3px 9px',
              borderRadius: 999,
            }}
          >
            <Globe size={11} strokeWidth={2.5} aria-hidden />
            Cross-border context · sovereign cycle
          </span>
          <h3
            id="sovereign-context-heading"
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.005em',
            }}
          >
            {entries.length} jurisdiction{entries.length !== 1 ? 's' : ''} flagged
          </h3>
        </div>
        {overridden && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--warning)',
              background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning) 30%, var(--border-color))',
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            Founder override
          </span>
        )}
      </div>

      <div
        className="sovereign-context-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${entries.length}, 1fr)`,
          gap: 12,
        }}
      >
        {entries.map(entry => (
          <article
            key={entry.slug}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.005em',
              }}
            >
              {entry.display}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                lineHeight: 1.45,
              }}
            >
              {entry.note}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginTop: 4,
                paddingTop: 6,
                borderTop: '1px dashed var(--border-color)',
              }}
            >
              {entry.riskClass}
            </div>
          </article>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        {moreCount > 0
          ? `+${moreCount} more emerging-market ${moreCount === 1 ? 'jurisdiction' : 'jurisdictions'} flagged on this audit. `
          : ''}
        See the DPR Regulatory Crosswalk grid for the full framework map per jurisdiction.
      </div>

      <style>{`
        @media (max-width: 720px) {
          .sovereign-context-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
