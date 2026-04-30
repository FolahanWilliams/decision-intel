/**
 * African / EM-jurisdiction → primary-regulator short-name mapping.
 *
 * Used by the deal-page Pan-African Regulatory Belt chip (B7 lock
 * 2026-04-30, Titi persona ask) and any other surface that needs to
 * display "your audit covers these regulators" in a 3-5-token chip-grade
 * shape.
 *
 * Source of truth for the framework-id list:
 *   src/lib/compliance/frameworks/africa-frameworks.ts
 *
 * Country names are matched case-insensitively against the canonical
 * `emergingMarketCountries` strings used by the structural-assumptions
 * pipeline (see src/lib/constants/market-context.ts).
 *
 * The chip surfaces the procurement moat IBM watsonx.governance + US
 * incumbent decision-intelligence tools cannot reach: explicit
 * jurisdiction-by-jurisdiction African regulatory mapping. CLAUDE.md
 * External Attack Vector #2 (IBM bundling) — this is the visible counter.
 */

interface RegulatorEntry {
  /** Framework ID used in src/lib/compliance/frameworks. Keep aligned with africa-frameworks.ts. */
  id: string;
  /** Short label that fits in a chip — preserves full meaning for a procurement reader. */
  shortLabel: string;
}

/**
 * Country (lowercased) → list of primary regulators that govern
 * cross-border / capital-allocation / data decisions in that
 * jurisdiction. Order is "most-procurement-relevant first".
 */
const COUNTRY_REGULATORS: Record<string, RegulatorEntry[]> = {
  nigeria: [
    { id: 'ndpr_nigeria', shortLabel: 'NDPR' },
    { id: 'cbn_ai_guidelines', shortLabel: 'CBN' },
    { id: 'frc_nigeria', shortLabel: 'FRC Nigeria' },
    { id: 'isa_nigeria_2007', shortLabel: 'ISA 2007' },
  ],
  kenya: [
    { id: 'cma_kenya', shortLabel: 'CMA Kenya' },
    { id: 'cbk_kenya', shortLabel: 'CBK' },
  ],
  ghana: [{ id: 'bog_ghana', shortLabel: 'BoG' }],
  'south africa': [
    { id: 'popia', shortLabel: 'PoPIA' },
    { id: 'sarb_model_risk', shortLabel: 'SARB' },
  ],
  egypt: [{ id: 'cbe_egypt', shortLabel: 'CBE' }],
  tanzania: [{ id: 'bot_fintech', shortLabel: 'BoT' }],
  // WAEMU member states — same regulator covers the 8-country bloc.
  // The countries listed in market-context.ts ("waemu") use the union
  // label; if a memo names a specific WAEMU country (Ivory Coast,
  // Senegal, Mali, etc.), the same regulator applies.
  waemu: [{ id: 'waemu', shortLabel: 'WAEMU' }],
  'ivory coast': [{ id: 'waemu', shortLabel: 'WAEMU' }],
  "côte d'ivoire": [{ id: 'waemu', shortLabel: 'WAEMU' }],
  senegal: [{ id: 'waemu', shortLabel: 'WAEMU' }],
  mali: [{ id: 'waemu', shortLabel: 'WAEMU' }],
  'burkina faso': [{ id: 'waemu', shortLabel: 'WAEMU' }],
  niger: [{ id: 'waemu', shortLabel: 'WAEMU' }],
  togo: [{ id: 'waemu', shortLabel: 'WAEMU' }],
  benin: [{ id: 'waemu', shortLabel: 'WAEMU' }],
  'guinea-bissau': [{ id: 'waemu', shortLabel: 'WAEMU' }],
};

/** Result of `getAfricanRegulatorBelt`. Both arrays are de-duplicated. */
export interface AfricanRegulatorBelt {
  /** Ordered, de-duplicated list of primary regulators. */
  regulators: Array<{ id: string; shortLabel: string }>;
  /** Lower-cased country labels that mapped to at least one regulator. */
  matchedCountries: string[];
  /** Country labels passed in that did not map (fall through silently —
   *  the chip still renders the matched set; non-African EMs do not
   *  surface here, e.g. Argentina / Turkey / Vietnam). */
  unmatchedCountries: string[];
}

/**
 * Map a list of `emergingMarketCountries` (as produced by the
 * structural-assumptions pipeline) onto a procurement-grade list of
 * African regulators with short labels.
 *
 * Returns `regulators: []` when no input matches. The chip caller
 * checks `regulators.length === 0` and renders nothing — this preserves
 * silent-fail behaviour for non-African EM deals (Argentina, Turkey,
 * Vietnam, etc.) where surfacing the African belt would be a tell.
 */
export function getAfricanRegulatorBelt(
  countries: string[] | null | undefined
): AfricanRegulatorBelt {
  if (!countries || countries.length === 0) {
    return { regulators: [], matchedCountries: [], unmatchedCountries: [] };
  }
  const seen = new Set<string>();
  const regulators: Array<{ id: string; shortLabel: string }> = [];
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const raw of countries) {
    const key = raw.trim().toLowerCase();
    if (!key) continue;
    const entries = COUNTRY_REGULATORS[key];
    if (!entries) {
      unmatched.push(key);
      continue;
    }
    matched.push(key);
    for (const entry of entries) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      regulators.push(entry);
    }
  }

  return {
    regulators,
    matchedCountries: Array.from(new Set(matched)),
    unmatchedCountries: Array.from(new Set(unmatched)),
  };
}
